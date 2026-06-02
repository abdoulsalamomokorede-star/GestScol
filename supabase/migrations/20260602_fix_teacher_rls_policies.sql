-- ==============================================================================
-- GESTSCOL - MIGRATION FIX TEACHER RLS POLICIES (Bug Fix)
-- Date: 2026-06-02
-- Auteur: Antigravity
-- Description:
--   1. Permettre aux enseignants de lire les élèves de leur établissement actif.
--   2. Permettre la lecture des profils utilisateurs des enseignants associés
--      (dont la colonne ecole_id est NULL dans la table utilisateurs).
--   3. Corriger les politiques de la table de jointure enseignants_matieres.
--   4. Simplifier les politiques de la table comptes_connexion.
-- ==============================================================================

-- ── 1. POLICES SUR LA TABLE ELEVES ──
DROP POLICY IF EXISTS "eleves_enseignant_select" ON public.eleves;
CREATE POLICY "eleves_enseignant_select" ON public.eleves
  FOR SELECT USING (
    (public.get_auth_user_role() = 'enseignant'::user_role) AND
    (ecole_id = public.get_auth_user_ecole_id())
  );

-- ── 2. POLICES SUR LA TABLE UTILISATEURS ──
DROP POLICY IF EXISTS "utilisateurs_select" ON public.utilisateurs;
CREATE POLICY "utilisateurs_select" ON public.utilisateurs
  FOR SELECT USING (
    (ecole_id = public.get_auth_user_ecole_id())
    OR
    id IN (
      SELECT enseignant_id FROM public.enseignant_ecoles
      WHERE ecole_id = public.get_auth_user_ecole_id()
    )
  );

-- ── 3. POLICES SUR LA TABLE ENSEIGNANTS_MATIERES ──
DROP POLICY IF EXISTS "enseignants_matieres_select" ON public.enseignants_matieres;
CREATE POLICY "enseignants_matieres_select" ON public.enseignants_matieres
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enseignant_ecoles ee
      WHERE ee.enseignant_id = enseignants_matieres.enseignant_id AND ee.ecole_id = public.get_auth_user_ecole_id()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.utilisateurs u
      WHERE u.id = enseignants_matieres.enseignant_id AND u.ecole_id = public.get_auth_user_ecole_id()
    )
  );

-- ── 4. POLICES SUR LA TABLE COMPTES_CONNEXION ──
DROP POLICY IF EXISTS "comptes_connexion_select" ON public.comptes_connexion;
CREATE POLICY "comptes_connexion_select" ON public.comptes_connexion
  FOR SELECT USING (
    (id = auth.uid())
    OR
    (public.get_auth_user_role() = 'directeur'::user_role)
  );

DROP POLICY IF EXISTS "comptes_connexion_write_directeur" ON public.comptes_connexion;
CREATE POLICY "comptes_connexion_write_directeur" ON public.comptes_connexion
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role)
  );

-- ── 5. POLICES SUR LA TABLE CLASSES ET ELEVES POUR COMPTAGE ──
DROP POLICY IF EXISTS "lecture_classes_membres" ON public.classes;
CREATE POLICY "lecture_classes_membres" ON public.classes
  FOR SELECT USING (
    (ecole_id = public.get_auth_user_ecole_id())
    OR
    (public.get_auth_user_role() = 'enseignant'::user_role AND public.check_enseignant_linked_to_school(ecole_id, auth.uid()))
    OR
    (public.get_auth_user_role() = 'parent'::user_role AND public.check_parent_linked_to_school(ecole_id, auth.uid()))
  );

DROP POLICY IF EXISTS "eleves_enseignant_select" ON public.eleves;
CREATE POLICY "eleves_enseignant_select" ON public.eleves
  FOR SELECT USING (
    (public.get_auth_user_role() = 'enseignant'::user_role) AND
    (public.check_enseignant_linked_to_school(ecole_id, auth.uid()))
  );
