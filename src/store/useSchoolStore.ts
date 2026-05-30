import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Eleve, Classe, Note, Paiement, Absence, Matiere, Inscription, Bulletin, AnneeScolaire, Ecole, UserCompteSimule, AbonnementEcole, NotificationItem, NotificationType } from '../types'
import { classesMock, elevesMock, notesMock, paiementsMock, absencesMock, matieresMock, ecoleMock, usersMock, inscriptionsMock, bulletinsMock } from '../data/mockData'
import { createClient } from '../lib/supabase/client'
import { updateSchoolAbonnement, getSchoolAbonnement } from '../app/actions/abonnement'
import { createNotification, markAsRead, fetchUserLectures, deleteNotificationDb } from '../app/actions/notifications'
import { toast } from '../hooks/use-toast'

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
  
  updateEcole: (data: Partial<Ecole>) => void
  updateAbonnement: (data: Partial<AbonnementEcole>) => Promise<void>
  
  fetchNotifications: () => Promise<void>
  addNotification: (data: {
    titre: string
    description: string
    type: NotificationType
    destinataireRole?: 'parent' | 'enseignant' | 'all'
    classeId?: string
    eleveId?: string
  }) => Promise<void>
  markNotificationAsRead: (id: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  
  fetchSupabaseData: () => Promise<void>
  
  setComptesSimules: (comptes: UserCompteSimule[]) => void
  addCompteConnexion: (compte: UserCompteSimule) => Promise<void>
  updateCompteConnexion: (id: string, data: Partial<UserCompteSimule>) => Promise<void>
  deleteCompteConnexion: (id: string) => Promise<void>

  initializeAnneesScolaires: () => void
  addAnneeScolaire: (annee: AnneeScolaire) => Promise<void>
  updateAnneeScolaire: (id: string, data: Partial<AnneeScolaire>) => Promise<void>
  deleteAnneeScolaire: (id: string) => Promise<void>
  setActiveAnneeScolaire: (id: string) => Promise<void>
  setCurrentUser: (user: User | null) => void
  clearSchoolData: (ecoleData: Partial<Ecole>) => void
  
  getEleves: (classeId?: string) => Eleve[]
  getEleveById: (id: string) => Eleve | undefined
  addEleve: (eleve: Eleve) => Promise<void>
  updateEleve: (id: string, data: Partial<Eleve>) => Promise<void>
  deleteEleve: (id: string) => Promise<void>
  
  getClasses: () => Classe[]
  getClasseById: (id: string) => Classe | undefined
  addClasse: (classe: Classe) => Promise<void>
  updateClasse: (id: string, data: Partial<Classe>) => Promise<void>
  deleteClasse: (id: string) => Promise<void>
  
  getNotesByEleve: (eleveId: string, trimestre?: 1 | 2 | 3) => Note[]
  addNote: (note: Note) => Promise<void>
  updateNote: (id: string, data: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  
  getPaiementsByEleve: (eleveId: string) => Paiement[]
  addPaiement: (paiement: Paiement) => Promise<void>
  updatePaiementStatut: (id: string, statut: 'paye' | 'en_attente' | 'retard', mode?: 'especes' | 'wave' | 'orange_money' | 'mtn_momo', reference?: string) => Promise<void>
  enregistrerPaiementInstallment: (id: string, montantEncaisse: number, mode: 'especes' | 'wave' | 'orange_money' | 'mtn_momo', reference?: string) => Promise<void>
  annulerVersement: (id: string, versementIdx: number) => Promise<void>
  updateClasseTarifs: (classeId: string, montantScolarite: number, montantInscription: number) => Promise<void>
  
  getAbsencesByEleve: (eleveId: string) => Absence[]
  addAbsence: (absence: Absence) => Promise<void>
  enregistrerAbsences: (date: string, seance: 'matin' | 'apres-midi', absences: Absence[], eleveIds: string[]) => Promise<void>
  justifierAbsence: (absenceId: string, motif?: string, justifiee?: boolean) => Promise<void>
  
  addMatiere: (matiere: Matiere) => Promise<void>
  updateMatiere: (id: string, data: Partial<Matiere>) => Promise<void>
  deleteMatiere: (id: string) => Promise<void>

  addEnseignant: (ens: User) => Promise<void>
  updateEnseignant: (id: string, data: Partial<User>) => Promise<void>
  deleteEnseignant: (id: string) => Promise<void>
  
  getInscriptions: () => Inscription[]
  getInscriptionsByEleve: (eleveId: string) => Inscription[]
  addInscription: (inscription: Inscription | any) => Promise<any>
  updateInscription: (id: string, data: Partial<Inscription>) => Promise<any>
  deleteInscription: (id: string) => Promise<void>
  
  getMoyenneEleve: (eleveId: string, trimestre: 1 | 2 | 3) => number

  addBulletin: (bulletin: Bulletin) => Promise<void>
  updateBulletin: (id: string, data: Partial<Bulletin>) => Promise<void>
  deleteBulletin: (id: string) => Promise<void>
  getBulletinsByClasseAndTrimestre: (classeId: string, trimestre: 1 | 2 | 3) => Bulletin[]
  calculerBulletinsClasse: (classeId: string, trimestre: 1 | 2 | 3, anneeScolaire: string) => Bulletin[]
  isAbonnementExpired: () => boolean
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
      updateEcole: async (data) => {
        if (checkAbonnement(get())) return
        const state = get()
        if (state.ecole.id) {
          try {
            const supabase = createClient()
            const { error } = await supabase
              .from('ecoles')
              .update({
                nom: data.nom,
                identifiant: data.identifiant,
                ville: data.ville,
                adresse: data.adresse,
                telephone: data.telephone,
                logo: data.logo,
                annee_scolaire: data.anneeScolaire
              })
              .eq('id', state.ecole.id)
            
            if (error) {
              console.warn("Erreur Supabase updateEcole:", error.message)
            }
          } catch (err) {
            console.warn("Exception updateEcole:", err)
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

          // 2. Récupérer les notifications de Supabase pour cette école
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('ecole_id', state.ecole.id)
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
            await deleteNotificationDb(id)
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
          
          const targetEcoleId = currentUser.ecoleId;
          if (!targetEcoleId) return;

          const supabase = createClient()
          const { data: ecoles } = await supabase.from('ecoles').select('*').eq('id', targetEcoleId)
          
          const ecoleId = targetEcoleId;
          let anneesQuery = supabase.from('annees_scolaires').select('*').eq('ecole_id', ecoleId)
          const { data: anneesScolaires } = await anneesQuery
          
          const { data: utilisateurs } = await supabase.from('utilisateurs').select('*').eq('ecole_id', ecoleId)
          const { data: classes } = await supabase.from('classes').select('*').eq('ecole_id', ecoleId)
          const { data: eleves } = await supabase.from('eleves').select('*').eq('ecole_id', ecoleId)
          const { data: inscriptions } = await supabase.from('inscriptions').select('*').eq('ecole_id', ecoleId)

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

          if (classesIds.length > 0) {
            const { data: mData } = await supabase.from('matieres').select('*').in('classe_id', classesIds)
            if (mData) matieres = mData
          }

          if (elevesIds.length > 0) {
            const { data: nData } = await supabase.from('notes').select('*').in('eleve_id', elevesIds)
            const { data: pData } = await supabase.from('paiements').select('*').in('eleve_id', elevesIds)
            const { data: aData } = await supabase.from('absences').select('*').in('eleve_id', elevesIds)
            const { data: bData } = await supabase.from('bulletins').select('*').in('eleve_id', elevesIds)
            
            if (nData) notes = nData
            if (pData) paiements = pData
            if (aData) absences = aData
            if (bData) bulletins = bData
          }

          if (userIds.length > 0) {
            const { data: cData } = await supabase.from('comptes_connexion').select('*').in('id', userIds)
            if (cData) comptesConnexion = cData
          }

          if (enseignantsIds.length > 0) {
            const { data: emData } = await supabase.from('enseignants_matieres').select('*').in('enseignant_id', enseignantsIds)
            if (emData) enseignantsMatieres = emData
          }
          
          // Récupération sécurisée bypassant RLS pour s'assurer que les parents et enseignants lisent le bon statut d'abonnement
          const abonnementRes = await getSchoolAbonnement(ecoleId)
          const abonnements = abonnementRes.success && abonnementRes.data ? [abonnementRes.data] : null

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

            set({ ecole: {
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
            } })
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
                    photoUrl: dbMe.photo_url
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
              dateGeneration: b.date_generation
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
        if (checkAbonnement(get())) return
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
          
          if (!error && data) {
            set(state => ({
              anneesScolaires: [...state.anneesScolaires, {
                id: data.id,
                nom: data.nom,
                dateDebut: data.date_debut,
                dateFin: data.date_fin,
                statut: data.statut
              }]
            }))
          }
        } catch (e) { console.error(e) }
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
          } else {
            document.cookie = "currentUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax"
          }
        }
        set({ currentUser: user })
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
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          await supabase.from('inscriptions').delete().eq('id', id)
        } catch (e) {
          console.warn("Exception deleteInscription:", e)
        }
        set((state) => ({
          inscriptions: state.inscriptions.filter(i => i.id !== id),
          paiements: state.paiements.filter(p => p.inscriptionId !== id)
        }))
      },
      
      getEleves: (classeId) => {
        const { eleves } = get()
        return classeId ? eleves.filter(e => e.classeId === classeId) : eleves
      },
      
      getEleveById: (id) => get().eleves.find(e => e.id === id),
      
      addEleve: async (eleve) => {
        if (checkAbonnement(get())) return
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
            date_inscription: eleve.dateInscription || new Date().toISOString().split('T')[0]
          }).select().single()
          
          if (error) {
            console.warn("Erreur addEleve:", error.message)
            set((state) => ({ eleves: [...state.eleves, eleve] }))
          } else if (data) {
            const newEleve: Eleve = { ...eleve, id: data.id }
            set((state) => ({ eleves: [...state.eleves, newEleve] }))
          }
        } catch (e) {
          console.warn("Exception addEleve:", e)
        }
      },
      
      updateEleve: async (id, data) => {
        if (checkAbonnement(get())) return
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
          
          await supabase.from('eleves').update(updateData).eq('id', id)
        } catch (e) {
          console.warn("Exception updateEleve:", e)
        }
        set((state) => ({
          eleves: state.eleves.map(e => e.id === id ? { ...e, ...data } : e)
        }))
      },

      deleteEleve: async (id) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          await supabase.from('eleves').delete().eq('id', id)
        } catch (e) {
          console.warn("Exception deleteEleve:", e)
        }
        set((state) => ({
          eleves: state.eleves.filter(e => e.id !== id),
          inscriptions: state.inscriptions.filter(i => i.eleveId !== id),
          paiements: state.paiements.filter(p => p.eleveId !== id),
          absences: state.absences.filter(a => a.eleveId !== id),
          notes: state.notes.filter(n => n.eleveId !== id),
          bulletins: state.bulletins.filter(b => b.eleveId !== id)
        }))
      },

      getClasses: () => get().classes,
      
      getClasseById: (id) => get().classes.find(c => c.id === id),

      addClasse: async (classe) => {
        if (checkAbonnement(get())) return
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
            console.warn("Erreur addClasse:", error)
            set((state) => ({ classes: [...state.classes, classe] }))
          } else if (data) {
            const newClasse: Classe = { ...classe, id: data.id }
            set((state) => ({ classes: [...state.classes, newClasse] }))
          }
        } catch (e) { console.error(e) }
      },
      updateClasse: async (id, data) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.nom) updateData.nom = data.nom
          if (data.niveau) updateData.niveau = data.niveau
          if (data.enseignantPrincipalId !== undefined) updateData.enseignant_principal_id = data.enseignantPrincipalId || null
          if (data.montantScolarite !== undefined) updateData.montant_scolarite = data.montantScolarite
          if (data.montantInscription !== undefined) updateData.montant_inscription = data.montantInscription

          await supabase.from('classes').update(updateData).eq('id', id)
        } catch (e) { console.error(e) }
        set((state) => ({ classes: state.classes.map(c => c.id === id ? { ...c, ...data } : c) }))
      },
      deleteClasse: async (id) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          await supabase.from('classes').delete().eq('id', id)
        } catch (e) { console.error(e) }
        set((state) => ({ classes: state.classes.filter(c => c.id !== id) }))
      },

      getNotesByEleve: (eleveId, trimestre) => {
        const { notes } = get()
        let filtered = notes.filter(n => n.eleveId === eleveId)
        if (trimestre) filtered = filtered.filter(n => n.trimestre === trimestre)
        return filtered
      },

      addNote: async (note) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('notes').insert({
            eleve_id: note.eleveId,
            matiere_id: note.matiereId,
            valeur: note.valeur,
            type: note.type,
            date: note.date,
            trimestre: note.trimestre,
            annee_scolaire: note.anneeScolaire
          }).select().single()
          if (error) {
            console.warn("Erreur addNote:", error.message)
            set((state) => ({ notes: [...state.notes, note] }))
          } else if (data) {
            const newNote: Note = { ...note, id: data.id }
            set((state) => ({ notes: [...state.notes, newNote] }))
          }
        } catch (e) {
          console.warn("Exception addNote:", e)
        }
      },
      
      updateNote: async (id, data) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.valeur !== undefined) updateData.valeur = data.valeur
          if (data.type) updateData.type = data.type
          if (data.date) updateData.date = data.date
          
          await supabase.from('notes').update(updateData).eq('id', id)
        } catch (e) {
          console.warn("Exception updateNote:", e)
        }
        set((state) => ({
          notes: state.notes.map(n => n.id === id ? { ...n, ...data } : n)
        }))
      },

      deleteNote: async (id) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          await supabase.from('notes').delete().eq('id', id)
        } catch (e) {
          console.warn("Exception deleteNote:", e)
        }
        set((state) => ({
          notes: state.notes.filter(n => n.id !== id)
        }))
      },

      getPaiementsByEleve: (eleveId) => get().paiements.filter(p => p.eleveId === eleveId),
      
      addPaiement: async (paiement) => {
        if (checkAbonnement(get())) return
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
            set((state) => ({ paiements: [...state.paiements, paiement] }))
          } else if (data) {
            const newPaiement: Paiement = { ...paiement, id: data.id }
            set((state) => ({ paiements: [...state.paiements, newPaiement] }))
          }
        } catch (e) {
          console.warn("Exception addPaiement:", e)
        }
      },

      updatePaiementStatut: async (id, statut, mode, reference) => {
        if (checkAbonnement(get())) return
        const updateData: any = { statut }
        if (mode) updateData.mode_paiement = mode
        if (reference) updateData.reference = reference
        if (statut === 'paye') updateData.date_paiement = new Date().toISOString().split('T')[0]
        
        try {
          const supabase = createClient()
          await supabase.from('paiements').update(updateData).eq('id', id)
        } catch (e) {
          console.warn("Exception updatePaiementStatut:", e)
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
      },

      enregistrerPaiementInstallment: async (id, montantEncaisse, mode, reference) => {
        if (checkAbonnement(get())) return
        const state = get()
        const paiementsState = state.paiements
        const p = paiementsState.find(p => p.id === id)
        if (!p) return

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
          await supabase.from('paiements').update(updateData).eq('id', id)
        } catch (e) {
          console.warn("Exception enregistrerPaiementInstallment:", e)
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
      },

      annulerVersement: async (id, versementIdx) => {
        if (checkAbonnement(get())) return
        const p = get().paiements.find(p => p.id === id)
        if (!p) return
        
        const historique = p.historiquePaiements || []
        if (versementIdx < 0 || versementIdx >= historique.length) return
        
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
          await supabase.from('paiements').update({
            montant_paye: newMontantPaye,
            statut: newStatut,
            historique_paiements: newHistorique
          }).eq('id', id)
        } catch (e) {
          console.warn("Exception annulerVersement:", e)
        }

        set((state) => ({
          paiements: state.paiements.map(pmt => pmt.id === id ? {
            ...pmt,
            montantPaye: newMontantPaye,
            statut: newStatut,
            historiquePaiements: newHistorique
          } : pmt)
        }))
      },


      updateClasseTarifs: async (classeId, montantScolarite, montantInscription) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          await supabase.from('classes').update({
            montant_scolarite: montantScolarite,
            montant_inscription: montantInscription
          }).eq('id', classeId)
        } catch (e) { console.error(e) }
        set((state) => ({
          classes: state.classes.map(c => c.id === classeId ? { ...c, montantScolarite, montantInscription } : c)
        }))
      },

      getAbsencesByEleve: (eleveId) => get().absences.filter(a => a.eleveId === eleveId),
      
      addAbsence: async (absence) => {
        if (checkAbonnement(get())) return
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
            set((state) => ({ absences: [...state.absences, absence] }))
          } else if (data) {
            const newAbsence: Absence = { ...absence, id: data.id }
            set((state) => ({ absences: [...state.absences, newAbsence] }))
          }
        } catch (e) {
          console.warn("Exception addAbsence:", e)
        }
      },

      enregistrerAbsences: async (date, seance, absencesAAjouter, eleveIds) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          if (eleveIds.length > 0) {
            await supabase.from('absences').delete()
              .eq('date', date)
              .eq('seance', seance)
              .in('eleve_id', eleveIds)
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
            } else if (data) {
              absencesAAjouter = data.map((d: any) => ({
                id: d.id,
                eleveId: d.eleve_id,
                date: d.date,
                seance: d.seance,
                justifiee: d.justifiee,
                motif: d.motif,
                anneeScolaire: d.annee_scolaire
              })) as Absence[]
            }
          }
        } catch (e) {
          console.warn("Exception enregistrerAbsences:", e)
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
      },

      justifierAbsence: async (absenceId, motif, justifiee = true) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          await supabase.from('absences').update({
            justifiee,
            motif: justifiee ? motif : null
          }).eq('id', absenceId)
        } catch (e) {
          console.warn("Exception justifierAbsence:", e)
        }
        set((state) => ({
          absences: state.absences.map(a => 
            a.id === absenceId ? { ...a, justifiee, motif: justifiee ? motif : undefined } : a
          )
        }))
      },

      addMatiere: async (matiere) => {
        try {
          if (checkAbonnement(get())) return
          const supabase = createClient()
          const { data, error } = await supabase.from('matieres').insert({
            nom: matiere.nom,
            coefficient: matiere.coefficient,
            classe_id: matiere.classeId,
            enseignant_id: matiere.enseignantIds && matiere.enseignantIds.length > 0 ? matiere.enseignantIds[0] : null
          }).select().single()
          if (error) {
            console.warn("Erreur addMatiere:", error.message)
            set((state) => ({ matieres: [...state.matieres, matiere] }))
          } else if (data) {
            const newMatiere: Matiere = { ...matiere, id: data.id }
            
            if (matiere.enseignantIds && matiere.enseignantIds.length > 0) {
              const insertData = matiere.enseignantIds.map(ensId => ({
                matiere_id: data.id,
                enseignant_id: ensId
              }))
              await supabase.from('enseignants_matieres').insert(insertData)
            }
            
            set((state) => ({ matieres: [...state.matieres, newMatiere] }))
          }
        } catch (e) {
          console.warn("Exception addMatiere:", e)
        }
      },
      updateMatiere: async (id, data) => {
        try {
          if (checkAbonnement(get())) return
          const supabase = createClient()
          const updateData: any = {}
          if (data.nom) updateData.nom = data.nom
          if (data.coefficient) updateData.coefficient = data.coefficient
          
          if (Object.keys(updateData).length > 0) {
            await supabase.from('matieres').update(updateData).eq('id', id)
          }

          if (data.enseignantIds !== undefined) {
            await supabase.from('enseignants_matieres').delete().eq('matiere_id', id)
            
            if (data.enseignantIds.length > 0) {
              const insertData = data.enseignantIds.map(ensId => ({
                matiere_id: id,
                enseignant_id: ensId
              }))
              await supabase.from('enseignants_matieres').insert(insertData)
            }
          }
          set((state) => ({ matieres: state.matieres.map(m => m.id === id ? { ...m, ...data } : m) }))
        } catch (e) {
          console.warn("Exception updateMatiere:", e)
        }
      },
      deleteMatiere: async (id) => {
        try {
          if (checkAbonnement(get())) return
          const supabase = createClient()
          await supabase.from('matieres').delete().eq('id', id)
          set((state) => ({ matieres: state.matieres.filter(m => m.id !== id) }))
        } catch (e) {
          console.warn("Exception deleteMatiere:", e)
        }
      },
 
      addEnseignant: async (ens) => {
        try {
          if (checkAbonnement(get())) return
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
            throw new Error(error.message)
          } else if (data) {
            const newEns: User = { ...ens, id: data.id }
            set((state) => ({ enseignants: [...state.enseignants, newEns] }))
          }
        } catch (e) {
          console.warn("Exception addEnseignant:", e)
        }
      },
      updateEnseignant: async (id, data) => {
        try {
          if (checkAbonnement(get())) return
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
            throw new Error(error.message)
          }
          
          set((state) => ({ enseignants: state.enseignants.map(e => e.id === id ? { ...e, ...data } : e) }))
        } catch (e) {
          console.warn("Exception updateEnseignant:", e)
        }
      },
      deleteEnseignant: async (id) => {
        try {
          if (checkAbonnement(get())) return
          const supabase = createClient()
          await supabase.from('utilisateurs').delete().eq('id', id)
          set((state) => ({ enseignants: state.enseignants.filter(e => e.id !== id) }))
        } catch (e) {
          console.warn("Exception deleteEnseignant:", e)
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
        if (checkAbonnement(get())) return
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
            date_generation: bulletin.dateGeneration
          }).select().single()
          if (error) {
            console.warn("Erreur addBulletin:", error.message)
            set((state) => ({ bulletins: [...state.bulletins, bulletin] }))
          } else if (data) {
            const newBulletin: Bulletin = { ...bulletin, id: data.id }
            set((state) => ({ bulletins: [...state.bulletins, newBulletin] }))
          }
        } catch (e) {
          console.warn("Exception addBulletin:", e)
        }
      },
      
      updateBulletin: async (id, data) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          const updateData: any = {}
          if (data.appreciationDirecteur !== undefined) updateData.appreciation_directeur = data.appreciationDirecteur
          if (data.dateGeneration) updateData.date_generation = data.dateGeneration
          await supabase.from('bulletins').update(updateData).eq('id', id)
        } catch (e) {
          console.warn("Exception updateBulletin:", e)
        }
        set((state) => ({
          bulletins: state.bulletins.map(b => b.id === id ? { ...b, ...data } : b)
        }))
      },

      deleteBulletin: async (id) => {
        if (checkAbonnement(get())) return
        try {
          const supabase = createClient()
          await supabase.from('bulletins').delete().eq('id', id)
        } catch (e) {
          console.warn("Exception deleteBulletin:", e)
        }
        set((state) => ({
          bulletins: state.bulletins.filter(b => b.id !== id)
        }))
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
            dateGeneration: bulletinExistant?.dateGeneration || new Date().toISOString().split('T')[0]
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
