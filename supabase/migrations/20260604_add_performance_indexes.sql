-- Migration: Ajout d'index de performance pour réduire les temps de chargement
CREATE INDEX IF NOT EXISTS idx_utilisateurs_ecole_id ON public.utilisateurs(ecole_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_ecole_id ON public.inscriptions(ecole_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_eleve_id ON public.inscriptions(eleve_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_classe_id ON public.inscriptions(classe_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_annee_scolaire ON public.inscriptions(annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_notes_eleve_id ON public.notes(eleve_id);
CREATE INDEX IF NOT EXISTS idx_absences_eleve_id ON public.absences(eleve_id);
CREATE INDEX IF NOT EXISTS idx_paiements_eleve_id ON public.paiements(eleve_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_eleve_id ON public.bulletins(eleve_id);
CREATE INDEX IF NOT EXISTS idx_matieres_classe_id ON public.matieres(classe_id);

-- Politique RLS pour permettre aux parents de lire les inscriptions de leurs enfants
DROP POLICY IF EXISTS inscriptions_parent_select ON public.inscriptions;
CREATE POLICY inscriptions_parent_select ON public.inscriptions
  FOR SELECT USING (
    eleve_id IN (
      SELECT e.id FROM public.eleves e 
      WHERE lower(e.parent_email) = lower(coalesce(auth.jwt()->>'email', ''))
         OR e.parent_user_id = auth.uid()
      UNION
      SELECT (unnest(cc.eleves_associes))::uuid AS unnest FROM public.comptes_connexion cc WHERE cc.id = auth.uid()
    )
  );
