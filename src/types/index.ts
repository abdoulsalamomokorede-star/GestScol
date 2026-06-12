// =============================================================
// GestScol — types/index.ts
// Types TypeScript stricts pour le SaaS de gestion scolaire
// Toutes les relations sont vérifiées et documentées ci-dessous
// =============================================================

// -------------------------------------------------------------
// ANNÉE SCOLAIRE
// -------------------------------------------------------------

export type AnneeScolaire = {
  id: string
  nom: string            // ex: "2024-2025"
  dateDebut: string      // ISO 8601
  dateFin: string        // ISO 8601
  statut: 'active' | 'archivee'
}

// -------------------------------------------------------------
// RÔLES & UTILISATEURS
// -------------------------------------------------------------

export type UserRole = 'directeur' | 'enseignant' | 'parent'

export type Civilite = 'M' | 'Mme' | 'Mlle' | 'Dr' | 'Pr'

export type User = {
  id: string
  nom: string
  prenom: string
  civilite: Civilite
  email: string
  telephone?: string
  role: UserRole
  ecoleId: string | null        // FK → Ecole.id
  identifiant?: string   // Utilisé pour les comptes_connexion
  photoUrl?: string      // URL ou Base64 de la photo de profil
  parentSubscriptionStatus?: string // Statut de l'abonnement du parent ('gratuit', 'premium', 't1', 't1,t2', etc.)
  // Note : pour role='enseignant', les classes/matières sont liées
  //        via Classe.enseignantPrincipalId et Matiere.enseignantId
  // Note : pour role='parent', le lien vers les enfants se fait
  //        via Eleve.parentUserId (un compte parent = un ou plusieurs élèves)
}

// -------------------------------------------------------------
// ÉCOLE & CLASSES
// -------------------------------------------------------------

export type AbonnementPlan = 'gratuit' | 'standard' | 'premium'
export type AbonnementStatut = 'actif' | 'expire' | 'suspendu' | 'en_attente'

export type AbonnementEcole = {
  id: string
  ecoleId: string
  plan: AbonnementPlan
  statut: AbonnementStatut
  dateDebut: string
  dateFin?: string
  transactionRef?: string
  modePaiement?: ModePaiement
  montantPaye: number
  maxEleves: number
}

export type Ecole = {
  id: string
  identifiant?: string   // ex: "FLAMB"
  nom: string
  ville: string
  adresse: string
  telephone: string
  logo?: string
  niveaux: ('prescolaire' | 'primaire' | 'secondaire')[]
  anneeScolaire: string  // ex: "2024-2025"
  abonnement?: AbonnementEcole // Relation jointe
}

export type Classe = {
  id: string
  nom: string                       // ex: "CM2 A", "6ème B"
  niveau: string                    // ex: "primaire", "secondaire"
  enseignantPrincipalId: string     // FK → User.id (role='enseignant')
  ecoleId: string                   // FK → Ecole.id
  montantScolarite: number          // Frais trimestriels en FCFA
  montantInscription: number        // Frais d'inscription annuels en FCFA
  // ⚠️ SUPPRIMÉ : effectif — champ calculé dynamiquement dans le store
  //    via getEleves(classeId).length pour éviter les désynchronisations
}

// -------------------------------------------------------------
// ÉLÈVES
// -------------------------------------------------------------

export type Eleve = {
  id: string
  matricule: string                // ex: "SCH-2024-0042" — identifiant unique
  nom: string
  prenom: string
  dateNaissance: string            // ISO 8601 : "2015-04-12"
  sexe: 'M' | 'F'
  classeId: string                 // FK → Classe.id
  ecoleId: string                  // FK → Ecole.id
  parentNom: string
  parentTelephone: string          // Format ivoirien : "+225 07 12 34 56"
  parentEmail?: string
  parentUserId?: string            // FK → User.id (role='parent')
  // ✅ AJOUTÉ : permet l'accès espace parent
  photoUrl?: string
  statut: 'actif' | 'suspendu' | 'exclu'
  dateInscription: string          // ISO 8601 : "2024-09-03"
}

// -------------------------------------------------------------
// INSCRIPTIONS
// ✅ NOUVEAU TYPE — table à part entière
// Représente l'acte d'inscription d'un élève pour une année scolaire.
// Un élève peut avoir plusieurs inscriptions (une par année scolaire).
// Les paiements de frais d'inscription y sont rattachés via Paiement.inscriptionId
// -------------------------------------------------------------

