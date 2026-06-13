'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { type EmailOtpType } from '@supabase/supabase-js'

const PasswordSchema = z.string()
  .min(12, "Le mot de passe doit contenir au moins 12 caractères (NIST 800-63B)")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
  .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial")

function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str
  return str.replace(/<[^>]*>/g, '').trim()
}

const RegisterPayloadSchema = z.object({
  plan: z.enum(['gratuit', 'standard', 'premium']),
  schoolName: z.string().min(2, "Le nom de l'école est trop court").max(100),
  address: z.string().min(2, "L'adresse est trop courte").max(200),
  city: z.string().min(2, "La ville est trop courte").max(100),
  countryPrefix: z.string().min(1).max(10),
  phone: z.string().min(5).max(20),
  levels: z.array(z.string()),
  adminFirstName: z.string().min(1, "Le prénom est requis").max(100),
  adminLastName: z.string().min(1, "Le nom est requis").max(100),
  adminCivilite: z.enum(['M', 'Mme', 'Mlle', 'Dr', 'Pr']),
  adminEmail: z.string().email("Format d'email invalide"),
  adminPhonePrefix: z.string().min(1).max(10),
  adminPhone: z.string().min(5).max(20),
  adminPassword: PasswordSchema,
  paymentMethod: z.string().optional(),
  paymentPhone: z.string().optional()
})

const RegisterDirectorPayloadSchema = z.object({
  adminFirstName: z.string().min(1, "Le prénom est requis").max(100),
  adminLastName: z.string().min(1, "Le nom est requis").max(100),
  adminCivilite: z.enum(['M', 'Mme', 'Mlle', 'Dr', 'Pr']),
  adminEmail: z.string().email("Format d'email invalide"),
  adminPhonePrefix: z.string().min(1).max(10),
  adminPhone: z.string().min(5).max(20),
  adminPassword: PasswordSchema
})

const RegisterSchoolPayloadSchema = z.object({
  plan: z.enum(['gratuit', 'standard', 'premium']),
  schoolName: z.string().min(2, "Le nom de l'école est trop court").max(100),
  address: z.string().min(2, "L'adresse est trop courte").max(200),
  city: z.string().min(2, "La ville est trop courte").max(100),
  countryPrefix: z.string().min(1).max(10),
  phone: z.string().min(5).max(20),
  levels: z.array(z.string()),
  paymentMethod: z.string().optional(),
  paymentPhone: z.string().optional()
})

const CreateDirecteurAccountSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100),
  prenom: z.string().min(1, "Le prénom est requis").max(100),
  civilite: z.enum(['M', 'Mme', 'Mlle', 'Dr', 'Pr']),
  email: z.string().email("Format d'email invalide"),
  telephone: z.string().optional(),
  motDePasse: PasswordSchema,
  nomEcole: z.string().optional(),
  villeEcole: z.string().optional(),
  adresseEcole: z.string().optional(),
  telephoneEcole: z.string().optional(),
  niveauxEcole: z.array(z.string()).optional(),
  logo: z.string().optional()
})

const CreateEnseignantAccountSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100),
  prenom: z.string().min(1, "Le prénom est requis").max(100),
  civilite: z.enum(['M', 'Mme', 'Mlle', 'Dr', 'Pr']),
  email: z.string().email("Format d'email invalide"),
  telephone: z.string().optional(),
  motDePasse: PasswordSchema,
  codeInvitation: z.string().optional()
})

const CreateParentAccountSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100),
  prenom: z.string().min(1, "Le prénom est requis").max(100),
  civilite: z.enum(['M', 'Mme', 'Mlle', 'Dr', 'Pr']),
  email: z.string().email("Format d'email invalide"),
  telephone: z.string().optional(),
  motDePasse: PasswordSchema
})

const AjouterEcoleActionSchema = z.object({
  nom: z.string().min(2, "Le nom de l'école est trop court").max(100),
  ville: z.string().min(2, "La ville est trop courte").max(100),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  logo: z.string().optional().nullable(),
  niveaux: z.array(z.string()),
  anneeScolaire: z.string().min(4).max(20)
})

type RegisterPayload = {
  plan: 'gratuit' | 'standard' | 'premium'
  schoolName: string
  address: string
  city: string
  countryPrefix: string
  phone: string
  levels: string[]
  
  adminFirstName: string
  adminLastName: string
  adminCivilite: string
  adminEmail: string
  adminPhonePrefix: string
  adminPhone: string
  adminPassword: string
  
  paymentMethod?: string
  paymentPhone?: string
}

