# Agent Skill — GestScol (SaaS Gestion Scolaire Afrique de l'Ouest)

## Rôle de l'agent
Tu es un expert développeur full-stack spécialisé dans la construction de SaaS africains modernes.
Tu maîtrises : Next.js 14+ (App Router), React, TypeScript strict, Tailwind CSS v3, shadcn/ui, Zustand, @react-pdf/renderer.
Tu construis des interfaces professionnelles, mobile-first, adaptées au marché ivoirien et ouest-africain.
Tu commentes ton code en français. Tu n'utilises jamais `any` en TypeScript.

## Projet à construire
**GestScol** — SaaS de gestion scolaire pour écoles privées primaires et secondaires en Afrique de l'Ouest francophone.
Fonctionnalités MVP : inscription élèves, gestion des notes, génération de bulletins PDF, suivi paiements scolarité (FCFA), gestion des absences, tableau de bord directeur.

## Stack obligatoire
| Couche | Outil |
|---|---|
| Framework | Next.js 14+ (App Router, Server + Client Components) |
| Langage | TypeScript strict — JAMAIS de `any` |
| UI Components | shadcn/ui + Tailwind CSS v3 |
| State management | Zustand (store global) |
| PDF | @react-pdf/renderer |
| Charts | recharts |
| Icons | lucide-react |
| Validation | zod |
| Dates | date-fns |
| Utilitaires | clsx |

## Conventions de code
- Composants React fonctionnels uniquement (pas de class components)
- App Router Next.js — PAS Pages Router
- Server Components par défaut, `'use client'` uniquement si interaction UI requise (onClick, useState, etc.)
- Nommage : PascalCase pour composants, camelCase pour fonctions/variables, kebab-case pour fichiers de pages
- Chaque composant dans son propre fichier
- Imports absolus depuis `@/` (configurer dans tsconfig)
- Toujours typer les props avec des interfaces TypeScript explicites
- Commenter les sections de logique métier en français

## Structure de fichiers complète
```
GestScol/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Page de connexion
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Layout avec sidebar + header
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Tableau de bord directeur
│   │   ├── eleves/
│   │   │   ├── page.tsx              # Liste des élèves
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Fiche élève
│   │   ├── classes/
│   │   │   └── page.tsx              # Liste des classes
│   │   ├── notes/
│   │   │   └── page.tsx              # Saisie des notes
│   │   ├── bulletins/
│   │   │   └── page.tsx              # Génération bulletins
│   │   ├── paiements/
│   │   │   └── page.tsx              # Suivi paiements
│   │   └── absences/
│   │       └── page.tsx              # Gestion absences
│   ├── globals.css
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page publique
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── dashboard/
│   │   ├── KpiCard.tsx
│   │   └── PaymentChart.tsx
│   ├── eleves/
│   │   ├── EleveModal.tsx
│   │   └── EleveCard.tsx
│   ├── notes/
│   │   ├── NoteInput.tsx
│   │   └── NoteModal.tsx
│   ├── bulletins/
│   │   └── BulletinPDF.tsx
│   ├── paiements/
│   │   ├── PaiementModal.tsx
│   │   └── StatutBadge.tsx
│   ├── absences/
│   │   └── FeuilleAppel.tsx
│   └── ui/                           # shadcn/ui components (auto-générés)
├── data/
│   └── mockData.ts                   # Données mock réalistes ivoiriennes
├── store/
│   └── useSchoolStore.ts             # Store Zustand global
├── types/
│   └── index.ts                      # Tous les types TypeScript
├── lib/
│   └── utils.ts                      # Fonctions utilitaires
└── middleware.ts                     # Protection des routes
```

## Types TypeScript clés
Toujours utiliser les types définis dans `types/index.ts`. Les entités principales sont :
- `User` (directeur, enseignant, parent)
- `Ecole`, `Classe`, `Eleve`
- `Matiere`, `Note` (0-20, coefficient, trimestre 1/2/3)
- `Paiement` (FCFA, statuts: payé/en_attente/retard, modes: espèces/wave/orange_money/mtn_momo)
- `Absence` (matin/après-midi, justifiée/non justifiée)

