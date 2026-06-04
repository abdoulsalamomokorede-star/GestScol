-- Mettre à jour la politique RLS pour permettre aux parents et enseignants de lire les notifications qu'ils ont créées
DROP POLICY IF EXISTS "lecture_notifications_autres" ON public.notifications;

CREATE POLICY "lecture_notifications_autres" ON public.notifications
  FOR SELECT USING (
    (public.get_auth_user_role() IN ('enseignant'::user_role, 'parent'::user_role)) AND
    (ecole_id = public.get_auth_user_ecole_id()) AND
    (
      destinataire_role = public.get_auth_user_role()::text OR 
      destinataire_role = 'tous' OR 
      destinataire_role = 'all' OR 
      cree_par = auth.uid()
    )
  );
