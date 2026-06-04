# 🛡️ GestScol — Guide de Référence de l'Agent & Fiche Technique

Bienvenue sur le référentiel d'ingénierie de **GestScol**, le SaaS de gestion scolaire de pointe conçu pour les établissements d'enseignement primaire et secondaire en Afrique de l'Ouest (particulièrement en Côte d'Ivoire).

Ce document fait office de **mémoire technique permanente** pour tout modèle d'IA intervenant sur ce projet. Il décrit avec précision le périmètre fonctionnel, l'architecture logicielle, les règles métier critiques, les garde-fous de sécurité en place et les décisions d'implémentation récentes.

---

## 📖 1. Présentation Générale & Vision
**GestScol** résout les défis administratifs et de trésorerie des écoles privées ouest-africaines (Côte d'Ivoire, Sénégal, Mali, Burkina Faso, etc.) avec une interface moderne, ultra-rapide, et pensée **mobile-first** pour s'adapter à l'usage massif de smartphones Android (Infinix, Tecno, Samsung) et aux connexions mobiles parfois instables.

* **Monnaie d'usage** : Franc CFA (XOF / FCFA), formaté rigoureusement.
* **Paiements dominants** : Mobile Money (Wave, Orange Money, MTN MoMo) et Espèces.
* **Cycle Scolaire** : 3 trimestres, rentrée en septembre.
* **Numéros de téléphone** : Format standard ivoirien à 10 chiffres (`+225 XX XX XX XX XX`).

---

## 🛠️ 2. Stack Technique & Écosystème
Le projet utilise une stack moderne et robuste garantissant réactivité, sécurité de niveau Fintech et typage strict à 100% :

| Couche | Technologie | Rôle / Rationale |
|---|---|---|
| **Framework** | **Next.js 16.2.6 (App Router)** | Rendu hybride (Server Components par défaut), routage dynamique et sécurisé via Turbopack. |
| **Base de Données** | **Supabase (PostgreSQL)** | Authentification, RLS (Row Level Security), stockage temps réel. |
| **State Global** | **Zustand** | Store centralisé unique (`src/store/useSchoolStore.ts`) avec persistance hybride (localStorage). |
| **Interface (UI)** | **Tailwind CSS v3 + shadcn/ui** | Design premium fondé sur des variables CSS harmonieuses (Emeraude / Ambre / Ardoise). |
| **Typage** | **TypeScript strict** | Zéro `any` toléré. Interfaces et enums centralisés. |
| **PDF Renderer** | **@react-pdf/renderer** | Compilation de bulletins A4 formels directement côté client. |
| **Graphiques** | **Recharts** | Visualisation analytique des flux de scolarité et de présence. |
| **Validation** | **Zod** | Validation robuste des schémas de formulaires et de mots de passe. |

---

## 📂 3. Structure de Fichiers Réelle du Projet
```
GestScol/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   ├── page.tsx                  # Page de connexion (Directeur)
│   │   │   │   ├── enseignant/page.tsx       # Connexion Enseignant (bloqué si gratuit)
│   │   │   │   └── parent/page.tsx           # Connexion Parent (bloqué si gratuit)
│   │   │   └── register/
│   │   │       ├── page.tsx                  # Landing d'inscription multi-plan
│   │   │       ├── directeur/page.tsx        # Inscription profil Directeur
│   │   │       ├── ecole/page.tsx            # Formulaire d'établissement
│   │   │       ├── enseignant/page.tsx       # Formulaire de rattachement Enseignant
│   │   │       └── parent/page.tsx           # Formulaire de rattachement Parent
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                    # Layout avec sidebar rétractable + header (et subscription guard)
│   │   │   ├── dashboard/page.tsx            # Tableau de bord Directeur (KPIs + Charts)
│   │   │   ├── ecoles/
│   │   │   │   └── page.tsx                  # Grille de sélection d'école par profil
│   │   │   ├── eleves/
│   │   │   │   ├── page.tsx                  # Liste des élèves & inscriptions
│   │   │   │   └── [id]/page.tsx              # Fiche profil élève exhaustive
│   │   │   ├── classes/page.tsx              # Configuration des classes et des frais
│   │   │   ├── matieres/page.tsx             # Liste des matières & coefficients par classe
│   │   │   ├── enseignants/page.tsx          # Gestion des dossiers enseignants
│   │   │   ├── notes/page.tsx                # Saisie des notes de classe
│   │   │   ├── bulletins/page.tsx            # Génération de bulletins scolaires PDF
│   │   │   ├── paiements/page.tsx            # Suivi des frais de scolarité (tranches)
│   │   │   ├── absences/page.tsx             # Suivi d'assiduité (Feuille d'appel)
│   │   │   ├── support/page.tsx              # Messagerie de support client directe
│   │   │   ├── aide/page.tsx                 # Base de connaissances & FAQ
│   │   │   └── parametres/page.tsx           # Config école, années scolaires & comptes
│   │   ├── globals.css                       # Système de design GestScol
│   │   ├── layout.tsx                        # Root layout global
│   │   └── page.tsx                          # Landing page publique premium
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                   # Menu réactif à tiroirs par rôles & sections
│   │   │   └── Header.tsx                    # Barre supérieure (Profil, Année active, Déconnexion)
│   │   ├── ecoles/
│   │   │   ├── CarteEcole.tsx                # Composant visuel de sélection d'école
│   │   │   ├── EcoleFormModal.tsx            # Formulaire d'ajout d'école
│   │   │   └── ConfirmSuppressionEcole.tsx   # Modale d'audit et suppression définitive
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx                   # Carte indicateur animée
│   │   │   └── PaiementsParClasseChart.tsx   # Graphique Recharts de recouvrement
│   │   ├── eleves/
│   │   │   └── EleveModal.tsx                # Formulaire d'ajout/modification d'élève
│   │   ├── inscriptions/
│   │   │   └── InscriptionModal.tsx          # Modal d'inscription et réinscription d'élèves
│   │   ├── absences/
│   │   │   └── FeuilleAppel.tsx              # Interface d'appel tactile rapide
│   │   ├── bulletins/
│   │   │   └── BulletinPDF.tsx               # Composant de rendu PDF A4 formel
│   │   └── ui/
│   │       ├── SelectCivilite.tsx            # Dropdown de sélection de civilité normalisé
│   │       ├── PremiumGuard.tsx              # Écran interactif commercial de plan gratuit
│   │       └── [shadcn components]           # Composants atomiques (dialog, button, table...)
│   ├── store/
│   │   └── useSchoolStore.ts                 # Moteur d'état central (Supabase + Local, persistance v12)
│   ├── types/
│   │   └── index.ts                          # Déclarations et contrats TypeScript strict
│   ├── lib/
│   │   ├── utils.ts                          # Utilitaires de formatage (CFA, dates, initiales)
│   │   └── supabase/
│   │       ├── client.tsx                    # Client Supabase pour composants client
│   │       ├── server.tsx                    # Client Supabase pour Server Components / Server Actions
│   │       └── admin.ts                      # Client Supabase d'administration (bypassant RLS via service role)
│   ├── proxy.ts                              # Edge Middleware & Proxy natif de Next.js 16 (Remplace middleware.ts)
│   └── app/actions/
│       ├── abonnement.ts                     # Actions serveur d'abonnement
│       ├── ecole.ts                          # Actions serveur de configuration d'établissement (avec Magic Bytes)
│       ├── notifications.ts                  # Actions serveur de gestion de communiqués
│       └── register.ts                       # Actions d'inscription, NIST 800-63B et auto-guérison
```

---

## 🌟 4. Fonctionnalités Clés Implémentées

### A. Espace Directeur (Administrateur Central)
* **Procédure d'Inscription & Réinscription en 2 Étapes** : 
  1. **Création Dossier Dossier Civil (Onglet « Élèves »)** : Création unique des coordonnées de l'élève (Nom, Prénom, Genre, Date de naissance), des contacts parents (indispensables au portail) et de la photo Base64. Fiche persistée à vie pour éviter les saisies redondantes.
  2. **Affectation Scolaire Annuelle (Onglet « Inscriptions »)** : Pour chaque nouvelle année, l'élève existant est simplement sélectionné dans une liste déroulante rapide (Combobox) et affecté à sa classe en un clic. GestScol configure ses frais, génère son inscription et l'associe à l'année sans aucune ressaisie.
* **Visualisation Financière** : Recharts affiche en temps réel les montants recouvrés en FCFA, les retards de paiements et le taux global de recouvrement de l'école.
* **Gestion des effectifs** : Comptabilisation instantanée par classe, croisée avec l'année scolaire sélectionnée en Header.
* **Dossier Élève Exhaustif** : La fiche élève regroupe les informations civiles, les parents associés, l'historique complet des versements scolaires, ses notes de l'année et son historique d'absences.
* **Contrôles de Validation des Bulletins (Grille & Masse)** :
  * **Unitaires** : Bouton `Valider` (ou `Annuler`) pour approuver un bulletin calculé, le rendre instantanément visible aux parents et leur envoyer une notification en temps réel.
  * **En lot** : Boutons supérieurs **« Tout valider »** et **« Tout annuler »** pour approuver ou brouillonner l'intégralité des bulletins d'une classe en un clic.

### B. Espace Enseignant (Accès Limité)
* **Feuille d'Appel Numérique Tactile** : Saisie ultra-rapide des présences par demi-journée (Matin / Après-midi).
* **Saisie et Pondération des Notes** : Grille d'évaluation des devoirs et compositions avec coefficients par matière.
* **Rattachement par Code d'Invitation** : Permet à un enseignant d'entrer un code à 8 chiffres généré par son établissement pour être associé automatiquement.

### C. Espace Parent (Suivi d'Élève)
* **Portail Famille** : Visualisation instantanée de l'emploi du temps des devoirs, des notes, des versements effectués et des absences de ses enfants.
* **Cloisonnement Strict** : Un parent n'a accès qu'aux données des élèves dont il est explicitement désigné comme responsable (par email ou par identifiant de compte).

---

## 🔒 5. Architecture de Sécurité & Garde-fous (AppSec)

### 1. Protection du Routage & RBAC (Next.js 16 Proxy)
Dans Next.js 16, **`src/proxy.ts`** fait office d'Edge Middleware. Le contrôle d'accès fondé sur les rôles (RBAC) est durci côté serveur :
* **Double Signal d'Authentification** : Le proxy valide cryptographiquement la signature du token JWT Supabase (`supabase.auth.getUser()`) ET vérifie la présence du cookie de session local Zustand `currentUser`.
* **Matrice de Permissions Serveur** :
  * **Parent** : Accès bloqué à la liste globale des élèves (`/eleves`), classes, enseignants, matières, écritures administratives et notes. Accès autorisé exclusivement à `/parent/dashboard`, `/eleves/[id]` (ses enfants rattachés), `/absences`, `/paiements` et `/aide`.
  * **Enseignant** : Accès bloqué aux pages financières (`/paiements`), bulletins globaux (`/bulletins`), et configurations d'école (`/parametres`). Accès autorisé à `/enseignant/dashboard`, `/notes`, `/absences` et `/aide`.
  * **Accès sans école liée** : Si l'utilisateur connecté ne possède pas d'établissement actif, il est redirigé de force vers la page de choix `/ecoles`.

### 2. Durcissement de la Sécurité de la Base de Données (Supabase RLS)
L'isolation multi-tenant a été renforcée au niveau de PostgreSQL :
* **RLS Fine-Grained (Polices Restrictives)** :
  * `utilisateurs` : Lecture limitée à l'établissement ; écriture et suppression restreintes aux seuls directeurs authentifiés.
  * `paiements` & `bulletins` : Lecture restreinte aux directeurs pour leur école, et aux parents pour leurs enfants uniquement (bulletins visibles uniquement s'ils sont validés via `est_valide = true`).
  * `notes` & `absences` : Lecture isolée par école ; modification limitée aux directeurs et aux enseignants affectés à l'établissement.

### 3. Protection contre les Attaques Standard (OWASP)
* **Chiffrement des Mots de Passe & NIST 800-63B** : alignement de la force de mot de passe sur la norme NIST. Toute création de compte exige un mot de passe d'au moins **12 caractères** incluant obligatoirement des majuscules, des minuscules, des chiffres et des caractères spéciaux (validation Zod côté serveur).
* **Sécurité HTTP (`next.config.ts`)** : Injection d'en-têtes HTTP stricts pour atténuer le clickjacking, le reniflage MIME et les attaques par canaux auxiliaires :
  * `Cross-Origin-Opener-Policy: same-origin` (COOP) et `Cross-Origin-Resource-Policy: same-site` (CORP).
  * `Content-Security-Policy` (CSP) configuré pour bloquer les scripts malveillants tout en permettant les services légitimes (Supabase, Wave, CinetPay).
  * `Strict-Transport-Security` (HSTS) actif pour 2 ans.

### 4. Restrictions de plans & Bridage Premium Visuel (PremiumGuard & Locks)
* **Stratégie d'incitation Premium** : Les éléments premium (ex: gestion des dossiers enseignants) sont maintenus visibles à 40% d'opacité avec badge doré `👑 Premium` et curseur bloqué. Cliquer dessus affiche la modale `PremiumGuard` (incitation de mise à niveau vers la formule Standard de 150 000 FCFA / an).
* **Lecture Seule en cas d'expiration** : Si l'abonnement expire, l'accès aux données passées est préservé en lecture seule, mais toute mutation de données est immédiatement interceptée et bloquée côté client par le store Zustand sans crash du thread.

### 5. Gestion des Fichiers Médias par Validateur Base64 (Magic Bytes)
La persistance des logos et photos s'effectue via encodage Base64 dans PostgreSQL (colonnes `TEXT`). Afin de parer aux failles d'injection de scripts malveillants dans les images ou de saturation de la base de données :
* **Limitation stricte** : Fichiers plafonnés à 1 Mo maximum sur le client (`validateBase64ImageClient` dans `useSchoolStore.ts`) et validés de manière renforcée sur le serveur.
* **Validation de signature réelle (Magic Bytes)** : Le serveur décode l'entête binaire pour autoriser exclusivement les formats d'images légitimes : JPEG (`ffd8ff`), PNG (`89504e47`), et WebP (`52494646`). Les fichiers suspects ou corrompus sont rejetés immédiatement.
* **Actions d'upload unifiées** : Les photos sont envoyées via des Server Actions dédiées et sécurisées :
  * `uploadProfilePhoto(base64Photo)` : Met à jour la photo de l'utilisateur connecté après vérification de sa session.
  * `uploadStudentPhoto(studentId, base64Photo)` : Met à jour la photo de l'élève ciblé uniquement si l'appelant est authentifié avec le rôle de **Directeur** et que l'élève appartient bien à son établissement actif.

### 6. Sanitisation de Téléchargements PDF (@react-pdf/renderer)
Pour prévenir les injections de caractères spéciaux ou directory traversal via les variables dynamiques (noms d'élèves, trimestres) dans les téléchargements de bulletins générés côté client :
* **getSafeFilename** : Utilisation d'un utilitaire de sanitisation supprimant les accents (`normalize("NFD")`) et convertissant tout caractère non-alphanumérique en underscore (`_`).

### 7. Inter-connexion Complète & Purge en Cascade (SaaS Multi-Tenant)
* **Liaison Comptes Authentification (`public.utilisateurs` ── `auth.users`)** :
  * Le champ `public.utilisateurs.id` possède une clé étrangère `utilisateurs_id_fkey` pointant vers `auth.users(id) ON DELETE CASCADE`.
* **Moteur de Purge du Tenant par Trigger Établissement** :
  * Un trigger `tr_delete_school_on_director_delete` rattaché à `utilisateurs` exécute la fonction de sécurité `delete_school_on_director_delete()`.
  * Dès que le profil d'un **Directeur** est supprimé (ex: suppression de son compte dans Auth), le trigger extrait son `ecole_id` et supprime l'école correspondante dans `public.ecoles`.
  * Grâce aux clés étrangères **`ON DELETE CASCADE`** reliant `ecoles(id)` à toutes les autres tables de la base de données, la suppression de l'école déclenche instantanément une purge complète en cascade de tout l'établissement (élèves, inscriptions, notes, absences, paiements, bulletins, matières, classes et enseignants).

### 8. Sécurisation des Actions Serveur (Server Actions Anti-Spoofing)
Afin d'éviter tout contournement des règles de cloisonnement et d'injection de requêtes arbitraires depuis le client :
* **Vérification d'identité systématique** : Toutes les actions serveurs critiques valident cryptographiquement la session de l'appelant via `supabase.auth.getUser()`. Le paramètre `utilisateurId` fourni par le client n'est jamais cru sur parole ; le serveur vérifie obligatoirement que `user.id === utilisateurId` avant de procéder à toute action (par ex. `markAsRead` et `fetchUserLectures` dans `notifications.ts`).
* **Cloisonnement multi-tenant des écritures** : Les mutations sur l'abonnement (`updateSchoolAbonnement` dans `abonnement.ts`) s'assurent de la validité de la transaction (comme la présence du préfixe `CP-` pour le simulateur de paiement) et consignent des traces d'audit en base pour parer aux fraudes. Les téléchargements ou modifications de photos d'élèves (`uploadStudentPhoto`) font l'objet d'un double contrôle côté serveur (authentification + vérification que l'élève appartient à l'école du directeur).

---

## ⚡ 6. Optimisations de Performance & Base de Données

### A. Indexation de la Base de Données (PostgreSQL)
Afin de minimiser le temps de réponse réseau lors du chargement des statistiques d'écoles et des affectations, des index ont été ajoutés sur les clés étrangères les plus sollicitées :
*   `idx_classes_enseignant_principal` sur `public.classes (enseignant_principal_id)`
*   `idx_eleves_classe` sur `public.eleves (classe_id)`
*   `idx_eleves_ecole` sur `public.eleves (ecole_id)`

### B. Optimisation des Fonctions RLS (PostgreSQL)
Les politiques de sécurité qui interrogent les tables de jointure pour déterminer les appartenances ont été réécrites pour intégrer un contrôle préliminaire du rôle de l'utilisateur connecté. Cela évite l'évaluation inutile de sous-requêtes complexes :
```sql
-- Exemple d'optimisation de politique sur la table classes
CREATE POLICY "lecture_classes_membres" ON public.classes
  FOR SELECT USING (
    (ecole_id = public.get_auth_user_ecole_id())
    OR
    (public.get_auth_user_role() = 'enseignant'::user_role AND public.check_enseignant_linked_to_school(ecole_id, auth.uid()))
    OR
    (public.get_auth_user_role() = 'parent'::user_role AND public.check_parent_linked_to_school(ecole_id, auth.uid()))
  );
```
Les fonctions SQL `check_parent_linked_to_school` et `check_enseignant_linked_to_school` vérifient instantanément le rôle dans la table `utilisateurs` et renvoient `false` en quelques microsecondes si le rôle ne correspond pas, court-circuitant ainsi les jointures coûteuses.

### C. UX & Fluidité du Chargement
*   **Bypass de chargement sur la page `/ecoles`** : Lors de l'accès à la page de sélection des écoles, le store Zustand ne bloque pas l'UI pour charger les données administratives globales de l'établissement (`fetchSupabaseData`).
*   **Neutralisation du White Screen Flash** : La page `/ecoles` et son layout d'hydratation ont été configurés avec une structure de chargement sur fond sombre (`bg-slate-900`) et un spinner de chargement vert émeraude, assurant une transition visuelle invisible et fluide entre la connexion et la console d'administration.

---

## 📐 7. Règles Métier & Formules Mathématiques Critiques

### 1. Calcul de Moyennes Pondérées (Coefficients)
La moyenne trimestrielle d'un élève dans une matière est la moyenne arithmétique simple de ses notes. 
La moyenne générale du trimestre de l'élève est pondérée par les coefficients des matières :
$$\text{Moyenne Générale} = \frac{\sum (\text{Moyenne Matière} \times \text{Coefficient})}{\sum \text{Coefficients}}$$

### 2. Rangs de Classe
* Le rang est calculé dynamiquement au sein de la même classe pour le même trimestre et la même année scolaire.
* Si deux élèves obtiennent la même moyenne, ils partagent le même rang (ex: 1er ex-aequo).

### 3. Appréciations Scolaires Automatisées
L'attribution des mentions sur le bulletin PDF s'appuie sur la moyenne obtenue :
* $\ge 16/20$ : "Excellent"
* $\ge 14/20$ : "Très Bien"
* $\ge 12/20$ : "Bien"
* $\ge 10/20$ : "Assez Bien"
* $\ge 08/20$ : "Passable"
* $< 08/20$ : "Insuffisant"

### 4. Inscription Active requise
> [!IMPORTANT]
> **Règle absolue d'inscription** : Un élève n'existe dans les effectifs comptabilisés, les feuilles d'appel et la saisie de notes que s'il possède une inscription active validée (`statut === 'validee'`) pour l'année scolaire sélectionnée en Header. Les raccourcis historiques `e.classeId` et `e.statut` ne doivent **JAMAIS** servir de fallback si l'inscription de l'année en cours est absente.

### 5. Cloisonnement Visuel de la Carte École (`CarteEcole.tsx`)
*   **Directeur** : Accès complet aux effectifs (nombre d'élèves, de classes) et au pourcentage de recouvrement des frais.
*   **Enseignant & Parent** : Les données financières et les effectifs globaux de l'école sont masqués. 
*   **Parent** : Affichage d'un bandeau de badges affichant la liste nominative des enfants du parent rattachés à cette école (`Enfant: Prénom`).

---

## 🎨 8. Design System & Identité Visuelle
Le projet arbore une esthétique premium de type "Fintech/SaaS moderne" inspirée des codes visuels ivoiriens :
* **Couleurs** :
  * Émeraude (`--primary` : `#059669`) : symbolise la croissance, l'éducation et la réussite.
  * Ambre/Or (`--accent` : `#F59E0B`) : apporte une touche chaleureuse, rappelant le prestige et la lumière.
  * Ardoise Sombre (`--sidebar-bg` : `#0F172A`) : pour une sidebar sobre et professionnelle.
* **Typographie** : `Sora` (titres géométriques accrocheurs) & `DM Sans` (corps de texte optimisé pour la lecture).
* **Mise en page** : Ratios aérés, coins arrondis adoucis (`rounded-xl` / `rounded-2xl`), cartes épurées avec de subtils ombrages et bordures translucides.

---

## 🤖 9. Instructions Importantes pour un Futur Modèle d'IA

Si vous êtes un modèle d'IA chargé de modifier, déboguer ou faire évoluer ce codebase, suivez scrupuleusement ces consignes :

### 1. Structure de Middleware & Proxy
* N'ajoutez **JAMAIS** de fichier `src/middleware.ts`. Next.js 16 utilise exclusivement **`src/proxy.ts`**.
* Lors de l'écriture d'une protection de route dans `src/proxy.ts`, assurez-vous de croiser l'utilisateur Supabase **ET** la présence du cookie `currentUser` de Zustand pour maintenir la synchronisation et prévenir les boucles infinies.

### 2. Redirection Dynamique post-Déconnexion
Lors de la déconnexion d'un utilisateur, vous devez le renvoyer vers son formulaire de login spécifique en utilisant la valeur sauvegardée dans le stockage local :
```typescript
const role = currentUser.role
// ... signOut() ...
if (role === 'enseignant') {
  window.location.href = '/login/enseignant'
} else if (role === 'parent') {
  window.location.href = '/login/parent'
} else {
  window.location.href = '/login'
}
```

### 3. Gestion des Écritures & Gardes d'Abonnement
Avant d'ajouter ou de modifier une action d'écriture (mutation de données) dans le store `useSchoolStore.ts`, vous **devez** :
* Appeler `checkAbonnement(state)` en haut de la fonction.
* Retourner un objet au format `{ success: false, error: "Message explicite" }` en cas d'échec pour éviter de faire planter le thread client.
* Ne jamais lever une exception brute (`throw new Error`) dans les méthodes asynchrones du store appelées par des callbacks d'UI.

### 4. Sécurisation des Actions (Server Actions)
* Toutes les Server Actions critiques (`src/app/actions/...`) doivent valider la session sur le serveur en récupérant l'utilisateur connecté via le client server-Supabase.
* N'exécutez jamais d'écritures critiques sans vérifier préalablement que l'utilisateur possède le bon rôle (ex: `role === 'directeur'`) et appartient à l'école cible (`ecole_id === ecoleId`).

### 5. Typage strict TypeScript (Zéro `any`)
* N'utilisez **JAMAIS** le type `any`. Si un type est complexe, déclarez une interface explicite dans `src/types/index.ts`.
* Toutes les entités (`Eleve`, `Classe`, `Inscription`, `Paiement`, `User`) doivent utiliser les structures du fichier de types centralisé.

### 6. Cohérence Linguistique & UX
* Toute l'interface utilisateur, y compris les formulaires, boutons, placeholders, messages d'erreurs et toasts de confirmation, doit être rédigée **exclusivement en français**.
* Utilisez des données de démonstration réalistes et typiques de l'Afrique de l'Ouest (noms de famille ivoiriens : Kouadio, Koné, Diallo, Diomandé ; numéros au format `+225` ; montants en `FCFA`).

### 7. Respect des Server/Client Components
* Laissez les composants en Server Components par défaut.
* N'ajoutez la directive `'use client'` que si le composant requiert explicitement des hooks React interactifs (`useState`, `useEffect`, `useRef`) ou des événements (`onClick`, `onChange`).
* Veillez à découper vos composants de formulaire complexes pour ne pas dépasser la limite conseillée de 250 lignes par fichier.

### 8. Intégrité Référentielle & Purge en Cascade
* Ne désactivez pas et ne modifiez pas les clés étrangères de clé d'authentification (`utilisateurs_id_fkey`) ou de comptes de simulation (`comptes_connexion_id_fkey`) reliant les tables à `auth.users(id)`.
* Respectez scrupuleusement la structure de purge par trigger `tr_delete_school_on_director_delete` rattachée à la table `public.utilisateurs`. Si vous ajoutez de nouvelles tables reliées à l'école, assurez-vous d'ajouter une clé étrangère avec la clause `ON DELETE CASCADE` pointant vers `public.ecoles(id)` (ou sa table parente) pour garantir que le trigger purge automatiquement vos nouvelles données lors de la suppression d'un Directeur.

### 9. Séparation du Dossier Élève et de l'Inscription Annuelle
* Respectez scrupuleusement le workflow en deux étapes de GestScol pour les inscriptions et réinscriptions :
  1. La création de l'élève s'effectue **uniquement** dans l'onglet **Élèves** (table `public.eleves`).
  2. L'inscription pour l'année scolaire active s'effectue dans l'onglet **Inscriptions** (table `public.inscriptions`) par simple sélection de l'élève existant dans une liste rapide.
* N'implémentez jamais de formulaire d'inscription ré-entrant qui forcerait la saisie redondante du Nom, Prénom ou des informations parents pour un élève déjà existant dans le système.
