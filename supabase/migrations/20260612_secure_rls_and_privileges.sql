-- Migration : Renforcement de la sécurité RLS & Prévention de l'élévation de privilèges
-- Date: 2026-06-12
-- Auteur: Antigravity

-- 1. Trigger de sécurité pour interdire la modification du rôle/email et verrouiller l'école
CREATE OR REPLACE FUNCTION public.check_user_school_association()
RETURNS trigger AS $$
BEGIN
  -- Si l'appelant utilise la clé service_role (le client d'administration), on autorise toutes les modifications.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 1. Empêcher la modification de son propre rôle.
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Modification du rôle non autorisée.';
  END IF;

  -- 2. Empêcher la modification de son propre email.
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    RAISE EXCEPTION 'Modification de l''adresse email non autorisée.';
  END IF;

  -- 3. Empêcher la modification de son propre ecole_id s'il est déjà défini.
  IF OLD.ecole_id IS NOT NULL AND OLD.ecole_id IS DISTINCT FROM NEW.ecole_id THEN
    RAISE EXCEPTION 'Modification de l''établissement d''origine (ecole_id) non autorisée.';
  END IF;

  -- 4. Vérifier l'association de ecole_courante_id si elle est modifiée.
  IF NEW.ecole_courante_id IS NOT NULL AND OLD.ecole_courante_id IS DISTINCT FROM NEW.ecole_courante_id THEN
    -- Vérification pour le directeur
    IF NEW.role = 'directeur'::public.user_role THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.ecoles 
        WHERE id = NEW.ecole_courante_id AND directeur_id = NEW.id
      ) AND NEW.ecole_courante_id <> COALESCE(NEW.ecole_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        RAISE EXCEPTION 'Accès refusé. Vous n''êtes pas propriétaire de cet établissement.';
      END IF;
    -- Vérification pour l'enseignant
    ELSIF NEW.role = 'enseignant'::public.user_role THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.enseignant_ecoles 
        WHERE ecole_id = NEW.ecole_courante_id AND enseignant_id = NEW.id AND actif = true
      ) AND NEW.ecole_courante_id <> COALESCE(NEW.ecole_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        RAISE EXCEPTION 'Accès refusé. Vous n''êtes pas enseignant dans cet établissement.';
      END IF;
    -- Vérification pour le parent
    ELSIF NEW.role = 'parent'::public.user_role THEN
      IF NOT public.check_parent_linked_to_school(NEW.ecole_courante_id, NEW.id) 
         AND NEW.ecole_courante_id <> COALESCE(NEW.ecole_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        RAISE EXCEPTION 'Accès refusé. Aucun enfant ne vous associe à cet établissement.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attacher le trigger
DROP TRIGGER IF EXISTS tr_check_user_school_association ON public.utilisateurs;
CREATE TRIGGER tr_check_user_school_association
BEFORE UPDATE ON public.utilisateurs
FOR EACH ROW EXECUTE FUNCTION public.check_user_school_association();


-- 2. Nettoyage des anciennes politiques laxistes sur les notifications
DROP POLICY IF EXISTS "Lecture notifications école" ON public.notifications;
DROP POLICY IF EXISTS "Insertion notifications directeur" ON public.notifications;
DROP POLICY IF EXISTS "Suppression notifications directeur" ON public.notifications;


-- 3. Sécurisation de la table notifications_lectures
DROP POLICY IF EXISTS "Enregistrement lectures utilisateur" ON public.notifications_lectures;
DROP POLICY IF EXISTS "Lecture lectures utilisateur" ON public.notifications_lectures;

-- Créer une politique d'isolation étanche pour les lectures de notifications
CREATE POLICY "lectures_self_all" ON public.notifications_lectures
  FOR ALL USING (utilisateur_id = auth.uid()) WITH CHECK (utilisateur_id = auth.uid());
