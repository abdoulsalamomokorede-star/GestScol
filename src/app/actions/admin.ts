'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UtilisateurSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères (NIST 800-63B)")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial")
    .optional(),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  telephone: z.string().optional(),
  role: z.enum(['directeur', 'enseignant', 'parent']),
  ecoleId: z.string().uuid("ID école invalide"),
  civilite: z.enum(['M', 'Mme', 'Mlle', 'Dr', 'Pr']).optional(),
  oldId: z.string().uuid().optional()
})

// We need a dedicated admin client using the service role key to create accounts silently
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variables d\'environnement Supabase manquantes pour l\'administration.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function createUtilisateurAuth(data: z.infer<typeof UtilisateurSchema>) {
  try {
    // 0. Vérification de l'authentification de l'appelant et de son rôle
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: "Non autorisé. Veuillez vous connecter." }
    }

    // Récupérer le profil réel de l'utilisateur connecté
    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('utilisateurs')
      .select('role, ecole_id')
      .eq('id', user.id)
      .single()

    if (callerProfileError || !callerProfile) {
      return { success: false, error: "Profil de l'appelant introuvable." }
    }

    if (callerProfile.role !== 'directeur') {
      return { success: false, error: "Accès refusé. Privilèges de Directeur requis." }
    }

    // Validation des données
    const validation = UtilisateurSchema.safeParse(data)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }

    const { email, password, nom, prenom, telephone, role, ecoleId, civilite, oldId } = validation.data

    // S'assurer que le Directeur ne gère que les utilisateurs de son propre établissement
    if (callerProfile.ecole_id !== ecoleId) {
      return { success: false, error: "Non autorisé. Vous ne pouvez gérer que les comptes de votre établissement." }
    }

    const adminAuthClient = getAdminClient()

    // 1. Check if user already exists
    const { data: existingUsers } = await adminAuthClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === email)
    
    let authUserId: string

    if (existingUser) {
      if (password) {
        await adminAuthClient.auth.admin.updateUserById(existingUser.id, { password })
      }
      authUserId = existingUser.id
    } else {
      const { data: newData, error: createError } = await adminAuthClient.auth.admin.createUser({
        email,
        password: password || undefined,
        email_confirm: true
      })

      if (createError) {
        return { success: false, error: "Impossible de créer le compte utilisateur." }
      }
      
      if (!newData.user) {
        return { success: false, error: "Le compte n'a pas pu être créé." }
      }
      
      authUserId = newData.user.id
    }

    if (oldId && authUserId !== oldId) {
      const { error: updateIdError } = await adminAuthClient
        .from('utilisateurs')
        .update({ id: authUserId })
        .eq('id', oldId)
        
      if (updateIdError) {
        return { success: false, error: "Erreur lors de la mise à jour de l'ancien identifiant." }
      }
    }

    // 2. Add or update user profile in `utilisateurs` table
    const { error: dbError } = await adminAuthClient
      .from('utilisateurs')
      .upsert({
        id: authUserId,
        nom,
        prenom,
        email,
        telephone,
        role,
        ecole_id: ecoleId,
        civilite
      }, { onConflict: 'id' })

    if (dbError) {
      // Ne pas renvoyer le message d'erreur brut de la base de données au client
      return { success: false, error: "Erreur lors de l'enregistrement dans la base de données. Il est possible que cet email soit déjà utilisé." }
    }

    return { success: true, userId: authUserId }

  } catch (err: any) {
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

export async function adminUpdatePassword(userId: string, newPassword: string) {
  try {
    // Vérification de l'authentification de l'appelant
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: "Non autorisé. Veuillez vous connecter." }
    }

    // 1. Récupérer le profil du Directeur appelant
    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('utilisateurs')
      .select('role, ecole_id')
      .eq('id', user.id)
      .single()

    if (callerProfileError || !callerProfile || callerProfile.role !== 'directeur') {
      return { success: false, error: "Accès refusé. Privilèges de Directeur requis." }
    }

    // 2. Récupérer l'utilisateur ciblé pour s'assurer qu'il appartient à la même école
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('utilisateurs')
      .select('ecole_id')
      .eq('id', userId)
      .single()

    if (targetProfileError || !targetProfile || targetProfile.ecole_id !== callerProfile.ecole_id) {
      return { success: false, error: "Non autorisé. L'utilisateur ciblé n'appartient pas à votre établissement." }
    }

    // Valider la longueur minimale de mot de passe fort (NIST 800-63B)
    if (newPassword.length < 12) {
      return { success: false, error: "Le mot de passe doit contenir au moins 12 caractères." }
    }

    const adminAuthClient = getAdminClient()
    const { error } = await adminAuthClient.auth.admin.updateUserById(userId, { password: newPassword })
    
    if (error) {
      return { success: false, error: "Erreur lors de la modification du mot de passe." }
    }
    
    return { success: true }
  } catch (err: any) {
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

