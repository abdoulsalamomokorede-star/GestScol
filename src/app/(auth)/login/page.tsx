'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { User, UserRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import logoImg from '@/app/logo.png'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const currentUser = useSchoolStore(state => state.currentUser)
  const setCurrentUser = useSchoolStore(state => state.setCurrentUser)
  const currentEcoleId = useSchoolStore(state => state.ecole.id)
  const clearSchoolData = useSchoolStore(state => state.clearSchoolData)

  useEffect(() => {
    // Check if the cookie actually exists. If not, the session expired (e.g., browser closed)
    // but localStorage (Zustand) still has the user. This causes an infinite loop with middleware.
    const hasCookie = document.cookie.includes('currentUser=')
    
    if (currentUser) {
      if (!hasCookie) {
        // Desynchronization detected: Cookie expired but localStorage persisted.
        // We must log them out locally to break the loop.
        setCurrentUser(null)
      } else {
        // Both exist, safe to redirect
        if (currentUser.role === 'enseignant') {
          router.push('/enseignant/dashboard')
        } else if (currentUser.role === 'parent') {
          router.push('/parent/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    }
  }, [currentUser, router, setCurrentUser])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError || !data.user) {
        setError('Email ou mot de passe incorrect.')
        setIsLoading(false)
        return
      }

      // Récupérer le profil utilisateur et son école
      const { data: profile, error: profileError } = await supabase
        .from('utilisateurs')
        .select('*, ecoles(*)')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        setError("Profil introuvable. Veuillez contacter l'administrateur.")
        setIsLoading(false)
        return
      }

      if (profile.role !== 'directeur') {
        setError("Accès refusé. Cet espace est réservé aux directeurs.")
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      const userProfile: User = {
        id: profile.id,
        nom: profile.nom,
        prenom: profile.prenom,
        email: profile.email,
        telephone: profile.telephone,
        role: profile.role,
        ecoleId: profile.ecole_id,
        civilite: profile.civilite
      }

      // Si l'utilisateur se connecte pour une autre école, on vide le cache local
      // pour ne pas afficher les données du précédent directeur
      if (profile.ecole_id !== currentEcoleId && profile.ecoles) {
        clearSchoolData({
          id: profile.ecoles.id,
          nom: profile.ecoles.nom,
          identifiant: profile.ecoles.identifiant,
          ville: profile.ecoles.ville,
          adresse: profile.ecoles.adresse,
          telephone: profile.ecoles.telephone,
          logo: profile.ecoles.logo,
          anneeScolaire: profile.ecoles.annee_scolaire
        })
      }

      // Sauvegarde session locale pour le middleware MVP
      setCurrentUser(userProfile)
      
      if (userProfile.role === 'enseignant') {
        router.push('/enseignant/dashboard')
      } else if (userProfile.role === 'parent') {
        router.push('/parent/dashboard')
      } else {
        router.push('/dashboard')
      }
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
        <p className="text-muted-foreground mt-2 font-medium">La gestion scolaire simplifiée en Afrique de l&apos;Ouest</p>
      </div>

      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Espace Directeur</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder au tableau de bord de votre école
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nom@ecole.ci" 
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
              Nouveau sur GestScol ?{" "}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-primary hover:underline font-bold"
              >
                Inscrivez et abonnez votre école ici
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
