-- ==============================================================================
-- GESTSCOL - MIGRATION FIX CASCADE DELETE SUR ECOLE
-- ==============================================================================

-- 1. Supprimer l'ancienne contrainte ON DELETE CASCADE
ALTER TABLE public.utilisateurs 
  DROP CONSTRAINT IF EXISTS utilisateurs_ecole_id_fkey;

-- 2. Recréer la contrainte avec ON DELETE SET NULL pour préserver les comptes utilisateurs
ALTER TABLE public.utilisateurs 
  ADD CONSTRAINT utilisateurs_ecole_id_fkey 
  FOREIGN KEY (ecole_id) 
  REFERENCES public.ecoles(id) 
  ON DELETE SET NULL;
