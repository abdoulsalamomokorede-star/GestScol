# 🛡️ GestScol — Guide de Référence de l'Agent & Fiche Technique

Bienvenue sur le référentiel d'ingénierie de **GestScol**, le SaaS de gestion scolaire de pointe conçu pour les établissements d'enseignement primaire et secondaire en Afrique de l'Ouest (particulièrement en Côte d'Ivoire).

Ce document fait office de **mémoire technique permanente** pour tout modèle d'IA intervenant sur ce projet. Il décrit avec précision le périmètre fonctionnel, l'architecture logicielle, les règles métier critiques et les garde-fous de sécurité en place.

---

## 📖 1. Présentation Générale & Vision
**GestScol** résout les défis administratifs des écoles privées ouest-africaines (Côte d'Ivoire, Sénégal, Mali, Burkina Faso, etc.) avec une interface moderne, ultra-rapide, et pensée **mobile-first** pour s'adapter à l'usage massif de smartphones Android (Infinix, Tecno, Samsung) et aux connexions mobiles parfois instables.

* **Monnaie d'usage** : Franc CFA (XOF / FCFA), formaté rigoureusement.
* **Paiements dominants** : Mobile Money (Wave, Orange Money, MTN MoMo) et Espèces.
* **Cycle Scolaire** : 3 trimestres, rentrée en septembre.
* **Numéros de téléphone** : Format standard ivoirien à 10 chiffres (`+225 XX XX XX XX XX`).

---

## 🛠️ 2. Stack Technique & Écosystème
Le projet utilise une stack moderne et robuste garantissant réactivité et typage strict à 100% :

| Couche | Technologie | Rôle / Rationale |
|---|---|---|
| **Framework** | **Next.js 14 (App Router)** | Server Components par défaut, routage dynamique et sécurisé. |
| **Base de Données** | **Supabase (PostgreSQL)** | Authentification, RLS (Row Level Security), stockage temps réel. |
| **State Global** | **Zustand** | Store centralisé unique (`src/store/useSchoolStore.ts`) avec persistance hybride. |
| **Interface (UI)** | **Tailwind CSS v3 + shadcn/ui** | Design premium fondé sur des variables CSS harmonieuses. |
| **Typage** | **TypeScript strict** | Zéro `any` toléré. Interfaces et enums centralisés. |
| **PDF Renderer** | **@react-pdf/renderer** | Compilation de bulletins A4 formels directement côté client. |
| **Graphiques** | **Recharts** | Visualisation analytique des flux de scolarité et de présence. |
| **Validation** | **Zod** | Validation robuste des schémas de formulaires (modals). |

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
│   │   │   ├── layout.tsx                    # Layout avec sidebar rétractable + header
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
│   │   └── useSchoolStore.ts                 # Moteur d'état central (Supabase + Local)
│   ├── types/
│   │   └── index.ts                          # Déclarations et contrats TypeScript strict
│   ├── lib/
│   │   └── utils.ts                          # Utilitaires de formatage (CFA, dates, initiales)
│   └── middleware.ts                         # Protection de session Next.js & Supabase
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

### D. Système d'Abonnement, de Restriction & Sécurité 🔒
GestScol intègre une double sécurité infaillible gérée par le store global et l'UI :

#### 1. Formule Gratuite (Restrictions Commerciales)
* **Sidebar Filtrée** : Les liens `Notes`, `Absences`, `Bulletins`, `Support` et l'onglet `Création de Comptes` des paramètres sont **masqués** pour le directeur.
* **Écran PremiumGuard** : Si un directeur force l'URL vers ces pages restreintes, l'UI intercepte la route et affiche `PremiumGuard` — un magnifique composant incitant à la mise à niveau vers la formule Standard (150 000 FCFA / an) avec option d'activation immédiate.
* **Connexion Bloquée** : Les enseignants et parents affiliés à une école sous formule gratuite voient leur connexion immédiatement rejetée avec déconnexion forcée et affichage d'une alerte explicite.

#### 2. Abonnement Expiré (Lecture Seule Sécurisée)
* **Bandeau Persistant** : Un bandeau d'alerte rouge écarlate s'affiche en haut de toutes les pages du Directeur, l'informant que son abonnement a expiré.
* **Accès aux données maintenu** : Le directeur peut naviguer librement, voir ses anciennes données, analyser ses bilans et fiches élèves (valeur d'usage conservée).
* **Verrouillage d'écriture Zustand** : Une méthode de garde `checkAbonnement` intercepte instantanément toutes les actions d'écriture asynchrones du store `useSchoolStore.ts`. Au lieu de lever une exception globale non gérée (qui ferait planter le runtime Next.js), elle retourne proprement `{ success: false, error: "..." }`.
* **Toast d'Erreur Bloquant** : Toutes les fenêtres de création/édition interceptent ce retour et affichent instantanément un toast rouge bloquant, en maintenant le formulaire ouvert pour ne pas faire perdre la saisie utilisateur au cas où il renouvellerait son abonnement.

---

## 📐 5. Règles Métier & Formules Mathématiques Critiques

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

### 4. Filtrage d'Année Scolaire Active
> [!IMPORTANT]
> **Règle absolue d'inscription** : Un élève n'existe dans les effectifs comptabilisés, les feuilles d'appel et la saisie de notes que s'il possède une inscription active validée (`statut === 'validee'`) pour l'année scolaire sélectionnée en Header. Les raccourcis historiques `e.classeId` et `e.statut` ne doivent **JAMAIS** servir de fallback si l'inscription de l'année en cours est absente.

---

## 🎨 6. Design System & Identité Visuelle
Le projet arbore une esthétique premium de type "Fintech/SaaS moderne" inspirée des codes visuels ivoiriens :

* **Couleurs** :
  * Émeraude (`--primary` : `#059669`) : symbolise la croissance, l'éducation et la réussite.
  * Ambre/Or (`--accent` : `#F59E0B`) : apporte une touche chaleureuse, rappelant le prestige et la lumière.
  * Ardoise Sombre (`--sidebar-bg` : `#0F172A`) : pour une sidebar sobre et professionnelle.
* **Typographie** : `Sora` (titres géométriques accrocheurs) & `DM Sans` (corps de texte optimisé pour la lecture).
* **Mise en page** : Ratios aérés, coins arrondis adoucis (`rounded-xl` / `rounded-2xl`), cartes épurées avec de subtils ombrages et bordures translucides.

---

## 🤖 7. Instructions Importantes pour un Futur Modèle d'IA

Si vous êtes un modèle d'IA chargé de modifier, déboguer ou faire évoluer ce codebase, suivez scrupuleusement ces consignes :

### 1. Gestion des Écritures & Gardes d'Abonnement
Avant d'ajouter ou de modifier une action d'écriture (mutation de données) dans le store `useSchoolStore.ts`, vous **devez** :
* Appeler `checkAbonnement(state)` en haut de la fonction.
* Retourner un objet au format `{ success: false, error: "Message explicite" }` en cas d'échec pour éviter de faire planter le thread client.
* Ne jamais lever une exception brute (`throw new Error`) dans les méthodes asynchrones du store appelées par des callbacks d'UI.

### 2. Typage strict TypeScript (Zéro `any`)
* N'utilisez **JAMAIS** le type `any`. Si un type est complexe, déclarez une interface explicite dans `src/types/index.ts`.
* Toutes les entités (`Eleve`, `Classe`, `Inscription`, `Paiement`, `User`) doivent utiliser les structures du fichier de types centralisé.

### 3. Cohérence Linguistique & UX
* Toute l'interface utilisateur, y compris les formulaires, boutons, placeholders, messages d'erreurs et toasts de confirmation, doit être rédigée **exclusivement en français**.
* Utilisez des données de démonstration réalistes et typiques de l'Afrique de l'Ouest (noms de famille ivoiriens : Kouadio, Koné, Diallo, Diomandé ; numéros au format `+225` ; montants en `FCFA`).

### 4. Respect des Server/Client Components
* Laissez les composants en Server Components par défaut.
* N'ajoutez la directive `'use client'` que si le composant requiert explicitement des hooks React interactifs (`useState`, `useEffect`, `useRef`) ou des événements (`onClick`, `onChange`).
* Veillez à découper vos composants de formulaire complexes pour ne pas dépasser la limite conseillée de 250 lignes par fichier.
