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
│   │   │   └── login/
│   │   │       ├── page.tsx                  # Page de connexion (Directeur)
│   │   │       ├── enseignant/page.tsx       # Connexion Enseignant (bloqué si gratuit)
│   │   │       └── parent/page.tsx           # Connexion Parent (bloqué si gratuit)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                    # Layout avec sidebar rétractable + header (et subscription guard)
│   │   │   ├── dashboard/page.tsx            # Tableau de bord Directeur (KPIs + Charts)
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
│   └── proxy.ts                              # Edge Middleware & Proxy natif de Next.js 16 (Remplace middleware.ts)
```

---

## 🌟 4. Fonctionnalités Clés Implémentées

### A. Espace Directeur (Administrateur Central)
* **Visualisation Financière** : Recharts affiche en temps réel les montants recouvrés en FCFA, les retards de paiements et le taux global de recouvrement de l'école.
* **Gestion des effectifs** : Comptabilisation instantanée par classe, croisée avec l'année scolaire sélectionnée en Header.
* **Dossier Élève Exhaustif** : La fiche élève regroupe les informations civiles, les parents associés, l'historique complet des versements scolaires, ses notes de l'année et son historique d'absences.

### B. Espace Enseignant (Accès Limité)
* **Restrictions d'accès** : L'enseignant n'a accès qu'à son tableau de bord dédié, affichant uniquement les effectifs de ses classes assignées.
* **Saisie des Notes & Appel** : Formulaires fluides permettant d'enregistrer les notes par matière/devoir et de cocher les absences quotidiennes.

### C. Espace Parent (Suivi d'Élève)
* **Vue Ciblée** : Accès épuré affichant les notes de son ou ses enfants, le suivi d'absences en temps réel, l'état de sa scolarité (tranches payées/restantes) et le téléchargement des bulletins A4 validés.

---

## 🔒 5. Architecture de Sécurité & Garde-fous (AppSec)

### 1. Protection du Routage Négocié (Next.js 16 Proxy)
Dans Next.js 16, **`src/proxy.ts`** remplace le `middleware.ts` traditionnel. Pour éliminer les boucles de redirection infinies (desynchronisation entre le client et le serveur), la politique de sécurité suit ces deux piliers :
* **Côté Serveur (`src/proxy.ts`)** : Le serveur ne considère l'utilisateur comme authentifié que s'il possède à la fois un utilisateur Supabase valide **ET** le cookie de session Zustand `currentUser`. Cela garantit que si Zustand est vidé, l'utilisateur est maintenu sur `/login` de manière stable.
* **Côté Client (`src/app/(dashboard)/layout.tsx`)** : Si Zustand est réhydraté et que `currentUser` est détecté comme `null` (déconnexion ou expiration), le layout force **synchrone** `setCurrentUser(null)` pour effacer instantanément le cookie client avant de lancer la signature de sortie asynchrone Supabase.

### 2. Isolation Multi-Tenant Hermétique
* **Base de données** : Le store Zustand `fetchSupabaseData` applique un **cloisonnement strict**. Toutes les requêtes sensibles (`matieres`, `notes`, `paiements`, `absences`, `bulletins`) n'effectuent jamais de `select('*')` brut. Elles filtrent via des clauses `.in()` s'appuyant uniquement sur les classes et élèves légitimes de l'établissement du Directeur connecté.
* **Server Actions RBAC** : Les Server Actions critiques (`updateSchoolAbonnement`, `createUtilisateurAuth`, `adminUpdatePassword`, `createNotification`) récupèrent la session utilisateur côté serveur et vérifient que l'utilisateur est bien le **Directeur** enregistré pour l'établissement concerné (`ecole_id`) avant de modifier des données.

### 3. Protection contre les Attaques Standard (OWASP)
* **Account Takeover (ATO)** : Les actions d'administration valident le rôle de Directeur et imposent un mot de passe fort via un schéma de validation Zod (12 caractères minimum, majuscule, minuscule, chiffre, symbole).
* **Sécurité HTTP (`next.config.ts`)** : Injection de headers stricts :
  * `Content-Security-Policy` (CSP) robuste autorisant uniquement les services fiables (Supabase, Wave, CinetPay).
  * `Strict-Transport-Security` (HSTS) actif pour 2 ans.
  * `X-Frame-Options: SAMEORIGIN` (prévention du clickjacking).
  * `X-Content-Type-Options: nosniff`.
  * `Referrer-Policy` & `Permissions-Policy`.

### 4. Restrictions de plans & Bridage Premium Visuel (PremiumGuard & Locks)
* **Stratégie d'incitation Premium (Visibilité Inactive)** : Plutôt que de simplement masquer les fonctionnalités, les éléments premium sont maintenus **visibles mais verrouillés/inactifs** avec un indicateur premium prestigieux (`👑 Premium` et une icône `Lock` dorée) pour susciter l'intérêt de l'utilisateur :
  * **Sidebar & Navigation** : Les liens premium (`Notes`, `Absences`, `Bulletins`, `Support`) restent visibles avec une opacité de 40%, un curseur interdit (`cursor-not-allowed`) et un badge doré `👑 Premium` à droite.
  * **Tableau de Bord Directeur** : Les cartes KPI (Absences, Bulletins) et le widget d'absences récentes s'affichent dans un état locked (avec cadenas, tirets à la place des valeurs et sous-titres incitatifs).
  * **Fiche Dossier Élève** : Le bouton "Générer Bulletin" s'affiche sous forme d'indicateur inactif doré, et les onglets "Notes" & "Absences" restent visibles avec des badges Premium dorés. Cliquer dessus affiche un magnifique écran de verrouillage incitatif à la place du contenu.
  * **Actions & Boutons** : Les boutons "Imprimer le reçu" (paiements) et "Diffuser un communiqué" (notifications) s'affichent sous forme inerte avec un contraste élevé en couleur ambre dorée (Premium) et un curseur interdit.
* **Sécurité du Routage Direct** : Si l'utilisateur tente d'accéder directement à une URL restreinte (`/matieres` ou `/enseignants/[id]/assignations`), la route est interceptée côté client et affiche un écran complet de conversion `PremiumGuard` (incitation de mise à niveau vers la formule Standard de 150 000 FCFA / an).
* **Abonnement Expiré** : L'accès aux données passées est préservé en lecture seule, mais toute écriture est interceptée côté client par la méthode de garde Zustand `checkAbonnement`, affichant un toast d'erreur bloquant sans perte de saisie pour l'utilisateur.

---

## 📐 6. Règles Métier & Formules Mathématiques Critiques

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

---

## 🎨 7. Design System & Identité Visuelle
Le projet arbore une esthétique premium de type "Fintech/SaaS moderne" inspirée des codes visuels ivoiriens :
* **Couleurs** :
  * Émeraude (`--primary` : `#059669`) : symbolise la croissance, l'éducation et la réussite.
  * Ambre/Or (`--accent` : `#F59E0B`) : apporte une touche chaleureuse, rappelant le prestige et la lumière.
  * Ardoise Sombre (`--sidebar-bg` : `#0F172A`) : pour une sidebar sobre et professionnelle.
