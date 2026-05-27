import {
  Absence, Bulletin, Classe, Ecole,
  Eleve, Inscription, Matiere, Note,
  Paiement, User,
} from '../types'

// ================================================================
// GestScol — data/mockData.ts
// Données de démonstration réalistes — Groupe Scolaire Les Flamboyants
// Abidjan Cocody — Année scolaire 2024-2025
// ================================================================

// ----------------------------------------------------------------
// ÉCOLE
// ----------------------------------------------------------------

export const ecoleMock: Ecole = {
  id: 'ecole-1',
  identifiant: 'FLAMB',
  nom: 'Groupe Scolaire Les Flamboyants',
  ville: 'Abidjan',
  adresse: 'Cocody, Riviera 2, Rue des Jardins',
  telephone: '+225 27 22 43 11 00',
  niveaux: ['primaire', 'secondaire'],
  anneeScolaire: 'as-2024-2025',
}

// ----------------------------------------------------------------
// UTILISATEURS
// Remplace l'ancien `enseignantsMock` (qui n'était pas typé User)
// Comptes de démo : directeur@flamboyants.ci | enseignant@flamboyants.ci | parent@gmail.com
// ----------------------------------------------------------------

export const usersMock: User[] = [
  // Directeur
  { id: 'user-1', nom: 'Konan', prenom: 'Kouakou Bernard', email: 'directeur@flamboyants.ci', role: 'directeur', ecoleId: 'ecole-1' },

  // Enseignants
  { id: 'user-2', nom: 'Koné', prenom: 'Mariam', email: 'enseignant@flamboyants.ci', role: 'enseignant', ecoleId: 'ecole-1' },
  { id: 'ens-2', nom: 'Diarrassouba', prenom: 'Amadou', email: 'a.diarrassouba@flamboyants.ci', role: 'enseignant', ecoleId: 'ecole-1' },
  { id: 'ens-3', nom: 'Yapi', prenom: 'Théodore', email: 't.yapi@flamboyants.ci', role: 'enseignant', ecoleId: 'ecole-1' },
  { id: 'ens-4', nom: 'Kouamé', prenom: 'Aya', email: 'a.kouame@flamboyants.ci', role: 'enseignant', ecoleId: 'ecole-1' },

  // Parents — chacun lié à ses enfants via Eleve.parentUserId
  { id: 'parent-1', nom: 'Kouassi', prenom: 'Yao', email: 'parent@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-2', nom: 'Traoré', prenom: 'Seydou', email: 's.traore@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-3', nom: 'Bamba', prenom: 'Ali', email: 'bamba.ali@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-4', nom: "N'Guessan", prenom: 'Amoin', email: 'nguessan.amoin@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-5', nom: 'Ouattara', prenom: 'Drissa', email: 'd.ouattara@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-6', nom: 'Konan', prenom: 'Koffi', email: 'konan.koffi@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-11', nom: 'Aka', prenom: 'Jean-Pierre', email: 'aka.jp@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-12', nom: 'Diallo', prenom: 'Fatoumata', email: 'diallo.fat@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-13', nom: 'Yao', prenom: 'Marie Ange', email: 'yao.marie@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-14', nom: 'Coulibaly', prenom: 'Lamine', email: 'coulibaly.l@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-15', nom: 'Koffi', prenom: 'Edmond', email: 'koffi.edm@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-41', nom: 'Gogbé', prenom: 'Patrice', email: 'gogbe.p@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-42', nom: 'Sanogo', prenom: 'Ibrahima', email: 'sanogo.ib@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-43', nom: 'Zrobo', prenom: 'Désiré', email: 'zrobo.d@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
  { id: 'parent-44', nom: 'Séka', prenom: 'Adjoua', email: 'seka.adj@gmail.com', role: 'parent', ecoleId: 'ecole-1' },
]

// ----------------------------------------------------------------
// CLASSES — sans effectif (champ supprimé, calculé via store)
// ----------------------------------------------------------------

export const classesMock: Classe[] = [
  { id: 'c1', nom: 'CP1 A', niveau: 'Primaire', enseignantPrincipalId: 'ens-3', ecoleId: 'ecole-1', montantScolarite: 60000, montantInscription: 20000 },
  { id: 'c2', nom: 'CE2 B', niveau: 'Primaire', enseignantPrincipalId: 'ens-2', ecoleId: 'ecole-1', montantScolarite: 75000, montantInscription: 22000 },
  { id: 'c3', nom: 'CM2 A', niveau: 'Primaire', enseignantPrincipalId: 'user-2', ecoleId: 'ecole-1', montantScolarite: 80000, montantInscription: 25000 },
  { id: 'c4', nom: '6ème A', niveau: 'Secondaire', enseignantPrincipalId: 'ens-4', ecoleId: 'ecole-1', montantScolarite: 120000, montantInscription: 35000 },
]

// ----------------------------------------------------------------
// ÉLÈVES — 6 par classe, noms ivoiriens réalistes
// Tous les élèves ayant un compte parent ont parentUserId renseigné
// ----------------------------------------------------------------

export const elevesMock: Eleve[] = [

  // ── CP1 A (c1) ── nés 2018-2019 ──────────────────────────────
  { id: 'el-11', matricule: 'SCH-2024-0011', nom: 'Aka', prenom: 'Mireille Essi', dateNaissance: '2018-03-22', sexe: 'F', classeId: 'c1', ecoleId: 'ecole-1', parentNom: 'Aka Jean-Pierre', parentTelephone: '+225 07 11 22 33 44', parentUserId: 'parent-11', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-12', matricule: 'SCH-2024-0012', nom: 'Diallo', prenom: 'Ibrahim Cheick', dateNaissance: '2018-07-14', sexe: 'M', classeId: 'c1', ecoleId: 'ecole-1', parentNom: 'Diallo Fatoumata', parentTelephone: '+225 05 22 33 44 55', parentUserId: 'parent-12', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-13', matricule: 'SCH-2024-0013', nom: 'Yao', prenom: 'Akissi Sandra', dateNaissance: '2018-11-05', sexe: 'F', classeId: 'c1', ecoleId: 'ecole-1', parentNom: 'Yao Marie Ange', parentTelephone: '+225 01 33 44 55 66', parentUserId: 'parent-13', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-14', matricule: 'SCH-2024-0014', nom: 'Coulibaly', prenom: 'Moussa Abou', dateNaissance: '2019-01-18', sexe: 'M', classeId: 'c1', ecoleId: 'ecole-1', parentNom: 'Coulibaly Lamine', parentTelephone: '+225 07 44 55 66 77', parentUserId: 'parent-14', statut: 'actif', dateInscription: '2024-09-03' },
  { id: 'el-15', matricule: 'SCH-2024-0015', nom: 'Koffi', prenom: 'Adjoua Bénédicte', dateNaissance: '2018-09-30', sexe: 'F', classeId: 'c1', ecoleId: 'ecole-1', parentNom: 'Koffi Edmond', parentTelephone: '+225 05 55 66 77 88', parentUserId: 'parent-15', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-16', matricule: 'SCH-2024-0016', nom: 'Touré', prenom: 'Sekou Lamine', dateNaissance: '2018-05-07', sexe: 'M', classeId: 'c1', ecoleId: 'ecole-1', parentNom: 'Touré Aminata', parentTelephone: '+225 01 66 77 88 99', statut: 'actif', dateInscription: '2024-09-03' },

  // ── CE2 B (c2) ── nés 2016-2017 ──────────────────────────────
  { id: 'el-21', matricule: 'SCH-2024-0021', nom: 'Gnonsoa', prenom: 'Amenan Sylvie', dateNaissance: '2016-04-11', sexe: 'F', classeId: 'c2', ecoleId: 'ecole-1', parentNom: 'Gnonsoa Koffi', parentTelephone: '+225 07 22 11 33 55', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-22', matricule: 'SCH-2024-0022', nom: 'Konaté', prenom: 'Abdoulaye', dateNaissance: '2016-08-23', sexe: 'M', classeId: 'c2', ecoleId: 'ecole-1', parentNom: 'Konaté Salimata', parentTelephone: '+225 05 33 44 11 22', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-23', matricule: 'SCH-2024-0023', nom: 'Assohou', prenom: "N'Da Stéphanie", dateNaissance: '2016-12-01', sexe: 'F', classeId: 'c2', ecoleId: 'ecole-1', parentNom: 'Assohou René', parentTelephone: '+225 01 44 55 22 33', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-24', matricule: 'SCH-2024-0024', nom: 'Camara', prenom: 'Boubacar Tidiane', dateNaissance: '2017-02-15', sexe: 'M', classeId: 'c2', ecoleId: 'ecole-1', parentNom: 'Camara Aissétou', parentTelephone: '+225 07 55 66 33 44', statut: 'actif', dateInscription: '2024-09-03' },
  { id: 'el-25', matricule: 'SCH-2024-0025', nom: 'Soro', prenom: 'Mariam Founè', dateNaissance: '2016-06-28', sexe: 'F', classeId: 'c2', ecoleId: 'ecole-1', parentNom: 'Soro Daouda', parentTelephone: '+225 05 66 77 44 55', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-26', matricule: 'SCH-2024-0026', nom: 'Atta', prenom: 'Kouamé Désiré', dateNaissance: '2017-10-09', sexe: 'M', classeId: 'c2', ecoleId: 'ecole-1', parentNom: 'Atta Christiane', parentTelephone: '+225 01 77 88 55 66', statut: 'actif', dateInscription: '2024-09-03' },

  // ── CM2 A (c3) ── nés 2014-2015 (5 existants + 1 nouveau) ────
  { id: 'el-1', matricule: '22457442B', nom: 'Kouassi', prenom: 'Amenan Grace', dateNaissance: '2015-05-12', sexe: 'F', classeId: 'c3', ecoleId: 'ecole-1', parentNom: 'Kouassi Yao', parentTelephone: '+225 07 01 02 03 04', parentUserId: 'parent-1', statut: 'actif', dateInscription: '2024-09-01' },
  { id: 'el-2', matricule: '18563219C', nom: 'Traoré', prenom: 'Mamadou', dateNaissance: '2014-11-23', sexe: 'M', classeId: 'c3', ecoleId: 'ecole-1', parentNom: 'Traoré Seydou', parentTelephone: '+225 05 02 03 04 05', parentUserId: 'parent-2', statut: 'actif', dateInscription: '2024-09-01' },
  { id: 'el-3', matricule: '95123654D', nom: 'Bamba', prenom: 'Fatou', dateNaissance: '2015-02-14', sexe: 'F', classeId: 'c3', ecoleId: 'ecole-1', parentNom: 'Bamba Ali', parentTelephone: '+225 01 03 04 05 06', parentUserId: 'parent-3', statut: 'actif', dateInscription: '2024-09-01' },
  { id: 'el-4', matricule: '36589412E', nom: "N'Guessan", prenom: 'Koffi Eric', dateNaissance: '2015-08-30', sexe: 'M', classeId: 'c3', ecoleId: 'ecole-1', parentNom: "N'Guessan Amoin", parentTelephone: '+225 07 04 05 06 07', parentUserId: 'parent-4', statut: 'actif', dateInscription: '2024-09-01' },
  { id: 'el-5', matricule: '74125896F', nom: 'Ouattara', prenom: 'Aïssata', dateNaissance: '2014-12-05', sexe: 'F', classeId: 'c3', ecoleId: 'ecole-1', parentNom: 'Ouattara Drissa', parentTelephone: '+225 05 05 06 07 08', parentUserId: 'parent-5', statut: 'actif', dateInscription: '2024-09-01' },
  { id: 'el-36', matricule: 'SCH-2024-0036', nom: 'Konan', prenom: 'Adjoua Marie', dateNaissance: '2015-03-19', sexe: 'F', classeId: 'c3', ecoleId: 'ecole-1', parentNom: 'Konan Koffi', parentTelephone: '+225 01 06 07 08 09', parentUserId: 'parent-6', statut: 'actif', dateInscription: '2024-09-02' },

  // ── 6ème A (c4) ── nés 2012-2013 ─────────────────────────────
  { id: 'el-41', matricule: 'SCH-2024-0041', nom: 'Gogbé', prenom: 'Véronique Aimée', dateNaissance: '2012-09-17', sexe: 'F', classeId: 'c4', ecoleId: 'ecole-1', parentNom: 'Gogbé Patrice', parentTelephone: '+225 07 88 99 11 22', parentUserId: 'parent-41', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-42', matricule: 'SCH-2024-0042', nom: 'Sanogo', prenom: 'Moustapha', dateNaissance: '2012-04-03', sexe: 'M', classeId: 'c4', ecoleId: 'ecole-1', parentNom: 'Sanogo Ibrahima', parentTelephone: '+225 05 99 11 22 33', parentUserId: 'parent-42', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-43', matricule: 'SCH-2024-0043', nom: 'Zrobo', prenom: 'Irène Akouya', dateNaissance: '2013-01-25', sexe: 'F', classeId: 'c4', ecoleId: 'ecole-1', parentNom: 'Zrobo Désiré', parentTelephone: '+225 01 11 22 33 44', parentUserId: 'parent-43', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-44', matricule: 'SCH-2024-0044', nom: 'Séka', prenom: 'Konan Blaise', dateNaissance: '2012-11-12', sexe: 'M', classeId: 'c4', ecoleId: 'ecole-1', parentNom: 'Séka Adjoua', parentTelephone: '+225 07 22 33 44 55', parentUserId: 'parent-44', statut: 'actif', dateInscription: '2024-09-03' },
  { id: 'el-45', matricule: 'SCH-2024-0045', nom: 'Fofana', prenom: 'Kadiatou', dateNaissance: '2013-06-08', sexe: 'F', classeId: 'c4', ecoleId: 'ecole-1', parentNom: 'Fofana Lanciné', parentTelephone: '+225 05 33 44 55 66', statut: 'actif', dateInscription: '2024-09-02' },
  { id: 'el-46', matricule: 'SCH-2024-0046', nom: 'Brou', prenom: "Maxime N'Dri", dateNaissance: '2012-07-21', sexe: 'M', classeId: 'c4', ecoleId: 'ecole-1', parentNom: 'Brou Adjoua Cécile', parentTelephone: '+225 01 44 55 66 77', statut: 'actif', dateInscription: '2024-09-03' },
]

// ----------------------------------------------------------------
// INSCRIPTIONS — une par élève pour l'année 2024-2025
// documentsRecus reflète ce qui a été fourni à la rentrée
// ----------------------------------------------------------------

export const inscriptionsMock: Inscription[] = [

  // ── CP1 A ────────────────────────────────────────────────────
  { id: 'ins-11', eleveId: 'el-11', classeId: 'c1', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 20000, documentsRecus: ['extrait_naissance', 'photos_identite', 'carnet_sante', 'fiche_renseignements'] },
  { id: 'ins-12', eleveId: 'el-12', classeId: 'c1', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 20000, documentsRecus: ['extrait_naissance', 'photos_identite', 'fiche_renseignements'] },
  { id: 'ins-13', eleveId: 'el-13', classeId: 'c1', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 20000, documentsRecus: ['extrait_naissance', 'photos_identite', 'carnet_sante', 'fiche_renseignements'] },
  { id: 'ins-14', eleveId: 'el-14', classeId: 'c1', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-03', statut: 'en_attente', fraisInscription: 20000, documentsRecus: ['fiche_renseignements'], commentaire: 'Extrait de naissance à fournir avant le 30/09' },
  { id: 'ins-15', eleveId: 'el-15', classeId: 'c1', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 20000, documentsRecus: ['extrait_naissance', 'photos_identite', 'carnet_sante', 'fiche_renseignements'] },
  { id: 'ins-16', eleveId: 'el-16', classeId: 'c1', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-03', statut: 'validee', fraisInscription: 20000, documentsRecus: ['extrait_naissance', 'photos_identite', 'fiche_renseignements'] },

  // ── CE2 B ────────────────────────────────────────────────────
  { id: 'ins-21', eleveId: 'el-21', classeId: 'c2', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 22000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'fiche_renseignements'] },
  { id: 'ins-22', eleveId: 'el-22', classeId: 'c2', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 22000, documentsRecus: ['extrait_naissance', 'bulletin_precedent', 'fiche_renseignements'] },
  { id: 'ins-23', eleveId: 'el-23', classeId: 'c2', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 22000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'fiche_renseignements'] },
  { id: 'ins-24', eleveId: 'el-24', classeId: 'c2', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-03', statut: 'validee', fraisInscription: 22000, documentsRecus: ['extrait_naissance', 'photos_identite', 'fiche_renseignements'] },
  { id: 'ins-25', eleveId: 'el-25', classeId: 'c2', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 22000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'fiche_renseignements'] },
  { id: 'ins-26', eleveId: 'el-26', classeId: 'c2', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-03', statut: 'en_attente', fraisInscription: 22000, documentsRecus: ['fiche_renseignements'], commentaire: 'Bulletin précédent manquant' },

  // ── CM2 A ────────────────────────────────────────────────────
  { id: 'ins-1', eleveId: 'el-1', classeId: 'c3', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-01', statut: 'validee', fraisInscription: 25000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'fiche_renseignements'] },
  { id: 'ins-2', eleveId: 'el-2', classeId: 'c3', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-01', statut: 'validee', fraisInscription: 25000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'fiche_renseignements'] },
  { id: 'ins-3', eleveId: 'el-3', classeId: 'c3', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-01', statut: 'validee', fraisInscription: 25000, documentsRecus: ['extrait_naissance', 'bulletin_precedent', 'fiche_renseignements'] },
  { id: 'ins-4', eleveId: 'el-4', classeId: 'c3', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-01', statut: 'validee', fraisInscription: 25000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'carnet_sante', 'fiche_renseignements'] },
  { id: 'ins-5', eleveId: 'el-5', classeId: 'c3', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-01', statut: 'en_attente', fraisInscription: 25000, documentsRecus: ['fiche_renseignements'], commentaire: 'Documents en cours de régularisation' },
  { id: 'ins-36', eleveId: 'el-36', classeId: 'c3', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 25000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'fiche_renseignements'] },

  // ── 6ème A ───────────────────────────────────────────────────
  { id: 'ins-41', eleveId: 'el-41', classeId: 'c4', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 35000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'certificat_scolarite', 'fiche_renseignements'] },
  { id: 'ins-42', eleveId: 'el-42', classeId: 'c4', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 35000, documentsRecus: ['extrait_naissance', 'bulletin_precedent', 'certificat_scolarite', 'fiche_renseignements'] },
  { id: 'ins-43', eleveId: 'el-43', classeId: 'c4', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 35000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'certificat_scolarite', 'fiche_renseignements'] },
  { id: 'ins-44', eleveId: 'el-44', classeId: 'c4', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-03', statut: 'en_attente', fraisInscription: 35000, documentsRecus: ['fiche_renseignements'], commentaire: 'Certificat de scolarité manquant' },
  { id: 'ins-45', eleveId: 'el-45', classeId: 'c4', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-02', statut: 'validee', fraisInscription: 35000, documentsRecus: ['extrait_naissance', 'photos_identite', 'bulletin_precedent', 'fiche_renseignements'] },
  { id: 'ins-46', eleveId: 'el-46', classeId: 'c4', ecoleId: 'ecole-1', anneeScolaire: 'as-2024-2025', dateInscription: '2024-09-03', statut: 'validee', fraisInscription: 35000, documentsRecus: ['extrait_naissance', 'bulletin_precedent', 'certificat_scolarite', 'fiche_renseignements'] },
]

// ----------------------------------------------------------------
// MATIÈRES — par classe, tous les enseignantId → User existants
// ----------------------------------------------------------------

export const matieresMock: Matiere[] = [

  // CP1 A (c1) — enseignant: ens-3
  { id: 'mc1-1', nom: 'Lecture & Écriture', coefficient: 4, classeId: 'c1', enseignantIds: [''] },
  { id: 'mc1-2', nom: 'Calcul', coefficient: 4, classeId: 'c1', enseignantIds: [''] },
  { id: 'mc1-3', nom: 'Éveil', coefficient: 2, classeId: 'c1', enseignantIds: [''] },
  { id: 'mc1-4', nom: 'Dessin & Sport', coefficient: 1, classeId: 'c1', enseignantIds: [''] },

  // CE2 B (c2) — enseignant: ens-2
  { id: 'mc2-1', nom: 'Mathématiques', coefficient: 3, classeId: 'c2', enseignantIds: [''] },
  { id: 'mc2-2', nom: 'Français', coefficient: 3, classeId: 'c2', enseignantIds: [''] },
  { id: 'mc2-3', nom: 'Sciences', coefficient: 2, classeId: 'c2', enseignantIds: [''] },
  { id: 'mc2-4', nom: 'Histoire-Géo', coefficient: 2, classeId: 'c2', enseignantIds: [''] },
  { id: 'mc2-5', nom: 'EPS', coefficient: 1, classeId: 'c2', enseignantIds: [''] },

  // CM2 A (c3) — enseignant: user-2
  { id: 'm1', nom: 'Mathématiques', coefficient: 3, classeId: 'c3', enseignantIds: [''] },
  { id: 'm2', nom: 'Français', coefficient: 3, classeId: 'c3', enseignantIds: [''] },
  { id: 'm3', nom: 'Sciences', coefficient: 2, classeId: 'c3', enseignantIds: [''] },
  { id: 'm4', nom: 'Histoire-Géo', coefficient: 2, classeId: 'c3', enseignantIds: [''] },
  { id: 'm5', nom: 'EPS', coefficient: 1, classeId: 'c3', enseignantIds: [''] },

  // 6ème A (c4) — enseignant: ens-4
  { id: 'mc4-1', nom: 'Mathématiques', coefficient: 4, classeId: 'c4', enseignantIds: [''] },
  { id: 'mc4-2', nom: 'Français', coefficient: 4, classeId: 'c4', enseignantIds: [''] },
  { id: 'mc4-3', nom: 'Anglais', coefficient: 3, classeId: 'c4', enseignantIds: [''] },
  { id: 'mc4-4', nom: 'Physique-Chimie', coefficient: 3, classeId: 'c4', enseignantIds: [''] },
  { id: 'mc4-5', nom: 'SVT', coefficient: 2, classeId: 'c4', enseignantIds: [''] },
  { id: 'mc4-6', nom: 'Histoire-Géo', coefficient: 2, classeId: 'c4', enseignantIds: [''] },
  { id: 'mc4-7', nom: 'EPS', coefficient: 1, classeId: 'c4', enseignantIds: [''] },
]

// ----------------------------------------------------------------
// NOTES — Trimestre 1, CM2 A (c3) et 6ème A (c4)
// Toutes les matiereId référencent des Matiere existantes
// ----------------------------------------------------------------

export const notesMock: Note[] = [

  // ── CM2 A — el-1 Kouassi Amenan Grace ───────────────────────
  { id: 'n1', eleveId: 'el-1', matiereId: 'm1', valeur: 16, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-08' },
  { id: 'n2', eleveId: 'el-1', matiereId: 'm1', valeur: 14, type: 'devoir', numero: 2, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-05' },
  { id: 'n3', eleveId: 'el-1', matiereId: 'm1', valeur: 15, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-25' },
  { id: 'n4', eleveId: 'el-1', matiereId: 'm2', valeur: 13, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-10' },
  { id: 'n5', eleveId: 'el-1', matiereId: 'm2', valeur: 14.5, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
  { id: 'n6', eleveId: 'el-1', matiereId: 'm3', valeur: 13, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-18' },
  { id: 'n7', eleveId: 'el-1', matiereId: 'm4', valeur: 12, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
  { id: 'n8', eleveId: 'el-1', matiereId: 'm5', valeur: 17, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-30' },

  // ── CM2 A — el-2 Traoré Mamadou ─────────────────────────────
  { id: 'n9', eleveId: 'el-2', matiereId: 'm1', valeur: 11, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-08' },
  { id: 'n10', eleveId: 'el-2', matiereId: 'm1', valeur: 9, type: 'devoir', numero: 2, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-05' },
  { id: 'n11', eleveId: 'el-2', matiereId: 'm2', valeur: 12, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
  { id: 'n12', eleveId: 'el-2', matiereId: 'm3', valeur: 10, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-18' },
  { id: 'n13', eleveId: 'el-2', matiereId: 'm4', valeur: 11, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
  { id: 'n14', eleveId: 'el-2', matiereId: 'm5', valeur: 14, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-30' },

  // ── CM2 A — el-3 Bamba Fatou ─────────────────────────────────
  { id: 'n15', eleveId: 'el-3', matiereId: 'm1', valeur: 8, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-08' },
  { id: 'n16', eleveId: 'el-3', matiereId: 'm1', valeur: 9.5, type: 'devoir', numero: 2, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-05' },
  { id: 'n17', eleveId: 'el-3', matiereId: 'm2', valeur: 13, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
  { id: 'n18', eleveId: 'el-3', matiereId: 'm3', valeur: 11, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-18' },
  { id: 'n19', eleveId: 'el-3', matiereId: 'm4', valeur: 10, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
  { id: 'n20', eleveId: 'el-3', matiereId: 'm5', valeur: 16, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-30' },

  // ── CM2 A — el-4 N'Guessan Koffi Eric ────────────────────────
  { id: 'n21', eleveId: 'el-4', matiereId: 'm1', valeur: 13, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-08' },
  { id: 'n22', eleveId: 'el-4', matiereId: 'm2', valeur: 15, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
  { id: 'n23', eleveId: 'el-4', matiereId: 'm3', valeur: 14, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-18' },
  { id: 'n24', eleveId: 'el-4', matiereId: 'm4', valeur: 13, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
  { id: 'n25', eleveId: 'el-4', matiereId: 'm5', valeur: 18, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-30' },

  // ── CM2 A — el-5 Ouattara Aïssata ────────────────────────────
  { id: 'n26', eleveId: 'el-5', matiereId: 'm1', valeur: 9, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-08' },
  { id: 'n27', eleveId: 'el-5', matiereId: 'm1', valeur: 10, type: 'devoir', numero: 2, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-05' },
  { id: 'n28', eleveId: 'el-5', matiereId: 'm2', valeur: 11, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
  { id: 'n29', eleveId: 'el-5', matiereId: 'm3', valeur: 12, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-18' },
  { id: 'n30', eleveId: 'el-5', matiereId: 'm4', valeur: 10, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
  { id: 'n31', eleveId: 'el-5', matiereId: 'm5', valeur: 15, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-30' },

  // ── CM2 A — el-36 Konan Adjoua Marie (1ère de classe) ────────
  { id: 'n32', eleveId: 'el-36', matiereId: 'm1', valeur: 17, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-08' },
  { id: 'n33', eleveId: 'el-36', matiereId: 'm1', valeur: 16, type: 'devoir', numero: 2, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-05' },
  { id: 'n34', eleveId: 'el-36', matiereId: 'm2', valeur: 16, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
  { id: 'n35', eleveId: 'el-36', matiereId: 'm3', valeur: 15, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-18' },
  { id: 'n36', eleveId: 'el-36', matiereId: 'm4', valeur: 14, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
  { id: 'n37', eleveId: 'el-36', matiereId: 'm5', valeur: 19, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-30' },

  // ── 6ème A — el-41 Gogbé Véronique ───────────────────────────
  { id: 'n41', eleveId: 'el-41', matiereId: 'mc4-1', valeur: 15, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-10' },
  { id: 'n42', eleveId: 'el-41', matiereId: 'mc4-2', valeur: 16, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-18' },
  { id: 'n43', eleveId: 'el-41', matiereId: 'mc4-3', valeur: 14, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-22' },
  { id: 'n44', eleveId: 'el-41', matiereId: 'mc4-4', valeur: 12, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
  { id: 'n45', eleveId: 'el-41', matiereId: 'mc4-5', valeur: 13, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-15' },
  { id: 'n46', eleveId: 'el-41', matiereId: 'mc4-6', valeur: 14, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
  { id: 'n47', eleveId: 'el-41', matiereId: 'mc4-7', valeur: 17, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-08' },

  // ── 6ème A — el-42 Sanogo Moustapha ──────────────────────────
  { id: 'n48', eleveId: 'el-42', matiereId: 'mc4-1', valeur: 9, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-10' },
  { id: 'n49', eleveId: 'el-42', matiereId: 'mc4-2', valeur: 11, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-18' },
  { id: 'n50', eleveId: 'el-42', matiereId: 'mc4-3', valeur: 13, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-22' },
  { id: 'n51', eleveId: 'el-42', matiereId: 'mc4-4', valeur: 8, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
  { id: 'n52', eleveId: 'el-42', matiereId: 'mc4-5', valeur: 10, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-15' },
  { id: 'n53', eleveId: 'el-42', matiereId: 'mc4-6', valeur: 9, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
  { id: 'n54', eleveId: 'el-42', matiereId: 'mc4-7', valeur: 15, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-08' },
]

// ----------------------------------------------------------------
// PAIEMENTS
// Règle : inscriptionId OBLIGATOIRE si type === 'inscription'
// ----------------------------------------------------------------

export const paiementsMock: Paiement[] = [

  // ── CP1 A ────────────────────────────────────────────────────
  { id: 'p-i11', eleveId: 'el-11', inscriptionId: 'ins-11', montant: 20000, montantPaye: 20000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-02', dateLimite: '2024-09-10', modePaiement: 'wave', reference: 'WV-240902-11' },
  { id: 'p-t11', eleveId: 'el-11', montant: 60000, montantPaye: 60000, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-10-03', dateLimite: '2024-10-15', modePaiement: 'orange_money' },
  { id: 'p-i12', eleveId: 'el-12', inscriptionId: 'ins-12', montant: 20000, montantPaye: 20000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-03', dateLimite: '2024-09-10', modePaiement: 'especes' },
  { id: 'p-t12', eleveId: 'el-12', montant: 60000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'retard', dateLimite: '2024-10-15' },
  { id: 'p-i14', eleveId: 'el-14', inscriptionId: 'ins-14', montant: 20000, montantPaye: 0, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'en_attente', dateLimite: '2024-09-20' },
  { id: 'p-t14', eleveId: 'el-14', montant: 60000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'en_attente', dateLimite: '2024-10-15' },
  { id: 'p-i15', eleveId: 'el-15', inscriptionId: 'ins-15', montant: 20000, montantPaye: 20000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-02', dateLimite: '2024-09-10', modePaiement: 'mtn_momo' },
  { id: 'p-t15', eleveId: 'el-15', montant: 60000, montantPaye: 60000, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-10-10', dateLimite: '2024-10-15', modePaiement: 'wave', reference: 'WV-241010-15' },

  // ── CE2 B ────────────────────────────────────────────────────
  { id: 'p-i21', eleveId: 'el-21', inscriptionId: 'ins-21', montant: 22000, montantPaye: 22000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-02', dateLimite: '2024-09-10', modePaiement: 'wave' },
  { id: 'p-t21', eleveId: 'el-21', montant: 75000, montantPaye: 75000, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-10-05', dateLimite: '2024-10-15', modePaiement: 'orange_money' },
  { id: 'p-i22', eleveId: 'el-22', inscriptionId: 'ins-22', montant: 22000, montantPaye: 22000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-02', dateLimite: '2024-09-10', modePaiement: 'especes' },
  { id: 'p-t22', eleveId: 'el-22', montant: 75000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'en_attente', dateLimite: '2024-10-15' },
  { id: 'p-i26', eleveId: 'el-26', inscriptionId: 'ins-26', montant: 22000, montantPaye: 0, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'en_attente', dateLimite: '2024-09-20' },
  { id: 'p-t26', eleveId: 'el-26', montant: 75000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'retard', dateLimite: '2024-10-15' },

  // ── CM2 A ────────────────────────────────────────────────────
  { id: 'p1', eleveId: 'el-1', inscriptionId: 'ins-1', montant: 25000, montantPaye: 25000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-02', dateLimite: '2024-09-15', modePaiement: 'wave', reference: 'WV-240902-01' },
  { id: 'p2', eleveId: 'el-1', montant: 80000, montantPaye: 80000, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-10-05', dateLimite: '2024-10-10', modePaiement: 'orange_money' },
  { id: 'p3', eleveId: 'el-2', inscriptionId: 'ins-2', montant: 25000, montantPaye: 25000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-10', dateLimite: '2024-09-15', modePaiement: 'especes' },
  { id: 'p4', eleveId: 'el-2', montant: 80000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'retard', dateLimite: '2024-10-10' },
  { id: 'p5', eleveId: 'el-3', inscriptionId: 'ins-3', montant: 25000, montantPaye: 25000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-05', dateLimite: '2024-09-15', modePaiement: 'mtn_momo' },
  { id: 'p6', eleveId: 'el-3', montant: 80000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'en_attente', dateLimite: '2024-12-10' },
  { id: 'p7', eleveId: 'el-4', inscriptionId: 'ins-4', montant: 25000, montantPaye: 25000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-01', dateLimite: '2024-09-15', modePaiement: 'wave', reference: 'WV-240901-04' },
  { id: 'p8', eleveId: 'el-4', montant: 80000, montantPaye: 80000, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-10-08', dateLimite: '2024-10-10', modePaiement: 'wave', reference: 'WV-241008-04' },
  { id: 'p9', eleveId: 'el-5', inscriptionId: 'ins-5', montant: 25000, montantPaye: 0, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'en_attente', dateLimite: '2024-09-20' },
  { id: 'p10', eleveId: 'el-5', montant: 80000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'retard', dateLimite: '2024-10-10' },
  { id: 'p-i36', eleveId: 'el-36', inscriptionId: 'ins-36', montant: 25000, montantPaye: 25000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-02', dateLimite: '2024-09-15', modePaiement: 'orange_money' },
  { id: 'p-t36', eleveId: 'el-36', montant: 80000, montantPaye: 80000, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-10-04', dateLimite: '2024-10-10', modePaiement: 'wave', reference: 'WV-241004-36' },

  // ── 6ème A ───────────────────────────────────────────────────
  { id: 'p-i41', eleveId: 'el-41', inscriptionId: 'ins-41', montant: 35000, montantPaye: 35000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-02', dateLimite: '2024-09-15', modePaiement: 'wave' },
  { id: 'p-t41', eleveId: 'el-41', montant: 120000, montantPaye: 120000, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-10-06', dateLimite: '2024-10-15', modePaiement: 'orange_money' },
  { id: 'p-i42', eleveId: 'el-42', inscriptionId: 'ins-42', montant: 35000, montantPaye: 35000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-03', dateLimite: '2024-09-15', modePaiement: 'especes' },
  { id: 'p-t42', eleveId: 'el-42', montant: 120000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'retard', dateLimite: '2024-10-15' },
  { id: 'p-i43', eleveId: 'el-43', inscriptionId: 'ins-43', montant: 35000, montantPaye: 35000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-02', dateLimite: '2024-09-15', modePaiement: 'mtn_momo' },
  { id: 'p-t43', eleveId: 'el-43', montant: 120000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'en_attente', dateLimite: '2024-10-15' },
  { id: 'p-i44', eleveId: 'el-44', inscriptionId: 'ins-44', montant: 35000, montantPaye: 0, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'en_attente', dateLimite: '2024-09-20' },
  { id: 'p-t44', eleveId: 'el-44', montant: 120000, montantPaye: 0, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'retard', dateLimite: '2024-10-15' },
  { id: 'p-i45', eleveId: 'el-45', inscriptionId: 'ins-45', montant: 35000, montantPaye: 35000, type: 'inscription', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-09-02', dateLimite: '2024-09-15', modePaiement: 'wave' },
  { id: 'p-t45', eleveId: 'el-45', montant: 120000, montantPaye: 120000, type: 'scolarite', anneeScolaire: 'as-2024-2025', statut: 'paye', datePaiement: '2024-10-12', dateLimite: '2024-10-15', modePaiement: 'wave' },
]

// ----------------------------------------------------------------
// ABSENCES
// ----------------------------------------------------------------

export const absencesMock: Absence[] = [
  // CM2 A
  { id: 'a1', eleveId: 'el-2', date: '2024-10-05', seance: 'matin', justifiee: false, anneeScolaire: 'as-2024-2025' },
  { id: 'a2', eleveId: 'el-2', date: '2024-10-07', seance: 'apres-midi', justifiee: false, anneeScolaire: 'as-2024-2025' },
  { id: 'a3', eleveId: 'el-4', date: '2024-11-12', seance: 'apres-midi', justifiee: true, anneeScolaire: 'as-2024-2025', motif: 'Maladie' },
  { id: 'a4', eleveId: 'el-3', date: '2024-10-22', seance: 'matin', justifiee: false, anneeScolaire: 'as-2024-2025' },
  { id: 'a5', eleveId: 'el-5', date: '2024-11-04', seance: 'matin', justifiee: true, anneeScolaire: 'as-2024-2025', motif: 'Consultation médicale' },
  { id: 'a6', eleveId: 'el-5', date: '2024-11-05', seance: 'matin', justifiee: true, anneeScolaire: 'as-2024-2025', motif: 'Consultation médicale' },
  { id: 'a7', eleveId: 'el-5', date: '2024-11-05', seance: 'apres-midi', justifiee: true, anneeScolaire: 'as-2024-2025', motif: 'Consultation médicale' },
  // 6ème A
  { id: 'a8', eleveId: 'el-42', date: '2024-10-09', seance: 'matin', justifiee: false, anneeScolaire: 'as-2024-2025' },
  { id: 'a9', eleveId: 'el-42', date: '2024-10-10', seance: 'matin', justifiee: false, anneeScolaire: 'as-2024-2025' },
  { id: 'a10', eleveId: 'el-43', date: '2024-11-06', seance: 'apres-midi', justifiee: true, anneeScolaire: 'as-2024-2025', motif: 'Cérémonie familiale' },
  { id: 'a11', eleveId: 'el-44', date: '2024-10-28', seance: 'matin', justifiee: false, anneeScolaire: 'as-2024-2025' },
  // CP1 A
  { id: 'a12', eleveId: 'el-12', date: '2024-10-15', seance: 'matin', justifiee: true, anneeScolaire: 'as-2024-2025', motif: 'Maladie' },
  { id: 'a13', eleveId: 'el-14', date: '2024-11-08', seance: 'apres-midi', justifiee: false, anneeScolaire: 'as-2024-2025' },
]

// ----------------------------------------------------------------
// BULLETINS GÉNÉRÉS — CM2 A, Trimestre 1
//
// Classement T1 CM2 A (moyenne pondérée par coefficients) :
//   1er  el-36  Konan Adjoua Marie   → 15.86
//   2ème el-4   N'Guessan Koffi Eric → 14.18
//   3ème el-1   Kouassi Amenan Grace → 13.93
//   4ème el-3   Bamba Fatou          → 11.20
//   5ème el-2   Traoré Mamadou       → 11.09
//   6ème el-5   Ouattara Aïssata     → 10.95
//   Moyenne classe : 12.87
// ----------------------------------------------------------------

export const bulletinsMock: Bulletin[] = [
  {
    id: 'bul-1',
    eleveId: 'el-1',
    classeId: 'c3',
    trimestre: 1, anneeScolaire: 'as-2024-2025',
    // Snapshot des notes au moment de la génération
    notes: [
      { id: 'n1', eleveId: 'el-1', matiereId: 'm1', valeur: 16, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-08' },
      { id: 'n2', eleveId: 'el-1', matiereId: 'm1', valeur: 14, type: 'devoir', numero: 2, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-05' },
      { id: 'n3', eleveId: 'el-1', matiereId: 'm1', valeur: 15, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-25' },
      { id: 'n4', eleveId: 'el-1', matiereId: 'm2', valeur: 13, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-10' },
      { id: 'n5', eleveId: 'el-1', matiereId: 'm2', valeur: 14.5, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
      { id: 'n6', eleveId: 'el-1', matiereId: 'm3', valeur: 13, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-18' },
      { id: 'n7', eleveId: 'el-1', matiereId: 'm4', valeur: 12, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
      { id: 'n8', eleveId: 'el-1', matiereId: 'm5', valeur: 17, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-30' },
    ],
    // Maths(3)=(16+14+15)/3=15 | Français(3)=(13+14.5)/2=13.75 | Sc(2)=13 | HG(2)=12 | EPS(1)=17
    // (15×3 + 13.75×3 + 13×2 + 12×2 + 17×1) / 11 = 153.25/11 = 13.93
    moyenneGenerale: 13.93,
    moyenneClasse: 12.87,
    rangClasse: 3,
    effectifClasse: 6,
    appreciation: 'Bien',
    appreciationDirecteur: 'Élève sérieuse et appliquée. Des efforts constants. Continue ainsi !',
    dateGeneration: '2024-12-10',
  },
  {
    id: 'bul-36',
    eleveId: 'el-36',
    classeId: 'c3',
    trimestre: 1, anneeScolaire: 'as-2024-2025',
    notes: [
      { id: 'n32', eleveId: 'el-36', matiereId: 'm1', valeur: 17, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-08' },
      { id: 'n33', eleveId: 'el-36', matiereId: 'm1', valeur: 16, type: 'devoir', numero: 2, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-05' },
      { id: 'n34', eleveId: 'el-36', matiereId: 'm2', valeur: 16, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-20' },
      { id: 'n35', eleveId: 'el-36', matiereId: 'm3', valeur: 15, type: 'devoir', numero: 1, trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-18' },
      { id: 'n36', eleveId: 'el-36', matiereId: 'm4', valeur: 14, type: 'composition', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-11-22' },
      { id: 'n37', eleveId: 'el-36', matiereId: 'm5', valeur: 19, type: 'oral', trimestre: 1, anneeScolaire: 'as-2024-2025', date: '2024-10-30' },
    ],
    // Maths(3)=(17+16)/2=16.5 | Français(3)=16 | Sc(2)=15 | HG(2)=14 | EPS(1)=19
    // (16.5×3 + 16×3 + 15×2 + 14×2 + 19×1) / 11 = 174.5/11 = 15.86
    moyenneGenerale: 15.86,
    moyenneClasse: 12.87,
    rangClasse: 1,
    effectifClasse: 6,
    appreciation: 'Très Bien',
    appreciationDirecteur: 'Première de sa classe. Excellente élève, brillante et rigoureuse. Félicitations !',
    dateGeneration: '2024-12-10',
  },
]

const existingPaiementEleveIds = new Set(paiementsMock.map(p => p.eleveId));
inscriptionsMock.forEach(ins => {
  if (!existingPaiementEleveIds.has(ins.eleveId)) {
    const classe = classesMock.find(c => c.id === ins.classeId);
    if (classe) {
      paiementsMock.push({
        id: 'p-i-' + ins.id,
        eleveId: ins.eleveId,
        inscriptionId: ins.id,
        montant: classe.montantInscription,
        montantPaye: 0,
        type: 'inscription',
        anneeScolaire: ins.anneeScolaire,
        statut: 'en_attente',
        dateLimite: '2024-09-30'
      });
      paiementsMock.push({
        id: 'p-t-' + ins.id,
        eleveId: ins.eleveId,
        montant: classe.montantScolarite,
        montantPaye: 0,
        type: 'scolarite',
        anneeScolaire: ins.anneeScolaire,
        statut: 'en_attente',
        dateLimite: '2024-10-15'
      });
    }
  }
});

