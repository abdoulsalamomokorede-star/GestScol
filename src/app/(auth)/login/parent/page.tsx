'use client'

import { useState, useEffect, useRef } from 'react'
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

const chargerProfilAvecRetry = async (supabase: any, userId: string, maxAttempts = 3, delay = 500) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: profile, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profile) {
      return { profile, error: null }
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delay * attempt))
    } else {
      return { profile: null, error: error || new Error("Profil introuvable après plusieurs tentatives.") }
    }
  }
  return { profile: null, error: new Error("Profil introuvable.") }
}

export default function ParentLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const submittingRef = useRef(false)

  const router = useRouter()
  const currentUser = useSchoolStore(state => state.currentUser)
  const setCurrentUser = useSchoolStore(state => state.setCurrentUser)
  const ecole = useSchoolStore(state => state.ecole)

  useEffect(() => {
    const hasCookie = document.cookie.includes('currentUser=')
    if (currentUser) {
      if (!hasCookie) {
        setCurrentUser(null)
      } else if (currentUser.role === 'parent') {
        router.push('/ecoles')
      }
    }
  }, [currentUser, router, setCurrentUser])

  // 1. Charger le sessionStorage de manière sécurisée après le montage
  useEffect(() => {
    const savedAttempts = sessionStorage.getItem('failedAttempts_parent')
    if (savedAttempts) {
      setFailedAttempts(parseInt(savedAttempts, 10))
    }

    const lockoutUntil = sessionStorage.getItem('lockoutUntil_parent')
    if (lockoutUntil) {
      const remaining = Math.ceil((parseInt(lockoutUntil, 10) - Date.now()) / 1000)
      if (remaining > 0) {
        setLockoutSeconds(remaining)
      } else {
        sessionStorage.removeItem('lockoutUntil_parent')
      }
    }
    setIsLoaded(true)
  }, [])

  // 2. Persister failedAttempts uniquement après chargement complet
  useEffect(() => {
    if (!isLoaded) return
    sessionStorage.setItem('failedAttempts_parent', failedAttempts.toString())
  }, [failedAttempts, isLoaded])

  // 3. Persister lockoutSeconds uniquement après chargement complet
  useEffect(() => {
    if (!isLoaded) return
    if (lockoutSeconds > 0) {
      const lockoutUntil = Date.now() + lockoutSeconds * 1000
      sessionStorage.setItem('lockoutUntil_parent', lockoutUntil.toString())
    } else {
      sessionStorage.removeItem('lockoutUntil_parent')
    }
  }, [lockoutSeconds, isLoaded])

  // 4. Décompte du verrouillage
  useEffect(() => {
    if (lockoutSeconds <= 0) return
    const timer = setInterval(() => {
      setLockoutSeconds(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutSeconds])

  const formatLockoutTime = (seconds: number) => {
    if (seconds > 60) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes} minute${minutes > 1 ? 's' : ''} ${remainingSeconds > 0 ? `et ${remainingSeconds} seconde${remainingSeconds > 1 ? 's' : ''}` : ''}`
    }
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockoutSeconds > 0 || submittingRef.current) return
    
    submittingRef.current = true
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError || !authData.user) {
        const msg = authError?.message?.toLowerCase() || ""
        const status = authError?.status
        
        if (status === 429 || msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("once per minute")) {
          setLockoutSeconds(300) // Verrouillage temporaire de 5 minutes
          setFailedAttempts(0)
          setError("Trop de tentatives de connexion échouées. Par mesure de sécurité, votre compte est temporairement bloqué. Veuillez réessayer dans quelques minutes.")
        } else if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("load failed")) {
          setError("Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet et réessayer.")
        } else {
          const nextAttempts = failedAttempts + 1
          if (nextAttempts >= 5) {
            setFailedAttempts(0)
            setLockoutSeconds(300)
            setError("Trop de tentatives de connexion échouées. Par mesure de sécurité, votre compte est temporairement bloqué. Veuillez réessayer dans quelques minutes.")
          } else {
            setFailedAttempts(nextAttempts)
            setError('E-mail ou mot de passe incorrect.')
          }
        }
        return
      }

      // Fetch the profile from utilisateurs table with retry
      const { profile, error: retryError } = await chargerProfilAvecRetry(supabase, authData.user.id)
      
      if (retryError || !profile) {
        const msg = retryError?.message?.toLowerCase() || ""
        if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("load failed")) {
          setError("Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet et réessayer.")
        } else {
          setError("Profil introuvable. Veuillez contacter l'administrateur.")
        }
        return
      }

      if (profile.role !== 'parent') {
        setError("Accès refusé. Cet espace est réservé aux parents.")
        await supabase.auth.signOut()
        return
      }

      const userProfile: User = {
        id: profile.id,
        nom: profile.nom,
        prenom: profile.prenom,
        email: profile.email || '',
        telephone: profile.telephone || '',
        role: 'parent',
        ecoleId: profile.ecole_id,
        civilite: profile.civilite || 'M.',
        photoUrl: profile.photo_url || undefined
      }

      // Réinitialiser les tentatives infructueuses en cas de succès
      setFailedAttempts(0)
      sessionStorage.removeItem('failedAttempts_parent')

      setCurrentUser(userProfile)
      window.location.href = '/ecoles'
      
    } catch (err: any) {
      console.error(err)
      const msg = err?.message?.toLowerCase() || ""
      const status = err?.status
      
      if (status === 429 || msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("once per minute")) {
        setLockoutSeconds(300)
        setFailedAttempts(0)
        setError("Trop de tentatives de connexion échouées. Par mesure de sécurité, votre compte est temporairement bloqué. Veuillez réessayer dans quelques minutes.")
      } else if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("load failed") || err instanceof TypeError) {
        setError("Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet et réessayer.")
      } else {
        setError('Une erreur est survenue lors de la connexion.')
      }
    } finally {
      setIsLoading(false)
      submittingRef.current = false
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
        <CardHeader className="space-y-1 text-center bg-blue-50/50 border-b border-blue-100 rounded-t-xl pb-6">
          <CardTitle className="text-2xl font-bold text-blue-600">Espace Parent</CardTitle>
          <CardDescription>
            Connectez-vous pour suivre la scolarité de vos enfants
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-md text-sm font-medium">
                {lockoutSeconds > 0 
                  ? `Trop de tentatives de connexion échouées. Par mesure de sécurité, votre compte est temporairement bloqué. Veuillez réessayer dans ${formatLockoutTime(lockoutSeconds)}.`
                  : error
                }
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="ex: parent@email.com" 
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              disabled={isLoading || lockoutSeconds > 0}
            >
              {isLoading ? 'Connexion en cours...' : lockoutSeconds > 0 
                ? `Bloqué (Réessayer dans ${Math.floor(lockoutSeconds / 60)}m ${lockoutSeconds % 60}s)` 
                : 'Se connecter'}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/40 w-full">
              Vous n'êtes pas parent ?{" "}
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
