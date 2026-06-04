-- Migration : Sécurisation de la table abonnements et audit_suppressions
-- Date: 2026-06-04
-- Auteur: Antigravity

-- 1. Nettoyer les politiques permissives sur la table 'abonnements'
DROP POLICY IF EXISTS "Autoriser l'insertion d'abonnements" ON public.abonnements;
DROP POLICY IF EXISTS "Autoriser la mise à jour d'abonnements" ON public.abonnements;
DROP POLICY IF EXISTS "Allow auth read access to abonnements" ON public.abonnements;
DROP POLICY IF EXISTS "Lecture abonnement école" ON public.abonnements;

-- 2. Créer une politique de lecture stricte pour les abonnements
CREATE POLICY "Lecture abonnement école" ON public.abonnements
  FOR SELECT TO authenticated
  USING (ecole_id = public.get_auth_user_ecole_id());

-- Note : Pas de politiques d'insertion, modification ou suppression pour abonnements.
-- Cela garantit que seules les opérations via les Server Actions (client admin) sont autorisées.

-- 3. Ajouter une politique d'insertion pour la table 'audit_suppressions'
DROP POLICY IF EXISTS "directeur_insert_audit" ON public.audit_suppressions;
CREATE POLICY "directeur_insert_audit" ON public.audit_suppressions
  FOR INSERT TO authenticated
  WITH CHECK (directeur_id = auth.uid());