export type DocumentInscription =
  | 'extrait_naissance'
  | 'carnet_sante'
  | 'bulletin_precedent'
  | 'photos_identite'
  | 'certificat_scolarite'
  | 'fiche_renseignements'

export type Inscription = {
  id: string
  eleveId: string                   // FK → Eleve.id
  classeId: string                  // FK → Classe.id (classe pour cette année)
  ecoleId: string                   // FK → Ecole.id
  anneeScolaire: string             // ex: "2024-2025"
  dateInscription: string           // ISO 8601 : "2024-09-02"
  statut: 'validee' | 'en_attente' | 'annulee'
  fraisInscription: number          // Montant en FCFA
  documentsRecus: DocumentDocumentInscription[]  // Documents fournis par les parents
  commentaire?: string              // Notes du directeur (allergies, besoins spéciaux…)
}

// Alias pour éviter la répétition dans Inscription
type DocumentDocumentInscription = DocumentInscription

// -------------------------------------------------------------
// MATIÈRES & NOTES
// -------------------------------------------------------------

export type Matiere = {
  id: string
  nom: string                       // ex: "Mathématiques", "Français", "Sciences"
  coefficient: number               // Poids dans le calcul de la moyenne
  classeId: string                  // FK → Classe.id
  enseignantIds?: string[]          // FK → User.id (role='enseignant') - Peut avoir plusieurs enseignants
}

export type NoteType = 'devoir' | 'composition' | 'oral'

export type Note = {
  id: string
  eleveId: string                   // FK → Eleve.id
  matiereId: string                 // FK → Matiere.id
  valeur: number                    // 0 à 20
  type: NoteType
  numero?: number                   // ex: 1 pour "Devoir 1", 2 pour "Devoir 2"
  trimestre: 1 | 2 | 3
  date: string                      // ISO 8601
  commentaire?: string
  anneeScolaire?: string            // ex: "2024-2025"
}

// -------------------------------------------------------------
// PAIEMENTS
// ✅ MODIFIÉ : ajout de inscriptionId pour lier les paiements d'inscription
// -------------------------------------------------------------

export type PaiementType =
  | 'inscription'    // Frais d'inscription → lié à Inscription.id
  | 'scolarite'      // Scolarité globale annuelle
  | 'cantine'
  | 'transport'

export type PaiementStatut = 'paye' | 'en_attente' | 'retard'

export type ModePaiement = 'especes' | 'wave' | 'orange_money' | 'mtn_momo'

export type Paiement = {
  id: string
  eleveId: string                   // FK → Eleve.id
  inscriptionId?: string            // FK → Inscription.id
  // ✅ AJOUTÉ : obligatoire si type='inscription'
  // optionnel pour les autres types
  montant: number                   // En FCFA (Montant total dû)
  montantPaye: number               // ✅ AJOUTÉ : montant déjà réglé en FCFA
  type: PaiementType
  statut: PaiementStatut
  datePaiement?: string             // ISO 8601 — défini si statut='paye'
  dateLimite: string                // ISO 8601 — date d'échéance
  modePaiement?: ModePaiement       // Défini si statut='paye' ou dernier mode utilisé
  reference?: string                // Référence de transaction Wave/OM/MTN
  historiquePaiements?: {           // ✅ AJOUTÉ : historique des paiements en plusieurs fois
    date: string
    montant: number
    mode: ModePaiement
    reference?: string
  }[]
  anneeScolaire?: string            // ex: "2024-2025"
}

// -------------------------------------------------------------
// ABSENCES
// -------------------------------------------------------------

export type Absence = {
  id: string
  eleveId: string                   // FK → Eleve.id
  date: string                      // ISO 8601
  seance: 'matin' | 'apres-midi'
  justifiee: boolean
  motif?: string                    // Obligatoire si justifiee=true
  anneeScolaire?: string            // ex: "2024-2025"
}

// -------------------------------------------------------------
// BULLETINS
// ✅ MODIFIÉ : ajout de classeId, effectifClasse, id
// Le tableau notes[] est un snapshot au moment de la génération
// (ne pas confondre avec les Note[] du store — ici c'est une copie figée pour le PDF)
// -------------------------------------------------------------

