import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Eleve, Classe, Note, Paiement, Absence, Matiere, Inscription, Bulletin, AnneeScolaire, Ecole, UserCompteSimule, AbonnementEcole, NotificationItem, NotificationType } from '../types'
import { classesMock, elevesMock, notesMock, paiementsMock, absencesMock, matieresMock, ecoleMock, usersMock, inscriptionsMock, bulletinsMock } from '../data/mockData'
import { createClient } from '../lib/supabase/client'
import { updateSchoolAbonnement, getSchoolAbonnement } from '../app/actions/abonnement'
import { updateSchoolDetails } from '../app/actions/ecole'
import { createNotification, markAsRead, fetchUserLectures, deleteNotificationDb, deleteNotificationsDb } from '../app/actions/notifications'
import { toast } from '../hooks/use-toast'

function validateBase64ImageClient(base64DataString: string | undefined): { success: boolean; error?: string } {
  if (!base64DataString) return { success: true }
  if (base64DataString.length > 1370000) {
    return { success: false, error: "La taille de l'image ne doit pas dépasser 1 Mo." }
  }
  const parts = base64DataString.split(';base64,')
  if (parts.length !== 2) {
    return { success: false, error: "Format d'image non supporté ou corrompu." }
  }
  const mimeType = parts[0].replace('data:', '')
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedMimes.includes(mimeType)) {
    return { success: false, error: "Type d'image non autorisé. Seuls JPEG, PNG et WebP sont acceptés." }
  }

  const base64Data = parts[1]
  const header = base64Data.substring(0, 15)
  const isJpeg = header.startsWith('/9j/')
  const isPng = header.startsWith('iVBORw0KGgo')
  const isWebp = header.startsWith('UklGR')

  if (!isJpeg && !isPng && !isWebp) {
    return { success: false, error: "Signature de fichier invalide (tentative d'injection bloquée)." }
  }
  return { success: true }
}

interface SchoolState {
  ecole: Ecole
  currentUser: User | null
  eleves: Eleve[]
  classes: Classe[]
  notes: Note[]
  paiements: Paiement[]
  absences: Absence[]
  matieres: Matiere[]
  enseignants: User[]
  inscriptions: Inscription[]
  bulletins: Bulletin[]
  anneesScolaires: AnneeScolaire[]
  activeAnneeScolaire: AnneeScolaire | null
  comptesSimules: UserCompteSimule[]
  notifications: NotificationItem[]
  suppressedNotificationIds: string[]
  currentLanguage?: 'fr' | 'ar'
  setLanguage: (lang: 'fr' | 'ar') => void
  
  updateEcole: (data: Partial<Ecole>) => void
  updateAbonnement: (data: Partial<AbonnementEcole>) => Promise<void>
  
