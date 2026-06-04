'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { AbonnementEcole } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Server Action pour mettre à jour l'abonnement d'une école de manière hautement sécurisée.
 * Utilise le client admin avec la Service Role Key pour contourner les restrictions RLS en écriture.
 */
export async function updateSchoolAbonnement(ecoleId: string, data: Partial<AbonnementEcole>) {
  try {
    if (!ecoleId) {
      return { success: false, error: "Identifiant de l'école manquant." }
    }

    // 1. Récupérer la session de l'utilisateur connecté sur le serveur
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: "Non autorisé. Veuillez vous connecter." }
    }

    // 2. Récupérer son rôle et son établissement en base
    const { data: profile, error: profileError } = await serverSupabase
      .from('utilisateurs')
      .select('role, ecole_id, ecole_courante_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "Profil utilisateur introuvable." }
    }

    // 3. Valider que l'utilisateur est Directeur de cette école spécifique
    const isDirecteur = profile.role === 'directeur';
    const isLinkedToSchool = profile.ecole_id === ecoleId || profile.ecole_courante_id === ecoleId;

    if (!isDirecteur || !isLinkedToSchool) {
      return { success: false, error: "Accès refusé. Privilèges de Directeur requis pour cet établissement." }
    }

    // Sécurisation AppSec : Validation des paiements simulés en mode démo/prototype
    if (data.plan && data.plan !== 'gratuit') {
      if (!data.transactionRef || !data.transactionRef.startsWith('CP-')) {
        return { success: false, error: "Signature de paiement CinetPay manquante ou invalide (CP- attendu)." }
      }
      const attendu = data.plan === 'standard' ? 150000 : 250000;
      if (data.montantPaye !== undefined && data.montantPaye < attendu) {
        return { success: false, error: `Le montant payé ne correspond pas au tarif annuel du forfait ${data.plan}.` }
      }
    }

    const supabase = createAdminClient()

    // Préparation des données en snake_case pour Supabase
    const updateData: any = {}
    if (data.plan !== undefined) updateData.plan = data.plan
    if (data.statut !== undefined) updateData.statut = data.statut
    if (data.dateDebut !== undefined) updateData.date_debut = data.dateDebut
    if (data.dateFin !== undefined) updateData.date_fin = data.dateFin
    if (data.transactionRef !== undefined) updateData.transaction_ref = data.transactionRef
    if (data.modePaiement !== undefined) updateData.mode_paiement = data.modePaiement
    if (data.montantPaye !== undefined) updateData.montant_paye = data.montantPaye
    if (data.maxEleves !== undefined) updateData.max_eleves = data.maxEleves

    // Mise à jour de la ligne d'abonnement existante pour l'école
    const { data: resData, error } = await supabase
      .from('abonnements')
      .update(updateData)
      .eq('ecole_id', ecoleId)
      .select()

    if (error) {
      console.error("Erreur Supabase lors de la mise à jour de l'abonnement :", error.message)
      return { success: false, error: `Erreur base de données : ${error.message}` }
    }

    revalidatePath('/abonnement')
    revalidatePath('/eleves')

    return { 
      success: true, 
      data: resData && resData.length > 0 ? {
        id: resData[0].id,
        ecoleId: resData[0].ecole_id,
        plan: resData[0].plan,
        statut: resData[0].statut,
        dateDebut: resData[0].date_debut,
        dateFin: resData[0].date_fin,
        transactionRef: resData[0].transaction_ref,
        modePaiement: resData[0].mode_paiement,
        montantPaye: Number(resData[0].montant_paye),
        maxEleves: Number(resData[0].max_eleves)
      } : null
    }

  } catch (err: any) {
    console.error("Exception dans updateSchoolAbonnement :", err)
    return { success: false, error: err.message || "Une erreur inattendue est survenue." }
  }
}

/**
 * Server Action pour récupérer l'abonnement d'une école de manière sécurisée en bypassant la RLS.
 * Utile pour s'assurer que les enseignants et parents accèdent correctement au statut d'abonnement.
 */
export async function getSchoolAbonnement(ecoleId: string) {
  try {
    if (!ecoleId) {
      return { success: false, error: "Identifiant de l'école manquant." }
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('abonnements')
      .select('*')
      .eq('ecole_id', ecoleId)

    if (error) {
      console.error("Erreur Supabase lors de la lecture de l'abonnement :", error.message)
      return { success: false, error: error.message }
    }

    if (data && data.length > 0) {
      return {
        success: true,
        data: {
          id: data[0].id,
          ecoleId: data[0].ecole_id,
          plan: data[0].plan,
          statut: data[0].statut,
          dateDebut: data[0].date_debut,
          dateFin: data[0].date_fin,
          transactionRef: data[0].transaction_ref,
          modePaiement: data[0].mode_paiement,
          montantPaye: Number(data[0].montant_paye),
          maxEleves: Number(data[0].max_eleves)
        } as AbonnementEcole
      }
    }

    return { success: true, data: null }

  } catch (err: any) {
    console.error("Exception dans getSchoolAbonnement :", err)
    return { success: false, error: err.message || "Une erreur inattendue." }
  }
}
