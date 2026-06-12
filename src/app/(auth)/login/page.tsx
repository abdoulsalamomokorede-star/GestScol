'use client'

import { useState, useEffect, useRef } from 'react'
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

export default function LoginPage() {
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
  const currentEcoleId = useSchoolStore(state => state.ecole.id)
  const clearSchoolData = useSchoolStore(state => state.clearSchoolData)
  
  const { t, dir, isAr } = useTranslation()

  useEffect(() => {
    const hasCookie = document.cookie.includes('currentUser=')
    
    if (currentUser) {
      if (!hasCookie) {
        setCurrentUser(null)
      } else {
        router.push('/ecoles')
      }
    }
  }, [currentUser, router, setCurrentUser])

  // 1. Charger le sessionStorage de manière sécurisée après le montage
  useEffect(() => {
    const savedAttempts = sessionStorage.getItem('failedAttempts')
    if (savedAttempts) {
      setFailedAttempts(parseInt(savedAttempts, 10))
    }

    const lockoutUntil = sessionStorage.getItem('lockoutUntil')
    if (lockoutUntil) {
      const remaining = Math.ceil((parseInt(lockoutUntil, 10) - Date.now()) / 1000)
      if (remaining > 0) {
        setLockoutSeconds(remaining)
      } else {
        sessionStorage.removeItem('lockoutUntil')
      }
    }
    setIsLoaded(true)
  }, [])

  // 2. Persister failedAttempts uniquement après chargement complet
  useEffect(() => {
    if (!isLoaded) return
    sessionStorage.setItem('failedAttempts', failedAttempts.toString())
  }, [failedAttempts, isLoaded])

  // 3. Persister lockoutSeconds uniquement après chargement complet
  useEffect(() => {
    if (!isLoaded) return
    if (lockoutSeconds > 0) {
      const lockoutUntil = Date.now() + lockoutSeconds * 1000
      sessionStorage.setItem('lockoutUntil', lockoutUntil.toString())
    } else {
      sessionStorage.removeItem('lockoutUntil')
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError || !data.user) {
        const msg = authError?.message?.toLowerCase() || ""
        const status = authError?.status
        
        if (status === 429 || msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("once per minute")) {
          setLockoutSeconds(300)
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

      const { profile, error: retryError } = await chargerProfilAvecRetry(supabase, data.user.id)

      if (retryError || !profile) {
        const msg = retryError?.message?.toLowerCase() || ""
        if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("load failed")) {
          setError(t('toast.network_error', "Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet et réessayer."))
        } else {
          setError(t('toast.profile_not_found', "Profil introuvable. Veuillez contacter l'administrateur."))
        }
        return
      }

      if (profile.role !== 'directeur') {
        setError(t('toast.access_denied_role', "Accès refusé. Cet espace est réservé aux directeurs."))
        await supabase.auth.signOut()
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
        civilite: profile.civilite,
        photoUrl: profile.photo_url || undefined
      }

      let ecoleData = null
      if (profile.ecole_id) {
        const { data: ecole } = await supabase
          .from('ecoles')
          .select('*')
          .eq('id', profile.ecole_id)
          .maybeSingle()
        ecoleData = ecole
      }

      if (profile.ecole_id !== currentEcoleId && ecoleData) {
        clearSchoolData({
          id: ecoleData.id,
          nom: ecoleData.nom,
          identifiant: ecoleData.identifiant,
          ville: ecoleData.ville,
          adresse: ecoleData.adresse,
          telephone: ecoleData.telephone,
          logo: ecoleData.logo,
          anneeScolaire: ecoleData.annee_scolaire
        })
      }

      setFailedAttempts(0)
      sessionStorage.removeItem('failedAttempts')
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
          style={{ backgroundImage: `url('/director_login_bg.png')` }}
        />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/35 text-primary dark:text-emerald-400 text-xs font-semibold border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('login.director_space', "Espace Directeur")}</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed hidden md:block text-start">
              {t('login.director_desc', "Connectez-vous pour piloter votre établissement, accéder aux rapports financiers, gérer les inscriptions et générer les bulletins MENA.")}
            </p>
          </div>

          <Card className="w-full shadow-lg border-border/50 text-start">
            <CardHeader className="space-y-1 text-center bg-slate-50 dark:bg-slate-900/50 border-b border-border/50 dark:border-border/30 rounded-t-xl pb-4">
              <CardTitle className="text-xl font-bold">{t('login.title', "Connexion")}</CardTitle>
              <CardDescription>
                {t('login.desc_dir', "Accédez à votre console d'administration")}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-5 text-start">
                {error && (
                  <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-md text-sm font-medium text-start">
                    {lockoutSeconds > 0 
                      ? `${t('toast.too_many_attempts_error', "Trop de tentatives de connexion échouées. Par mesure de sécurité, votre compte est temporairement bloqué. Veuillez réessayer dans")} ${formatLockoutTime(lockoutSeconds)}.`
                      : error
                    }
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-start block">{t('login.email', "Adresse email")}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder={t('login.placeholder_email_dir', "nom@ecole.ci")} 
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
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold"
                  disabled={isLoading || lockoutSeconds > 0}
                >
                  {isLoading ? t('login.signing_in', 'Connexion en cours...') : lockoutSeconds > 0 
                    ? `${t('login.locked', "Bloqué")} (Réessayer dans ${Math.floor(lockoutSeconds / 60)}m)` 
                    : t('login.signin', 'Se connecter')}
                </Button>
                
                <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/40 w-full">
                  {t('login.new_gestscol', "Nouveau sur GestScol ?")}{" "}
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="text-primary hover:underline font-bold"
                  >
                    {t('login.register_school', "Inscrivez et abonnez votre école ici")}
                  </button>
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