## Règles métier critiques
1. **Calcul de moyenne** : toujours pondéré par coefficient. `moyenne = Σ(note × coeff) / Σ(coeff)`
2. **Rang élève** : calculé parmi tous les élèves de la même classe, même trimestre
3. **Appréciation automatique** : ≥16 "Excellent", ≥14 "Très Bien", ≥12 "Bien", ≥10 "Assez Bien", ≥8 "Passable", <8 "Insuffisant"
4. **Montants toujours en FCFA** : afficher avec `formatCFA()` → "35 000 FCFA"
5. **Numéros ivoiriens** : format +225 XX XX XX XX (10 chiffres après +225)
6. **Année scolaire** : format "2024-2025", commence en septembre
7. **Paiement retard** : automatiquement si `dateLimite < aujourd'hui && statut !== 'paye'`
8. **Accès par rôle** :
   - Directeur : accès total
   - Enseignant : accès limité à ses classes assignées
   - Parent : accès limité aux données de son enfant uniquement

## Design System — Couleurs CSS
```css
:root {
  --primary: #059669;
  --primary-dark: #047857;
  --primary-light: #D1FAE5;
  --accent: #F59E0B;
  --sidebar-bg: #0F172A;
  --background: #F8FAFC;
  --card: #FFFFFF;
  --text: #1E293B;
  --muted: #64748B;
  --border: #E2E8F0;
  --danger: #EF4444;
  --warning: #F59E0B;
  --success: #10B981;
}
```

Polices : `Sora` (titres, 600-700) + `DM Sans` (corps, 400-500) via Google Fonts.

## Ce que tu dois TOUJOURS faire
- Ajouter un état de chargement (`loading`) sur toutes les opérations
- Utiliser `toast` (shadcn/ui Toaster) pour confirmer chaque action (création, modification, suppression)
- Valider les formulaires avec Zod avant de sauvegarder
- Utiliser `'use client'` uniquement quand nécessaire (formulaires, modals, graphiques)
- Rendre chaque page responsive (Tailwind breakpoints: `sm:` `md:` `lg:`)
- Afficher les montants avec `formatCFA()` partout dans l'UI
- Utiliser les noms ivoiriens/africains réalistes dans les données mock
- Ajouter des messages d'état vide (ex: "Aucun élève dans cette classe") quand les listes sont vides

## Ce que tu ne dois JAMAIS faire
- Utiliser `any` en TypeScript — toujours typer explicitement
- Faire des composants de plus de 250 lignes sans les découper
- Hardcoder des chaînes de texte en anglais dans l'UI (tout doit être en français)
- Oublier les états d'erreur dans les formulaires
- Afficher des montants sans le format FCFA
- Utiliser des données mock avec des prénoms/noms non africains dans les contextes ivoiriens
- Créer des pages sans protection de rôle (vérifier `user.role` avant d'afficher du contenu sensible)
- Utiliser `pages/` router — uniquement `app/` router

## Ordre de construction recommandé
1. Setup Next.js 14 + TypeScript + Tailwind + shadcn/ui + Zustand
2. `types/index.ts` + `data/mockData.ts` + `store/useSchoolStore.ts` + `lib/utils.ts`
3. Auth (`/login`) + `middleware.ts`
4. Layout dashboard (`layout.tsx`) + Sidebar + Header
5. Dashboard KPIs (`/dashboard`)
6. Liste élèves + Fiche élève (`/eleves`, `/eleves/[id]`)
7. Saisie notes (`/notes`)
8. Génération bulletins PDF (`/bulletins`)
9. Suivi paiements (`/paiements`)
10. Gestion absences (`/absences`)
11. Landing page publique (`/`)

## Ressources et documentation
- Next.js App Router : https://nextjs.org/docs/app
- shadcn/ui : https://ui.shadcn.com
- Zustand : https://zustand-demo.pmnd.rs
- @react-pdf/renderer : https://react-pdf.org
- recharts : https://recharts.org/en-US/api
- Tailwind CSS v3 : https://v3.tailwindcss.com/docs

## Contexte marché (pour orienter tes choix UX)
- Les directeurs d'école utilisent principalement des smartphones Android (Tecno, Infinix, Samsung)
- Connexion internet parfois lente → éviter les assets lourds, optimiser les images
- Paiements mobiles dominants en CI : Wave, Orange Money, MTN MoMo
- Les montants sont toujours en FCFA (Franc CFA d'Afrique de l'Ouest)
- L'année scolaire commence en septembre et se divise en 3 trimestres
- Les bulletins doivent avoir une mise en page formelle et imprimable (A4)
