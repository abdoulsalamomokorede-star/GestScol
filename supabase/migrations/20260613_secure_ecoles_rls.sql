-- Migration : Sécurisation de la table ecoles et comptes_connexion (OWASP / Multi-Tenant Hardening)
-- Date: 2026-06-13
-- Auteur: Antigravity

-- 1. Supprimer la politique d'insertion wildcard sur la table ecoles
DROP POLICY IF EXISTS "insert_ecole_signup" ON public.ecoles;

-- 2. Nettoyer les anciennes politiques de la table comptes_connexion
DROP POLICY IF EXISTS "comptes_connexion_select" ON public.comptes_connexion;
DROP POLICY IF EXISTS "comptes_connexion_write_directeur" ON public.comptes_connexion;
DROP POLICY IF EXISTS "comptes_connexion_write" ON public.comptes_connexion;

-- 3. Recréer la politique de lecture sécurisée multi-tenant pour comptes_connexion
CREATE POLICY "comptes_connexion_select" ON public.comptes_connexion
  FOR SELECT USING (
    (id = auth.uid())
    OR
    (
      public.get_auth_user_role() = 'directeur'::public.user_role 
      AND EXISTS (
        SELECT 1 FROM public.utilisateurs u
        WHERE u.id = comptes_connexion.id 
          AND u.ecole_id = public.get_auth_user_ecole_id()
      )
    )
  );

-- 4. Recréer la politique d'écriture (INSERT, UPDATE, DELETE) sécurisée multi-tenant pour comptes_connexion
CREATE POLICY "comptes_connexion_write" ON public.comptes_connexion
  FOR ALL USING (
    (id = auth.uid())
    OR
    (
      public.get_auth_user_role() = 'directeur'::public.user_role 
      AND EXISTS (
        SELECT 1 FROM public.utilisateurs u
        WHERE u.id = comptes_connexion.id 
          AND u.ecole_id = public.get_auth_user_ecole_id()
      )
    )
  )
  WITH CHECK (
    (id = auth.uid())
    OR
    (
      public.get_auth_user_role() = 'directeur'::public.user_role 
      AND EXISTS (
        SELECT 1 FROM public.utilisateurs u
        WHERE u.id = comptes_connexion.id 
          AND u.ecole_id = public.get_auth_user_ecole_id()
      )
    )
  );
