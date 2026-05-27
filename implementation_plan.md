# Plan d'implémentation — Peaufinage & Améliorations Étape 8 (Suivi des paiements)

Ce plan détaille les modifications à apporter au module de gestion et de suivi des paiements de **GestionScol** afin de corriger les problèmes de visibilité identifiés (contrastes), de permettre le paiement de la scolarité en plusieurs fois (acomptes / tranches), de structurer formellement le reçu de paiement avec un support d'impression et d'export PDF haut de gamme, et d'ajouter une interface complète de gestion des tarifs scolaires par classe.

---

## User Review Required

> [!IMPORTANT]
> **Résolution de l'affichage des Modales (Scroll & Hauteur)**
> - Les modales d'encaissement et de reçu pouvaient déborder et masquer leurs boutons de validation (Annuler/Imprimer/Valider) sur les écrans à faible hauteur.
> - Nous allons appliquer des styles de hauteur maximale et de défilement vertical (`max-h-[90vh] overflow-y-auto`) à ces boîtes de dialogue pour garantir que tous les boutons soient toujours accessibles et visibles par défilement interne.

> [!IMPORTANT]
> **Annulation / Suppression d'un Versement Erroné (Sécurité Directeur)**
> - Nous allons implémenter la possibilité d'annuler ou de supprimer un versement spécifique enregistré par erreur.
> - **Sécurité & Rôle** : Seul le **Directeur** aura le droit d'annuler un versement.
> - **Logique Métier (Zustand)** :
>   - Supprimer le versement ciblé dans `historiquePaiements` par son index.
>   - Soustraire son montant de `montantPaye`.
>   - Recalculer dynamiquement le statut : si le paiement n'est plus soldé (`montantPaye < montant`), le statut repasse en `'retard'` (si la date limite est dépassée) ou en `'en_attente'`.
>   - Réajuster la date de paiement, le mode et la référence d'après le dernier versement valide restant (ou réinitialiser si aucun versement ne subsiste).
> - **Interface Utilisateur** :
>   - Dans le tableau des versements du Reçu (`RecuModal.tsx`), si l'utilisateur connecté est un Directeur, une icône de corbeille rouge (ou un bouton "Annuler") sera affichée à côté de chaque ligne de versement.
>   - Une confirmation sécurisée (`window.confirm`) sera demandée avant de procéder à l'annulation définitive du versement.

> [!IMPORTANT]
> **Paiement de la scolarité en plusieurs fois (Installments)**
> Nous allons enrichir la modale d'encaissement. Au lieu de payer directement la totalité du montant dû en une fois, le Directeur pourra saisir un **montant de versement**.
> - Par défaut, le montant proposé est égal au solde restant dû (`montant - montantPaye`).
> - Le directeur peut saisir n'importe quel montant supérieur à `0` et inférieur ou égal à ce solde.
> - Le statut passera à `'paye'` uniquement si le cumul des versements atteint ou dépasse le montant total dû. Sinon, il restera dans son statut actuel (`'en_attente'` ou `'retard'`), mais avec un indicateur clair du montant payé.
> - Chaque versement sera enregistré dans l'historique avec sa date, son montant, son mode de paiement (Espèces, Wave, Orange Money, MTN MoMo) et sa référence de transaction.

> [!TIP]
> **Reçu Financier Multi-Versements & Export PDF / Impression Pro**
> Le reçu de caisse sera complètement révisé pour afficher un tableau détaillé de tous les versements partiels effectués. Il affichera clairement :
> 1. Le **Montant total dû** pour le frais concerné (ex: 70 000 FCFA).
> 2. L'**Historique détaillé** (date, montant, mode et référence de chaque versement).
> 3. Le **Total déjà réglé** (ex: 50 000 FCFA).
> 4. Le **Solde restant à payer** (ex: 20 000 FCFA).
> Ce format est optimisé pour l'impression A4 et l'export PDF. 
> * **Nom de fichier PDF personnalisé** : Lors du clic sur "Imprimer / Exporter en PDF", le titre de la page sera temporairement changé pour `Recu_Paiement_MATRICULE_NOM.pdf` afin que le fichier enregistré par le navigateur porte un nom professionnel et automatique.
> * **Rendu d'impression parfait** : Des règles CSS `@media print` sophistiquées seront ajoutées pour centrer verticalement le reçu en A4, forcer une couleur de texte très contrastée (noir pur) et masquer tous les éléments d'arrière-plan du site.

