-- Migration : Correction des politiques RLS pour le support multi-écoles dynamique
-- Date: 2026-05-31
-- Auteur: Antigravity

-- 1. Redéfinir get_auth_user_ecole_id() pour renvoyer dynamiquement l'école active
CREATE OR REPLACE FUNCTION public.get_auth_user_ecole_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(ecole_courante_id, ecole_id) FROM public.utilisateurs WHERE id = auth.uid();
$$;

-- 2. Recréation des politiques de classes
DROP POLICY IF EXISTS lecture_classes_membres ON public.classes;
DROP POLICY IF EXISTS ecriture_classes_directeur ON public.classes;

CREATE POLICY lecture_classes_membres ON public.classes
  FOR SELECT USING (ecole_id = public.get_auth_user_ecole_id());

CREATE POLICY ecriture_classes_directeur ON public.classes
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND 
    (ecole_id = public.get_auth_user_ecole_id() OR ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid()))
  );

-- 3. Recréation des politiques d'élèves
DROP POLICY IF EXISTS parent_lire_ses_enfants ON public.eleves;
DROP POLICY IF EXISTS ecriture_eleves_directeur ON public.eleves;

CREATE POLICY parent_lire_ses_enfants ON public.eleves
  FOR SELECT USING (
    ecole_id = public.get_auth_user_ecole_id() AND (
      public.get_auth_user_role() IN ('directeur'::user_role, 'enseignant'::user_role) OR
      parent_user_id = auth.uid()
    )
  );

CREATE POLICY ecriture_eleves_directeur ON public.eleves
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND 
    (ecole_id = public.get_auth_user_ecole_id() OR ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid()))
  );

-- 4. Recréation des politiques d'inscriptions
DROP POLICY IF EXISTS inscriptions_select ON public.inscriptions;
DROP POLICY IF EXISTS inscriptions_write_directeur ON public.inscriptions;

CREATE POLICY inscriptions_select ON public.inscriptions
  FOR SELECT USING (
    (public.get_auth_user_role() IN ('directeur'::user_role, 'enseignant'::user_role) AND ecole_id = public.get_auth_user_ecole_id()) OR
    (EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = inscriptions.eleve_id AND e.parent_user_id = auth.uid()))
  );

CREATE POLICY inscriptions_write_directeur ON public.inscriptions
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND 
    (ecole_id = public.get_auth_user_ecole_id() OR ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid()))
  );

-- 5. Recréation des politiques de matières
DROP POLICY IF EXISTS matieres_select ON public.matieres;
DROP POLICY IF EXISTS matieres_write_directeur ON public.matieres;

CREATE POLICY matieres_select ON public.matieres
  FOR SELECT USING (
    public.get_auth_user_ecole_id() = (SELECT c.ecole_id FROM public.classes c WHERE c.id = matieres.classe_id)
  );

CREATE POLICY matieres_write_directeur ON public.matieres
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND 
    (public.get_auth_user_ecole_id() = (SELECT c.ecole_id FROM public.classes c WHERE c.id = matieres.classe_id) OR 
     EXISTS (SELECT 1 FROM public.classes c WHERE c.id = matieres.classe_id AND c.ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid())))
  );

-- 6. Recréation des politiques de notes
DROP POLICY IF EXISTS lecture_notes_membres ON public.notes;
DROP POLICY IF EXISTS notes_write_staff ON public.notes;

CREATE POLICY lecture_notes_membres ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.eleves e 
      WHERE e.id = notes.eleve_id AND e.ecole_id = public.get_auth_user_ecole_id() AND (
        public.get_auth_user_role() IN ('directeur'::user_role, 'enseignant'::user_role) OR
        e.parent_user_id = auth.uid()
      )
    )
  );

CREATE POLICY notes_write_staff ON public.notes
  FOR ALL USING (
    public.get_auth_user_role() IN ('directeur'::user_role, 'enseignant'::user_role) AND
    EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = notes.eleve_id AND e.ecole_id = public.get_auth_user_ecole_id())
  );

-- 7. Recréation des politiques de paiements
DROP POLICY IF EXISTS lecture_paiements ON public.paiements;
DROP POLICY IF EXISTS paiements_write_directeur ON public.paiements;

CREATE POLICY lecture_paiements ON public.paiements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.eleves e 
      WHERE e.id = paiements.eleve_id AND e.ecole_id = public.get_auth_user_ecole_id() AND (
        public.get_auth_user_role() = 'directeur'::user_role OR
        e.parent_user_id = auth.uid()
      )
    )
  );

CREATE POLICY paiements_write_directeur ON public.paiements
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND
    EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = paiements.eleve_id AND (e.ecole_id = public.get_auth_user_ecole_id() OR e.ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid())))
  );

