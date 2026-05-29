'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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

export async function registerSchoolAndAdmin(data: RegisterPayload) {
  try {
    const supabase = await createClient()

    // 0. Vérifier si l'utilisateur existe déjà dans notre base de données locale (utilisateurs)
    const { data: existingUser } = await supabase
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
      const adminSupabase = createAdminClient()
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

    const { data: ecoleData, error: ecoleError } = await supabase
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
    
    await supabase.from('annees_scolaires').insert({
      ecole_id: ecoleId,
      nom: anneeScolaire,
      date_debut: anneeScolaireDebut,
      date_fin: anneeScolaireFin,
      statut: 'active'
    })

    // 3. Créer l'utilisateur (Directeur) dans la table `utilisateurs`
    const fullAdminPhone = `${data.adminPhonePrefix} ${data.adminPhone}`
    
    const { error: userError } = await supabase
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

    const { error: abonnementError } = await supabase
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