* **Typographie** : `Sora` (titres géométriques accrocheurs) & `DM Sans` (corps de texte optimisé pour la lecture).
* **Mise en page** : Ratios aérés, coins arrondis adoucis (`rounded-xl` / `rounded-2xl`), cartes épurées avec de subtils ombrages et bordures translucides.

---

## 🤖 8. Instructions Importantes pour un Futur Modèle d'IA

Si vous êtes un modèle d'IA chargé de modifier, déboguer ou faire évoluer ce codebase, suivez scrupuleusement ces consignes :

### 1. Structure de Middleware & Proxy
* N'ajoutez **JAMAIS** de fichier `src/middleware.ts`. Next.js 16 utilise exclusivement **`src/proxy.ts`**.
* Lors de l'écriture d'une protection de route dans `src/proxy.ts`, assurez-vous de croiser l'utilisateur Supabase **ET** la présence du cookie `currentUser` de Zustand pour maintenir la synchronisation et prévenir les boucles infinies.

### 2. Gestion des Écritures & Gardes d'Abonnement
Avant d'ajouter ou de modifier une action d'écriture (mutation de données) dans le store `useSchoolStore.ts`, vous **devez** :
* Appeler `checkAbonnement(state)` en haut de la fonction.
* Retourner un objet au format `{ success: false, error: "Message explicite" }` en cas d'échec pour éviter de faire planter le thread client.
* Ne jamais lever une exception brute (`throw new Error`) dans les méthodes asynchrones du store appelées par des callbacks d'UI.

### 3. Sécurisation des Actions (Server Actions)
* Toutes les Server Actions critiques (`src/app/actions/...`) doivent valider la session sur le serveur en récupérant l'utilisateur connecté via le client server-Supabase.
* N'exécutez jamais d'écritures critiques sans vérifier préalablement que l'utilisateur possède le bon rôle (ex: `role === 'directeur'`) et appartient à l'école cible (`ecole_id === ecoleId`).

### 4. Typage strict TypeScript (Zéro `any`)
* N'utilisez **JAMAIS** le type `any`. Si un type est complexe, déclarez une interface explicite dans `src/types/index.ts`.
* Toutes les entités (`Eleve`, `Classe`, `Inscription`, `Paiement`, `User`) doivent utiliser les structures du fichier de types centralisé.

### 5. Cohérence Linguistique & UX
* Toute l'interface utilisateur, y compris les formulaires, boutons, placeholders, messages d'erreurs et toasts de confirmation, doit être rédigée **exclusivement en français**.
* Utilisez des données de démonstration réalistes et typiques de l'Afrique de l'Ouest (noms de famille ivoiriens : Kouadio, Koné, Diallo, Diomandé ; numéros au format `+225` ; montants en `FCFA`).

### 6. Respect des Server/Client Components
* Laissez les composants en Server Components par défaut.
* N'ajoutez la directive `'use client'` que si le composant requiert explicitement des hooks React interactifs (`useState`, `useEffect`, `useRef`) ou des événements (`onClick`, `onChange`).
* Veillez à découper vos composants de formulaire complexes pour ne pas dépasser la limite conseillée de 250 lignes par fichier.