export async function registerSchoolAndAdmin(rawPayload: RegisterPayload) {
  try {
    const validation = RegisterPayloadSchema.safeParse(rawPayload)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }
    const validated = validation.data
    const sanitizedData = {
      ...validated,
      schoolName: sanitizeString(validated.schoolName),
      address: sanitizeString(validated.address),
      city: sanitizeString(validated.city),
      adminFirstName: sanitizeString(validated.adminFirstName),
      adminLastName: sanitizeString(validated.adminLastName)
    }
    const data = sanitizedData;

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 0. Vérifier si l'utilisateur existe déjà dans notre base de données locale (utilisateurs)
    const { data: existingUser } = await adminSupabase
      .from('utilisateurs')
      .select('id, email, ecole_id')
      .eq('email', data.adminEmail)
      .maybeSingle()

    if (existingUser) {
      return { 
        success: false, 
        error: "Cet e-mail est déjà associé à un compte existant. Veuillez vous connecter." 
      }
    }

    // 0.5. Nettoyer tout compte orphelin dans auth.users si possible
    try {
      const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()
      if (!listError && usersData && usersData.users) {
        const authUser = usersData.users.find(
          (u) => u.email?.toLowerCase() === data.adminEmail.toLowerCase()
        )
        if (authUser) {
          console.log(`[Autoguérison] Suppression du compte auth orphelin détecté : ${authUser.id} (${authUser.email})`)
          const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(authUser.id)
          if (deleteError) {
            console.error("[Autoguérison] Erreur lors de la suppression de l'utilisateur orphelin :", deleteError)
          } else {
            console.log(`[Autoguérison] Compte auth orphelin ${authUser.id} supprimé avec succès.`)
          }
        }
      }
    } catch (adminError) {
      console.warn("[Autoguérison] Impossible de nettoyer les comptes orphelins (les variables d'administration ne sont pas disponibles) :", adminError)
    }

    // 1. Créer le compte utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.adminEmail,
      password: data.adminPassword,
      options: {
        data: {
          nom: data.adminLastName,
          prenom: data.adminFirstName,
          role: 'directeur'
        }
      }
    })

    if (authError) {
      console.error("Auth Error:", authError)
      const msg = authError.message.toLowerCase()
      if (msg.includes("already registered") || msg.includes("already be associated")) {
        return { success: false, error: "Cette adresse email est déjà utilisée." }
      }
      if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("once per minute")) {
        return { 
          success: false, 
          error: "Trop de tentatives d'inscription. Veuillez patienter quelques minutes avant de réessayer." 
        }
      }
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { 
        success: false, 
        error: "Erreur : Cet e-mail semble déjà être associé à un compte existant. Veuillez utiliser une autre adresse e-mail ou vous connecter." 
      }
    }

    const userId = authData.user.id

    // 2. Créer l'école
    const anneeScolaire = "2026-2027" // Peut être calculé dynamiquement
    const fullSchoolPhone = `${data.countryPrefix} ${data.phone}`

    const { data: ecoleData, error: ecoleError } = await adminSupabase
      .from('ecoles')
      .insert({
        identifiant: `GS-${Math.floor(100000 + Math.random() * 900000)}`, // Generate random 6-digit ID
        nom: data.schoolName,
        ville: data.city,
        adresse: data.address,
        telephone: fullSchoolPhone,
        niveaux: data.levels,
        annee_scolaire: anneeScolaire
      })
      .select('id, identifiant')
      .single()

    if (ecoleError) {
      console.error("Ecole Error:", ecoleError)
      // Note: On pourrait supprimer le compte Auth ici si ça échoue
      return { success: false, error: "Erreur lors de la création de l'école." }
    }

    const ecoleId = ecoleData.id

    // 2.5 Créer l'année scolaire par défaut
    const anneeScolaireDebut = anneeScolaire.split('-')[0] + '-09-01'
    const anneeScolaireFin = anneeScolaire.split('-')[1] + '-07-31'
    
    await adminSupabase.from('annees_scolaires').insert({
      ecole_id: ecoleId,
      nom: anneeScolaire,
      date_debut: anneeScolaireDebut,
      date_fin: anneeScolaireFin,
      statut: 'active'
    })

    // 3. Créer l'utilisateur (Directeur) dans la table `utilisateurs`
    const fullAdminPhone = `${data.adminPhonePrefix} ${data.adminPhone}`
    
    const { error: userError } = await adminSupabase
      .from('utilisateurs')
      .upsert({
        id: userId,
        nom: data.adminLastName,
        prenom: data.adminFirstName,
        civilite: data.adminCivilite,
        email: data.adminEmail,
        telephone: fullAdminPhone,
        role: 'directeur',
        ecole_id: ecoleId
      }, { onConflict: 'id' })

    if (userError) {
      console.error("User Insert Error:", userError)
      return { success: false, error: "Erreur lors de l'enregistrement du directeur." }
    }

    // 4. Créer l'abonnement
    let statut = 'actif'
    let montant = 0
    let maxEleves = 50
    let dateFin: string | null = null

    if (data.plan === 'standard') {
      montant = 150000
      maxEleves = 300
      const fin = new Date()
      fin.setFullYear(fin.getFullYear() + 1)
      dateFin = fin.toISOString()
    } else if (data.plan === 'premium') {
      montant = 250000
      maxEleves = 99999 // Illimité
      const fin = new Date()
      fin.setFullYear(fin.getFullYear() + 1)
      dateFin = fin.toISOString()
    }

    const { error: abonnementError } = await adminSupabase
      .from('abonnements')
      .insert({
        ecole_id: ecoleId,
        plan: data.plan,
        statut: statut, // Pour le moment on l'active directement à l'inscription
        mode_paiement: data.paymentMethod || null,
        montant_paye: montant,
        max_eleves: maxEleves,
        transaction_ref: data.paymentPhone ? `SIM-${Date.now()}` : null,
        date_fin: dateFin
      })

    if (abonnementError) {
      console.error("Abonnement Error:", abonnementError)
      return { success: false, error: "Erreur lors de l'activation de l'abonnement." }
    }

    // Revalidate paths if needed
    revalidatePath('/')

    return { 
      success: true,
      user: {
        id: userId,
        nom: data.adminLastName,
        prenom: data.adminFirstName,
        civilite: data.adminCivilite,
        email: data.adminEmail,
        telephone: fullAdminPhone,
        role: 'directeur',
        ecoleId: ecoleId
      },
      ecole: {
        id: ecoleId,
        nom: data.schoolName,
        ville: data.city,
        adresse: data.address,
        telephone: fullSchoolPhone,
        identifiant: ecoleData.identifiant
      }
    }
  } catch (error: any) {
    console.error("Unexpected error in registerSchoolAndAdmin:", error)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

// --- NOUVEAU FLUX EN 2 ÉTAPES (COMPTE DIRECTEUR PUIS ÉCOLE) ---

interface RegisterDirectorPayload {
  adminFirstName: string
  adminLastName: string
  adminCivilite: string
  adminEmail: string
  adminPhonePrefix: string
  adminPhone: string
  adminPassword: string
}

export async function registerDirectorAccount(rawPayload: RegisterDirectorPayload) {
  try {
    const validation = RegisterDirectorPayloadSchema.safeParse(rawPayload)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }
    const validated = validation.data
    const sanitizedData = {
      ...validated,
      adminFirstName: sanitizeString(validated.adminFirstName),
      adminLastName: sanitizeString(validated.adminLastName)
    }
    const data = sanitizedData;

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 2. Vérifier si l'utilisateur existe déjà dans notre base de données locale (utilisateurs)
    const { data: existingUser } = await adminSupabase
      .from('utilisateurs')
      .select('id, email')
      .eq('email', data.adminEmail)
      .maybeSingle()

    if (existingUser) {
      return { 
        success: false, 
        error: "Cet e-mail est déjà associé à un compte existant. Veuillez vous connecter." 
      }
    }

    // 2.5. Nettoyer tout compte orphelin dans auth.users si possible
    try {
      const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()
      if (!listError && usersData && usersData.users) {
        const authUser = usersData.users.find(
          (u) => u.email?.toLowerCase() === data.adminEmail.toLowerCase()
        )
        if (authUser) {
          console.log(`[Autoguérison] Suppression du compte auth orphelin détecté : ${authUser.id} (${authUser.email})`)
          const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(authUser.id)
          if (deleteError) {
            console.error("[Autoguérison] Erreur lors de la suppression de l'utilisateur orphelin :", deleteError)
          }
        }
      }
    } catch (adminError) {
      console.warn("[Autoguérison] Impossible de nettoyer les comptes orphelins :", adminError)
    }

    // 3. Créer le compte utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.adminEmail,
      password: data.adminPassword,
      options: {
        data: {
          nom: data.adminLastName,
          prenom: data.adminFirstName,
          role: 'directeur'
        }
      }
    })

    if (authError) {
      console.error("Auth Error:", authError)
      const msg = authError.message.toLowerCase()
      if (msg.includes("already registered") || msg.includes("already be associated")) {
        return { success: false, error: "Cette adresse email est déjà utilisée." }
      }
      if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("once per minute")) {
        return { 
          success: false, 
          error: "Trop de tentatives d'inscription. Veuillez patienter quelques minutes avant de réessayer." 
        }
      }
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { 
        success: false, 
        error: "Erreur : Cet e-mail semble déjà être associé à un compte existant." 
      }
    }

    const userId = authData.user.id
    const fullAdminPhone = `${data.adminPhonePrefix} ${data.adminPhone}`

    // 4. Créer le profil dans utilisateurs (ecole_id est nul au départ)
    const { error: userError } = await adminSupabase
      .from('utilisateurs')
      .upsert({
        id: userId,
        nom: data.adminLastName,
        prenom: data.adminFirstName,
        civilite: data.adminCivilite,
        email: data.adminEmail,
        telephone: fullAdminPhone,
        role: 'directeur',
        ecole_id: null
      }, { onConflict: 'id' })

    if (userError) {
      console.error("User Insert Error:", userError)
      return { success: false, error: "Erreur lors de l'enregistrement du directeur." }
    }

    return {
      success: true,
      user: {
        id: userId,
        nom: data.adminLastName,
        prenom: data.adminFirstName,
        civilite: data.adminCivilite,
        email: data.adminEmail,
        telephone: fullAdminPhone,
        role: 'directeur',
        ecoleId: null
      }
    }
  } catch (error: any) {
    console.error("Unexpected error in registerDirectorAccount:", error)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

interface RegisterSchoolPayload {
  plan: 'gratuit' | 'standard' | 'premium'
  schoolName: string
  address: string
  city: string
  countryPrefix: string
  phone: string
  levels: string[]
  paymentMethod?: string
  paymentPhone?: string
}

export async function registerSchoolForDirector(rawPayload: RegisterSchoolPayload, userId: string) {
  try {
    const validation = RegisterSchoolPayloadSchema.safeParse(rawPayload)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }
    const validated = validation.data
    const sanitizedData = {
      ...validated,
      schoolName: sanitizeString(validated.schoolName),
      address: sanitizeString(validated.address),
      city: sanitizeString(validated.city)
    }
    const data = sanitizedData;
    if (!userId) {
      return { success: false, error: "Utilisateur non authentifié." }
    }

    const adminSupabase = createAdminClient()

    // 1. Créer l'école
    const anneeScolaire = "2026-2027"
    const fullSchoolPhone = `${data.countryPrefix} ${data.phone}`

    const { data: ecoleData, error: ecoleError } = await adminSupabase
      .from('ecoles')
      .insert({
        identifiant: `GS-${Math.floor(100000 + Math.random() * 900000)}`, // Generate random 6-digit ID
        nom: data.schoolName,
        ville: data.city,
        adresse: data.address,
        telephone: fullSchoolPhone,
        niveaux: data.levels,
        annee_scolaire: anneeScolaire,
        directeur_id: userId // Liaison de l'école au directeur propriétaire
      })
      .select('id, identifiant')
      .single()

    if (ecoleError) {
      console.error("Ecole Error:", ecoleError)
      return { success: false, error: "Erreur lors de la création de l'école." }
    }

    const ecoleId = ecoleData.id

    // 2. Créer l'année scolaire par défaut
    const anneeScolaireDebut = anneeScolaire.split('-')[0] + '-09-01'
    const anneeScolaireFin = anneeScolaire.split('-')[1] + '-07-31'
    
    const { error: anneeError } = await adminSupabase.from('annees_scolaires').insert({
      ecole_id: ecoleId,
      nom: anneeScolaire,
      date_debut: anneeScolaireDebut,
      date_fin: anneeScolaireFin,
      statut: 'active'
    })

    if (anneeError) {
      console.error("Annee Scolaire Error:", anneeError)
      return { success: false, error: "Erreur lors de la création de l'année scolaire par défaut." }
    }

    // 3. Mettre à jour le profil utilisateur (Directeur) pour le lier à l'école créée
    const { error: userError } = await adminSupabase
      .from('utilisateurs')
      .update({ ecole_id: ecoleId })
      .eq('id', userId)

    if (userError) {
      console.error("User Update Error:", userError)
      return { success: false, error: "Erreur lors du rattachement de l'école au directeur." }
    }

    // 4. Créer l'abonnement
    let statut = 'actif'
    let montant = 0
    let maxEleves = 50
    let dateFin: string | null = null

    if (data.plan === 'standard') {
      montant = 150000
      maxEleves = 300
      const fin = new Date()
      fin.setFullYear(fin.getFullYear() + 1)
      dateFin = fin.toISOString()
    } else if (data.plan === 'premium') {
      montant = 250000
      maxEleves = 99999 // Illimité
      const fin = new Date()
      fin.setFullYear(fin.getFullYear() + 1)
      dateFin = fin.toISOString()
    }

    const { error: abonnementError } = await adminSupabase
      .from('abonnements')
      .insert({
        ecole_id: ecoleId,
        plan: data.plan,
        statut: statut,
        mode_paiement: data.paymentMethod || null,
        montant_paye: montant,
        max_eleves: maxEleves,
        transaction_ref: data.paymentPhone ? `SIM-${Date.now()}` : null,
        date_fin: dateFin
      })

    if (abonnementError) {
      console.error("Abonnement Error:", abonnementError)
      return { success: false, error: "Erreur lors de l'activation de l'abonnement." }
    }

    // Revalidate cache paths
    revalidatePath('/')

    return { 
      success: true,
      ecole: {
        id: ecoleId,
        nom: data.schoolName,
        ville: data.city,
        adresse: data.address,
        telephone: fullSchoolPhone,
        identifiant: ecoleData.identifiant
      }
    }
  } catch (error: any) {
    console.error("Unexpected error in registerSchoolForDirector:", error)
    return { success: false, error: "Une erreur inattendue est survenue lors de l'enregistrement de l'école." }
  }
}

