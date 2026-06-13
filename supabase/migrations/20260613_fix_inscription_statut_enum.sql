-- Migration : Ajout de la valeur 'annulee' à l'enum inscription_statut
-- Date: 2026-06-13
-- Auteur: Antigravity

ALTER TYPE inscription_statut ADD VALUE IF NOT EXISTS 'annulee';
