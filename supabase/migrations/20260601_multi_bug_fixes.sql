-- ==============================================================================
-- GESTSCOL - MIGRATION CORRECTION MULTI-BUG (SQL & RLS)
-- Date: 2026-06-01
-- Auteur: Antigravity
-- ==============================================================================

-- ── 1. TABLE INVITATIONS ENSEIGNANT (Bug 2 & 9) ──
CREATE TABLE IF NOT EXISTS public.invitations_enseignant (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id      UUID NOT NULL REFERENCES public.ecoles(id) ON DELETE CASCADE,
  directeur_id  UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  email_cible   TEXT NOT NULL,
  code          TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8)),
  expire_le     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  utilise       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ecole_id, email_cible)
);

ALTER TABLE public.invitations_enseignant ENABLE ROW LEVEL SECURITY;

-- Polices RLS Invitations
DROP POLICY IF EXISTS "invitations_directeur_all" ON public.invitations_enseignant;
CREATE POLICY "invitations_directeur_all" ON public.invitations_enseignant
  FOR ALL USING (directeur_id = auth.uid()) WITH CHECK (directeur_id = auth.uid());

DROP POLICY IF EXISTS "invitations_code_select" ON public.invitations_enseignant;
CREATE POLICY "invitations_code_select" ON public.invitations_enseignant
  FOR SELECT USING (NOT utilise AND expire_le > NOW());

-- Polices RLS Junction enseignant_ecoles (Bug 2)
DROP POLICY IF EXISTS "enseignant_ecoles_directeur_all" ON public.enseignant_ecoles;
CREATE POLICY "enseignant_ecoles_directeur_all" ON public.enseignant_ecoles
  FOR ALL USING (
    ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid())
  ) WITH CHECK (
    ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid())
  );

DROP POLICY IF EXISTS "enseignant_ecoles_self_select" ON public.enseignant_ecoles;
CREATE POLICY "enseignant_ecoles_self_select" ON public.enseignant_ecoles
  FOR SELECT USING (enseignant_id = auth.uid());

-- ── 2. POLICES D'ACCÈS PARENTS (Bug 7 & 8) ──
-- Correction des politiques d'élèves pour parents
DROP POLICY IF EXISTS "parent_lire_ses_enfants" ON public.eleves;
DROP POLICY IF EXISTS "eleves_parent_select" ON public.eleves;
CREATE POLICY "eleves_parent_select" ON public.eleves
  FOR SELECT USING (
    LOWER(parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    OR id::text IN (SELECT unnest(eleves_associes) FROM public.comptes_connexion WHERE id = auth.uid())
  );

-- Polices notes pour parent
DROP POLICY IF EXISTS "notes_parent_select" ON public.notes;
CREATE POLICY "notes_parent_select" ON public.notes
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e
      WHERE LOWER(e.parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
      UNION
      SELECT (unnest(eleves_associes))::uuid FROM public.comptes_connexion WHERE id = auth.uid()
    )
  );

-- Polices absences pour parent
DROP POLICY IF EXISTS "absences_parent_select" ON public.absences;
CREATE POLICY "absences_parent_select" ON public.absences
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e
      WHERE LOWER(e.parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
      UNION
      SELECT (unnest(eleves_associes))::uuid FROM public.comptes_connexion WHERE id = auth.uid()
    )
  );

-- Polices paiements pour parent
DROP POLICY IF EXISTS "paiements_parent_select" ON public.paiements;
CREATE POLICY "paiements_parent_select" ON public.paiements
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e
      WHERE LOWER(e.parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
      UNION
      SELECT (unnest(eleves_associes))::uuid FROM public.comptes_connexion WHERE id = auth.uid()
    )
  );

-- Polices bulletins pour parent
DROP POLICY IF EXISTS "bulletins_parent_select" ON public.bulletins;
CREATE POLICY "bulletins_parent_select" ON public.bulletins
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e
      WHERE LOWER(e.parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
      UNION
      SELECT (unnest(eleves_associes))::uuid FROM public.comptes_connexion WHERE id = auth.uid()
    ) AND est_valide = true
  );

-- ── 3. POLICES ABSENCES DIRECTEUR & ENSEIGNANT (Bug 10) ──
DROP POLICY IF EXISTS "absences_directeur_select" ON public.absences;
CREATE POLICY "absences_directeur_select" ON public.absences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.eleves e
      WHERE e.id = absences.eleve_id AND e.ecole_id IN (
        SELECT id FROM public.ecoles WHERE directeur_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "absences_enseignant_select" ON public.absences;
CREATE POLICY "absences_enseignant_select" ON public.absences
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e
      JOIN public.classes c ON c.id = e.classe_id
      WHERE c.enseignant_principal_id = auth.uid()
    )
  );

-- ── 4. POLICES NOTIFICATIONS FILTRÉES (Bug 8) ──
DROP POLICY IF EXISTS "lecture_notifications_ecole" ON public.notifications;
DROP POLICY IF EXISTS "lecture_notifications_directeur" ON public.notifications;
CREATE POLICY "lecture_notifications_directeur" ON public.notifications
  FOR SELECT USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND
    (ecole_id = public.get_auth_user_ecole_id())
  );

DROP POLICY IF EXISTS "lecture_notifications_autres" ON public.notifications;
CREATE POLICY "lecture_notifications_autres" ON public.notifications
  FOR SELECT USING (
    (public.get_auth_user_role() IN ('enseignant'::user_role, 'parent'::user_role)) AND
    (ecole_id = public.get_auth_user_ecole_id()) AND
    (destinataire_role = public.get_auth_user_role()::text OR destinataire_role = 'tous' OR destinataire_role = 'all')
  );