-- 8. Recréation des politiques d'absences
DROP POLICY IF EXISTS absences_select ON public.absences;
DROP POLICY IF EXISTS absences_write_staff ON public.absences;

CREATE POLICY absences_select ON public.absences
  FOR SELECT USING (
    (public.get_auth_user_role() IN ('directeur'::user_role, 'enseignant'::user_role) AND EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = absences.eleve_id AND e.ecole_id = public.get_auth_user_ecole_id())) OR
    (EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = absences.eleve_id AND e.parent_user_id = auth.uid()))
  );

CREATE POLICY absences_write_staff ON public.absences
  FOR ALL USING (
    public.get_auth_user_role() IN ('directeur'::user_role, 'enseignant'::user_role) AND
    EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = absences.eleve_id AND e.ecole_id = public.get_auth_user_ecole_id())
  );

-- 9. Recréation des politiques de bulletins
DROP POLICY IF EXISTS bulletins_select ON public.bulletins;
DROP POLICY IF EXISTS bulletins_write_directeur ON public.bulletins;

CREATE POLICY bulletins_select ON public.bulletins
  FOR SELECT USING (
    (public.get_auth_user_role() = 'directeur'::user_role AND EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = bulletins.eleve_id AND e.ecole_id = public.get_auth_user_ecole_id())) OR
    (EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = bulletins.eleve_id AND e.parent_user_id = auth.uid() AND bulletins.est_valide = true))
  );

CREATE POLICY bulletins_write_directeur ON public.bulletins
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND
    EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = bulletins.eleve_id AND (e.ecole_id = public.get_auth_user_ecole_id() OR e.ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid())))
  );

-- 10. Recréation des politiques de comptes de connexion simulés
DROP POLICY IF EXISTS comptes_connexion_select ON public.comptes_connexion;
DROP POLICY IF EXISTS comptes_connexion_write_directeur ON public.comptes_connexion;

CREATE POLICY comptes_connexion_select ON public.comptes_connexion
  FOR SELECT USING (
    (public.get_auth_user_role() = 'directeur'::user_role AND public.get_auth_user_ecole_id() = (SELECT ecole_id FROM public.utilisateurs WHERE id = comptes_connexion.id)) OR
    id = auth.uid()
  );

CREATE POLICY comptes_connexion_write_directeur ON public.comptes_connexion
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND
    (public.get_auth_user_ecole_id() = (SELECT ecole_id FROM public.utilisateurs WHERE id = comptes_connexion.id) OR 
     (SELECT ecole_id FROM public.utilisateurs WHERE id = comptes_connexion.id) IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid()))
  );

-- 11. Recréation des politiques de junction enseignants_matieres
DROP POLICY IF EXISTS enseignants_matieres_select ON public.enseignants_matieres;
DROP POLICY IF EXISTS enseignants_matieres_write_directeur ON public.enseignants_matieres;

CREATE POLICY enseignants_matieres_select ON public.enseignants_matieres
  FOR SELECT USING (
    public.get_auth_user_ecole_id() = (SELECT ecole_id FROM public.utilisateurs WHERE id = enseignants_matieres.enseignant_id)
  );

CREATE POLICY enseignants_matieres_write_directeur ON public.enseignants_matieres
  FOR ALL USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND
    (public.get_auth_user_ecole_id() = (SELECT ecole_id FROM public.utilisateurs WHERE id = enseignants_matieres.enseignant_id) OR
     (SELECT ecole_id FROM public.utilisateurs WHERE id = enseignants_matieres.enseignant_id) IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid()))
  );

-- 12. Recréation des politiques de notifications
DROP POLICY IF EXISTS lecture_notifications_ecole ON public.notifications;
DROP POLICY IF EXISTS insertion_notifications_directeur ON public.notifications;
DROP POLICY IF EXISTS suppression_notifications_directeur ON public.notifications;

CREATE POLICY lecture_notifications_ecole ON public.notifications
  FOR SELECT USING (
    ecole_id = public.get_auth_user_ecole_id()
  );

CREATE POLICY insertion_notifications_directeur ON public.notifications
  FOR INSERT WITH CHECK (
    (public.get_auth_user_role() = 'directeur'::user_role) AND
    (ecole_id = public.get_auth_user_ecole_id() OR ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid()))
  );

CREATE POLICY suppression_notifications_directeur ON public.notifications
  FOR DELETE USING (
    (public.get_auth_user_role() = 'directeur'::user_role) AND
    (ecole_id = public.get_auth_user_ecole_id() OR ecole_id IN (SELECT id FROM public.ecoles WHERE directeur_id = auth.uid()))
  );
