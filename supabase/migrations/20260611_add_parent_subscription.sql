-- Add parent_subscription_status column to the public.utilisateurs table
ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS parent_subscription_status character varying DEFAULT 'gratuit';
