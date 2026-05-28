-- ==============================================================================
-- GESTSCOL - SCHEMA NOTIFICATIONS DYNAMIQUES D'ÉCOLE (SUPABASE)
-- Exécutez ce script dans l'éditeur de requêtes SQL de votre Dashboard Supabase.
-- ==============================================================================

-- ==========================================
-- 1. TABLES
-- ==========================================

-- Table principale des notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ecole_id UUID NOT NULL REFERENCES public.ecoles(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'systeme', -- 'communique', 'paiement', 'absence', 'bulletin', 'inscription', 'systeme'
    destinataire_role VARCHAR(50), -- 'parent', 'enseignant', 'all'
    classe_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    eleve_id UUID REFERENCES public.eleves(id) ON DELETE CASCADE,
    cree_par UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table de suivi de lecture par utilisateur
CREATE TABLE IF NOT EXISTS public.notifications_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    lu_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_notification_utilisateur UNIQUE (notification_id, utilisateur_id)
);

-- ==========================================
-- 2. INDEX DE PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_notifications_ecole ON public.notifications(ecole_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lectures_user ON public.notifications_lectures(utilisateur_id);

-- ==========================================
-- 3. SECURITÉ RLS (Row Level Security)
-- ==========================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_lectures ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table 'notifications'
CREATE POLICY "Lecture notifications école" ON public.notifications
    FOR SELECT USING (
        ecole_id = (SELECT ecole_id FROM public.utilisateurs WHERE email = auth.jwt()->>'email')
    );

CREATE POLICY "Insertion notifications directeur" ON public.notifications
    FOR INSERT WITH CHECK (
        ecole_id = (SELECT ecole_id FROM public.utilisateurs WHERE email = auth.jwt()->>'email' AND role = 'directeur')
    );

CREATE POLICY "Suppression notifications directeur" ON public.notifications
    FOR DELETE USING (
        ecole_id = (SELECT ecole_id FROM public.utilisateurs WHERE email = auth.jwt()->>'email' AND role = 'directeur')
    );

-- Politiques pour la table 'notifications_lectures'
CREATE POLICY "Lecture lectures utilisateur" ON public.notifications_lectures
    FOR SELECT USING (
        utilisateur_id = (SELECT id FROM public.utilisateurs WHERE email = auth.jwt()->>'email')
    );

CREATE POLICY "Enregistrement lectures utilisateur" ON public.notifications_lectures
    FOR ALL USING (
        utilisateur_id = (SELECT id FROM public.utilisateurs WHERE email = auth.jwt()->>'email')
    );
