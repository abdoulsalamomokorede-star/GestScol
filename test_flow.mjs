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

const adminAuthClient = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY'],
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testAdminFlow() {
  const email = `testflow_${Date.now()}@test.com`;
  
  // 1. Manually add an Enseignant
  const { data: ut, error: utErr } = await adminAuthClient.from('utilisateurs').insert({
    nom: 'FlowTest',
    prenom: 'P',
    role: 'enseignant',
    email: email
  }).select().single()

  if (utErr) {
    console.error('Error inserting:', utErr)
    return
  }
  
  const oldId = ut.id;
  console.log('Inserted Enseignant with ID:', oldId);

  // 2. Now simulate admin.ts
  const { data: existingUsers } = await adminAuthClient.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find(u => u.email === email)
  
  let authUserId;
  if (existingUser) {
    console.log('User already exists in auth');
    authUserId = existingUser.id;
  } else {
    console.log('Creating user in auth');
    const { data, error } = await adminAuthClient.auth.admin.createUser({
      email,
      password: 'Password123!',
      email_confirm: true
    })
    if (error) {
       console.error('Error creating auth user:', error);
       return;
    }
    authUserId = data.user.id;
  }
  
  console.log('Auth user id:', authUserId);
  
  if (oldId && authUserId !== oldId) {
      console.log('Updating oldId to authUserId...');
      const { error: updateIdError } = await adminAuthClient
        .from('utilisateurs')
        .update({ id: authUserId })
        .eq('id', oldId)
        
      if (updateIdError) {
        console.warn("Could not update oldId:", updateIdError)
      } else {
        console.log("Updated id successfully")
      }
  }
  
  console.log('Upserting...');
  const { error: dbError } = await adminAuthClient
      .from('utilisateurs')
      .upsert({
        id: authUserId,
        role: 'enseignant',
        email: email,
        nom: 'FlowTest',
        prenom: 'P',
      }, { onConflict: 'id' })

  if (dbError) {
      console.error('Upsert failed:', dbError);
  } else {
      console.log('Upsert succeeded!');
  }
  
  await adminAuthClient.auth.admin.deleteUser(authUserId);
  await adminAuthClient.from('utilisateurs').delete().eq('id', authUserId);
  await adminAuthClient.from('utilisateurs').delete().eq('id', oldId);
}

testAdminFlow()
