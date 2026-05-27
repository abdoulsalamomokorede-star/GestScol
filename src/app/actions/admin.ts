'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UtilisateurSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional(),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  telephone: z.string().optional(),
  role: z.enum(['directeur', 'enseignant', 'parent']),
  ecoleId: z.string().uuid("ID école invalide"),
  civilite: z.enum(['M.', 'Mme', 'Mlle']).optional(),
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
    // 0. Vérification de l'authentification de l'appelant
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: "Non autorisé. Veuillez vous connecter." }
    }

    // Validation des données
    const validation = UtilisateurSchema.safeParse(data)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }

    const { email, password, nom, prenom, telephone, role, ecoleId, civilite, oldId } = validation.data

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

    // Validation (on pourrait valider que l'appelant est directeur de la même école que l'utilisateur ciblé)
    // Pour l'instant, on exige au moins une authentification active.

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

