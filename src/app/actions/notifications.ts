'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NotificationItem, NotificationType } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Insère une nouvelle notification dans la base de données (système ou communiqué rédigé).
 * Utilise le client admin pour contourner les restrictions RLS.
 */
export async function createNotification(data: {
  ecoleId: string
  titre: string
  description: string
  type: NotificationType
  destinataireRole?: 'parent' | 'enseignant' | 'all'
  classeId?: string
  eleveId?: string
  creePar?: string
}) {
  try {
    if (!data.ecoleId) {
      return { success: false, error: "Identifiant de l'école manquant." }
    }

    // 1. Récupérer la session de l'appelant
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: "Non autorisé. Veuillez vous connecter." }
    }

    // 2. Récupérer son profil en base
    const { data: profile, error: profileError } = await serverSupabase
      .from('utilisateurs')
      .select('role, ecole_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "Profil utilisateur introuvable." }
    }

    // 3. Seul un Directeur ou un Enseignant de la même école peut émettre des notifications
    if ((profile.role !== 'directeur' && profile.role !== 'enseignant') || profile.ecole_id !== data.ecoleId) {
      return { success: false, error: "Accès refusé. Privilèges insuffisants pour cet établissement." }
    }

    const supabase = createAdminClient()

    // Préparation des données en snake_case
    const insertData: any = {
      ecole_id: data.ecoleId,
      titre: data.titre,
      description: data.description,
      type: data.type,
      destinataire_role: data.destinataireRole || null,
      classe_id: data.classeId || null,
      eleve_id: data.eleveId || null,
      cree_par: data.creePar || null
    }

    const { data: resData, error } = await supabase
      .from('notifications')
      .insert(insertData)
      .select()

    if (error) {
      console.error("Erreur Supabase insertion notification:", error.message)
      // Code d'erreur PostgreSQL pour relation non existante : "42P01"
      if (error.code === '42P01') {
        return { success: false, code: 'TABLE_NOT_FOUND', error: "La table des notifications n'existe pas encore." }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/notifications')
    
    return { 
      success: true, 
      data: resData && resData.length > 0 ? {
        id: resData[0].id,
        ecoleId: resData[0].ecole_id,
        titre: resData[0].titre,
        description: resData[0].description,
        type: resData[0].type,
        destinataireRole: resData[0].destinataire_role,
        classeId: resData[0].classe_id,
        eleveId: resData[0].eleve_id,
        creePar: resData[0].cree_par,
        createdAt: resData[0].created_at,
        lu: false
      } as NotificationItem : null
    }

  } catch (err: any) {
    console.error("Exception dans createNotification:", err)
    return { success: false, error: err.message || "Une erreur inattendue est survenue." }
  }
}

/**
 * Enregistre la lecture d'une notification pour un utilisateur spécifique.
 */
export async function markAsRead(notificationId: string, utilisateurId: string) {
  try {
    if (!notificationId || !utilisateurId) {
      return { success: false, error: "Identifiants requis manquants." }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('notifications_lectures')
      .upsert({
        notification_id: notificationId,
        utilisateur_id: utilisateurId
      }, { onConflict: 'notification_id,utilisateur_id' })

    if (error) {
      console.error("Erreur Supabase lecture notification:", error.message)
      if (error.code === '42P01') {
        return { success: false, code: 'TABLE_NOT_FOUND', error: "La table de lecture des notifications n'existe pas." }
      }
      return { success: false, error: error.message }
    }

    return { success: true }

  } catch (err: any) {
    console.error("Exception dans markAsRead:", err)
    return { success: false, error: err.message || "Une erreur inattendue." }
  }
}

/**
 * Récupère les IDs de toutes les notifications lues par un utilisateur spécifique.
 */
export async function fetchUserLectures(utilisateurId: string) {
  try {
    if (!utilisateurId) return { success: false, error: "Identifiant utilisateur manquant." }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('notifications_lectures')
      .select('notification_id')
      .eq('utilisateur_id', utilisateurId)

    if (error) {
      console.error("Erreur Supabase lectures utilisateur:", error.message)
      if (error.code === '42P01') {
        return { success: false, code: 'TABLE_NOT_FOUND', error: "La table de lecture n'existe pas." }
      }
      return { success: false, error: error.message }
    }

    return { 
      success: true, 
      readIds: data ? data.map(item => item.notification_id) : [] 
    }

  } catch (err: any) {
    console.error("Exception dans fetchUserLectures:", err)
    return { success: false, error: err.message }
  }
}

/**
 * Supprime une notification (réservé au Directeur de l'école).
 */
export async function deleteNotificationDb(notificationId: string) {
  try {
    if (!notificationId) return { success: false, error: "Identifiant notification manquant." }

    // 1. Récupérer la session de l'appelant
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: "Non autorisé. Veuillez vous connecter." }
    }

    // 2. Récupérer son profil en base
    const { data: profile, error: profileError } = await serverSupabase
      .from('utilisateurs')
      .select('role, ecole_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "Profil utilisateur introuvable." }
    }

    // 3. Seul le Directeur de l'école de la notification peut la supprimer
    // Récupérer la notification ciblée pour vérifier son ecole_id
    const { data: notif, error: notifError } = await serverSupabase
      .from('notifications')
      .select('ecole_id')
      .eq('id', notificationId)
      .single()

    if (notifError || !notif) {
      return { success: false, error: "Notification introuvable." }
    }

    if (profile.role !== 'directeur' || profile.ecole_id !== notif.ecole_id) {
      return { success: false, error: "Accès refusé. Privilèges de Directeur requis pour cet établissement." }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error("Erreur Supabase suppression notification:", error.message)
      return { success: false, error: error.message }
    }

    return { success: true }

  } catch (err: any) {
    console.error("Exception dans deleteNotificationDb:", err)
    return { success: false, error: err.message }
  }
}
