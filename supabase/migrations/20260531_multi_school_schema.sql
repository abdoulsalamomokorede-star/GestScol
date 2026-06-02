-- ==============================================================================
-- GESTSCOL - MIGRATION MULTI-ECOLE & CRÉATION DE COMPTE PAR RÔLE
-- ==============================================================================

-- 1. Ajout de ecole_courante_id dans public.utilisateurs
ALTER TABLE public.utilisateurs
  ADD COLUMN IF NOT EXISTS ecole_courante_id UUID
    REFERENCES public.ecoles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.utilisateurs.ecole_courante_id IS
  'Dernière école sélectionnée par l''utilisateur sur la page /ecoles. NULL = forcer la sélection.';

-- 2. Indexation de parent_email pour recherche insensible à la casse
CREATE INDEX IF NOT EXISTS idx_eleves_parent_email
  ON public.eleves(LOWER(parent_email));

-- 3. Table de jointure public.enseignant_ecoles
CREATE TABLE IF NOT EXISTS public.enseignant_ecoles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enseignant_id UUID NOT NULL
    REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  ecole_id    UUID NOT NULL
    REFERENCES public.ecoles(id) ON DELETE CASCADE,
  date_assignation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(enseignant_id, ecole_id)
);

CREATE INDEX IF NOT EXISTS idx_enseignant_ecoles_enseignant ON public.enseignant_ecoles(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_enseignant_ecoles_ecole ON public.enseignant_ecoles(ecole_id);

-- Activer RLS pour enseignant_ecoles
ALTER TABLE public.enseignant_ecoles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour public.enseignant_ecoles
DROP POLICY IF EXISTS "enseignant_ecoles_directeur_select" ON public.enseignant_ecoles;
CREATE POLICY "enseignant_ecoles_directeur_select" ON public.enseignant_ecoles
  FOR SELECT USING (
    ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid())
  );

DROP POLICY IF EXISTS "enseignant_ecoles_enseignant_select" ON public.enseignant_ecoles;
CREATE POLICY "enseignant_ecoles_enseignant_select" ON public.enseignant_ecoles
  FOR SELECT USING (enseignant_id = auth.uid());

DROP POLICY IF EXISTS "enseignant_ecoles_directeur_insert" ON public.enseignant_ecoles;
CREATE POLICY "enseignant_ecoles_directeur_insert" ON public.enseignant_ecoles
  FOR INSERT WITH CHECK (
    ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid())
  );

DROP POLICY IF EXISTS "enseignant_ecoles_directeur_delete" ON public.enseignant_ecoles;
CREATE POLICY "enseignant_ecoles_directeur_delete" ON public.enseignant_ecoles
  FOR DELETE USING (
    ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid())
  );

-- 4. Table d'audit des suppressions d'écoles
CREATE TABLE IF NOT EXISTS public.audit_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  directeur_id UUID,
  ecole_id UUID,
  ecole_nom TEXT,
  nb_eleves_supprimes INT,
  nb_paiements_supprimes INT,
  nb_enseignants_supprimes INT,
  supprime_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_suppressions ENABLE ROW LEVEL SECURITY;

-- 5. Mise à jour des policies RLS de ecoles
DROP POLICY IF EXISTS "ecoles_directeur_select" ON public.ecoles;
CREATE POLICY "ecoles_directeur_select" ON public.ecoles
  FOR SELECT USING (directeur_id = auth.uid());

DROP POLICY IF EXISTS "ecoles_directeur_insert" ON public.ecoles;
CREATE POLICY "ecoles_directeur_insert" ON public.ecoles
  FOR INSERT WITH CHECK (directeur_id = auth.uid());

DROP POLICY IF EXISTS "ecoles_directeur_delete" ON public.ecoles;
CREATE POLICY "ecoles_directeur_delete" ON public.ecoles
  FOR DELETE USING (directeur_id = auth.uid());

DROP POLICY IF EXISTS "ecoles_enseignant_select" ON public.ecoles;
CREATE POLICY "ecoles_enseignant_select" ON public.ecoles
  FOR SELECT USING (
    id IN (
      SELECT ecole_id FROM public.enseignant_ecoles
      WHERE enseignant_id = auth.uid() AND actif = TRUE
    )
    OR
    id IN (
      SELECT DISTINCT e.ecole_id FROM public.eleves e
      JOIN public.classes c ON c.id = e.classe_id
              AND c.enseignant_principal_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ecoles_parent_select" ON public.ecoles;
CREATE POLICY "ecoles_parent_select" ON public.ecoles
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT e.ecole_id FROM public.eleves e
      WHERE LOWER(e.parent_email) = LOWER(
        (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
    OR
    id IN (
      SELECT DISTINCT e.ecole_id FROM public.eleves e
      JOIN public.comptes_connexion cc ON cc.eleve_id = e.id
      WHERE cc.id = auth.uid()
    )
  );
