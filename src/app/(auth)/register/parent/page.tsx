'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createParentAccount } from '@/app/actions/register'
import { useSchoolStore } from '@/store/useSchoolStore'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'

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

import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SelectCivilite } from '@/components/ui/SelectCivilite'
import { Civilite } from '@/types'
import {
  Users,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  AlertCircle,
  PhoneCall,
  Check,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import logoImg from '@/app/logo.png'

const WEST_AFRICAN_COUNTRIES = [
  { label: "Côte d'Ivoire", value: "CI", prefix: "+225", placeholder: "07 48 85 96 12", digits: 10 },
  { label: "Sénégal", value: "SN", prefix: "+221", placeholder: "77 123 45 67", digits: 9 },
  { label: "Mali", value: "ML", prefix: "+223", placeholder: "70 12 34 56", digits: 8 },
  { label: "Burkina Faso", value: "BF", prefix: "+226", placeholder: "70 12 34 56", digits: 8 },
  { label: "Togo", value: "TG", prefix: "+228", placeholder: "90 12 34 56", digits: 8 },
  { label: "Bénin", value: "BJ", prefix: "+229", placeholder: "97 12 34 56", digits: 8 },
  { label: "Niger", value: "NE", prefix: "+227", placeholder: "90 12 34 56", digits: 8 },
  { label: "Guinée", value: "GN", prefix: "+224", placeholder: "62 012 34 56", digits: 9 },
]

export default function RegisterParentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const setCurrentUser = useSchoolStore(state => state.setCurrentUser)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{ active: boolean; count: number } | null>(null)

  const [form, setForm] = useState({
    civilite: '' as Civilite | '',
    nom: '',
    prenom: '',
    email: '',
    phonePrefix: '+225',
    telephone: '',
    motDePasse: '',
    confirmationMotDePasse: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Règles de sécurité mot de passe
  const hasMinLength = form.motDePasse.length >= 12
  const hasUppercase = /[A-Z]/.test(form.motDePasse)
  const hasLowercase = /[a-z]/.test(form.motDePasse)
  const hasDigit = /[0-9]/.test(form.motDePasse)
  const hasSpecial = /[^A-Za-z0-9]/.test(form.motDePasse)
  const isMatch = form.motDePasse !== '' && form.motDePasse === form.confirmationMotDePasse

  const handlePasswordRules = () => {
    return [
      { label: "Au moins 12 caractères", met: hasMinLength },
      { label: "Une lettre majuscule (A-Z)", met: hasUppercase },
      { label: "Une lettre minuscule (a-z)", met: hasLowercase },
      { label: "Un chiffre (0-9)", met: hasDigit },
      { label: "Un caractère spécial (ex: @, #, $, !)", met: hasSpecial },
    ]
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.civilite) newErrors.civilite = "La civilité est requise."
    if (!form.nom.trim()) newErrors.nom = "Le nom de famille est requis."
    if (!form.prenom.trim()) newErrors.prenom = "Le prénom est requis."
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim()) {
      newErrors.email = "L'adresse e-mail est requise."
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Veuillez saisir une adresse e-mail valide."
    }

    const phoneClean = form.telephone.replace(/\s+/g, '')
    if (!form.telephone.trim()) {
      newErrors.telephone = "Le numéro de téléphone est requis."
    } else {
      const country = WEST_AFRICAN_COUNTRIES.find(c => c.prefix === form.phonePrefix)
      if (country && phoneClean.length !== country.digits) {
        newErrors.telephone = `Le numéro doit contenir exactement ${country.digits} chiffres.`
      }
    }

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
      newErrors.motDePasse = "Le mot de passe ne respecte pas les critères NIST."
    }

    if (!isMatch) {
      newErrors.confirmationMotDePasse = "Les mots de passe ne correspondent pas."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const phoneFull = `${form.phonePrefix} ${form.telephone.trim()}`
      
      const payload = {
        civilite: form.civilite as Civilite,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        telephone: phoneFull,
        motDePasse: form.motDePasse
      }

      const result = await createParentAccount(payload)

      if (!result.success) {
        setIsSubmitting(false)
        toast({
          title: "Échec de l'inscription",
          description: result.error || "Une erreur est survenue lors de l'inscription.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Compte créé !",
        description: "Connexion automatique en cours...",
        variant: "default"
      })

      // Connexion automatique directe après la création
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.motDePasse,
      })

      if (authError || !authData.user) {
        setSuccessData({ active: true, count: result.nbElevesLies ?? 0 })
        toast({
          title: "Compte créé !",
          description: "Votre compte a été créé avec succès. Veuillez vous connecter manuellement.",
          variant: "default"
        })
        return
      }

      // Récupérer le profil utilisateur avec retry
      const { profile, error: retryError } = await chargerProfilAvecRetry(supabase, authData.user.id)
      if (retryError || !profile) {
        setSuccessData({ active: true, count: result.nbElevesLies ?? 0 })
        toast({
          title: "Compte créé !",
          description: "Votre compte a été créé avec succès. Veuillez vous connecter manuellement.",
          variant: "default"
        })
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

      setCurrentUser(userProfile)

      toast({
        title: "Connexion réussie !",
        description: "Bienvenue sur GestScol ! Redirection vers vos établissements...",
        variant: "default"
      })

      // Redirection immédiate
      window.location.href = '/ecoles'
    } catch (err) {
      setIsSubmitting(false)
      toast({
        title: "Erreur serveur",
        description: "Veuillez réessayer plus tard.",
        variant: "destructive"
      })
    }
  }

  if (successData?.active) {
    const hasLinkedChildren = successData.count > 0

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col items-center justify-center p-4 py-12 text-slate-800 dark:text-slate-200 animate-fadeIn">
        <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-border/60 bg-white dark:bg-card text-slate-800 dark:text-slate-200 text-center">
          <CardContent className="pt-8 pb-6 flex flex-col items-center space-y-4">
            {hasLinkedChildren ? (
              <>
                <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2 border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">Compte Connecté !</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                  Votre compte Parent a été créé avec succès et lié automatiquement à <strong>{successData.count} enfant(s)</strong> référencé(s) dans le système.
                </p>
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-250/20 dark:border-emerald-900/40 rounded-xl text-xs text-left text-emerald-700 dark:text-emerald-400 w-full">
                  <p className="font-bold">Liaison automatique réussie !</p>
                  <p className="mt-1">
                    Vos identifiants ont été validés. Vous pouvez désormais vous connecter pour suivre les notes, absences, paiements et bulletins de vos enfants.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-16 w-16 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 rounded-full flex items-center justify-center mb-2 border border-amber-100 dark:border-amber-900/30">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">Compte créé avec alerte</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                  Votre compte Parent a bien été créé, mais <strong>aucun élève n&apos;est actuellement associé</strong> à l&apos;adresse email <strong>{form.email}</strong>.
                </p>
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-250/20 dark:border-amber-900/40 rounded-xl text-xs text-left text-amber-700 dark:text-amber-400 w-full">
                  <p className="font-bold">Que faire ?</p>
                  <p className="mt-1">
                    Contactez l&apos;établissement de votre enfant pour qu&apos;il enregistre votre adresse e-mail correcte (<strong>{form.email}</strong>) dans la fiche élève.
                  </p>
                </div>
              </>
            )}

            <Button
              onClick={() => router.push('/login/parent')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold w-full rounded-xl py-2.5 shadow-md transition-all duration-200"
            >
              Aller à la connexion parent
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background animate-fadeIn">
      {/* Panneau Gauche - Photo en plein écran */}
      <div className="hidden md:block md:flex-1 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/parent_login_bg.png')` }}
        />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white dark:from-background to-transparent" />
      </div>

      {/* Panneau Droit - Formulaire */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 md:max-w-xl lg:max-w-2xl bg-white dark:bg-background border-l border-border dark:border-border/40 shadow-sm overflow-y-auto max-h-screen">
        <div className="space-y-6 my-auto">
          {/* Brand Header */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="mb-3 transition-transform duration-300 hover:scale-105 inline-block">
              <img src={logoImg.src} alt="GestScol Logo" className="h-16 w-auto object-contain" />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-wide font-display">GestScol</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 text-center md:text-left font-medium">
              Espace Parent — Inscription
            </p>
          </div>

          <Card className="w-full shadow-lg border-slate-200/80 dark:border-border/60 bg-white dark:bg-card text-slate-800 dark:text-slate-200">
            <CardHeader className="border-b border-slate-100 dark:border-border/60 pb-6">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
                <Users className="h-6 w-6 text-amber-600 dark:text-amber-450" /> Profil Parent
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Créez votre compte pour suivre les résultats et la scolarité de vos enfants.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="py-6 space-y-4">
                {/* Civilité */}
                <div className="space-y-2">
                  <SelectCivilite
                    value={form.civilite}
                    onChange={(val) => setForm(prev => ({ ...prev, civilite: val }))}
                    error={errors.civilite}
                  />
                </div>

                {/* Prénom & Nom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-slate-700 dark:text-slate-300">Prénom *</Label>
                    <Input
                      id="prenom"
                      placeholder="Ex: Mireille"
                      value={form.prenom}
                      onChange={(e) => setForm(prev => ({ ...prev, prenom: e.target.value }))}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-amber-500 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500/20 rounded-xl"
                    />
                    {errors.prenom && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.prenom}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-slate-700 dark:text-slate-300">Nom de famille *</Label>
                    <Input
                      id="nom"
                      placeholder="Ex: Akossi"
                      value={form.nom}
                      onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-amber-500 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500/20 rounded-xl"
                    />
                    {errors.nom && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.nom}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email de contact */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Votre adresse e-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="parent@ecole.ci"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-amber-500 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500/20 rounded-xl"
                  />
                  <span className="text-[10px] text-emerald-600 font-semibold block leading-tight">
                    ⚠️ Utilisez impérativement l&apos;adresse email que vous avez fournie à l&apos;école de votre enfant.
                  </span>
                  {errors.email && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-slate-700 dark:text-slate-300">Numéro de téléphone mobile *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={form.phonePrefix}
                      onValueChange={(val) => setForm(prev => ({ ...prev, phonePrefix: val }))}
                    >
                      <SelectTrigger className="w-[110px] bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 text-slate-900 dark:text-slate-100 shrink-0 rounded-xl">
                        <SelectValue placeholder="CI" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 text-slate-900 dark:text-slate-100">
                        {WEST_AFRICAN_COUNTRIES.map((c) => (
                          <SelectItem key={c.value} value={c.prefix}>
                            {c.value} ({c.prefix})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="telephone"
                      placeholder="07 48 85 96 12"
                      value={form.telephone}
                      onChange={(e) => setForm(prev => ({ ...prev, telephone: e.target.value }))}
                      className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-amber-500 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500/20 rounded-xl"
                    />
                  </div>
                  {errors.telephone && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.telephone}
                    </p>
                  )}
                </div>

                {/* Mots de passe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="motDePasse" className="text-slate-700 dark:text-slate-300">Mot de passe *</Label>
                    <Input
                      id="motDePasse"
                      type="password"
                      placeholder="••••••••"
                      value={form.motDePasse}
                      onChange={(e) => setForm(prev => ({ ...prev, motDePasse: e.target.value }))}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-amber-500 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500/20 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmationMotDePasse" className="text-slate-700 dark:text-slate-300">Confirmer *</Label>
                    <Input
                      id="confirmationMotDePasse"
                      type="password"
                      placeholder="••••••••"
                      value={form.confirmationMotDePasse}
                      onChange={(e) => setForm(prev => ({ ...prev, confirmationMotDePasse: e.target.value }))}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-amber-500 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500/20 rounded-xl"
                    />
                    {errors.confirmationMotDePasse && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.confirmationMotDePasse}
                      </p>
                    )}
                  </div>
                </div>

                {/* Force du mot de passe */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border/60 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="h-4.5 w-4.5 text-amber-600 dark:text-amber-450" /> Force du mot de passe
                  </h3>
                  <div className="space-y-1">
                    {handlePasswordRules().map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {rule.met ? (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-slate-350 dark:text-slate-500 shrink-0" />
                        )}
                        <span className={rule.met ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-slate-100 dark:border-border/60 pt-6">
                <Link
                  href="/register"
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 flex items-center gap-1 font-semibold transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Autre profil
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-650 text-slate-950 font-bold px-6 py-2.5 rounded-xl flex items-center gap-1 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      Création... <Loader2 className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      S&apos;inscrire
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="mt-8 text-center space-y-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-border/60 pt-4">
          <p>Déjà inscrit ? <Link href="/login/parent" className="text-amber-600 hover:text-amber-700 font-bold hover:underline">Se connecter</Link></p>
          <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <PhoneCall className="h-3.5 w-3.5" /> Support GestScol : +225 05 86 03 79 74
          </p>
        </div>
      </div>
    </div>
  )
}