  fetchNotifications: () => Promise<void>
  addNotification: (data: {
    titre: string
    description: string
    type: NotificationType
    destinataireRole?: 'parent' | 'enseignant' | 'directeur' | 'all'
    classeId?: string
    eleveId?: string
  }) => Promise<void>
  markNotificationAsRead: (id: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  deleteNotifications: (ids: string[]) => Promise<void>
  
  fetchSupabaseData: () => Promise<void>
  
  setComptesSimules: (comptes: UserCompteSimule[]) => void
  addCompteConnexion: (compte: UserCompteSimule) => Promise<void>
  updateCompteConnexion: (id: string, data: Partial<UserCompteSimule>) => Promise<void>
  deleteCompteConnexion: (id: string) => Promise<void>

  initializeAnneesScolaires: () => void
  addAnneeScolaire: (annee: AnneeScolaire | any) => Promise<any>
  updateAnneeScolaire: (id: string, data: Partial<AnneeScolaire>) => Promise<void>
  deleteAnneeScolaire: (id: string) => Promise<void>
  setActiveAnneeScolaire: (id: string) => Promise<void>
  setCurrentUser: (user: User | null) => void
  clearSchoolData: (ecoleData: Partial<Ecole>) => void
  
  getEleves: (classeId?: string) => Eleve[]
  getEleveById: (id: string) => Eleve | undefined
  addEleve: (eleve: Eleve) => Promise<{ success: boolean; error?: string }>
  updateEleve: (id: string, data: Partial<Eleve>) => Promise<{ success: boolean; error?: string }>
  deleteEleve: (id: string) => Promise<{ success: boolean; error?: string }>
  
  getClasses: () => Classe[]
  getClasseById: (id: string) => Classe | undefined
  addClasse: (classe: Classe) => Promise<{ success: boolean; error?: string }>
  updateClasse: (id: string, data: Partial<Classe>) => Promise<{ success: boolean; error?: string }>
  deleteClasse: (id: string) => Promise<{ success: boolean; error?: string }>
  
  getNotesByEleve: (eleveId: string, trimestre?: 1 | 2 | 3) => Note[]
  addNote: (note: Note) => Promise<{ success: boolean; error?: string }>
  updateNote: (id: string, data: Partial<Note>) => Promise<{ success: boolean; error?: string }>
  deleteNote: (id: string) => Promise<{ success: boolean; error?: string }>
  
  getPaiementsByEleve: (eleveId: string) => Paiement[]
  addPaiement: (paiement: Paiement) => Promise<{ success: boolean; error?: string }>
  updatePaiementStatut: (id: string, statut: 'paye' | 'en_attente' | 'retard', mode?: 'especes' | 'wave' | 'orange_money' | 'mtn_momo', reference?: string) => Promise<{ success: boolean; error?: string }>
  enregistrerPaiementInstallment: (id: string, montantEncaisse: number, mode: 'especes' | 'wave' | 'orange_money' | 'mtn_momo', reference?: string) => Promise<{ success: boolean; error?: string }>
  annulerVersement: (id: string, versementIdx: number) => Promise<{ success: boolean; error?: string }>
  updateClasseTarifs: (classeId: string, montantScolarite: number, montantInscription: number) => Promise<{ success: boolean; error?: string }>
  
  getAbsencesByEleve: (eleveId: string) => Absence[]
  addAbsence: (absence: Absence) => Promise<{ success: boolean; error?: string }>
  enregistrerAbsences: (date: string, seance: 'matin' | 'apres-midi', absences: Absence[], eleveIds: string[]) => Promise<{ success: boolean; error?: string }>
  justifierAbsence: (absenceId: string, motif?: string, justifiee?: boolean) => Promise<{ success: boolean; error?: string }>
  
  addMatiere: (matiere: Matiere) => Promise<{ success: boolean; error?: string }>
  updateMatiere: (id: string, data: Partial<Matiere>) => Promise<{ success: boolean; error?: string }>
  deleteMatiere: (id: string) => Promise<{ success: boolean; error?: string }>

  addEnseignant: (ens: User) => Promise<{ success: boolean; error?: string }>
  updateEnseignant: (id: string, data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  deleteEnseignant: (id: string) => Promise<{ success: boolean; error?: string }>
  gererAjoutEnseignant: (emailEnseignant: string) => Promise<{ success: boolean; cas?: 'associe' | 'invite'; nomEnseignant?: string; error?: string }>
  annulerInvitationEnseignant: (invitationId: string) => Promise<{ success: boolean; error?: string }>
  chargerEnseignants: () => Promise<{ associes: any[]; invitationsEnAttente: any[] }>
  
  getInscriptions: () => Inscription[]
  getInscriptionsByEleve: (eleveId: string) => Inscription[]
  addInscription: (inscription: Inscription | any) => Promise<{ success: boolean; error?: string }>
  updateInscription: (id: string, data: Partial<Inscription>) => Promise<{ success: boolean; error?: string }>
  deleteInscription: (id: string) => Promise<{ success: boolean; error?: string }>
  
  getMoyenneEleve: (eleveId: string, trimestre: 1 | 2 | 3) => number

  addBulletin: (bulletin: Bulletin) => Promise<{ success: boolean; error?: string }>
  updateBulletin: (id: string, data: Partial<Bulletin>) => Promise<{ success: boolean; error?: string }>
  deleteBulletin: (id: string) => Promise<{ success: boolean; error?: string }>
  getBulletinsByClasseAndTrimestre: (classeId: string, trimestre: 1 | 2 | 3) => Bulletin[]
  calculerBulletinsClasse: (classeId: string, trimestre: 1 | 2 | 3, anneeScolaire: string) => Bulletin[]
  isAbonnementExpired: () => boolean
  ecoleId: string | null
  fetchEcolesUtilisateur: () => Promise<any[]>
  ajouterEcole: (donnees: any) => Promise<{ success: boolean; data?: any; error?: string }>
  supprimerEcole: (ecoleId: string) => Promise<{ success: boolean; error?: string }>
  setEcoleCourante: (ecoleId: string) => Promise<void>
  upgradeParentToPremium: (type: 'annuel' | 't1' | 't2' | 't3', anneeId: string) => Promise<{ success: boolean; error?: string }>
}

const checkAbonnement = (state: any, suppressToast = false): boolean => {
  const ecole = state.ecole
  if (!ecole?.abonnement) return false
  const isExpired = ['expire', 'suspendu'].includes(ecole.abonnement.statut) ||
    (ecole.abonnement.dateFin && new Date(ecole.abonnement.dateFin) < new Date())
  if (isExpired) {
    const errorMsg = "Abonnement expiré. Veuillez le renouveler pour effectuer cette action."
    if (!suppressToast) {
      try {
        toast({
          title: "Action impossible",
          description: errorMsg,
          variant: "destructive"
        })
      } catch (e) {
        console.warn("Could not display toast from checkAbonnement:", e)
      }
    }
    return true
  }
  return false
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set, get) => ({
      ecole: ecoleMock,
      currentLanguage: 'fr',
      setLanguage: (lang: 'fr' | 'ar') => set({ currentLanguage: lang }),
      updateEcole: async (data) => {
        if (checkAbonnement(get())) return
        const state = get()
        if (state.ecole.id) {
          const res = await updateSchoolDetails(state.ecole.id, data)
          if (!res.success) {
            console.warn("Erreur updateSchoolDetails en base :", res.error)
          }
        }
        set((state) => ({ ecole: { ...state.ecole, ...data } }))
      },
      updateAbonnement: async (data) => {
        const state = get()
        if (state.ecole.id) {
          const res = await updateSchoolAbonnement(state.ecole.id, data)
          if (!res.success) {
            console.warn("Erreur de mise à jour de l'abonnement en base :", res.error)
          }
        }
        
        set((state) => {
          const currentAbonnement = state.ecole.abonnement || {
            id: '',
            ecoleId: state.ecole.id,
            plan: 'gratuit',
            statut: 'en_attente',
            dateDebut: new Date().toISOString(),
            montantPaye: 0,
            maxEleves: 50
          }
          
          return {
            ecole: {
              ...state.ecole,
              abonnement: {
                ...currentAbonnement,
                ...data
              }
            }
          }
        })
      },
      fetchNotifications: async () => {
        const state = get()
        const currentUser = state.currentUser
        if (!currentUser || !state.ecole.id) return

        try {
          const supabase = createClient()
          
          // 1. Charger les lectures de l'utilisateur connecté
          const lecturesRes = await fetchUserLectures(currentUser.id)
          const readIds = lecturesRes.readIds || []

          let query = supabase
            .from('notifications')
            .select('*')
            .eq('ecole_id', state.ecole.id)

          if (currentUser.role !== 'directeur') {
            query = query.or(`destinataire_role.eq.${currentUser.role},destinataire_role.eq.tous,destinataire_role.eq.all,cree_par.eq.${currentUser.id}`)
          }

          const { data, error } = await query
            .order('created_at', { ascending: false })

          if (error) {
            console.warn("Erreur Supabase fetchNotifications (Basculement en mode local):", error.message)
            return
          }

          if (data) {
            const mapped: NotificationItem[] = data.map(item => ({
              id: item.id,
              ecoleId: item.ecole_id,
              titre: item.titre,
              description: item.description,
              type: item.type as any,
              destinataireRole: item.destinataire_role || undefined,
              classeId: item.classe_id || undefined,
              eleveId: item.eleve_id || undefined,
              creePar: item.cree_par || undefined,
              createdAt: item.created_at,
              lu: readIds.includes(item.id)
            }))
            
            set({ notifications: mapped })
          }

        } catch (err) {
          console.warn("Exception fetchNotifications (Utilisation de l'état mocké existant):", err)
        }
      },

      addNotification: async (data) => {
        const state = get()
        if (!state.ecole.id) return

        const newNotifObj = {
          ecoleId: state.ecole.id,
          titre: data.titre,
          description: data.description,
          type: data.type,
          destinataireRole: data.destinataireRole,
          classeId: data.classeId,
          eleveId: data.eleveId,
          creePar: state.currentUser?.id
        }

        // 1. Envoyer en base de données via notre Server Action RLS-bypass
        const res = await createNotification(newNotifObj)
        
        // 2. Mettre à jour l'état local
        if (res.success && res.data) {
          set(state => ({
            notifications: [res.data!, ...state.notifications]
          }))
        } else {
          // Si la table n'existe pas en DB, on l'ajoute au store local mocké
          const localMockNotif: NotificationItem = {
            id: `mock-temp-${Date.now()}`,
            ecoleId: state.ecole.id,
            titre: data.titre,
            description: data.description,
            type: data.type,
            destinataireRole: data.destinataireRole,
            classeId: data.classeId,
            eleveId: data.eleveId,
            creePar: state.currentUser?.id,
            createdAt: new Date().toISOString(),
            lu: false
          }
          set(state => ({
            notifications: [localMockNotif, ...state.notifications]
          }))
        }
      },

      markNotificationAsRead: async (id) => {
        const state = get()
        const currentUser = state.currentUser
        if (!currentUser) return

        // 1. Si ce n'est pas une notification mockée temporaire, enregistrer en base via la Server Action
        if (!id.startsWith('mock-temp-') && !id.startsWith('mock-')) {
          await markAsRead(id, currentUser.id)
        }

        // 2. Mettre à jour l'état local
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, lu: true } : n)
        }))
      },

      deleteNotification: async (id) => {
        const state = get()
        const currentUser = state.currentUser
        if (!currentUser) return

        if (currentUser.role === 'directeur') {
          // Le Directeur supprime définitivement la notification en base pour tout le monde
          if (!id.startsWith('mock-temp-') && !id.startsWith('mock-')) {
            const res = await deleteNotificationDb(id)
            if (!res.success) {
              toast({
                title: "Erreur de suppression",
                description: res.error || "Impossible de supprimer la notification de la base de données.",
                variant: "destructive"
              })
              return
            }
          }
          // On la retire également localement
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }))
        } else {
          // Les parents et enseignants ne font que la masquer pour eux-mêmes de manière persistante avec isolation utilisateur
          set(state => ({
            suppressedNotificationIds: [...(state.suppressedNotificationIds || []), `${currentUser.id}_${id}`]
          }))
        }
      },

      deleteNotifications: async (ids) => {
        const state = get()
        const currentUser = state.currentUser
        if (!currentUser || !ids || ids.length === 0) return

        if (currentUser.role === 'directeur') {
          const dbIds = ids.filter(id => !id.startsWith('mock-temp-') && !id.startsWith('mock-'))
          if (dbIds.length > 0) {
            const res = await deleteNotificationsDb(dbIds)
            if (!res.success) {
              toast({
                title: "Erreur de suppression",
                description: res.error || "Impossible de supprimer les notifications de la base de données.",
                variant: "destructive"
              })
              return
            }
          }
          set(state => ({
            notifications: state.notifications.filter(n => !ids.includes(n.id))
          }))
        } else {
          const newSuppressed = ids.map(id => `${currentUser.id}_${id}`)
          set(state => ({
            suppressedNotificationIds: Array.from(new Set([...(state.suppressedNotificationIds || []), ...newSuppressed]))
          }))
        }
      },
      ecoleId: null,
      currentUser: null,
      eleves: elevesMock,
      classes: classesMock,
      notes: notesMock,
      paiements: paiementsMock.map(p => ({
        ...p,
        montantPaye: p.montantPaye !== undefined ? p.montantPaye : (p.statut === 'paye' ? p.montant : 0),
        historiquePaiements: p.historiquePaiements || (p.statut === 'paye' ? [{
          date: p.datePaiement || '2024-09-02',
          montant: p.montant,
          mode: p.modePaiement || 'especes',
          reference: p.reference
        }] : [])
      })),
      absences: absencesMock,
      matieres: matieresMock,
      enseignants: usersMock.filter(u => u.role === 'enseignant'),
      inscriptions: inscriptionsMock,
      bulletins: bulletinsMock,
      anneesScolaires: [
        { id: 'as-2024-2025', nom: '2024-2025', dateDebut: '2024-09-01', dateFin: '2025-07-31', statut: 'active' }
      ],
      activeAnneeScolaire: { id: 'as-2024-2025', nom: '2024-2025', dateDebut: '2024-09-01', dateFin: '2025-07-31', statut: 'active' },
      comptesSimules: [],
      notifications: [
        {
          id: 'mock-1',
          ecoleId: 'ecole-1',
          titre: 'Reçu de versement scolarité',
          description: "Un versement de 150 000 FCFA a été enregistré via CinetPay (Wave) pour l'élève Amenan Grace Kouassi (Classe: CM2 A).",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          type: 'paiement',
          eleveId: 'el-1',
          classeId: 'c3',
          lu: false
        },
        {
          id: 'mock-2',
          ecoleId: 'ecole-1',
          titre: 'Absence enregistrée',
          description: "L'absence de l'élève Mamadou Traoré (Classe: CM2 A) a été signalée pour la séance du matin (Motif: Visite médicale).",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          type: 'absence',
          eleveId: 'el-2',
          classeId: 'c3',
          lu: false
        },
        {
          id: 'mock-3',
          ecoleId: 'ecole-1',
          titre: 'Bulletin du 1er Trimestre disponible',
          description: "Le bulletin officiel de l'élève Mireille Essi Aka (Classe: CP1 A) a été généré et approuvé par la direction.",
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          type: 'bulletin',
          eleveId: 'el-11',
          classeId: 'c1',
          lu: true
        },
        {
          id: 'mock-4',
          ecoleId: 'ecole-1',
          titre: 'Nouvel élève inscrit',
          description: "Dossier d'inscription complété et validé pour Ibrahim Cheick Diallo (Classe: CP1 A).",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          type: 'inscription',
          eleveId: 'el-12',
          classeId: 'c1',
          lu: true
        },
        {
          id: 'mock-5',
          ecoleId: 'ecole-1',
          titre: "Réunion des parents d'élèves",
          description: "La direction de GestScol convie tous les parents d'élèves à la grande réunion de fin d'année le samedi 6 juin à 9h00.",
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          type: 'communique',
          destinataireRole: 'parent',
          lu: false
        }
      ],
      suppressedNotificationIds: [],

      clearSchoolData: (ecoleData) => set({
        ecole: { ...ecoleMock, ...ecoleData, id: ecoleData.id || '' },
        eleves: [],
        classes: [],
        notes: [],
        paiements: [],
        absences: [],
        matieres: [],
        enseignants: [],
        inscriptions: [],
        bulletins: [],
        comptesSimules: [],
        notifications: [],
        suppressedNotificationIds: []
      }),

      setComptesSimules: (comptes) => set({ comptesSimules: comptes }),

      addCompteConnexion: async (compte) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          const { error } = await supabase.from('comptes_connexion').insert({
            id: compte.id,
            identifiant: compte.identifiant,
            mdp_temporaire: compte.mdpTemporaire,
            role: compte.role,
            nom: compte.nom,
            prenom: compte.prenom,
            email: compte.email || null,
            telephone: compte.telephone || null,
            enseignant_id: compte.enseignantId || null,
            eleves_associes: compte.elevesAssocies || [],
            date_creation: compte.dateCreation
          })
          if (error) {
            console.warn("Erreur addCompteConnexion:", error.message)
            throw error
          }
          set((state) => ({ comptesSimules: [...state.comptesSimules, compte] }))
        } catch (e) {
          console.warn("Exception addCompteConnexion:", e)
          throw e
        }
      },

      updateCompteConnexion: async (id, data) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.mdpTemporaire) updateData.mdp_temporaire = data.mdpTemporaire
          if (data.nom) updateData.nom = data.nom
          if (data.prenom) updateData.prenom = data.prenom
          if (data.email !== undefined) updateData.email = data.email
          if (data.telephone !== undefined) updateData.telephone = data.telephone
          if (data.elevesAssocies) updateData.eleves_associes = data.elevesAssocies
          if (data.identifiant) updateData.identifiant = data.identifiant
          
          await supabase.from('comptes_connexion').update(updateData).eq('id', id)
        } catch (e) {
          console.warn("Exception updateCompteConnexion:", e)
        }
        set((state) => ({
          comptesSimules: state.comptesSimules.map(c => c.id === id ? { ...c, ...data } : c)
        }))
      },

      deleteCompteConnexion: async (id) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          await supabase.from('comptes_connexion').delete().eq('id', id)
        } catch (e) {
          console.warn("Exception deleteCompteConnexion:", e)
        }
        set((state) => ({
          comptesSimules: state.comptesSimules.filter(c => c.id !== id)
        }))
      },

      fetchSupabaseData: async () => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) return; // Do not fetch if no user is logged in
          
          const supabase = createClient()

          // ── CAS PARENT (Bug 7) ───────────────────────────────────
          if (currentUser.role === 'parent') {
            const eleveIds: string[] = []

            // Méthode A : via comptes_connexion
            const { data: connexions } = await supabase
              .from('comptes_connexion')
              .select('eleves_associes')
              .eq('id', currentUser.id)
              .maybeSingle()
            
            const associes = connexions?.eleves_associes || []
            eleveIds.push(...associes)

            // Méthode B (fallback) : via parent_email sur les élèves
            if (eleveIds.length === 0) {
              const { data: elevesParEmail } = await supabase
                .from('eleves')
                .select('id')
                .ilike('parent_email', currentUser.email)
              eleveIds.push(...(elevesParEmail?.map(e => e.id) ?? []))
            }

            if (eleveIds.length === 0) {
              console.warn('[Parent] Aucun élève lié à ce compte')
              return
            }

            // Resolve class IDs from eleves to load classes
            const { data: dbEleves } = await supabase.from('eleves').select('*').in('id', eleveIds)
            const classIds = dbEleves ? Array.from(new Set(dbEleves.map(e => e.classe_id).filter(Boolean))) as string[] : []
            const ecoleIds = dbEleves ? Array.from(new Set(dbEleves.map(e => e.ecole_id).filter(Boolean))) as string[] : []
            const activeEcoleId = get().ecoleId || (ecoleIds.length > 0 ? ecoleIds[0] : null)

            const [notes, absences, paiements, bulletins, dbClasses, dbEcoles, dbMatieres, inscriptions, dbAnnees, abonnementRes, meRes] = await Promise.all([
              supabase.from('notes').select('*').in('eleve_id', eleveIds),
              supabase.from('absences').select('*').in('eleve_id', eleveIds),
              supabase.from('paiements').select('*').in('eleve_id', eleveIds),
              supabase.from('bulletins').select('*').in('eleve_id', eleveIds),
              classIds.length > 0 ? supabase.from('classes').select('*').in('id', classIds) : Promise.resolve({ data: [] }),
              activeEcoleId ? supabase.from('ecoles').select('*').eq('id', activeEcoleId) : Promise.resolve({ data: [] }),
              classIds.length > 0 ? supabase.from('matieres').select('*').in('classe_id', classIds) : Promise.resolve({ data: [] }),
              supabase.from('inscriptions').select('*').in('eleve_id', eleveIds),
              activeEcoleId ? supabase.from('annees_scolaires').select('*').eq('ecole_id', activeEcoleId) : Promise.resolve({ data: [] }),
              activeEcoleId ? getSchoolAbonnement(activeEcoleId) : Promise.resolve({ success: false, data: null }),
              supabase.from('utilisateurs').select('*').eq('id', currentUser.id).maybeSingle()
            ])

            const mappedAnnees = (dbAnnees.data ?? []).map(a => ({
              id: a.id,
              nom: a.nom,
              dateDebut: a.date_debut,
              dateFin: a.date_fin,
              statut: a.statut as 'active' | 'archivee'
            }))
            const active = mappedAnnees.find(a => a.statut === 'active')

            // Mettre à jour le store avec les données récupérées
            set({
              notes: (notes.data ?? []).map(n => ({
                id: n.id,
                eleveId: n.eleve_id,
                matiereId: n.matiere_id,
                valeur: n.valeur,
                coefficient: n.coefficient,
                type: n.type,
                numero: n.numero,
                date: n.date,
                trimestre: n.trimestre,
                anneeScolaire: n.annee_scolaire
              })),
              absences: (absences.data ?? []).map(a => ({
                id: a.id,
                eleveId: a.eleve_id,
                date: a.date,
                seance: a.seance,
                justifiee: a.justifiee,
                motif: a.motif,
                anneeScolaire: a.annee_scolaire
              })),
              paiements: (paiements.data ?? []).map(p => ({
                id: p.id,
                eleveId: p.eleve_id,
                inscriptionId: p.inscription_id,
                montant: p.montant,
                montantPaye: p.montant_paye,
                type: p.type,
                statut: p.statut,
                datePaiement: p.date_paiement,
                dateLimite: p.date_limite,
                modePaiement: p.mode_paiement,
                reference: p.reference,
                historiquePaiements: p.historique_paiements || [],
                anneeScolaire: p.annee_scolaire
              })),
              bulletins: (bulletins.data ?? []).map(b => ({
                id: b.id,
                eleveId: b.eleve_id,
                classeId: b.classe_id,
                trimestre: b.trimestre,
                anneeScolaire: b.annee_scolaire,
                notes: b.notes,
                moyenneGenerale: b.moyenne_generale,
                moyenneClasse: b.moyenne_classe,
                rangClasse: b.rang_classe,
                effectifClasse: b.effectif_classe,
                appreciation: b.appreciation,
                appreciationDirecteur: b.appreciation_directeur,
                dateGeneration: b.date_generation,
                estValide: b.est_valide || false
              })),
              eleves: (dbEleves ?? []).map(e => ({
                id: e.id,
                matricule: e.matricule,
                nom: e.nom,
                prenom: e.prenom,
                dateNaissance: e.date_naissance,
                sexe: e.sexe,
                classeId: e.classe_id,
                ecoleId: e.ecole_id,
                parentNom: e.parent_nom,
                parentTelephone: e.parent_telephone,
                parentEmail: e.parent_email,
                parentUserId: e.parent_user_id || currentUser.id,
                photoUrl: e.photo_url,
                statut: e.statut,
                dateInscription: e.date_inscription
              })),
              inscriptions: (inscriptions.data ?? []).map(i => {
                const pFrais = (paiements.data ?? [])?.find(p => p.inscription_id === i.id && p.type === 'inscription')
                return {
                  id: i.id,
                  eleveId: i.eleve_id,
                  anneeScolaire: i.annee_scolaire,
                  dateInscription: i.date_inscription,
                  classeId: i.classe_id,
                  ecoleId: i.ecole_id,
                  documentsFournis: i.documents_fournis || [],
                  statut: i.statut,
                  fraisInscription: i.frais_inscription !== undefined && i.frais_inscription !== null ? Number(i.frais_inscription) : (pFrais ? pFrais.montant : 0),
                  documentsRecus: i.documents_recus || i.documents_fournis || []
                }
              }),
              classes: (dbClasses.data ?? []).map(c => ({
                id: c.id,
                nom: c.nom,
                niveau: c.niveau,
                enseignantPrincipalId: c.enseignant_principal_id,
                ecoleId: c.ecole_id,
                montantScolarite: c.montant_scolarite,
                montantInscription: c.montant_inscription
              })),
              matieres: (dbMatieres.data ?? []).map(m => ({
                id: m.id,
                nom: m.nom,
                coefficient: m.coefficient,
                classeId: m.classe_id
              })),
              anneesScolaires: mappedAnnees,
              activeAnneeScolaire: active || null,
              ecoleId: activeEcoleId,
              ecole: dbEcoles.data && dbEcoles.data.length > 0 ? (() => {
                const currentDbEcole = dbEcoles.data.find(e => e.id === activeEcoleId) || dbEcoles.data[0]
                const ecoleAbonnement = abonnementRes && abonnementRes.success && abonnementRes.data ? {
                  id: abonnementRes.data.id,
                  ecoleId: abonnementRes.data.ecoleId,
                  plan: abonnementRes.data.plan,
                  statut: abonnementRes.data.statut,
                  dateDebut: abonnementRes.data.dateDebut,
                  dateFin: abonnementRes.data.dateFin,
                  transactionRef: abonnementRes.data.transactionRef,
                  modePaiement: abonnementRes.data.modePaiement,
                  montantPaye: abonnementRes.data.montantPaye,
                  maxEleves: abonnementRes.data.maxEleves
                } : get().ecole?.abonnement
                
                return {
                  id: currentDbEcole.id,
                  nom: currentDbEcole.nom,
                  ville: currentDbEcole.ville,
                  adresse: currentDbEcole.adresse,
                  telephone: currentDbEcole.telephone,
                  logo: currentDbEcole.logo,
                  anneeScolaire: currentDbEcole.annee_scolaire,
                  niveaux: currentDbEcole.niveaux,
                  abonnement: ecoleAbonnement
                }
              })() : get().ecole
            })
            const dbMe = meRes?.data
            if (dbMe) {
              set({
                currentUser: {
                  ...currentUser,
                  nom: dbMe.nom,
                  prenom: dbMe.prenom,
                  email: dbMe.email,
                  telephone: dbMe.telephone,
                  photoUrl: dbMe.photo_url,
                  parentSubscriptionStatus: dbMe.parent_subscription_status || 'gratuit'
                }
              })
            }
            return
          }

          const targetEcoleId = currentUser.ecoleId;
          if (!targetEcoleId) return;
          const ecoleId = targetEcoleId;

          // Vague 1 : Exécuter toutes les requêtes réseau indépendantes en parallèle
          const [
            ecolesRes,
            anneesRes,
            utilisateursRes,
            classesRes,
            elevesRes,
            inscriptionsRes,
            abonnementRes
          ] = await Promise.all([
            supabase.from('ecoles').select('*').eq('id', targetEcoleId),
            supabase.from('annees_scolaires').select('*').eq('ecole_id', ecoleId),
            supabase.from('utilisateurs').select('*').eq('ecole_id', ecoleId),
            supabase.from('classes').select('*').eq('ecole_id', ecoleId),
            supabase.from('eleves').select('*').eq('ecole_id', ecoleId),
            supabase.from('inscriptions').select('*').eq('ecole_id', ecoleId),
            getSchoolAbonnement(ecoleId)
          ])

          const ecoles = ecolesRes.data || []
          const anneesScolaires = anneesRes.data || []
          const utilisateurs = utilisateursRes.data || []
          const classes = classesRes.data || []
          const eleves = elevesRes.data || []
          const inscriptions = inscriptionsRes.data || []
          const abonnements = abonnementRes.success && abonnementRes.data ? [abonnementRes.data] : null

          // Extraction des IDs de l'établissement pour assurer le cloisonnement strict des données (multi-tenant)
          const userIds = utilisateurs ? utilisateurs.map(u => u.id) : []
          const enseignantsIds = utilisateurs ? utilisateurs.filter(u => u.role === 'enseignant').map(u => u.id) : []
          const classesIds = classes ? classes.map(c => c.id) : []
          const elevesIds = eleves ? eleves.map(e => e.id) : []

          let matieres: any[] = []
          let notes: any[] = []
          let paiements: any[] = []
          let absences: any[] = []
          let bulletins: any[] = []
          let comptesConnexion: any[] = []
          let enseignantsMatieres: any[] = []

          // Vague 2 : Exécuter toutes les requêtes réseau dépendantes en parallèle
          const [
            matieresRes,
            notesRes,
            paiementsRes,
            absencesRes,
            bulletinsRes,
            comptesRes,
            enseignantsMatieresRes
          ] = await Promise.all([
            classesIds.length > 0 
              ? supabase.from('matieres').select('*').in('classe_id', classesIds) 
              : Promise.resolve({ data: [] }),
            elevesIds.length > 0 
              ? supabase.from('notes').select('*').in('eleve_id', elevesIds) 
              : Promise.resolve({ data: [] }),
            elevesIds.length > 0 
              ? supabase.from('paiements').select('*').in('eleve_id', elevesIds) 
              : Promise.resolve({ data: [] }),
            elevesIds.length > 0 
              ? supabase.from('absences').select('*').in('eleve_id', elevesIds) 
              : Promise.resolve({ data: [] }),
            elevesIds.length > 0 
              ? supabase.from('bulletins').select('*').in('eleve_id', elevesIds) 
              : Promise.resolve({ data: [] }),
            userIds.length > 0 
              ? supabase.from('comptes_connexion').select('*').in('id', userIds) 
              : Promise.resolve({ data: [] }),
            enseignantsIds.length > 0 
              ? supabase.from('enseignants_matieres').select('*').in('enseignant_id', enseignantsIds) 
              : Promise.resolve({ data: [] })
          ])

          if (matieresRes.data) matieres = matieresRes.data
          if (notesRes.data) notes = notesRes.data
          if (paiementsRes.data) paiements = paiementsRes.data
          if (absencesRes.data) absences = absencesRes.data
          if (bulletinsRes.data) bulletins = bulletinsRes.data
          if (comptesRes.data) comptesConnexion = comptesRes.data
          if (enseignantsMatieresRes.data) enseignantsMatieres = enseignantsMatieresRes.data

          if (anneesScolaires) {
            const mappedAnnees = anneesScolaires.map(a => ({
              id: a.id,
              nom: a.nom,
              dateDebut: a.date_debut,
              dateFin: a.date_fin,
              statut: a.statut
            }))
            set({ anneesScolaires: mappedAnnees })
            const active = mappedAnnees.find(a => a.statut === 'active')
            set({ activeAnneeScolaire: active || null })
          }

          if (ecoles && ecoles.length > 0) {
            const ecoleAbonnement = abonnements && abonnements.length > 0 ? {
              id: abonnements[0].id,
              ecoleId: abonnements[0].ecoleId,
              plan: abonnements[0].plan,
              statut: abonnements[0].statut,
              dateDebut: abonnements[0].dateDebut,
              dateFin: abonnements[0].dateFin,
              transactionRef: abonnements[0].transactionRef,
              modePaiement: abonnements[0].modePaiement,
              montantPaye: abonnements[0].montantPaye,
              maxEleves: abonnements[0].maxEleves
            } : undefined

            set({ 
              ecoleId: ecoles[0].id,
              ecole: {
                id: ecoles[0].id,
                identifiant: ecoles[0].identifiant,
                nom: ecoles[0].nom,
                ville: ecoles[0].ville,
                adresse: ecoles[0].adresse,
                telephone: ecoles[0].telephone,
                logo: ecoles[0].logo,
                niveaux: ecoles[0].niveaux,
                anneeScolaire: ecoles[0].annee_scolaire,
                abonnement: ecoleAbonnement
              }
            })
          }

          if (classes) {
            set({ classes: classes.map(c => ({
              id: c.id,
              nom: c.nom,
              niveau: c.niveau,
              enseignantPrincipalId: c.enseignant_principal_id,
              ecoleId: c.ecole_id,
              montantScolarite: c.montant_scolarite,
              montantInscription: c.montant_inscription
            })) })
          }

          if (eleves) {
            set({ eleves: eleves.map(e => ({
              id: e.id,
              matricule: e.matricule,
              nom: e.nom,
              prenom: e.prenom,
              dateNaissance: e.date_naissance,
              sexe: e.sexe,
              classeId: e.classe_id,
              ecoleId: e.ecole_id,
              parentNom: e.parent_nom,
              parentTelephone: e.parent_telephone,
              parentEmail: e.parent_email,
              parentUserId: e.parent_user_id,
              photoUrl: e.photo_url,
              statut: e.statut,
              dateInscription: e.date_inscription
            })) })
          }
          
          if (utilisateurs) {
            set({ enseignants: utilisateurs
              .filter(u => u.role === 'enseignant')
              .map(u => ({
                id: u.id,
                nom: u.nom,
                prenom: u.prenom,
                civilite: u.civilite,
                email: u.email,
                telephone: u.telephone,
                role: u.role,
                ecoleId: u.ecole_id,
                photoUrl: u.photo_url
              })) 
            })

            const currentUser = get().currentUser
            if (currentUser) {
              const dbMe = utilisateurs.find(u => u.id === currentUser.id)
              if (dbMe) {
                set({
                  currentUser: {
                    ...currentUser,
                    nom: dbMe.nom,
                    prenom: dbMe.prenom,
                    email: dbMe.email,
                    telephone: dbMe.telephone,
                    photoUrl: dbMe.photo_url,
                    parentSubscriptionStatus: dbMe.parent_subscription_status || 'gratuit'
                  }
                })
              }
            }
          }

          if (inscriptions) {
            // Filter out inscriptions referencing deleted or non-existent students
            const validInscriptions = inscriptions.filter(i => 
              i.eleve_id && (!eleves || eleves.some(e => e.id === i.eleve_id))
            )
            set({ inscriptions: validInscriptions.map(i => {
              const pFrais = paiements?.find(p => p.inscription_id === i.id && p.type === 'inscription')
              return {
                id: i.id,
                eleveId: i.eleve_id,
                anneeScolaire: i.annee_scolaire,
                dateInscription: i.date_inscription,
                classeId: i.classe_id,
                ecoleId: i.ecole_id,
                documentsFournis: i.documents_fournis || [],
                statut: i.statut,
                fraisInscription: i.frais_inscription !== undefined && i.frais_inscription !== null ? Number(i.frais_inscription) : (pFrais ? pFrais.montant : 0),
                documentsRecus: i.documents_recus || i.documents_fournis || []
              }
            }) })
          }

          if (paiements) {
            const validPaiements = paiements.filter(p => 
              p.eleve_id && (!eleves || eleves.some(e => e.id === p.eleve_id))
            )
            set({ paiements: validPaiements.map(p => ({
              id: p.id,
              eleveId: p.eleve_id,
              inscriptionId: p.inscription_id,
              montant: p.montant,
              montantPaye: p.montant_paye,
              type: p.type,
              statut: p.statut,
              datePaiement: p.date_paiement,
              dateLimite: p.date_limite,
              modePaiement: p.mode_paiement,
              reference: p.reference,
              historiquePaiements: p.historique_paiements || [],
              anneeScolaire: p.annee_scolaire
            })) })
          }
          
          if (matieres) {
            const validMatieres = matieres.filter(m => 
              m.classe_id && (!classes || classes.some(c => c.id === m.classe_id))
            )
            set({ matieres: validMatieres.map(m => {
              // Retrieve all teacher UUIDs for this matiere from the junction table
              const ensIds = enseignantsMatieres 
                ? enseignantsMatieres.filter(em => em.matiere_id === m.id).map(em => em.enseignant_id)
                : [];
              
              // Fallback to the old column if the junction table hasn't been fully populated or used yet
              if (m.enseignant_id && !ensIds.includes(m.enseignant_id)) {
                ensIds.push(m.enseignant_id);
              }

              return {
                id: m.id,
                nom: m.nom,
                coefficient: m.coefficient,
                classeId: m.classe_id,
                enseignantIds: ensIds
              };
            }) })
          }

          if (notes) {
            const validNotes = notes.filter(n => 
              n.eleve_id && (!eleves || eleves.some(e => e.id === n.eleve_id))
            )
            set({ notes: validNotes.map(n => ({
              id: n.id,
              eleveId: n.eleve_id,
              matiereId: n.matiere_id,
              valeur: n.valeur,
              coefficient: n.coefficient,
              type: n.type,
              numero: n.numero,
              date: n.date,
              trimestre: n.trimestre,
              anneeScolaire: n.annee_scolaire
            })) })
          }

          if (absences) {
            const validAbsences = absences.filter(a => 
              a.eleve_id && (!eleves || eleves.some(e => e.id === a.eleve_id))
            )
            set({ absences: validAbsences.map(a => ({
              id: a.id,
              eleveId: a.eleve_id,
              date: a.date,
              seance: a.seance,
              justifiee: a.justifiee,
              motif: a.motif,
              anneeScolaire: a.annee_scolaire
            })) })
          }

          if (bulletins) {
            const validBulletins = bulletins.filter(b => 
              b.eleve_id && (!eleves || eleves.some(e => e.id === b.eleve_id))
            )
            set({ bulletins: validBulletins.map(b => ({
              id: b.id,
              eleveId: b.eleve_id,
              classeId: b.classe_id,
              trimestre: b.trimestre,
              anneeScolaire: b.annee_scolaire,
              notes: b.notes,
              moyenneGenerale: b.moyenne_generale,
              moyenneClasse: b.moyenne_classe,
              rangClasse: b.rang_classe,
              effectifClasse: b.effectif_classe,
              appreciation: b.appreciation,
              appreciationDirecteur: b.appreciation_directeur,
              dateGeneration: b.date_generation,
              estValide: b.est_valide || false
            })) })
          }

          if (utilisateurs && comptesConnexion) {
            const relevantUsers = utilisateurs.filter(u => u.role === 'parent' || u.role === 'enseignant');
            const comptes: any[] = [];
            
            for (const user of relevantUsers) {
               const cx = comptesConnexion.find(c => c.id === user.id || c.enseignant_id === user.id);
               if (cx) {
                 comptes.push({
                    id: user.id,
                    identifiant: cx.identifiant || user.email,
                    mdpTemporaire: cx.mdp_temporaire,
                    role: user.role as 'enseignant' | 'parent',
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    telephone: user.telephone,
                    enseignantId: user.id,
                    elevesAssocies: cx.eleves_associes,
                    dateCreation: cx.date_creation || new Date().toISOString()
                 });
               }
            }
            
            set({ comptesSimules: comptes });
          }
        } catch (error) {
          console.error("Erreur lors de la synchro avec Supabase", error)
        }
      },

      initializeAnneesScolaires: () => {
        const state = get()
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() // 0-indexed, 8 = September
        
        // La nouvelle année commence généralement en septembre
        const startYear = currentMonth >= 8 ? currentYear : currentYear - 1
        const anneeNom = `${startYear}-${startYear + 1}`
        
        const existingAnnee = state.anneesScolaires.find(a => a.nom === anneeNom)
        if (!existingAnnee) {
          const newAnnee: AnneeScolaire = {
            id: `as-${anneeNom}`,
            nom: anneeNom,
            dateDebut: `${startYear}-09-01`,
            dateFin: `${startYear + 1}-07-31`,
            statut: 'active'
          }
          
          const updatedAnnees = state.anneesScolaires.map(a => ({ ...a, statut: 'archivee' as const }))
          
          set({ 
            anneesScolaires: [...updatedAnnees, newAnnee],
            activeAnneeScolaire: newAnnee
          })
        }
      },
      
      addAnneeScolaire: async (annee) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const ecoleId = get().ecole?.id
          const { data, error } = await supabase.from('annees_scolaires').insert({
            nom: annee.nom,
            date_debut: annee.dateDebut,
            date_fin: annee.dateFin,
            statut: annee.statut,
            ecole_id: ecoleId || null
          }).select().single()
          
          if (error) {
            console.error("Error inserting school year:", error)
            return { success: false, error: error.message }
          }

          if (data) {
            set(state => ({
              anneesScolaires: [...state.anneesScolaires, {
                id: data.id,
                nom: data.nom,
                dateDebut: data.date_debut,
                dateFin: data.date_fin,
                statut: data.statut
              }]
            }))
            return { success: true }
          }
          return { success: false, error: "L'année scolaire n'a pas pu être créée." }
        } catch (e: any) {
          console.error(e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      updateAnneeScolaire: async (id, data) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.nom) updateData.nom = data.nom
          if (data.dateDebut) updateData.date_debut = data.dateDebut
          if (data.dateFin) updateData.date_fin = data.dateFin
          if (data.statut) updateData.statut = data.statut
          
          await supabase.from('annees_scolaires').update(updateData).eq('id', id)
        } catch (e) { console.error(e) }
        
        set(state => ({
          anneesScolaires: state.anneesScolaires.map(a => a.id === id ? { ...a, ...data } : a),
          activeAnneeScolaire: state.activeAnneeScolaire?.id === id ? { ...state.activeAnneeScolaire, ...data } : state.activeAnneeScolaire
        }))
      },
      deleteAnneeScolaire: async (id) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          await supabase.from('annees_scolaires').delete().eq('id', id)
        } catch (e) { console.error(e) }
        
        set(state => ({
          anneesScolaires: state.anneesScolaires.filter(a => a.id !== id),
          activeAnneeScolaire: state.activeAnneeScolaire?.id === id ? null : state.activeAnneeScolaire
        }))
      },
      setActiveAnneeScolaire: async (id) => {
        if (checkAbonnement(get())) return
        const state = get()
        const newActive = state.anneesScolaires.find(a => a.id === id)
        if (!newActive) return

        try {
          const supabase = createClient()
          const ecoleId = state.ecole?.id
          // Passer toutes les années en archivée
          let updateQuery = supabase.from('annees_scolaires').update({ statut: 'archivee' }).neq('id', id)
          if (ecoleId) {
            updateQuery = updateQuery.eq('ecole_id', ecoleId)
          }
          await updateQuery
          
          // Passer la sélectionnée en active
          await supabase.from('annees_scolaires').update({ statut: 'active' }).eq('id', id)
        } catch (e) { console.error(e) }

        set(state => ({
          anneesScolaires: state.anneesScolaires.map(a => ({ ...a, statut: a.id === id ? 'active' : 'archivee' })),
          activeAnneeScolaire: { ...newActive, statut: 'active' }
        }))
      },

      setCurrentUser: (user) => {
        if (typeof window !== 'undefined') {
          if (user) {
            document.cookie = "currentUser=true; path=/; max-age=86400; SameSite=Lax"
            sessionStorage.setItem('lastRole', user.role)
          } else {
            document.cookie = "currentUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax"
          }
        }
        set({ currentUser: user })
      },

      fetchEcolesUtilisateur: async () => {
        const { currentUser } = get()

        if (!currentUser?.id) {
          console.warn('[fetchEcolesUtilisateur] currentUser null — abandon')
          return []
        }

        const supabase = createClient() // client public soumis à RLS

        try {
          if (currentUser.role === 'directeur') {
            const { data, error } = await supabase
              .from('ecoles')
              .select(`
                id,
                nom,
                ville,
                adresse,
                telephone,
                logo,
                annee_scolaire,
                niveaux,
                directeur_id,
                classes(count),
                eleves(count)
              `)
              .eq('directeur_id', currentUser.id)
              .order('nom', { ascending: true })

            if (error) {
              console.error('[fetchEcolesUtilisateur] Directeur :', error.message)
              return []
            }

            return (data ?? []).map((e: any) => ({
              id: e.id,
              nom: e.nom,
              ville: e.ville,
              adresse: e.adresse ?? '',
              telephone: e.telephone ?? '',
              logo: e.logo ?? undefined,
              anneeScolaire: e.annee_scolaire ?? '',
              niveaux: e.niveaux ?? [],
              directeurId: e.directeur_id,
              nbClasses: e.classes?.[0]?.count ?? 0,
              nbEleves: e.eleves?.[0]?.count ?? 0,
              tauxRecouvrement: 100,
            }))
          }

          if (currentUser.role === 'enseignant') {
            const { data: eeData, error: eeError } = await supabase
              .from('enseignant_ecoles')
              .select('ecole_id')
              .eq('enseignant_id', currentUser.id)

            if (eeError) {
              console.error('[fetchEcolesUtilisateur] Enseignant jointures :', eeError.message)
              return []
            }

            const ecoleIds = (eeData ?? []).map((x: any) => x.ecole_id).filter(Boolean)
            if (ecoleIds.length === 0) {
              return []
            }

            const { data, error } = await supabase
              .from('ecoles')
              .select('id, nom, ville, adresse, telephone, logo, annee_scolaire, niveaux, directeur_id, abonnements(plan)')
              .in('id', ecoleIds)
              .order('nom', { ascending: true })

            if (error) {
              console.error('[fetchEcolesUtilisateur] Enseignant :', error.message)
              return []
            }

            return (data ?? []).map((e: any) => ({
              id: e.id,
              nom: e.nom,
              ville: e.ville,
              adresse: e.adresse ?? '',
              telephone: e.telephone ?? '',
              logo: e.logo ?? undefined,
              anneeScolaire: e.annee_scolaire ?? '',
              niveaux: e.niveaux ?? [],
              directeurId: e.directeur_id,
              nbClasses: 0,
              nbEleves: 0,
              tauxRecouvrement: 0,
            }))
          }

          if (currentUser.role === 'parent') {
            const eleveIds: string[] = []

            // Méthode A : via comptes_connexion
            const { data: connexions } = await supabase
              .from('comptes_connexion')
              .select('eleves_associes')
              .eq('id', currentUser.id)
              .maybeSingle()
            
            const associes = connexions?.eleves_associes || []
            eleveIds.push(...associes)

            // Méthode B (fallback) : via parent_email sur les élèves
            if (eleveIds.length === 0 && currentUser.email) {
              const { data: elevesParEmail } = await supabase
                .from('eleves')
                .select('id')
                .ilike('parent_email', currentUser.email)
              eleveIds.push(...(elevesParEmail?.map(e => e.id) ?? []))
            }

            if (eleveIds.length === 0) {
              return []
            }

            // Récupérer les ecole_id des élèves
            const { data: dbEleves } = await supabase
              .from('eleves')
              .select('ecole_id')
              .in('id', eleveIds)

            const ecoleIds = dbEleves
              ? Array.from(new Set(dbEleves.map((e: any) => e.ecole_id).filter(Boolean)))
              : []

            if (ecoleIds.length === 0) {
              return []
            }

            const { data, error } = await supabase
              .from('ecoles')
              .select('id, nom, ville, adresse, telephone, logo, annee_scolaire, niveaux, directeur_id, abonnements(plan)')
              .in('id', ecoleIds)
              .order('nom', { ascending: true })

            if (error) {
              console.error('[fetchEcolesUtilisateur] Parent :', error.message)
              return []
            }

            return (data ?? []).map((e: any) => ({
              id: e.id,
              nom: e.nom,
              ville: e.ville,
              adresse: e.adresse ?? '',
              telephone: e.telephone ?? '',
              logo: e.logo ?? undefined,
              anneeScolaire: e.annee_scolaire ?? '',
              niveaux: e.niveaux ?? [],
              directeurId: e.directeur_id,
              nbClasses: 0,
              nbEleves: 0,
              tauxRecouvrement: 0,
            }))
          }
        } catch (err) {
          console.error('[fetchEcolesUtilisateur] Exception :', err)
        }

        return []
      },

      ajouterEcole: async (donnees) => {
        const { currentUser } = get()
        if (!currentUser || currentUser.role !== 'directeur') {
          return { success: false, error: 'Accès refusé : rôle directeur requis' }
        }
        if (checkAbonnement(get())) {
          return { success: false, error: 'Abonnement expiré. Impossible d\'ajouter un établissement.' }
        }

        const supabase = createClient()
        const { data, error } = await supabase
          .from('ecoles')
          .insert({
            nom: donnees.nom,
            ville: donnees.ville,
            adresse: donnees.adresse || '',
            telephone: donnees.telephone || '',
            logo: donnees.logo || null,
            niveaux: donnees.niveaux,
            annee_scolaire: donnees.anneeScolaire,
            directeur_id: currentUser.id,
            identifiant: `GS-${Math.floor(100000 + Math.random() * 900000)}`
          })
          .select()
          .single()

        if (error) return { success: false, error: error.message }
        
        // Créer l'année scolaire par défaut pour cette école
        const anneeScolaireDebut = donnees.anneeScolaire.split('-')[0] + '-09-01'
        const anneeScolaireFin = donnees.anneeScolaire.split('-')[1] + '-07-31'
        await supabase.from('annees_scolaires').insert({
          ecole_id: data.id,
          nom: donnees.anneeScolaire,
          date_debut: anneeScolaireDebut,
          date_fin: anneeScolaireFin,
          statut: 'active'
        })

        // Activer un plan gratuit par défaut
        await supabase.from('abonnements').insert({
          ecole_id: data.id,
          plan: 'gratuit',
          statut: 'actif',
          montant_paye: 0,
          max_eleves: 50
        })

        const ecoleCreee = {
          id: data.id,
          nom: data.nom,
          ville: data.ville,
          adresse: data.adresse ?? '',
          telephone: data.telephone ?? '',
          logo: data.logo ?? undefined,
          anneeScolaire: data.annee_scolaire,
          niveaux: data.niveaux ?? [],
          directeurId: data.directeur_id,
          nbClasses: 0,
          nbEleves: 0,
          tauxRecouvrement: 100
        }

        return { success: true, data: ecoleCreee }
      },

      supprimerEcole: async (ecoleId) => {
        const { currentUser } = get()
        if (!currentUser || currentUser.role !== 'directeur') {
          return { success: false, error: 'Accès refusé : rôle directeur requis' }
        }

        const supabase = createClient()
        const { data: ecole } = await supabase
          .from('ecoles')
          .select('id, directeur_id, nom')
          .eq('id', ecoleId)
          .eq('directeur_id', currentUser.id)
          .single()

        if (!ecole) return { success: false, error: 'Établissement introuvable ou non autorisé.' }

        // Récupérer le nombre d'élèves et d'enseignants pour l'audit avant de supprimer
        const { count: countEleves } = await supabase.from('eleves').select('*', { count: 'exact', head: true }).eq('ecole_id', ecoleId)
        const { count: countEnseignants } = await supabase.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('ecole_id', ecoleId).eq('role', 'enseignant')
        
        await supabase.from('audit_suppressions').insert({
          directeur_id: currentUser.id,
          ecole_id: ecoleId,
          ecole_nom: ecole.nom,
          nb_eleves_supprimes: countEleves ?? 0,
          nb_enseignants_supprimes: countEnseignants ?? 0,
          nb_paiements_supprimes: 0
        })

        const { error } = await supabase
          .from('ecoles')
          .delete()
          .eq('id', ecoleId)

        if (error) return { success: false, error: error.message }
        
        // Si l'école supprimée est l'école active, réinitialiser
        const state = get()
        if (state.ecoleId === ecoleId) {
          set({ ecoleId: null, currentUser: { ...currentUser, ecoleId: null } })
        }

        return { success: true }
      },

      setEcoleCourante: async (ecoleId) => {
        const { currentUser } = get()
        if (!currentUser) return

        set({ 
          ecoleId: ecoleId,
          currentUser: { ...currentUser, ecoleId: ecoleId }
        })

        const supabase = createClient()
        await supabase
          .from('utilisateurs')
          .update({ ecole_courante_id: ecoleId })
          .eq('id', currentUser.id)
      },
      
      getInscriptions: () => get().inscriptions,
      getInscriptionsByEleve: (eleveId) => get().inscriptions.filter(i => i.eleveId === eleveId),
      addInscription: async (data) => {
        if (checkAbonnement(get(), true)) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const insertData: any = {
            eleve_id: data.eleveId,
            classe_id: data.classeId,
            ecole_id: get().ecole?.id || null,
            annee_scolaire: data.anneeScolaire,
            date_inscription: data.dateInscription,
            statut: data.statut,
            documents_fournis: data.documentsRecus,
            commentaire: data.commentaire
          }
          if (data.fraisInscription !== undefined) {
            insertData.frais_inscription = data.fraisInscription
          }
          
          const { data: dbInscriptions, error } = await supabase.from('inscriptions').insert([insertData]).select()
          
          if (error) {
            console.error("Supabase insert error:", error)
            throw new Error(error.message)
          }
          
          const returnedInscription = dbInscriptions?.[0];
          let returnedPaiements: any[] = [];
          
          if (returnedInscription) {
             const classe = get().classes.find(c => c.id === returnedInscription.classe_id)
             if (classe) {
               const dateLimitInsc = new Date();
               dateLimitInsc.setDate(dateLimitInsc.getDate() + 7);
               
               const dateLimitScol = new Date();
               dateLimitScol.setMonth(dateLimitScol.getMonth() + 1);
               
               const pInsc = {
                  eleve_id: returnedInscription.eleve_id,
                  inscription_id: returnedInscription.id,
                  montant: data.fraisInscription !== undefined ? data.fraisInscription : classe.montantInscription,
                  type: 'inscription',
                  statut: 'en_attente',
                  date_limite: dateLimitInsc.toISOString().split('T')[0],
                  annee_scolaire: returnedInscription.annee_scolaire
               };
               const pScol = {
                  eleve_id: returnedInscription.eleve_id,
                  inscription_id: returnedInscription.id,
                  montant: classe.montantScolarite,
                  type: 'scolarite',
                  statut: 'en_attente',
                  date_limite: dateLimitScol.toISOString().split('T')[0],
                  annee_scolaire: returnedInscription.annee_scolaire
               };
               
               const { data: dbPaiements, error: pErr } = await supabase.from('paiements').insert([pInsc, pScol]).select()
               if (pErr) console.error("Paiement insert error:", pErr)
               if (dbPaiements) {
                 returnedPaiements = dbPaiements.map(p => ({
                    id: p.id,
                    eleveId: p.eleve_id,
                    inscriptionId: p.inscription_id,
                    montant: p.montant,
                    montantPaye: p.montant_paye,
                    type: p.type,
                    statut: p.statut,
                    dateLimite: p.date_limite,
                    anneeScolaire: p.annee_scolaire
                 }))
               }
             }

             set((state) => ({ 
               inscriptions: [...state.inscriptions, {
                 id: returnedInscription.id,
                 eleveId: returnedInscription.eleve_id,
                 classeId: returnedInscription.classe_id,
                 anneeScolaire: returnedInscription.annee_scolaire,
                 dateInscription: returnedInscription.date_inscription,
                 statut: returnedInscription.statut,
                 fraisInscription: returnedInscription.frais_inscription,
                 documentsRecus: returnedInscription.documents_fournis,
                 documentsFournis: returnedInscription.documents_fournis,
                 ecoleId: returnedInscription.ecole_id
               }],
               paiements: [...state.paiements, ...returnedPaiements]
             }))
          }
          return { success: true }
        } catch (e: any) {
          console.warn("Exception addInscription:", e)
          return { success: false, error: e.message }
        }
      },
      updateInscription: async (id, data) => {
        if (checkAbonnement(get(), true)) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.statut !== undefined) updateData.statut = data.statut
          if (data.documentsRecus !== undefined) updateData.documents_fournis = data.documentsRecus
          if (data.commentaire !== undefined) updateData.commentaire = data.commentaire
          if (data.classeId !== undefined) updateData.classe_id = data.classeId
          
          // Only add to updateData if it's not undefined
          if (data.fraisInscription !== undefined) updateData.frais_inscription = data.fraisInscription

          const { error } = await supabase.from('inscriptions').update(updateData).eq('id', id)
          
          if (error) {
            console.error("Supabase update error:", error)
            throw new Error(error.message)
          }
          
          if (data.fraisInscription !== undefined) {
             const { error: pErr } = await supabase.from('paiements').update({ montant: data.fraisInscription }).eq('inscription_id', id).eq('type', 'inscription')
             if (pErr) console.error("Paiement update error:", pErr)
          }
          if (data.classeId !== undefined) {
             const classe = get().classes.find(c => c.id === data.classeId)
             if (classe) {
                const { error: sErr } = await supabase.from('paiements').update({ montant: classe.montantScolarite }).eq('inscription_id', id).eq('type', 'scolarite')
                if (sErr) console.error("Scolarite update error:", sErr)
             }
          }

          set((state) => {
            let updatedPaiements = state.paiements;
            if (data.fraisInscription !== undefined || data.classeId !== undefined) {
              updatedPaiements = state.paiements.map(p => {
                if (p.inscriptionId === id) {
                  if (p.type === 'inscription' && data.fraisInscription !== undefined) {
                    return { ...p, montant: data.fraisInscription }
                  }
                  if (p.type === 'scolarite' && data.classeId !== undefined) {
                     const classe = state.classes.find(c => c.id === data.classeId)
                     return { ...p, montant: classe ? classe.montantScolarite : p.montant }
                  }
                }
                return p;
              })
            }
            return {
              inscriptions: state.inscriptions.map(i => i.id === id ? { ...i, ...data } : i),
              paiements: updatedPaiements
            }
          })
          
          return { success: true }
        } catch (e: any) {
          console.warn("Exception updateInscription:", e)
          return { success: false, error: e.message }
        }
      },
      deleteInscription: async (id) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase.from('inscriptions').delete().eq('id', id)
          if (error) {
            console.warn("Erreur deleteInscription:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({
            inscriptions: state.inscriptions.filter(i => i.id !== id),
            paiements: state.paiements.filter(p => p.inscriptionId !== id)
          }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception deleteInscription:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      
      getEleves: (classeId) => {
        const { eleves } = get()
        return classeId ? eleves.filter(e => e.classeId === classeId) : eleves
      },
      
      getEleveById: (id) => get().eleves.find(e => e.id === id),
      
      addEleve: async (eleve) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        if (eleve.photoUrl) {
          const check = validateBase64ImageClient(eleve.photoUrl)
          if (!check.success) {
            return { success: false, error: check.error }
          }
        }
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('eleves').insert({
            matricule: eleve.matricule,
            nom: eleve.nom,
            prenom: eleve.prenom,
            date_naissance: eleve.dateNaissance,
            sexe: eleve.sexe,
            classe_id: eleve.classeId,
            ecole_id: eleve.ecoleId || get().ecole?.id || null,
            parent_nom: eleve.parentNom,
            parent_telephone: eleve.parentTelephone,
            parent_email: eleve.parentEmail,
            statut: eleve.statut || 'actif',
            date_inscription: eleve.dateInscription || new Date().toISOString().split('T')[0],
            photo_url: eleve.photoUrl || null
          }).select().single()
          
          if (error) {
            console.warn("Erreur addEleve:", error.message)
            return { success: false, error: error.message }
          }
          if (data) {
            const newEleve: Eleve = { ...eleve, id: data.id }
            set((state) => ({ eleves: [...state.eleves, newEleve] }))
            return { success: true }
          }
          return { success: false, error: "L'élève n'a pas pu être inséré." }
        } catch (e: any) {
          console.warn("Exception addEleve:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      
      updateEleve: async (id, data) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        if (data.photoUrl) {
          const check = validateBase64ImageClient(data.photoUrl)
          if (!check.success) {
            return { success: false, error: check.error }
          }
        }
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.nom !== undefined) updateData.nom = data.nom
          if (data.prenom !== undefined) updateData.prenom = data.prenom
          if (data.matricule !== undefined) updateData.matricule = data.matricule
          if (data.sexe !== undefined) updateData.sexe = data.sexe
          if (data.dateNaissance !== undefined) updateData.date_naissance = data.dateNaissance
          if (data.classeId !== undefined) updateData.classe_id = data.classeId
          if (data.statut !== undefined) updateData.statut = data.statut
          if (data.parentNom !== undefined) updateData.parent_nom = data.parentNom
          if (data.parentTelephone !== undefined) updateData.parent_telephone = data.parentTelephone
          if (data.parentEmail !== undefined) updateData.parent_email = data.parentEmail
          if (data.parentUserId !== undefined) updateData.parent_user_id = data.parentUserId || null
          if (data.photoUrl !== undefined) updateData.photo_url = data.photoUrl
          
          const { error } = await supabase.from('eleves').update(updateData).eq('id', id)
          if (error) {
            console.warn("Erreur updateEleve:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({
            eleves: state.eleves.map(e => e.id === id ? { ...e, ...data } : e)
          }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception updateEleve:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      deleteEleve: async (id) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase.from('eleves').delete().eq('id', id)
          if (error) {
            console.warn("Erreur deleteEleve:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({
            eleves: state.eleves.filter(e => e.id !== id),
            inscriptions: state.inscriptions.filter(i => i.eleveId !== id),
            paiements: state.paiements.filter(p => p.eleveId !== id),
            absences: state.absences.filter(a => a.eleveId !== id),
            notes: state.notes.filter(n => n.eleveId !== id),
            bulletins: state.bulletins.filter(b => b.eleveId !== id)
          }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception deleteEleve:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      getClasses: () => get().classes,
      
      getClasseById: (id) => get().classes.find(c => c.id === id),

      addClasse: async (classe) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('classes').insert({
            nom: classe.nom,
            niveau: classe.niveau,
            enseignant_principal_id: classe.enseignantPrincipalId || null,
            ecole_id: get().ecole?.id || null,
            montant_scolarite: classe.montantScolarite,
            montant_inscription: classe.montantInscription
          }).select().single()
          if (error) {
            console.warn("Erreur addClasse:", error.message)
            return { success: false, error: error.message }
          }
          if (data) {
            const newClasse: Classe = { ...classe, id: data.id }
            set((state) => ({ classes: [...state.classes, newClasse] }))
            return { success: true }
          }
          return { success: false, error: "La classe n'a pas pu être insérée." }
        } catch (e: any) {
          console.warn("Exception addClasse:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      updateClasse: async (id, data) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.nom) updateData.nom = data.nom
          if (data.niveau) updateData.niveau = data.niveau
          if (data.enseignantPrincipalId !== undefined) updateData.enseignant_principal_id = data.enseignantPrincipalId || null
          if (data.montantScolarite !== undefined) updateData.montant_scolarite = data.montantScolarite
          if (data.montantInscription !== undefined) updateData.montant_inscription = data.montantInscription

          const { error } = await supabase.from('classes').update(updateData).eq('id', id)
          if (error) {
            console.warn("Erreur updateClasse:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({ classes: state.classes.map(c => c.id === id ? { ...c, ...data } : c) }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception updateClasse:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      deleteClasse: async (id) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase.from('classes').delete().eq('id', id)
          if (error) {
            console.warn("Erreur deleteClasse:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({ classes: state.classes.filter(c => c.id !== id) }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception deleteClasse:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      getNotesByEleve: (eleveId, trimestre) => {
        const { notes } = get()
        let filtered = notes.filter(n => n.eleveId === eleveId)
        if (trimestre) filtered = filtered.filter(n => n.trimestre === trimestre)
        return filtered
      },

      addNote: async (note) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('notes').insert({
            eleve_id: note.eleveId,
            matiere_id: note.matiereId,
            valeur: note.valeur,
            type: note.type,
            numero: note.numero,
            date: note.date,
            trimestre: note.trimestre,
            annee_scolaire: note.anneeScolaire
          }).select().single()
          
          if (error) {
            console.warn("Erreur addNote:", error.message)
            return { success: false, error: error.message }
          }
          if (data) {
            const newNote: Note = { ...note, id: data.id }
            set((state) => ({ notes: [...state.notes, newNote] }))
            return { success: true }
          }
          return { success: false, error: "La note n'a pas pu être insérée." }
        } catch (e: any) {
          console.warn("Exception addNote:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      
      updateNote: async (id, data) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.valeur !== undefined) updateData.valeur = data.valeur
          if (data.type) updateData.type = data.type
          if (data.date) updateData.date = data.date
          
          const { error } = await supabase.from('notes').update(updateData).eq('id', id)
          if (error) {
            console.warn("Erreur updateNote:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({
            notes: state.notes.map(n => n.id === id ? { ...n, ...data } : n)
          }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception updateNote:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      deleteNote: async (id) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase.from('notes').delete().eq('id', id)
          if (error) {
            console.warn("Erreur deleteNote:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({
            notes: state.notes.filter(n => n.id !== id)
          }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception deleteNote:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      getPaiementsByEleve: (eleveId) => get().paiements.filter(p => p.eleveId === eleveId),
      
      addPaiement: async (paiement) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('paiements').insert({
            eleve_id: paiement.eleveId,
            inscription_id: paiement.inscriptionId,
            montant: paiement.montant,
            montant_paye: paiement.montantPaye,
            type: paiement.type,
            statut: paiement.statut,
            date_paiement: paiement.datePaiement,
            date_limite: paiement.dateLimite,
            mode_paiement: paiement.modePaiement,
            reference: paiement.reference,
            historique_paiements: paiement.historiquePaiements,
            annee_scolaire: paiement.anneeScolaire
          }).select().single()
          
          if (error) {
            console.warn("Erreur addPaiement:", error.message)
            return { success: false, error: error.message }
          }
          if (data) {
            const newPaiement: Paiement = { ...paiement, id: data.id }
            set((state) => ({ paiements: [...state.paiements, newPaiement] }))

            try {
              const el = get().eleves.find(e => e.id === paiement.eleveId)
              if (el) {
                const formattedMontant = new Intl.NumberFormat('fr-FR').format(paiement.montant) + ' FCFA'
                await get().addNotification({
                  titre: 'Paiement scolarité enregistré',
                  description: `Le paiement de ${formattedMontant} pour ${el.prenom} ${el.nom} a été enregistré avec succès.`,
                  type: 'paiement',
                  eleveId: el.id,
                  classeId: el.classeId,
                  destinataireRole: 'directeur'
                })
              }
            } catch (err) {
              console.warn("Erreur lors de la notification paiement:", err)
            }

            return { success: true }
          }
          return { success: false, error: "Le paiement n'a pas pu être inséré." }
        } catch (e: any) {
          console.warn("Exception addPaiement:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      updatePaiementStatut: async (id, statut, mode, reference) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        const updateData: any = { statut }
        if (mode) updateData.mode_paiement = mode
        if (reference) updateData.reference = reference
        if (statut === 'paye') updateData.date_paiement = new Date().toISOString().split('T')[0]
        
        try {
          const supabase = createClient()
          const { error } = await supabase.from('paiements').update(updateData).eq('id', id)
          if (error) {
            console.warn("Erreur updatePaiementStatut:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({
            paiements: state.paiements.map(p => p.id === id ? { 
              ...p, 
              statut, 
              modePaiement: mode || p.modePaiement,
              reference: reference || p.reference,
              datePaiement: updateData.date_paiement || p.datePaiement
            } : p)
          }))

          if (statut === 'paye') {
            try {
              const p = get().paiements.find(pmt => pmt.id === id)
              if (p) {
                const el = get().eleves.find(e => e.id === p.eleveId)
                if (el) {
                  const formatMode = mode === 'wave' ? 'Wave' : mode === 'orange_money' ? 'Orange Money' : mode === 'mtn_momo' ? 'MTN MoMo' : 'Espèces'
                  const formattedMontant = new Intl.NumberFormat('fr-FR').format(p.montant) + ' FCFA'
                  const classeName = get().classes.find(c => c.id === el.classeId)?.nom || 'Inconnue'
                  const typeLabel = p.type === 'inscription' ? "d'inscription" : 'de scolarité'

                  // 1. Notification Parent
                  await get().addNotification({
                    titre: 'Reçu de versement scolarité',
                    description: `Le versement de ${formattedMontant} a été enregistré via ${formatMode} pour l'élève ${el.prenom} ${el.nom} (Classe: ${classeName}).`,
                    type: 'paiement',
                    eleveId: el.id,
                    classeId: el.classeId,
                    destinataireRole: 'parent'
                  })

                  // 2. Notification Directeur
                  await get().addNotification({
                    titre: 'Paiement scolarité/inscription validé',
                    description: `Le paiement ${typeLabel} de ${formattedMontant} pour l'élève ${el.prenom} ${el.nom} (Classe: ${classeName}) a été validé via ${formatMode}.`,
                    type: 'paiement',
                    eleveId: el.id,
                    classeId: el.classeId,
                    destinataireRole: 'directeur'
                  })
                }
              }
            } catch (err) {
              console.warn("Erreur lors de la notification automatique de paiement statut :", err)
            }
          }

          return { success: true }
        } catch (e: any) {
          console.warn("Exception updatePaiementStatut:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      enregistrerPaiementInstallment: async (id, montantEncaisse, mode, reference) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        const state = get()
        const paiementsState = state.paiements
        const p = paiementsState.find(p => p.id === id)
        if (!p) {
          return { success: false, error: "Paiement introuvable." }
        }

        const newMontantPaye = (p.montantPaye || 0) + montantEncaisse
        const newStatut = newMontantPaye >= p.montant ? 'paye' : p.statut
        const newHistorique = [
          ...(p.historiquePaiements || []),
          {
            date: new Date().toISOString().split('T')[0],
            montant: montantEncaisse,
            mode,
            reference
          }
        ]
        const updateData: any = {
          montant_paye: newMontantPaye,
          statut: newStatut,
          mode_paiement: mode,
          historique_paiements: newHistorique
        }
        if (reference) updateData.reference = reference
        if (newStatut === 'paye') updateData.date_paiement = new Date().toISOString().split('T')[0]

        try {
          const supabase = createClient()
          const { error } = await supabase.from('paiements').update(updateData).eq('id', id)
          if (error) {
            console.warn("Erreur enregistrerPaiementInstallment:", error.message)
            return { success: false, error: error.message }
          }
          
          set((state) => ({
            paiements: state.paiements.map(pmt => pmt.id === id ? {
              ...pmt,
              montantPaye: newMontantPaye,
              statut: newStatut,
              modePaiement: mode,
              reference: reference || pmt.reference,
              datePaiement: updateData.date_paiement || pmt.datePaiement,
              historiquePaiements: newHistorique
            } : pmt)
          }))

          // Génération automatique d'une notification système de paiement pour le parent
          try {
            const el = get().eleves.find(e => e.id === p.eleveId)
            if (el) {
              const formatMode = mode === 'wave' ? 'Wave' : mode === 'orange_money' ? 'Orange Money' : mode === 'mtn_momo' ? 'MTN MoMo' : 'Espèces'
              const formattedMontant = new Intl.NumberFormat('fr-FR').format(montantEncaisse) + ' FCFA'
              const classeName = get().classes.find(c => c.id === el.classeId)?.nom || 'Inconnue'
              
              await get().addNotification({
                titre: 'Reçu de versement scolarité',
                description: `Un versement de ${formattedMontant} a été enregistré via ${formatMode} pour l'élève ${el.prenom} ${el.nom} (Classe: ${classeName}).`,
                type: 'paiement',
                eleveId: el.id,
                classeId: el.classeId,
                destinataireRole: 'parent'
              })
            }
          } catch (err) {
            console.warn("Erreur lors de la génération de notification automatique de paiement :", err)
          }

          return { success: true }
        } catch (e: any) {
          console.warn("Exception enregistrerPaiementInstallment:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      annulerVersement: async (id, versementIdx) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        const p = get().paiements.find(p => p.id === id)
        if (!p) {
          return { success: false, error: "Paiement introuvable." }
        }
        
        const historique = p.historiquePaiements || []
        if (versementIdx < 0 || versementIdx >= historique.length) {
          return { success: false, error: "Index de versement invalide." }
        }
        
        const versementAAnnuler = historique[versementIdx]
        const newMontantPaye = Math.max(0, (p.montantPaye || 0) - versementAAnnuler.montant)
        const newHistorique = historique.filter((_, idx) => idx !== versementIdx)
        
        let newStatut = p.statut
        if (newMontantPaye < p.montant) {
          const today = new Date().toISOString().split('T')[0]
          newStatut = p.dateLimite < today ? 'retard' : 'en_attente'
        } else {
          newStatut = 'paye'
        }

        try {
          const supabase = createClient()
          const { error } = await supabase.from('paiements').update({
            montant_paye: newMontantPaye,
            statut: newStatut,
            historique_paiements: newHistorique
          }).eq('id', id)
          if (error) {
            console.warn("Erreur annulerVersement:", error.message)
            return { success: false, error: error.message }
          }
          
          set((state) => ({
            paiements: state.paiements.map(pmt => pmt.id === id ? {
              ...pmt,
              montantPaye: newMontantPaye,
              statut: newStatut,
              historiquePaiements: newHistorique
            } : pmt)
          }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception annulerVersement:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      updateClasseTarifs: async (classeId, montantScolarite, montantInscription) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase.from('classes').update({
            montant_scolarite: montantScolarite,
            montant_inscription: montantInscription
          }).eq('id', classeId)
          if (error) {
            console.error("Erreur updateClasseTarifs:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({
            classes: state.classes.map(c => c.id === classeId ? { ...c, montantScolarite, montantInscription } : c)
          }))
          return { success: true }
        } catch (e: any) {
          console.error(e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      getAbsencesByEleve: (eleveId) => get().absences.filter(a => a.eleveId === eleveId),
      
      addAbsence: async (absence) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('absences').insert({
            eleve_id: absence.eleveId,
            date: absence.date,
            seance: absence.seance,
            justifiee: absence.justifiee,
            motif: absence.motif,
            annee_scolaire: absence.anneeScolaire
          }).select().single()
          if (error) {
            console.warn("Erreur addAbsence:", error.message)
            return { success: false, error: error.message }
          }
          if (data) {
            const newAbsence: Absence = { ...absence, id: data.id }
            set((state) => ({ absences: [...state.absences, newAbsence] }))

            try {
              const el = get().eleves.find(e => e.id === absence.eleveId)
              if (el) {
                const seanceLabel = absence.seance === 'matin' ? 'matin' : 'après-midi'
                const motifLabel = absence.motif ? ` (Motif : ${absence.motif})` : ''
                const justifLabel = absence.justifiee ? 'justifiée' : 'non justifiée'
                
                // 1. Notification Directeur
                await get().addNotification({
                  titre: 'Absence enregistrée',
                  description: `${el.prenom} ${el.nom} a été marqué(e) absent(e) le ${absence.date} (${seanceLabel}).`,
                  type: 'absence',
                  eleveId: el.id,
                  classeId: el.classeId,
                  destinataireRole: 'directeur'
                })

                // 2. Notification Parent (Bug 11)
                await get().addNotification({
                  titre: 'Absence signalée',
                  description: `L'absence de ${el.prenom} ${el.nom} pour la séance du ${seanceLabel} le ${absence.date} a été enregistrée (${justifLabel})${motifLabel}.`,
                  type: 'absence',
                  eleveId: el.id,
                  classeId: el.classeId,
                  destinataireRole: 'parent'
                })
              }
            } catch (err) {
              console.warn("Erreur notification absence:", err)
            }

            return { success: true }
          }
          return { success: false, error: "L'absence n'a pas pu être insérée." }
        } catch (e: any) {
          console.warn("Exception addAbsence:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      enregistrerAbsences: async (date, seance, absencesAAjouter, eleveIds) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          if (eleveIds.length > 0) {
            const { error: delErr } = await supabase.from('absences').delete()
              .eq('date', date)
              .eq('seance', seance)
              .in('eleve_id', eleveIds)
            if (delErr) {
              console.warn("Erreur de suppression des anciennes absences:", delErr.message)
              return { success: false, error: delErr.message }
            }
          }

          if (absencesAAjouter.length > 0) {
            const absencesToInsert = absencesAAjouter.map(a => ({
              eleve_id: a.eleveId,
              date: a.date,
              seance: a.seance,
              justifiee: a.justifiee,
              motif: a.motif,
              annee_scolaire: a.anneeScolaire
            }))
            
            const { data, error } = await supabase.from('absences').insert(absencesToInsert).select()
            if (error) {
              console.warn("Erreur Supabase enregistrerAbsences:", error.message)
              return { success: false, error: error.message }
            }
            if (data) {
              absencesAAjouter = data.map((d: any) => ({
                id: d.id,
                eleveId: d.eleve_id,
                date: d.date,
                seance: d.seance,
                justifiee: d.justifiee,
                motif: d.motif,
                annee_scolaire: d.annee_scolaire
              })) as Absence[]
            }
          }

          set((state) => {
            const cleanAbsences = state.absences.filter(
              a => !(a.date === date && a.seance === seance && eleveIds.includes(a.eleveId))
            )
            return {
              absences: [...cleanAbsences, ...absencesAAjouter]
            }
          })

          // Génération automatique des notifications système d'absence pour les parents
          try {
            if (absencesAAjouter.length > 0) {
              for (const a of absencesAAjouter) {
                const el = get().eleves.find(e => e.id === a.eleveId)
                if (el) {
                  const formatSeance = a.seance === 'matin' ? 'matin' : 'après-midi'
                  const formatJustifiee = a.justifiee ? 'Justifiée' : 'Non justifiée'
                  const formatMotif = a.motif ? ` (Motif : ${a.motif})` : ''
                  
                  await get().addNotification({
                    titre: 'Absence enregistrée',
                    description: `L'absence de l'élève ${el.prenom} ${el.nom} (Classe: ${get().classes.find(c => c.id === el.classeId)?.nom || 'Inconnue'}) a été signalée pour la séance du ${formatSeance} le ${new Date(a.date).toLocaleDateString('fr-FR')}. Statut: ${formatJustifiee}${formatMotif}.`,
                    type: 'absence',
                    eleveId: el.id,
                    classeId: el.classeId,
                    destinataireRole: 'parent'
                  })
                }
              }
            }
          } catch (err) {
            console.warn("Erreur lors de la génération de notification automatique d'absence :", err)
          }

          return { success: true }
        } catch (e: any) {
          console.warn("Exception enregistrerAbsences:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      justifierAbsence: async (absenceId, motif, justifiee = true) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase.from('absences').update({
            justifiee,
            motif: justifiee ? motif : null
          }).eq('id', absenceId)
          if (error) {
            console.warn("Erreur justifierAbsence:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({
            absences: state.absences.map(a => 
              a.id === absenceId ? { ...a, justifiee, motif: justifiee ? motif : undefined } : a
            )
          }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception justifierAbsence:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      addMatiere: async (matiere) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('matieres').insert({
            nom: matiere.nom,
            coefficient: matiere.coefficient,
            classe_id: matiere.classeId,
            enseignant_id: matiere.enseignantIds && matiere.enseignantIds.length > 0 ? matiere.enseignantIds[0] : null
          }).select().single()
          
          if (error) {
            console.warn("Erreur addMatiere:", error.message)
            return { success: false, error: error.message }
          }
          if (data) {
            const newMatiere: Matiere = { ...matiere, id: data.id }
            
            if (matiere.enseignantIds && matiere.enseignantIds.length > 0) {
              const insertData = matiere.enseignantIds.map(ensId => ({
                matiere_id: data.id,
                enseignant_id: ensId
              }))
              await supabase.from('enseignants_matieres').insert(insertData)
            }
            
            set((state) => ({ matieres: [...state.matieres, newMatiere] }))
            return { success: true }
          }
          return { success: false, error: "La matière n'a pas pu être insérée." }
        } catch (e: any) {
          console.warn("Exception addMatiere:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      updateMatiere: async (id, data) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.nom) updateData.nom = data.nom
          if (data.coefficient) updateData.coefficient = data.coefficient
          
          if (Object.keys(updateData).length > 0) {
            const { error: uErr } = await supabase.from('matieres').update(updateData).eq('id', id)
            if (uErr) {
              console.warn("Erreur de mise à jour de la matière:", uErr.message)
              return { success: false, error: uErr.message }
            }
          }

          if (data.enseignantIds !== undefined) {
            await supabase.from('enseignants_matieres').delete().eq('matiere_id', id)
            
            if (data.enseignantIds.length > 0) {
              const insertData = data.enseignantIds.map(ensId => ({
                matiere_id: id,
                enseignant_id: ensId
              }))
              const { error: insErr } = await supabase.from('enseignants_matieres').insert(insertData)
              if (insErr) {
                console.warn("Erreur d'association de l'enseignant:", insErr.message)
                return { success: false, error: insErr.message }
              }
            }
          }
          set((state) => ({ matieres: state.matieres.map(m => m.id === id ? { ...m, ...data } : m) }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception updateMatiere:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      deleteMatiere: async (id) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase.from('matieres').delete().eq('id', id)
          if (error) {
            console.warn("Erreur deleteMatiere:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({ matieres: state.matieres.filter(m => m.id !== id) }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception deleteMatiere:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
 
      addEnseignant: async (ens) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('utilisateurs').insert({
            nom: ens.nom,
            prenom: ens.prenom,
            civilite: ens.civilite,
            email: ens.email || `temp-${Date.now()}@gestscol.local`,
            telephone: ens.telephone,
            role: 'enseignant',
            ecole_id: ens.ecoleId || get().ecole?.id || null
          }).select().single()
          
          if (error) {
            console.warn("Erreur addEnseignant:", error.message)
            return { success: false, error: error.message }
          }
          if (data) {
            const newEns: User = { ...ens, id: data.id }
            set((state) => ({ enseignants: [...state.enseignants, newEns] }))
            return { success: true }
          }
          return { success: false, error: "L'enseignant n'a pas pu être inséré." }
        } catch (e: any) {
          console.warn("Exception addEnseignant:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      updateEnseignant: async (id, data) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.nom) updateData.nom = data.nom
          if (data.prenom) updateData.prenom = data.prenom
          if (data.civilite) updateData.civilite = data.civilite
          if (data.email !== undefined) updateData.email = data.email || `temp-${Date.now()}@gestscol.local`
          if (data.telephone !== undefined) updateData.telephone = data.telephone
          
          const { error } = await supabase.from('utilisateurs').update(updateData).eq('id', id)
          if (error) {
            console.warn("Erreur updateEnseignant:", error.message)
            return { success: false, error: error.message }
          }
          
          set((state) => ({ enseignants: state.enseignants.map(e => e.id === id ? { ...e, ...data } : e) }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception updateEnseignant:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      deleteEnseignant: async (id) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase.from('utilisateurs').delete().eq('id', id)
          if (error) {
            console.warn("Erreur deleteEnseignant:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({ enseignants: state.enseignants.filter(e => e.id !== id) }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception deleteEnseignant:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      annulerInvitationEnseignant: async (invitationId) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('invitations_enseignant')
            .delete()
            .eq('id', invitationId)

          if (error) {
            console.error("Erreur annulerInvitationEnseignant:", error.message)
            return { success: false, error: error.message }
          }
          return { success: true }
        } catch (e: any) {
          console.error("Exception annulerInvitationEnseignant:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      gererAjoutEnseignant: async (emailEnseignant) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        const state = get()
        const currentUser = state.currentUser
        if (!currentUser || !state.ecole?.id) {
          return { success: false, error: "Non connecté ou établissement non défini." }
        }

        try {
          const supabase = createClient()
          
          // 1. Rechercher si l'enseignant possède déjà un compte utilisateur
          const { data: user, error: userError } = await supabase
            .from('utilisateurs')
            .select('*')
            .eq('email', emailEnseignant)
            .eq('role', 'enseignant')
            .maybeSingle()

          if (userError) {
            console.error('[gererAjoutEnseignant] Erreur fetch utilisateur:', userError.message)
            return { success: false, error: userError.message }
          }

          if (user) {
            // Cas 1 : L'utilisateur existe déjà
            // Vérifier s'il est déjà lié à cette école
            const { data: jointure, error: jointureError } = await supabase
              .from('enseignant_ecoles')
              .select('*')
              .eq('enseignant_id', user.id)
              .eq('ecole_id', state.ecole.id)
              .maybeSingle()

            if (jointureError) {
              console.error('[gererAjoutEnseignant] Erreur jointure:', jointureError.message)
              return { success: false, error: jointureError.message }
            }

            if (!jointure) {
              // Associer l'enseignant à l'école
              const { error: insertError } = await supabase
                .from('enseignant_ecoles')
                .insert({
                  enseignant_id: user.id,
                  ecole_id: state.ecole.id,
                  actif: true
                })

              if (insertError) {
                console.error('[gererAjoutEnseignant] Erreur insert jointure:', insertError.message)
                return { success: false, error: insertError.message }
              }
            }

            // Mettre à jour l'état local du store s'il n'y est pas déjà
            const mappedUser: User = {
              id: user.id,
              nom: user.nom,
              prenom: user.prenom,
              civilite: user.civilite,
              email: user.email,
              telephone: user.telephone,
              role: user.role,
              ecoleId: user.ecole_id,
              photoUrl: user.photo_url
            }

            set((s) => {
              const alreadyExists = s.enseignants.some((e) => e.id === user.id)
              return {
                enseignants: alreadyExists ? s.enseignants : [...s.enseignants, mappedUser]
              }
            })

            return {
              success: true,
              cas: 'associe',
              nomEnseignant: `${user.prenom} ${user.nom}`
            }
          } else {
            // Cas 2 : L'enseignant n'existe pas en base
            // Créer une invitation
            const { error: inviteError } = await supabase
              .from('invitations_enseignant')
              .insert({
                ecole_id: state.ecole.id,
                directeur_id: currentUser.id,
                email_cible: emailEnseignant,
                utilise: false
              })

            if (inviteError) {
              console.error('[gererAjoutEnseignant] Erreur insert invitation:', inviteError.message)
              return { success: false, error: inviteError.message }
            }

            return {
              success: true,
              cas: 'invite'
            }
          }
        } catch (e: any) {
          console.error('[gererAjoutEnseignant] Exception:', e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      chargerEnseignants: async () => {
        const state = get()
        if (!state.ecole?.id) {
          return { associes: [], invitationsEnAttente: [] }
        }

        try {
          const supabase = createClient()

          // 1. Charger les enseignants associés via enseignant_ecoles
          // On fait un select avec jointure utilisateurs
          const { data: jointures, error: jointuresError } = await supabase
            .from('enseignant_ecoles')
            .select(`
              id,
              enseignant_id,
              ecole_id,
              date_assignation,
              actif,
              utilisateurs:enseignant_id (*)
            `)
            .eq('ecole_id', state.ecole.id)

          if (jointuresError) {
            console.error('[chargerEnseignants] Erreur fetch jointures:', jointuresError.message)
            throw jointuresError
          }

          // 2. Charger les invitations en attente (non utilisées et non expirées)
          const { data: invites, error: invitesError } = await supabase
            .from('invitations_enseignant')
            .select('*')
            .eq('ecole_id', state.ecole.id)
            .eq('utilise', false)
            .gt('expire_le', new Date().toISOString())

          if (invitesError) {
            console.error('[chargerEnseignants] Erreur fetch invitations:', invitesError.message)
            throw invitesError
          }

          const associes = (jointures ?? [])
            .map((j: any) => {
              const u = j.utilisateurs
              if (!u) return null
              return {
                id: u.id,
                nom: u.nom,
                prenom: u.prenom,
                civilite: u.civilite,
                email: u.email,
                telephone: u.telephone,
                role: u.role,
                ecoleId: u.ecole_id,
                photoUrl: u.photo_url,
                dateAssignation: j.date_assignation,
                actif: j.actif
              }
            })
            .filter(Boolean)

          const invitationsEnAttente = (invites ?? []).map((i: any) => ({
            id: i.id,
            emailCible: i.email_cible,
            code: i.code,
            expireLe: i.expire_le,
            createdAt: i.created_at
          }))

          // Mettre également à jour l'état enseignants du store avec les enseignants actifs associés
          const storeEnseignants: User[] = associes.map((a: any) => ({
            id: a.id,
            nom: a.nom,
            prenom: a.prenom,
            civilite: a.civilite,
            email: a.email,
            telephone: a.telephone,
            role: a.role,
            ecoleId: a.ecoleId,
            photoUrl: a.photoUrl
          }))
          set({ enseignants: storeEnseignants })

          return {
            associes,
            invitationsEnAttente
          }
        } catch (e) {
          console.error('[chargerEnseignants] Exception:', e)
          return { associes: [], invitationsEnAttente: [] }
        }
      },

      getMoyenneEleve: (eleveId, trimestre) => {
        const notes = get().getNotesByEleve(eleveId, trimestre)
        const matieres = get().matieres
        
        let totalCoeff = 0
        let totalNotes = 0

        notes.forEach(note => {
          const matiere = matieres.find(m => m.id === note.matiereId)
          if (matiere) {
            totalNotes += note.valeur * matiere.coefficient
            totalCoeff += matiere.coefficient
          }
        })

        return totalCoeff > 0 ? Number((totalNotes / totalCoeff).toFixed(2)) : 0
      },

      addBulletin: async (bulletin) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('bulletins').insert({
            eleve_id: bulletin.eleveId,
            classe_id: bulletin.classeId,
            trimestre: bulletin.trimestre,
            annee_scolaire: bulletin.anneeScolaire,
            notes: bulletin.notes,
            moyenne_generale: bulletin.moyenneGenerale,
            moyenne_classe: bulletin.moyenneClasse,
            rang_classe: bulletin.rangClasse,
            effectif_classe: bulletin.effectifClasse,
            appreciation: bulletin.appreciation,
            appreciation_directeur: bulletin.appreciationDirecteur,
            date_generation: bulletin.dateGeneration,
            est_valide: bulletin.estValide || false
          }).select().single()
          
          if (error) {
            console.warn("Erreur addBulletin:", error.message)
            return { success: false, error: error.message }
          }
          if (data) {
            const newBulletin: Bulletin = { ...bulletin, id: data.id, estValide: data.est_valide || false }
            set((state) => ({ bulletins: [...state.bulletins, newBulletin] }))

            if (newBulletin.estValide) {
              try {
                const el = get().eleves.find(e => e.id === newBulletin.eleveId)
                if (el) {
                  const trimestreLabel = newBulletin.trimestre === 1 ? '1er' : newBulletin.trimestre === 2 ? '2ème' : '3ème'
                  await get().addNotification({
                    titre: '🏆 Bulletin Trimestriel Disponible',
                    description: `Le bulletin de notes du ${trimestreLabel} Trimestre de l'élève ${el.prenom} ${el.nom} a été validé par la direction. Vous pouvez le télécharger dans votre espace.`,
                    type: 'bulletin',
                    eleveId: el.id,
                    classeId: el.classeId,
                    destinataireRole: 'parent'
                  })
                }
              } catch (nErr) {
                console.warn("Erreur notification bulletin add:", nErr)
              }
            }

            return { success: true }
          }
          return { success: false, error: "Le bulletin n'a pas pu être inséré." }
        } catch (e: any) {
          console.warn("Exception addBulletin:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },
      
      updateBulletin: async (id, data) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.appreciationDirecteur !== undefined) updateData.appreciation_directeur = data.appreciationDirecteur
          if (data.dateGeneration) updateData.date_generation = data.dateGeneration
          if (data.estValide !== undefined) updateData.est_valide = data.estValide
          if (data.notes !== undefined) updateData.notes = data.notes
          if (data.moyenneGenerale !== undefined) updateData.moyenne_generale = data.moyenneGenerale
          if (data.moyenneClasse !== undefined) updateData.moyenne_classe = data.moyenneClasse
          if (data.rangClasse !== undefined) updateData.rang_classe = data.rangClasse
          if (data.effectifClasse !== undefined) updateData.effectif_classe = data.effectifClasse
          if (data.appreciation !== undefined) updateData.appreciation = data.appreciation
          
          const { error } = await supabase.from('bulletins').update(updateData).eq('id', id)
          if (error) {
            console.warn("Erreur updateBulletin:", error.message)
            return { success: false, error: error.message }
          }
          
          set((state) => ({
            bulletins: state.bulletins.map(b => b.id === id ? { ...b, ...data } : b)
          }))

          if (data.estValide) {
            try {
              const bul = get().bulletins.find(b => b.id === id)
              if (bul) {
                const el = get().eleves.find(e => e.id === bul.eleveId)
                if (el) {
                  const trimestreLabel = bul.trimestre === 1 ? '1er' : bul.trimestre === 2 ? '2ème' : '3ème'
                  await get().addNotification({
                    titre: '🏆 Bulletin Trimestriel Disponible',
                    description: `Le bulletin de notes du ${trimestreLabel} Trimestre de l'élève ${el.prenom} ${el.nom} a été validé par la direction. Vous pouvez le télécharger dans votre espace.`,
                    type: 'bulletin',
                    eleveId: el.id,
                    classeId: el.classeId,
                    destinataireRole: 'parent'
                  })
                }
              }
            } catch (nErr) {
              console.warn("Erreur notification bulletin:", nErr)
            }
          }

          return { success: true }
        } catch (e: any) {
          console.warn("Exception updateBulletin:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      deleteBulletin: async (id) => {
        if (checkAbonnement(get())) {
          return { success: false, error: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action." }
        }
        try {
          const supabase = createClient()
          const { error } = await supabase.from('bulletins').delete().eq('id', id)
          if (error) {
            console.warn("Erreur deleteBulletin:", error.message)
            return { success: false, error: error.message }
          }
          set((state) => ({
            bulletins: state.bulletins.filter(b => b.id !== id)
          }))
          return { success: true }
        } catch (e: any) {
          console.warn("Exception deleteBulletin:", e)
          return { success: false, error: e.message || "Une erreur inattendue est survenue." }
        }
      },

      getBulletinsByClasseAndTrimestre: (classeId, trimestre) => {
        return get().bulletins.filter(b => b.classeId === classeId && b.trimestre === trimestre)
      },

      calculerBulletinsClasse: (classeId, trimestre, anneeScolaire) => {
        const { eleves, notes, matieres, inscriptions } = get()
        
        // 1. Récupérer les inscriptions validées pour l'année scolaire ET la classe demandée
        const inscriptionsAnnee = inscriptions.filter(i => 
          i.anneeScolaire === anneeScolaire && 
          i.statut === 'validee' && 
          i.classeId === classeId
        )
        const elevesInscritsIds = inscriptionsAnnee.map(i => i.eleveId)

        // 2. Récupérer les élèves actifs inscrits dans cette classe cette année
        const elevesClasse = eleves.filter(e => 
          e.statut === 'actif' &&
          elevesInscritsIds.includes(e.id)
        )
        if (elevesClasse.length === 0) return []
        
        // 3. Récupérer les matières associées à cette classe
        const matieresClasse = matieres.filter(m => m.classeId === classeId)
        
        // 3. Calculer la moyenne générale de chaque élève pour pouvoir les classer
        const moyennesEleves = elevesClasse.map(eleve => {
          const notesEleve = notes.filter(n => n.eleveId === eleve.id && n.trimestre === trimestre && n.anneeScolaire === anneeScolaire)
          
          let totalCoeff = 0
          let totalPoints = 0
          
          matieresClasse.forEach(matiere => {
            const notesMatiere = notesEleve.filter(n => n.matiereId === matiere.id)
            if (notesMatiere.length > 0) {
              const somme = notesMatiere.reduce((acc, curr) => acc + curr.valeur, 0)
              const moyenneMatiere = somme / notesMatiere.length
              totalPoints += moyenneMatiere * matiere.coefficient
              totalCoeff += matiere.coefficient
            }
          })
          
          const moyenneGenerale = totalCoeff > 0 ? Number((totalPoints / totalCoeff).toFixed(2)) : 0
          return {
            eleveId: eleve.id,
            moyenneGenerale,
            notesSnapshot: notesEleve
          }
        })
        
        // 4. Classer les élèves par moyenne décroissante
        const moyennesTriees = [...moyennesEleves].sort((a, b) => b.moyenneGenerale - a.moyenneGenerale)
        
        // 5. Calculer la moyenne générale de la classe
        const sommeMoyennes = moyennesEleves.reduce((acc, curr) => acc + curr.moyenneGenerale, 0)
        const moyenneClasse = Number((sommeMoyennes / moyennesEleves.length).toFixed(2))
        
        // 6. Construire le bulletin pour chaque élève
        const bulletinsGeneres: Bulletin[] = elevesClasse.map(eleve => {
          const statsEleve = moyennesEleves.find(m => m.eleveId === eleve.id)!
          const rangClasse = moyennesTriees.findIndex(m => m.eleveId === eleve.id) + 1
          
          let appreciation = 'Insuffisant'
          const moy = statsEleve.moyenneGenerale
          if (moy >= 16) appreciation = 'Excellent'
          else if (moy >= 14) appreciation = 'Très Bien'
          else if (moy >= 12) appreciation = 'Bien'
          else if (moy >= 10) appreciation = 'Assez Bien'
          else if (moy >= 8) appreciation = 'Passable'
          
          const bulletinExistant = get().bulletins.find(
            b => b.eleveId === eleve.id && b.trimestre === trimestre && b.anneeScolaire === anneeScolaire
          )
          
          return {
            id: bulletinExistant?.id || `bul-${eleve.id}-${trimestre}-${anneeScolaire}`,
            eleveId: eleve.id,
            classeId: classeId,
            trimestre: trimestre,
            anneeScolaire: anneeScolaire,
            notes: statsEleve.notesSnapshot,
            moyenneGenerale: statsEleve.moyenneGenerale,
            moyenneClasse,
            rangClasse,
            effectifClasse: elevesClasse.length,
            appreciation,
            appreciationDirecteur: bulletinExistant?.appreciationDirecteur || '',
            dateGeneration: bulletinExistant?.dateGeneration || new Date().toISOString().split('T')[0],
            estValide: bulletinExistant?.estValide || false
          }
        })
        
        return bulletinsGeneres
      },
      isAbonnementExpired: () => {
        const ecole = get().ecole
        if (!ecole?.abonnement) return false
        const isExpiredStatut = ['expire', 'suspendu'].includes(ecole.abonnement.statut)
        const isExpiredDate = ecole.abonnement.dateFin ? new Date(ecole.abonnement.dateFin) < new Date() : false
        return isExpiredStatut || isExpiredDate
      },
      upgradeParentToPremium: async (type: 'annuel' | 't1' | 't2' | 't3', anneeId: string) => {
        const { currentUser } = get()
        if (!currentUser || currentUser.role !== 'parent') {
          return { success: false, error: "Utilisateur non connecté ou n'est pas un parent." }
        }

        try {
          const supabase = createClient()
          const actuel = currentUser.parentSubscriptionStatus || 'gratuit'
          
          if (actuel === 'premium') {
            return { success: true }
          }

          let nouveauStatut = ''
          
          // Récupérer et parser les abonnements existants par année
          const abonnements = actuel.includes(':') 
            ? actuel.split(';').filter(Boolean) 
            : []
            
          const idxAnnee = abonnements.findIndex(a => a.startsWith(`${anneeId}:`))
          let statutAnnee = 'premium'
          
          if (type !== 'annuel') {
            let trimestres: string[] = []
            if (idxAnnee !== -1) {
              const parts = abonnements[idxAnnee].split(':')
              const statutExistant = parts[1]
              if (statutExistant === 'premium') {
                return { success: true }
              }
              trimestres = statutExistant.split(',').filter(Boolean)
            }
            
            if (!trimestres.includes(type)) {
              trimestres.push(type)
            }
            trimestres.sort()
            
            if (trimestres.includes('t1') && trimestres.includes('t2') && trimestres.includes('t3')) {
              statutAnnee = 'premium'
            } else {
              statutAnnee = trimestres.join(',')
            }
          }
          
          const nouvelAbonnementAnnee = `${anneeId}:${statutAnnee}`
          if (idxAnnee !== -1) {
            abonnements[idxAnnee] = nouvelAbonnementAnnee
          } else {
            abonnements.push(nouvelAbonnementAnnee)
          }
          
          nouveauStatut = abonnements.join(';')

          const { error } = await supabase
            .from('utilisateurs')
            .update({ parent_subscription_status: nouveauStatut })
            .eq('id', currentUser.id)

          if (error) {
            console.error("Erreur de mise à jour de l'abonnement parent :", error.message)
            return { success: false, error: error.message }
          }

          set({
            currentUser: {
              ...currentUser,
              parentSubscriptionStatus: nouveauStatut
            }
          })

          return { success: true }
        } catch (err: any) {
          console.error(err)
          return { success: false, error: err.message || "Une erreur inattendue est survenue." }
        }
      }
    }),
    {
      name: 'gestscol-storage',
      version: 12,
      migrate: (persistedState: any, version: number) => {
        if (version < 12) {
          // Vider le cache pour forcer le chargement de mockData.ts mis à jour
          return undefined as any
        }
        return persistedState as any
      }
    }
  )
)
