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
import { Sparkles } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageToggle from '@/components/layout/LanguageToggle'

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

  const { t, dir } = useTranslation()

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
          setError(t('toast.too_many_attempts_error', "Trop de tentatives de connexion échouées. Par mesure de sécurité, votre compte est temporairement bloqué. Veuillez réessayer dans quelques minutes."))
        } else if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("load failed")) {
          setError(t('toast.network_error', "Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet et réessayer."))
        } else {
          const nextAttempts = failedAttempts + 1
          if (nextAttempts >= 5) {
            setFailedAttempts(0)
            setLockoutSeconds(300)
            setError(t('toast.too_many_attempts_error', "Trop de tentatives de connexion échouées. Par mesure de sécurité, votre compte est temporairement bloqué. Veuillez réessayer dans quelques minutes."))
          } else {
            setFailedAttempts(nextAttempts)
            setError(t('toast.invalid_credentials', 'Email ou mot de passe incorrect.'))
          }
        }
        return
      }

      // Fetch the profile from utilisateurs table with retry
      const { profile, error: retryError } = await chargerProfilAvecRetry(supabase, authData.user.id)
      
      if (retryError || !profile) {
        const msg = retryError?.message?.toLowerCase() || ""
        if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("load failed")) {
          setError(t('toast.network_error', "Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet et réessayer."))
        } else {
          setError(t('toast.profile_not_found', "Profil introuvable. Veuillez contacter l'administrateur."))
        }
        return
      }

      if (profile.role !== 'parent') {
        setError(t('toast.access_denied_role_parent', "Accès refusé. Cet espace est réservé aux parents."))
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
        photoUrl: profile.photo_url || undefined,
        parentSubscriptionStatus: profile.parent_subscription_status || 'gratuit'
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
        setError(t('toast.too_many_attempts_error', "Trop de tentatives de connexion échouées. Par mesure de sécurité, votre compte est temporairement bloqué. Veuillez réessayer dans quelques minutes."))
      } else if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("load failed") || err instanceof TypeError) {
        setError(t('toast.network_error', "Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet et réessayer."))
      } else {
        setError(t('toast.login_error', 'Une erreur est survenue lors de la connexion.'))
      }
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background animate-fadeIn relative" dir="ltr">
      {/* Panneau Gauche - Photo en plein écran 100% claire, colorée et visible */}
      <div className="hidden md:block md:flex-1 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-100"
          style={{ backgroundImage: `url('/parent_login_bg.png')` }}
        />
        {/* Un léger dégradé blanc sur le bord droit uniquement pour fusionner avec la bordure du formulaire */}
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white dark:from-background to-transparent" />
      </div>

      {/* Panneau Droit - Formulaire et Identité de marque sur fond blanc clair */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 md:max-w-md lg:max-w-lg xl:max-w-xl bg-white dark:bg-card border-l border-border dark:border-border/40 shadow-sm text-start relative" dir={dir}>
        {/* Sélecteur de langue absolu sur le formulaire */}
        <div className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-50`}>
          <LanguageToggle />
        </div>
        <div className="space-y-6 my-auto">
          <div className="flex flex-col items-center md:items-start text-center md:text-start">
            <Link href="/" className="mb-4 transition-transform duration-300 hover:scale-105 cursor-pointer">
              <img src={logoImg.src} alt="GestScol Logo" className="h-16 w-auto object-contain" />
            </Link>
            <h1 className="text-3xl font-display font-extrabold text-text tracking-wide mt-2">GestScol</h1>
            <p className="text-muted-foreground mt-1 font-medium text-center md:text-start text-sm">
              {t('landing.hero.subtitle', "La gestion scolaire simplifiée en Afrique de l'Ouest")}
            </p>
          </div>

          <div className="space-y-4 text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/35 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-200/50">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('login.parent_space', "Portail Famille")}</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed hidden md:block text-start">
              {t('login.parent_desc', "Connectez-vous pour suivre la scolarité de vos enfants, consulter leurs notes trimestrielles, vérifier les paiements et justifier leurs absences.")}
            </p>
          </div>

          <Card className="w-full shadow-lg border-border/50 text-start">
            <CardHeader className="space-y-1 text-center bg-blue-50/50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 rounded-t-xl pb-4">
              <CardTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">{t('login.title', "Connexion")}</CardTitle>
              <CardDescription>
                {t('login.desc_parent', "Connectez-vous pour suivre la scolarité de vos enfants")}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-6 text-start">
                {error && (
                  <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-md text-sm font-medium text-start">
                    {lockoutSeconds > 0 
                      ? `${t('toast.too_many_attempts_error', "Trop de tentatives de connexion échouées. Par mesure de sécurité, votre compte est temporairement bloqué. Veuillez réessayer dans")} ${formatLockoutTime(lockoutSeconds)}.`
                      : error
                    }
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-start block">{t('login.email', "Adresse e-mail")}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder={t('login.placeholder_email_parent', "ex: parent@email.com")} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="focus-visible:ring-primary text-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-start block">{t('login.password', "Mot de passe")}</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="focus-visible:ring-primary text-start"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  disabled={isLoading || lockoutSeconds > 0}
                >
                  {isLoading ? t('login.signing_in', 'Connexion en cours...') : lockoutSeconds > 0 
                    ? `${t('login.locked', "Bloqué")} (Réessayer dans ${Math.floor(lockoutSeconds / 60)}m)` 
                    : t('login.signin', 'Se connecter')}
                </Button>

                <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/40 w-full">
                  {t('login.not_parent', "Vous n'êtes pas parent ?")}{" "}
                  <Link href="/" className="text-primary hover:underline font-bold">
                    {t('login.back_home', "Retour à l'accueil")}
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="text-xs text-muted-foreground text-center md:text-start pt-6 border-t border-border/40">
          <p>{t('login.copyright', "© {year} GestScol. Tous droits réservés.").replace('{year}', new Date().getFullYear().toString())}</p>
        </div>
      </div>
    </div>
  )
}
