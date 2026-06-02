'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { Ecole } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Server Action pour mettre à jour les détails d'une école (y compris son logo Base64 volumineux)
 * de manière hautement sécurisée en contournant les restrictions du navigateur et RLS côté client.
 */
export async function updateSchoolDetails(ecoleId: string, data: Partial<Ecole>) {
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

    // Validation de sécurité du logo Base64 côté serveur (magic bytes + taille)
    if (data.logo) {
      // 1. Validation de la taille (max 1 Mo)
      // En Base64, 1 Mo de fichier = environ 1.33 Mo de texte (1 370 000 caractères)
      if (data.logo.length > 1370000) {
        return { success: false, error: "Fichier trop volumineux. La taille maximale autorisée est de 1 Mo." }
      }

      // 2. Validation du type MIME et des magic bytes
      const parts = data.logo.split(';base64,')
      if (parts.length !== 2) {
        return { success: false, error: "Format d'image non supporté ou corrompu." }
      }

      const mimeType = parts[0].replace('data:', '')
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedMimes.includes(mimeType)) {
        return { success: false, error: "Type d'image non autorisé. Seuls JPEG, PNG et WebP sont acceptés." }
      }

      // Extraction des magic bytes réels pour empêcher les fausses extensions/MIME-types
      const base64Data = parts[1]
      const buffer = Buffer.from(base64Data, 'base64')
      const hex = buffer.subarray(0, 4).toString('hex')

      const MAGIC_BYTES: Record<string, string> = {
        'ffd8ff': 'image/jpeg',
        '89504e47': 'image/png',
        '52494646': 'image/webp',
      }

      const detectedType = Object.entries(MAGIC_BYTES)
        .find(([magic]) => hex.startsWith(magic))?.[1]

      if (!detectedType) {
        return { success: false, error: "Signature de fichier non valide (tentative d'injection bloquée)." }
      }
    }

    const supabase = createAdminClient()

    // Préparation des données en snake_case pour Supabase
    const updateData: any = {}
    if (data.nom !== undefined) updateData.nom = data.nom
    if (data.identifiant !== undefined) updateData.identifiant = data.identifiant
    if (data.ville !== undefined) updateData.ville = data.ville
    if (data.adresse !== undefined) updateData.adresse = data.adresse
    if (data.telephone !== undefined) updateData.telephone = data.telephone
    if (data.logo !== undefined) updateData.logo = data.logo
    if (data.anneeScolaire !== undefined) updateData.annee_scolaire = data.anneeScolaire

    // Mise à jour de la table ecoles via admin client
    const { data: resData, error } = await supabase
      .from('ecoles')
      .update(updateData)
      .eq('id', ecoleId)
      .select()

    if (error) {
      console.error("Erreur Supabase lors de la mise à jour de l'école :", error.message)
      return { success: false, error: `Erreur base de données : ${error.message}` }
    }

    revalidatePath('/parametres')

    return { 
      success: true, 
      data: resData && resData.length > 0 ? {
        id: resData[0].id,
        identifiant: resData[0].identifiant,
        nom: resData[0].nom,
        ville: resData[0].ville,
        adresse: resData[0].adresse,
        telephone: resData[0].telephone,
        logo: resData[0].logo,
        anneeScolaire: resData[0].annee_scolaire
      } : null
    }

  } catch (err: any) {
    console.error("Exception dans updateSchoolDetails :", err)
    return { success: false, error: err.message || "Une erreur inattendue est survenue." }
  }
}
