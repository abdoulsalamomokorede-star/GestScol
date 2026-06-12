import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Crée un client Supabase avec les privilèges d'administration (service_role).
 * À utiliser EXCLUSIVEMENT côté serveur (Server Actions, API Routes) pour les opérations critiques
 * qui doivent contourner les politiques RLS.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables d\'environnement Supabase privées manquantes pour le client d\'administration.')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
