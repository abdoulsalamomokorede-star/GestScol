import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...val] = line.split('=');
    if (key && val) {
      env[key.trim()] = val.join('=').trim().replace(/"/g, '');
    }
  }
});

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY'],
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkComptes() {
  const { data: c } = await supabase.from('comptes_connexion').select('*');
  console.log("Comptes_connexion:");
  c?.forEach(u => console.log(u.id, u.email, u.nom, u.prenom));
}

checkComptes()