// ── CRÉATION COMPTE DIRECTEUR CONSOLIDE ─────────────────────────
export async function createDirecteurAccount(rawPayload: any) {
  try {
    const validation = CreateDirecteurAccountSchema.safeParse(rawPayload)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }
    const validated = validation.data
    const sanitizedData = {
      ...validated,
      nom: sanitizeString(validated.nom),
      prenom: sanitizeString(validated.prenom),
      nomEcole: validated.nomEcole ? sanitizeString(validated.nomEcole) : undefined,
      villeEcole: validated.villeEcole ? sanitizeString(validated.villeEcole) : undefined,
      adresseEcole: validated.adresseEcole ? sanitizeString(validated.adresseEcole) : undefined,
      telephoneEcole: validated.telephoneEcole ? sanitizeString(validated.telephoneEcole) : undefined
    }
    const data = sanitizedData;
    const adminSupabase = createAdminClient()

    // 2. Vérifier si l'email existe
    const { data: existing } = await adminSupabase
      .from('utilisateurs')
      .select('id, email')
      .eq('email', data.email)
      .maybeSingle()

    if (existing) {
      return { success: false, error: "Cette adresse email est déjà associée à un compte." }
    }

    // 2.5. Nettoyer tout compte orphelin dans auth.users si possible
    try {
      const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()
      if (!listError && usersData && usersData.users) {
        const authUser = usersData.users.find(
          (u) => u.email?.toLowerCase() === data.email.toLowerCase()
        )
        if (authUser) {
          console.log(`[Autoguérison] Suppression du compte auth orphelin détecté dans createDirecteurAccount : ${authUser.id} (${authUser.email})`)
          const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(authUser.id)
          if (deleteError) {
            console.error("[Autoguérison] Erreur lors de la suppression de l'utilisateur orphelin :", deleteError)
          } else {
            console.log(`[Autoguérison] Compte auth orphelin ${authUser.id} supprimé avec succès.`)
          }
        }
      }
    } catch (adminError) {
      console.warn("[Autoguérison] Impossible de nettoyer les comptes orphelins :", adminError)
    }

    // 3. Créer l'utilisateur dans Supabase Auth via signUp pour envoyer l'email de confirmation
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.motDePasse,
      options: {
        data: {
          nom: data.nom,
          prenom: data.prenom,
          role: 'directeur'
        }
      }
    })

    console.log("[signUp] Directeur result:", { user: authData?.user, session: authData?.session, error: authError })
    if (authError || !authData.user) {
      return { success: false, error: authError?.message || `Erreur d'inscription dans Supabase Auth (user is ${authData?.user ? 'defined' : 'null'})` }
    }

    const userId = authData.user.id

    // 4. Créer le profil dans public.utilisateurs
    const { error: userError } = await adminSupabase
      .from('utilisateurs')
      .insert({
        id: userId,
        nom: data.nom,
        prenom: data.prenom,
        civilite: data.civilite,
        email: data.email,
        telephone: data.telephone,
        role: 'directeur',
        ecole_id: null
      })

    if (userError) {
      await adminSupabase.auth.admin.deleteUser(userId)
      return { success: false, error: "Impossible de créer le profil utilisateur." }
    }

    // 5. Si une école est fournie, la créer
    if (data.nomEcole && data.villeEcole) {
      const ecoleIdentifiant = `GS-${Math.floor(100000 + Math.random() * 900000)}`
      const { data: ecoleData, error: ecoleError } = await adminSupabase
        .from('ecoles')
        .insert({
          identifiant: ecoleIdentifiant,
          nom: data.nomEcole,
          ville: data.villeEcole,
          adresse: data.adresseEcole || '',
          telephone: data.telephoneEcole || data.telephone,
          niveaux: data.niveauxEcole || ['primaire'],
          annee_scolaire: '2026-2027',
          directeur_id: userId,
          logo: data.logo || null
        })
        .select('id')
        .single()

      if (!ecoleError && ecoleData) {
        // Associer l'école à l'utilisateur et la définir comme école courante
        await adminSupabase
          .from('utilisateurs')
          .update({ 
            ecole_id: ecoleData.id,
            ecole_courante_id: ecoleData.id
          })
          .eq('id', userId)

        // Créer l'année scolaire par défaut
        await adminSupabase.from('annees_scolaires').insert({
          ecole_id: ecoleData.id,
          nom: '2026-2027',
          date_debut: '2026-09-01',
          date_fin: '2027-07-31',
          statut: 'active'
        })

        // Activer l'abonnement d'essai gratuit
        await adminSupabase.from('abonnements').insert({
          ecole_id: ecoleData.id,
          plan: 'gratuit',
          statut: 'actif',
          montant_paye: 0,
          max_eleves: 50
        })
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in createDirecteurAccount Server Action:", error)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

// ── CRÉATION COMPTE ENSEIGNANT ──────────────────────────────────
export async function createEnseignantAccount(rawPayload: any) {
  try {
    const validation = CreateEnseignantAccountSchema.safeParse(rawPayload)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }
    const validated = validation.data
    const sanitizedData = {
      ...validated,
      nom: sanitizeString(validated.nom),
      prenom: sanitizeString(validated.prenom)
    }
    const data = sanitizedData;
    const adminSupabase = createAdminClient()

    // 2. Vérifier si l'email existe déjà
    const { data: existing } = await adminSupabase
      .from('utilisateurs')
      .select('id, email')
      .eq('email', data.email)
      .maybeSingle()

    if (existing) {
      return { success: false, error: "Cette adresse email est déjà associée à un compte." }
    }

    // 2.5. Nettoyer tout compte orphelin dans auth.users si possible
    try {
      const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()
      if (!listError && usersData && usersData.users) {
        const authUser = usersData.users.find(
          (u) => u.email?.toLowerCase() === data.email.toLowerCase()
        )
        if (authUser) {
          console.log(`[Autoguérison] Suppression du compte auth orphelin détecté dans createEnseignantAccount : ${authUser.id} (${authUser.email})`)
          const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(authUser.id)
          if (deleteError) {
            console.error("[Autoguérison] Erreur lors de la suppression de l'utilisateur orphelin :", deleteError)
          } else {
            console.log(`[Autoguérison] Compte auth orphelin ${authUser.id} supprimé avec succès.`)
          }
        }
      }
    } catch (adminError) {
      console.warn("[Autoguérison] Impossible de nettoyer les comptes orphelins :", adminError)
    }

    // 3. Rechercher une invitation valide (par code ou par email)
    let invitation = null
    if (data.codeInvitation) {
      const { data: inviteByCode } = await adminSupabase
        .from('invitations_enseignant')
        .select('*')
        .eq('code', data.codeInvitation.toUpperCase().trim())
        .eq('utilise', false)
        .gt('expire_le', new Date().toISOString())
        .maybeSingle()

      invitation = inviteByCode
    }

    if (!invitation) {
      const { data: inviteByEmail } = await adminSupabase
        .from('invitations_enseignant')
        .select('*')
        .eq('email_cible', data.email.toLowerCase().trim())
        .eq('utilise', false)
        .gt('expire_le', new Date().toISOString())
        .maybeSingle()

      invitation = inviteByEmail
    }

    // 4. Créer l'utilisateur dans Supabase Auth via signUp pour envoyer l'email de confirmation
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.motDePasse,
      options: {
        data: {
          nom: data.nom,
          prenom: data.prenom,
          role: 'enseignant'
        }
      }
    })

    console.log("[signUp] Enseignant result:", { user: authData?.user, session: authData?.session, error: authError })
    if (authError || !authData.user) {
      return { success: false, error: authError?.message || `Erreur d'inscription Auth (user is ${authData?.user ? 'defined' : 'null'})` }
    }

    const userId = authData.user.id

    // 5. Créer le profil dans utilisateurs
    const { error: userError } = await adminSupabase
      .from('utilisateurs')
      .insert({
        id: userId,
        nom: data.nom,
        prenom: data.prenom,
        civilite: data.civilite,
        email: data.email,
        telephone: data.telephone,
        role: 'enseignant',
        ecole_id: invitation ? invitation.ecole_id : null
      })

    if (userError) {
      await adminSupabase.auth.admin.deleteUser(userId)
      return { success: false, error: "Erreur lors de la création du profil utilisateur." }
    }

    // 6. Si une invitation est trouvée, associer l'enseignant et l'invitation
    if (invitation) {
      // Créer la jointure enseignant_ecoles
      await adminSupabase
        .from('enseignant_ecoles')
        .insert({
          enseignant_id: userId,
          ecole_id: invitation.ecole_id,
          actif: true
        })

      // Marquer l'invitation comme utilisée
      await adminSupabase
        .from('invitations_enseignant')
        .update({ utilise: true })
        .eq('id', invitation.id)

      // Envoyer une notification au directeur
      await adminSupabase.from('notifications').insert({
        ecole_id: invitation.ecole_id,
        titre: "Enseignant inscrit via invitation",
        description: `L'enseignant ${data.prenom} ${data.nom} (${data.email}) a rejoint l'établissement en utilisant une invitation valide.`,
        type: 'systeme'
      })
    }

    return { success: true, invitationAssociee: !!invitation }
  } catch (error: any) {
    console.error("Error in createEnseignantAccount Server Action:", error)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

// ── CRÉATION COMPTE PARENT ──────────────────────────────────────
export async function createParentAccount(rawPayload: any) {
  try {
    const validation = CreateParentAccountSchema.safeParse(rawPayload)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }
    const validated = validation.data
    const sanitizedData = {
      ...validated,
      nom: sanitizeString(validated.nom),
      prenom: sanitizeString(validated.prenom)
    }
    const data = sanitizedData;
    const adminSupabase = createAdminClient()

    // 2. Vérifier si l'email existe déjà
    const { data: existing } = await adminSupabase
      .from('utilisateurs')
      .select('id, email')
      .eq('email', data.email)
      .maybeSingle()

    if (existing) {
      return { success: false, error: "Cette adresse email est déjà associée à un compte." }
    }

    // 2.5. Nettoyer tout compte orphelin dans auth.users si possible
    try {
      const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()
      if (!listError && usersData && usersData.users) {
        const authUser = usersData.users.find(
          (u) => u.email?.toLowerCase() === data.email.toLowerCase()
        )
        if (authUser) {
          console.log(`[Autoguérison] Suppression du compte auth orphelin détecté dans createParentAccount : ${authUser.id} (${authUser.email})`)
          const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(authUser.id)
          if (deleteError) {
            console.error("[Autoguérison] Erreur lors de la suppression de l'utilisateur orphelin :", deleteError)
          } else {
            console.log(`[Autoguérison] Compte auth orphelin ${authUser.id} supprimé avec succès.`)
          }
        }
      }
    } catch (adminError) {
      console.warn("[Autoguérison] Impossible de nettoyer les comptes orphelins :", adminError)
    }

    // 3. Créer l'utilisateur dans Supabase Auth via signUp pour envoyer l'email de confirmation
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.motDePasse,
      options: {
        data: {
          nom: data.nom,
          prenom: data.prenom,
          role: 'parent'
        }
      }
    })

    console.log("[signUp] Parent result:", { user: authData?.user, session: authData?.session, error: authError })
    if (authError || !authData.user) {
      return { success: false, error: authError?.message || `Erreur d'inscription Auth (user is ${authData?.user ? 'defined' : 'null'})` }
    }

    const userId = authData.user.id

    // 4. Créer le profil dans utilisateurs
    const { error: userError } = await adminSupabase
      .from('utilisateurs')
      .insert({
        id: userId,
        nom: data.nom,
        prenom: data.prenom,
        civilite: data.civilite,
        email: data.email,
        telephone: data.telephone,
        role: 'parent',
        ecole_id: null
      })

    if (userError) {
      await adminSupabase.auth.admin.deleteUser(userId)
      return { success: false, error: "Erreur lors de la création du profil utilisateur." }
    }

    // 5. Réconciliation automatique des élèves via parent_email
    const { data: eleves } = await adminSupabase
      .from('eleves')
      .select('id, ecole_id, nom, prenom')
      .eq('parent_email', data.email)

    let nbElevesLies = 0

    if (eleves && eleves.length > 0) {
      nbElevesLies = eleves.length
      for (const eleve of eleves) {
        await adminSupabase
          .from('eleves')
          .update({ parent_user_id: userId })
          .eq('id', eleve.id)

        // Envoyer une notification système dans l'école pour signaler la liaison
        await adminSupabase.from('notifications').insert({
          ecole_id: eleve.ecole_id,
          titre: "Compte parent connecté",
          description: `Le parent de l'élève ${eleve.prenom} ${eleve.nom} a créé et activé son compte personnel (${data.email}).`,
          type: 'systeme',
          eleve_id: eleve.id
        })
      }
    }

    return { success: true, nbElevesLies }
  } catch (error: any) {
    console.error("Error in createParentAccount Server Action:", error)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

// ── GESTION DES ECOLES ACTIONS ──────────────────────────────────
export async function ajouterEcoleAction(rawDonnees: any) {
  try {
    const validation = AjouterEcoleActionSchema.safeParse(rawDonnees)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }
    const validated = validation.data
    const sanitizedDonnees = {
      ...validated,
      nom: sanitizeString(validated.nom),
      ville: sanitizeString(validated.ville),
      adresse: validated.adresse ? sanitizeString(validated.adresse) : undefined,
      telephone: validated.telephone ? sanitizeString(validated.telephone) : undefined
    }
    const donnees = sanitizedDonnees;
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Vérifier la session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Non autorisé. Session requise." }

    const { data: profile } = await adminSupabase
      .from('utilisateurs')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'directeur') {
      return { success: false, error: "Accès refusé. Rôle directeur requis." }
    }

    const ecoleIdentifiant = `GS-${Math.floor(100000 + Math.random() * 900000)}`
    const { data: school, error } = await adminSupabase
      .from('ecoles')
      .insert({
        identifiant: ecoleIdentifiant,
        nom: donnees.nom,
        ville: donnees.ville,
        adresse: donnees.adresse || '',
        telephone: donnees.telephone || '',
        logo: donnees.logo || null,
        niveaux: donnees.niveaux,
        annee_scolaire: donnees.anneeScolaire,
        directeur_id: user.id
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Créer l'année scolaire par défaut
    const anneeScolaireDebut = donnees.anneeScolaire.split('-')[0] + '-09-01'
    const anneeScolaireFin = donnees.anneeScolaire.split('-')[1] + '-07-31'
    await adminSupabase.from('annees_scolaires').insert({
      ecole_id: school.id,
      nom: donnees.anneeScolaire,
      date_debut: anneeScolaireDebut,
      date_fin: anneeScolaireFin,
      statut: 'active'
    })

    // Créer l'abonnement gratuit
    await adminSupabase.from('abonnements').insert({
      ecole_id: school.id,
      plan: 'gratuit',
      statut: 'actif',
      montant_paye: 0,
      max_eleves: 50
    })

    revalidatePath('/')
    return { success: true, data: school }
  } catch (error: any) {
    console.error("Error in ajouterEcoleAction Server Action:", error)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

export async function supprimerEcoleAction(ecoleId: string) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Vérifier la session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Non autorisé. Session requise." }

    // Vérifier les droits du directeur et la possession de l'école
    const { data: ecole } = await adminSupabase
      .from('ecoles')
      .select('id, directeur_id, nom')
      .eq('id', ecoleId)
      .eq('directeur_id', user.id)
      .single()

    if (!ecole) return { success: false, error: "Établissement introuvable ou non autorisé." }

    // Audit counts
    const { count: countEleves } = await adminSupabase.from('eleves').select('*', { count: 'exact', head: true }).eq('ecole_id', ecoleId)
    const { count: countEnseignants } = await adminSupabase.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('ecole_id', ecoleId).eq('role', 'enseignant')

    await adminSupabase.from('audit_suppressions').insert({
      directeur_id: user.id,
      ecole_id: ecoleId,
      ecole_nom: ecole.nom,
      nb_eleves_supprimes: countEleves ?? 0,
      nb_enseignants_supprimes: countEnseignants ?? 0,
      nb_paiements_supprimes: 0
    })

    // Supprimer l'école (le trigger cascade s'occupe de vider les autres tables)
    const { error } = await adminSupabase
      .from('ecoles')
      .delete()
      .eq('id', ecoleId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error("Error in supprimerEcoleAction Server Action:", error)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}

/**
 * Associe un enseignant déjà connecté à une école via un code d'invitation valide.
 */
export async function rejoindreEcoleViaCode(codeInvitation: string) {
  try {
    if (!codeInvitation) {
      return { success: false, error: "Le code d'invitation est requis." }
    }

    // 1. Récupérer l'utilisateur connecté sur le serveur
    const serverSupabase = await createClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Non autorisé. Veuillez vous connecter." }
    }

    // 2. Récupérer son profil
    const { data: profile, error: profileError } = await serverSupabase
      .from('utilisateurs')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "Profil utilisateur introuvable." }
    }

    if (profile.role !== 'enseignant') {
      return { success: false, error: "Seul un enseignant peut rejoindre un établissement via un code d'invitation." }
    }

    const adminSupabase = createAdminClient()

    // 3. Rechercher une invitation active avec ce code
    const { data: invitation, error: inviteError } = await adminSupabase
      .from('invitations_enseignant')
      .select('*')
      .eq('code', codeInvitation.toUpperCase().trim())
      .eq('utilise', false)
      .gt('expire_le', new Date().toISOString())
      .maybeSingle()

    if (inviteError || !invitation) {
      return { success: false, error: "Code d'invitation invalide, expiré ou déjà utilisé." }
    }

    // 4. Vérifier si l'enseignant est déjà lié à cette école
    const { data: existingLink } = await adminSupabase
      .from('enseignant_ecoles')
      .select('*')
      .eq('enseignant_id', user.id)
      .eq('ecole_id', invitation.ecole_id)
      .maybeSingle()

    if (existingLink) {
      return { success: false, error: "Vous êtes déjà membre de cet établissement." }
    }

    // 5. Créer la liaison dans enseignant_ecoles
    const { error: linkError } = await adminSupabase
      .from('enseignant_ecoles')
      .insert({
        enseignant_id: user.id,
        ecole_id: invitation.ecole_id,
        actif: true
      })

    if (linkError) {
      return { success: false, error: "Erreur lors de la liaison avec l'établissement." }
    }

    // 6. Mettre à jour l'ecole_id principal de l'enseignant si celui-ci était nul
    if (!profile.ecole_id) {
      await adminSupabase
        .from('utilisateurs')
        .update({ ecole_id: invitation.ecole_id, ecole_courante_id: invitation.ecole_id })
        .eq('id', user.id)
    }

    // 7. Marquer l'invitation comme utilisée
    await adminSupabase
      .from('invitations_enseignant')
      .update({ utilise: true })
      .eq('id', invitation.id)

    // 8. Envoyer une notification au directeur de l'école ciblée
    await adminSupabase.from('notifications').insert({
      ecole_id: invitation.ecole_id,
      titre: "Enseignant rattaché via code",
      description: `L'enseignant ${profile.prenom} ${profile.nom} (${profile.email}) s'est rattaché à l'établissement avec succès.`,
      type: 'systeme'
    })

    return { success: true, ecoleId: invitation.ecole_id }

  } catch (err: any) {
    console.error("Exception dans rejoindreEcoleViaCode:", err)
    return { success: false, error: err.message || "Une erreur inattendue est survenue." }
  }
}

/**
 * Valide le jeton d'OTP (token_hash) pour confirmer l'inscription ou la modification du compte.
 */
export async function confirmUserAccount(tokenHash: string, type: EmailOtpType) {
  try {
    if (!tokenHash || !type) {
      return { success: false, error: "Paramètres de confirmation invalides ou manquants." }
    }
    
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type
    })

    if (error) {
      console.error("[OTP Verification Error]:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in confirmUserAccount Server Action:", error)
    return { success: false, error: "Une erreur inattendue est survenue." }
  }
}