> [!NOTE]
> **Gestion des Scolarités (Tarifs par classe & Recouvrement)**
> Un nouvel onglet **"Gestion des Scolarités"** sera ajouté à la page des paiements pour les Directeurs. Il permettra de :
> - Consulter un tableau de toutes les classes avec les KPIs clés de scolarité : effectif, montant de la scolarité par élève, total théorique dû, montant effectivement collecté, reste à recouvrer et taux de recouvrement de la classe.
> - Ajuster le montant de la scolarité trimestrielle pour chaque classe à l'aide d'une boîte de dialogue de mise à jour rapide.

---

## Proposed Changes

### 1. Store Zustand

#### [MODIFY] [useSchoolStore.ts](file:///d:/Mes%20Projets%20Vibe-Coding/GestionScol/src/store/useSchoolStore.ts)
- Ajouter l'implémentation de la fonction `enregistrerPaiementInstallment` dans le store.
- **[NOUVEAU]** Ajouter l'implémentation de `annulerVersement` dans le store :
  ```typescript
  annulerVersement: (paiementId: string, versementIdx: number) => void
  ```
  Cette fonction va :
  - Trouver le paiement concerné.
  - Soustraire le montant du versement supprimé de `montantPaye`.
  - Retirer le versement de `historiquePaiements` à l'index donné.
  - Recalculer le `statut` : si `montantPaye < montant`, repasser le statut à `'retard'` (si la date limite du paiement est dépassée par rapport à aujourd'hui) ou `'en_attente'`.
  - Mettre à jour `modePaiement` et `reference` d'après le dernier versement restant dans l'historique (ou les réinitialiser si l'historique devient vide).
- Ajouter et implémenter l'action `updateClasseScolarite` pour modifier le tarif de scolarité d'une classe.

---

### 2. Composants de Paiement

#### [MODIFY] [PaiementModal.tsx](file:///d:/Mes%20Projets%20Vibe-Coding/GestionScol/src/components/paiements/PaiementModal.tsx)
- Mettre à jour l'affichage de la fiche de dette (Montant total dû, Cumul réglé, Reste à payer).
- **[CORRECTION AFFICHAGE]** Ajouter les classes `max-h-[90vh] overflow-y-auto` sur le `DialogContent` pour empêcher que les boutons de validation soient tronqués en bas d'écran.
- Valider et enregistrer le versement en appelant `enregistrerPaiementInstallment`.

#### [MODIFY] [RecuModal.tsx](file:///d:/Mes%20Projets%20Vibe-Coding/GestionScol/src/components/paiements/RecuModal.tsx)
- **Correction des contrastes du Badge "En retard"** :
  - Remplacer le système de badge avec classes `bg-danger`/`bg-success` par l'utilisation de `variant="outline"` avec des classes HSL très élégantes et sans conflit, à savoir :
    - *Payé* : `bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30`
    - *En retard* : `bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30`
    - *En attente* : `bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30`
- **Correction du bouton "Reçu" au survol** :
  - Ajouter les classes de survol explicites sur les boutons outline `Reçu` de la table :
    `hover:bg-primary hover:text-white hover:border-primary transition-all duration-200`
    Cela évite que le texte devienne blanc sur fond clair lors du survol et offre une transition visuelle de qualité premium.
- **Ajout de l'onglet "Gestion des Scolarités" (Directeur uniquement)** :
  - Remplacer la vue Directeur simple par un système d'onglets (utilisant les composants `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` de shadcn/ui).
  - **Onglet 1 : "Suivi des Règlements"** : Contient l'interface actuelle (KPIs financiers, barre de filtres avancés, liste/table des paiements avec actions d'encaissement et de reçu).
  - **Onglet 2 : "Gestion des Scolarités"** :
    - Affiche une grille ou table des classes.
    - Pour chaque classe, calcule dynamiquement :
      - L'effectif d'élèves.
      - Le tarif de scolarité trimestriel (`montantScolarite` de la classe).
      - Le total théorique dû (basé sur le type de frais scolarité générés pour les élèves de la classe).
      - Le montant collecté à ce jour.
      - Le reste à recouvrer.
      - Le taux de recouvrement sous forme de badge de performance coloré ou de mini-barre de progression.
    - Propose un bouton d'action **"Ajuster le tarif"** ouvrant un dialogue interactif (`Dialog`) pour saisir un nouveau montant de scolarité trimestrielle pour la classe et mettre à jour le store en direct.

---

## Verification Plan

### Tests Fonctionnels (Paiements partiels)
1. **Accéder au Suivi des Paiements** en tant que Directeur (`directeur@flamboyants.ci`).
2. Choisir un élève ayant un paiement "En attente" ou "En retard" (ex: Kouassi Grace, scolarité de 70 000 FCFA).
3. Cliquer sur **Encaisser**.
4. Constater que la fiche résume bien :
   - Montant total dû : 70 000 FCFA.
   - Montant déjà payé : 0 FCFA.
   - Reste à payer : 70 000 FCFA.
5. Saisir un versement partiel de **30 000 FCFA** par espèces et valider.
6. Constater le Toast de succès et s'assurer que le paiement reste affiché avec son statut actuel (ex. "En attente"), mais affiche maintenant :
   - Cumul réglé : 30 000 FCFA.
   - Reste à payer : 40 000 FCFA.
7. Cliquer sur **Reçu** pour ce même élève. S'assurer que le reçu de caisse détaille :
   - Un unique versement de 30 000 FCFA à la date du jour.
   - Un Total Dû de 70 000 FCFA.
   - Un Total Réglé de 30 000 FCFA.
   - Un Solde restant de 40 000 FCFA.
8. Recommencer l'encaissement pour cet élève en saisissant cette fois **20 000 FCFA** par Wave (référence: `WV-2026-T2`).
9. Valider et vérifier que le montant total collecté passe à 50 000 FCFA et le reste à 20 000 FCFA.
10. Ouvrir à nouveau le reçu : il doit maintenant lister les **deux versements distincts** dans le tableau avec leurs modes respectifs (Espèces et Wave), avec le solde mis à jour à 20 000 FCFA.
11. Effectuer le dernier versement de **20 000 FCFA** (ou plus) pour solder la scolarité. Constater que le statut du paiement passe automatiquement à **"Payé"** (badge vert) et que le solde restant sur le reçu est de **0 FCFA** avec la mention de solde intégral.

### Tests d'Impression & Export PDF
1. Ouvrir le reçu d'un paiement partiel ou total.
2. Cliquer sur le bouton **Imprimer / Exporter en PDF**.
3. Dans la boîte de dialogue d'impression, constater que le titre du fichier PDF suggéré est bien structuré : `Recu_REC-X_MATRICULE.pdf`.
4. S'assurer visuellement dans la prévisualisation que les éléments inutiles (boutons fermer/imprimer, sidebar du site) sont totalement masqués et que le reçu occupe proprement une page A4 avec une excellente visibilité.

### Tests d'Interface (Visibilité & Gestion)
1. **Vérification des contrastes** :
   - S'assurer que le badge "En retard" est parfaitement lisible avec son texte rouge foncé sur fond rouge très clair.
   - Survoler le bouton "Reçu" : s'assurer qu'il passe au vert foncé avec son texte en blanc très net.
2. **Gestion des scolarités** :
   - Cliquer sur le nouvel onglet **"Gestion des Scolarités"**.
   - Vérifier la présence du tableau récapitulatif des classes et de leurs taux de recouvrement.
   - Cliquer sur **Ajuster le tarif** pour l'une des classes (ex: "CM2 A").
   - Entrer un nouveau montant (ex: modifier de 75 000 FCFA à 80 000 FCFA) et valider.
   - Vérifier que la modification s'applique instantanément dans le tableau.
