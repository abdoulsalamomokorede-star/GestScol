-- ==============================================================================
-- GESTSCOL - MIGRATION FIX USER PERMISSIONS & RLS RECURSION (Bug Fix)
-- Date: 2026-06-01
-- Auteur: Antigravity
-- Description: 
--   1. Remplacer la sélection directe sur auth.users par auth.jwt() ->> 'email'
--      pour éviter l'erreur "permission denied for table users".
--   2. Créer des fonctions SECURITY DEFINER pour ecoles, eleves, et enseignant_ecoles
--      afin de contourner le RLS dans les sous-requêtes RLS et briser la récursion infinie.
-- ==============================================================================

-- ── 1. FONCTIONS D'AIDE EN SECURITY DEFINER ──

-- Vérifie si un parent est lié à un établissement
CREATE OR REPLACE FUNCTION public.check_parent_linked_to_school(p_ecole_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_linked boolean;
BEGIN
  -- Récupérer l'email à partir du JWT
  v_email := auth.jwt() ->> 'email';
  
  SELECT EXISTS (
    SELECT 1 FROM public.eleves e
    WHERE e.ecole_id = p_ecole_id AND (
      (v_email IS NOT NULL AND LOWER(e.parent_email) = LOWER(v_email))
      OR
      e.id::text IN (
        SELECT unnest(eleves_associes) FROM public.comptes_connexion
        WHERE id = p_user_id
      )
    )
  ) INTO v_linked;
  
  RETURN coalesce(v_linked, false);
END;
$$;

-- Vérifie si un enseignant est lié à un établissement
CREATE OR REPLACE FUNCTION public.check_enseignant_linked_to_school(p_ecole_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_linked boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.enseignant_ecoles ee
    WHERE ee.ecole_id = p_ecole_id AND ee.enseignant_id = p_user_id AND ee.actif = true
    UNION
    SELECT 1 FROM public.eleves e
    JOIN public.classes c ON c.id = e.classe_id
    WHERE e.ecole_id = p_ecole_id AND c.enseignant_principal_id = p_user_id
  ) INTO v_linked;
  
  RETURN coalesce(v_linked, false);
END;
$$;

-- Vérifie si un directeur possède un établissement (brise la récursion de ecoles/eleves)
CREATE OR REPLACE FUNCTION public.check_directeur_owns_school(p_ecole_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owns boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.ecoles
    WHERE id = p_ecole_id AND directeur_id = p_user_id
  ) INTO v_owns;
  
  RETURN coalesce(v_owns, false);
END;
$$;


-- ── 2. POLICES REDÉFINIES SUR LA TABLE ECOLES ──
DROP POLICY IF EXISTS "ecoles_parent_select" ON public.ecoles;
CREATE POLICY "ecoles_parent_select" ON public.ecoles
  FOR SELECT USING (
    public.check_parent_linked_to_school(id, auth.uid())
  );

DROP POLICY IF EXISTS "ecoles_enseignant_select" ON public.ecoles;
CREATE POLICY "ecoles_enseignant_select" ON public.ecoles
  FOR SELECT USING (
    public.check_enseignant_linked_to_school(id, auth.uid())
  );


-- ── 3. POLICES REDÉFINIES SUR LA TABLE ELEVES ──
DROP POLICY IF EXISTS "eleves_parent_select" ON public.eleves;
CREATE POLICY "eleves_parent_select" ON public.eleves
  FOR SELECT USING (
    LOWER(parent_email) = LOWER(coalesce(auth.jwt() ->> 'email', ''))
    OR id::text IN (SELECT unnest(eleves_associes) FROM public.comptes_connexion WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "ecriture_eleves_directeur" ON public.eleves;
CREATE POLICY "ecriture_eleves_directeur" ON public.eleves
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND 
    (ecole_id = public.get_auth_user_ecole_id() OR public.check_directeur_owns_school(ecole_id, auth.uid()))
  );


-- ── 4. POLICES REDÉFINIES SUR LA TABLE NOTES ──
DROP POLICY IF EXISTS "notes_parent_select" ON public.notes;
CREATE POLICY "notes_parent_select" ON public.notes
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e
      WHERE LOWER(e.parent_email) = LOWER(coalesce(auth.jwt() ->> 'email', ''))
      UNION
      SELECT (unnest(eleves_associes))::uuid FROM public.comptes_connexion WHERE id = auth.uid()
    )
  );


-- ── 5. POLICES REDÉFINIES SUR LA TABLE ABSENCES ──
DROP POLICY IF EXISTS "absences_parent_select" ON public.absences;
CREATE POLICY "absences_parent_select" ON public.absences
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e
      WHERE LOWER(e.parent_email) = LOWER(coalesce(auth.jwt() ->> 'email', ''))
      UNION
      SELECT (unnest(eleves_associes))::uuid FROM public.comptes_connexion WHERE id = auth.uid()
    )
  );


-- ── 6. POLICES REDÉFINIES SUR LA TABLE PAIEMENTS ──
DROP POLICY IF EXISTS "paiements_parent_select" ON public.paiements;
CREATE POLICY "paiements_parent_select" ON public.paiements
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e
      WHERE LOWER(e.parent_email) = LOWER(coalesce(auth.jwt() ->> 'email', ''))
      UNION
      SELECT (unnest(eleves_associes))::uuid FROM public.comptes_connexion WHERE id = auth.uid()
    )
  );


-- ── 7. POLICES REDÉFINIES SUR LA TABLE BULLETINS ──
DROP POLICY IF EXISTS "bulletins_parent_select" ON public.bulletins;
CREATE POLICY "bulletins_parent_select" ON public.bulletins
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e
      WHERE LOWER(e.parent_email) = LOWER(coalesce(auth.jwt() ->> 'email', ''))
      UNION
      SELECT (unnest(eleves_associes))::uuid FROM public.comptes_connexion WHERE id = auth.uid()
    ) AND est_valide = true
  );
