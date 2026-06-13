'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateBase64Image } from '@/lib/security'

/**
 * Met à jour de manière sécurisée la photo de profil de l'utilisateur connecté.
 */
export async function uploadProfilePhoto(base64Photo: string) {
  try {
    if (!base64Photo) {
      return { success: false, error: "Aucun fichier fourni." }
    }

    // 1. Authentifier l'appelant
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Non autorisé. Veuillez vous connecter." }
    }

    // 2. Valider l'image (Taille & Magic Bytes)
    const validation = validateBase64Image(base64Photo)
    if (!validation.success) {
      return { success: false, error: validation.error }
    }

    const adminSupabase = createAdminClient()

    // 3. Mettre à jour la table public.utilisateurs
    const { error: updateError } = await adminSupabase
      .from('utilisateurs')
      .update({ photo_url: base64Photo })
      .eq('id', user.id)

    if (updateError) {
      console.error("Erreur de mise à jour de la photo de profil :", updateError.message)
      return { success: false, error: "Erreur base de données lors de la sauvegarde." }
    }

    return { success: true }
  } catch (err: any) {
    console.error("Exception dans uploadProfilePhoto :", err)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

/**
 * Met à jour de manière sécurisée la photo d'un élève (réservé aux directeurs de l'école de l'élève).
 */
export async function uploadStudentPhoto(studentId: string, base64Photo: string) {
  try {
    if (!studentId || !base64Photo) {
      return { success: false, error: "Paramètres manquants." }
    }

    // 1. Authentifier l'appelant
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Non autorisé. Veuillez vous connecter." }
    }

    // 2. Récupérer son rôle et son établissement
    const { data: profile, error: profileError } = await serverSupabase
      .from('utilisateurs')
      .select('role, ecole_id, ecole_courante_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "Profil utilisateur introuvable." }
    }

    if (profile.role !== 'directeur') {
      return { success: false, error: "Accès refusé. Privilèges de Directeur requis." }
    }

    // 3. Récupérer l'élève ciblé pour valider qu'il appartient bien à l'école du directeur
    const { data: student, error: studentError } = await serverSupabase
      .from('eleves')
      .select('ecole_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return { success: false, error: "Élève introuvable." }
    }

    const currentSchoolId = profile.ecole_courante_id || profile.ecole_id
    if (student.ecole_id !== currentSchoolId) {
      return { success: false, error: "Accès refusé. Cet élève n'appartient pas à votre établissement." }
    }

    // 4. Valider l'image (Taille & Magic Bytes)
    const validation = validateBase64Image(base64Photo)
    if (!validation.success) {
      return { success: false, error: validation.error }
    }

    const adminSupabase = createAdminClient()

    // 5. Mettre à jour la photo de l'élève
    const { error: updateError } = await adminSupabase
      .from('eleves')
      .update({ photo_url: base64Photo })
      .eq('id', studentId)

    if (updateError) {
      console.error("Erreur de mise à jour de la photo de l'élève :", updateError.message)
      return { success: false, error: "Erreur lors de la sauvegarde de la photo de l'élève." }
    }

    return { success: true }
  } catch (err: any) {
    console.error("Exception dans uploadStudentPhoto :", err)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}