export type Bulletin = {
  id: string                        // ✅ AJOUTÉ : nécessaire pour référencer les bulletins générés
  eleveId: string                   // FK → Eleve.id
  classeId: string                  // FK → Classe.id ✅ AJOUTÉ : contexte du rang
  trimestre: 1 | 2 | 3
  anneeScolaire: string
  notes: Note[]                     // Snapshot des notes à la date de génération
  moyenneGenerale: number           // Calculée avec coefficients
  moyenneClasse: number             // ✅ AJOUTÉ : pour affichage comparatif sur le bulletin
  rangClasse: number                // Rang parmi les élèves de la même classe
  effectifClasse: number            // ✅ AJOUTÉ : nb d'élèves classés (ex: rang 3/28)
  appreciation: string              // "Excellent", "Bien", "Assez Bien"…
  appreciationDirecteur?: string    // Observation libre du directeur
  dateGeneration: string            // ISO 8601
  estValide?: boolean               // Indique si le bulletin a été validé par le Directeur et est visible par les parents
}

// =============================================================
// RÉCAPITULATIF DES RELATIONS (toutes vérifiées ✅)
// =============================================================
//
//  Ecole      1 ──< Classe          via Classe.ecoleId
//  Ecole      1 ──< User            via User.ecoleId
//  Classe     1 ──< Eleve           via Eleve.classeId
//  Classe     1 ──< Matiere         via Matiere.classeId
//  Classe     >──1 User             via Classe.enseignantPrincipalId
//  Eleve      1 ──< Inscription     via Inscription.eleveId   ✅ NOUVEAU
//  Eleve      1 ──< Note            via Note.eleveId
//  Eleve      1 ──< Paiement        via Paiement.eleveId
//  Eleve      1 ──< Absence         via Absence.eleveId
//  Eleve      1 ──< Bulletin        via Bulletin.eleveId
//  Eleve      >──1 User (parent)    via Eleve.parentUserId    ✅ AJOUTÉ
//  Matiere    1 ──< Note            via Note.matiereId
//  Matiere    >──1 User (ens.)      via Matiere.enseignantId
//  Inscription 1 ──< Paiement       via Paiement.inscriptionId ✅ AJOUTÉ
//
// =============================================================

export type UserCompteSimule = {
  id: string
  nom: string
  prenom: string
  email?: string
  telephone?: string
  role: 'enseignant' | 'parent'
  elevesAssocies?: string[]
  dateCreation: string
  identifiant?: string
  mdpTemporaire?: string
  enseignantId?: string
}

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------

export type NotificationType = 'paiement' | 'absence' | 'bulletin' | 'inscription' | 'systeme' | 'communique'

export type NotificationItem = {
  id: string
  ecoleId: string
  titre: string
  description: string
  type: NotificationType
  destinataireRole?: 'parent' | 'enseignant' | 'directeur' | 'all'
  classeId?: string
  eleveId?: string
  creePar?: string
  createdAt: string
  lu: boolean
}

// ── Gestion multi-école ──────────────────────────────────────────

export type EcoleAvecRole = {
  id: string
  nom: string
  ville: string
  adresse: string
  telephone: string
  logo?: string              // Base64
  anneeScolaire: string
  niveaux: ('prescolaire' | 'primaire' | 'secondaire')[]
  directeurId: string        // FK → utilisateurs.id
  // Champs calculés pour la page /ecoles
  nbEleves?: number          // count des élèves actifs
  nbClasses?: number         // count des classes
  tauxRecouvrement?: number  // % paiements à jour
  prenomsEnfants?: string[]  // prénoms des enfants du parent pour cette école
}


export type EnseignantEcole = {
  id: string
  enseignantId: string       // FK → utilisateurs.id
  ecoleId: string            // FK → ecoles.id
  dateAssignation: string    // ISO 8601
  actif: boolean
}

// ── Création de compte ───────────────────────────────────────────

export type RoleInscription = 'directeur' | 'enseignant' | 'parent'

export type DonneesInscriptionDirecteur = {
  civilite: Civilite
  nom: string
  prenom: string
  email: string
  telephone: string
  motDePasse: string
  confirmationMotDePasse: string
  nomEcole?: string
  villeEcole?: string
  adresseEcole?: string
  telephoneEcole?: string
  niveauxEcole?: ('prescolaire' | 'primaire' | 'secondaire')[]
}

export type DonneesInscriptionEnseignant = {
  civilite: Civilite
  nom: string
  prenom: string
  email: string
  telephone: string
  motDePasse: string
  confirmationMotDePasse: string
  emailDirecteur: string
}

export type DonneesInscriptionParent = {
  civilite: Civilite
  nom: string
  prenom: string
  email: string
  telephone: string
  motDePasse: string
  confirmationMotDePasse: string
}