-- ==============================================================================
-- GESTSCOL - SCHEMA SUPABASE (Mise à jour pour les Abonnements)
-- Ajoutez ceci à votre base de données existante.
-- ==============================================================================

-- ==========================================
-- 1. ENUMS pour les abonnements
-- ==========================================
CREATE TYPE abonnement_plan AS ENUM ('gratuit', 'standard', 'premium');
CREATE TYPE abonnement_statut AS ENUM ('actif', 'expire', 'suspendu', 'en_attente');

-- ==========================================
-- 2. TABLE: abonnements
-- ==========================================
CREATE TABLE public.abonnements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ecole_id UUID NOT NULL,
    plan abonnement_plan NOT NULL DEFAULT 'gratuit',
    statut abonnement_statut NOT NULL DEFAULT 'en_attente',
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_fin TIMESTAMP WITH TIME ZONE,
    transaction_ref VARCHAR(100),
    mode_paiement VARCHAR(50), -- Peut-être 'wave', 'orange_money', 'mtn_momo'
    montant_paye NUMERIC DEFAULT 0,
    max_eleves INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT abonnements_ecole_id_fkey FOREIGN KEY (ecole_id) REFERENCES public.ecoles(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. SECURITÉ RLS (Row Level Security)
-- ==========================================
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs (directeurs/enseignants/parents) peuvent lire l'abonnement de leur propre école
CREATE POLICY "Lecture abonnement école" ON public.abonnements
    FOR SELECT USING (ecole_id IN (SELECT ecole_id FROM public.utilisateurs WHERE email = auth.jwt()->>'email'));

-- ==========================================
-- 4. TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_abonnements_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_abonnements_updated_at 
BEFORE UPDATE ON public.abonnements 
FOR EACH ROW EXECUTE PROCEDURE update_abonnements_modtime();
