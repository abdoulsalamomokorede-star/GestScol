'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import logoImg from '@/app/logo.png'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import Link from 'next/link'

export default function EnseignantLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const currentUser = useSchoolStore(state => state.currentUser)
  const setCurrentUser = useSchoolStore(state => state.setCurrentUser)
  const ecole = useSchoolStore(state => state.ecole)

  useEffect(() => {
    const hasCookie = document.cookie.includes('currentUser=')
    if (currentUser) {
      if (!hasCookie) {
        setCurrentUser(null)
      } else if (currentUser.role === 'enseignant') {
        router.push('/enseignant/dashboard')
      }
    }
  }, [currentUser, router, setCurrentUser])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError || !authData.user) {
        setError('E-mail ou mot de passe incorrect.')
        setIsLoading(false)
        return
      }

      // Fetch the profile from utilisateurs table
      const { data: profile, error: profileError } = await supabase
        .from('utilisateurs')
        .select('*, ecoles(*)')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        setError("Profil introuvable. Veuillez contacter l'administrateur.")
        setIsLoading(false)
        return
      }

      if (profile.role !== 'enseignant') {
        setError("Accès refusé. Cet espace est réservé aux enseignants.")
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      const userProfile: User = {
        id: profile.id,
        nom: profile.nom,
        prenom: profile.prenom,
        email: profile.email || '',
        telephone: profile.telephone || '',
        role: 'enseignant',
        ecoleId: profile.ecole_id,
        civilite: profile.civilite || 'M.'
      }

      setCurrentUser(userProfile)
      router.push('/enseignant/dashboard')
      
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de la connexion.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <Link href="/" className="mb-4 transition-transform duration-300 hover:scale-105 cursor-pointer">
          <img src={logoImg.src} alt="GestScol Logo" className="h-20 w-auto object-contain" />
        </Link>
        <h1 className="text-3xl font-display font-extrabold text-text tracking-wide mt-2">GestScol</h1>
      </div>

      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-1 text-center bg-slate-50 border-b border-border/50 rounded-t-xl pb-6">
          <CardTitle className="text-2xl font-bold text-primary">Espace Enseignant</CardTitle>
          <CardDescription>
            Connectez-vous avec votre adresse e-mail professionnelle
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="ex: enseignant@ecole.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
              </div>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-dark text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/40 w-full">
              Vous n'êtes pas enseignant ?{" "}
              <Link href="/" className="text-primary hover:underline font-bold">
                Retour à l'accueil
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
