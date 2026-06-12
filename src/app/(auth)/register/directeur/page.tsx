'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createDirecteurAccount } from '@/app/actions/register'
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
  Building2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  AlertCircle,
  PhoneCall,
  Check,
  X,
  Upload
} from 'lucide-react'
import logoImg from '@/app/logo.png'

import { useTranslation } from '@/hooks/useTranslation'
import LanguageToggle from '@/components/layout/LanguageToggle'

export default function RegisterDirecteurPage() {
  const router = useRouter()
  const { toast } = useToast()
  const setCurrentUser = useSchoolStore(state => state.setCurrentUser)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { t, dir, isAr } = useTranslation()

  const WEST_AFRICAN_COUNTRIES = [
    { label: t('country.CI', "Côte d'Ivoire"), value: "CI", prefix: "+225", placeholder: "07 48 85 96 12", digits: 10 },
    { label: t('country.SN', "Sénégal"), value: "SN", prefix: "+221", placeholder: "77 123 45 67", digits: 9 },
    { label: t('country.ML', "Mali"), value: "ML", prefix: "+223", placeholder: "70 12 34 56", digits: 8 },
    { label: t('country.BF', "Burkina Faso"), value: "BF", prefix: "+226", placeholder: "70 12 34 56", digits: 8 },
    { label: t('country.TG', "Togo"), value: "TG", prefix: "+228", placeholder: "90 12 34 56", digits: 8 },
    { label: t('country.BJ', "Bénin"), value: "BJ", prefix: "+229", placeholder: "97 12 34 56", digits: 8 },
    { label: t('country.NE', "Niger"), value: "NE", prefix: "+227", placeholder: "90 12 34 56", digits: 8 },
    { label: t('country.GN', "Guinée"), value: "GN", prefix: "+224", placeholder: "62 012 34 56", digits: 9 },
  ]

  const niveauxOptions = [
    { value: 'prescolaire', label: t('level.prescolaire', 'Préscolaire'), description: t('level.prescolaire_desc', "Maternelle / Jardin d'enfants") },
    { value: 'primaire',    label: t('level.primaire', 'Primaire'),    description: t('level.primaire_desc', 'CP1 → CM2') },
    { value: 'secondaire',  label: t('level.secondaire', 'Secondaire'),  description: t('level.secondaire_desc', '6ème → Terminale') },
  ]

  // Formulaire d'inscription Directeur
  const [form, setForm] = useState({
    civilite: '' as Civilite | '',
    nom: '',
    prenom: '',
    email: '',
    phonePrefix: '+225',
    telephone: '',
    motDePasse: '',
    confirmationMotDePasse: '',
    // Étape 2 : Première école
    nomEcole: '',
    villeEcole: '',
    adresseEcole: '',
    ecolePhonePrefix: '+225',
    telephoneEcole: '',
    niveauxEcole: [] as ('prescolaire' | 'primaire' | 'secondaire')[],
    logo: undefined as string | undefined,
  })

  // Traiter le chargement d'image en Base64 pour le logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérification de la taille (max 1 Mo)
    if (file.size > 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: t('errors.logo_size', "L'image ne doit pas dépasser 1 Mo.") }))
      return
    }

    // Vérification du type MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: t('errors.logo_format', "Formats autorisés : JPEG, PNG, WebP uniquement.") }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm(prev => ({ ...prev, logo: reader.result as string }))
      setErrors(prev => {
        const { logo, ...rest } = prev
        return rest
      })
    }
    reader.readAsDataURL(file)
  }

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
      { label: t('register.dir.rule_min_length', "Au moins 12 caractères"), met: hasMinLength },
      { label: t('register.dir.rule_uppercase', "Une lettre majuscule (A-Z)"), met: hasUppercase },
      { label: t('register.dir.rule_lowercase', "Une lettre minuscule (a-z)"), met: hasLowercase },
      { label: t('register.dir.rule_digit', "Un chiffre (0-9)"), met: hasDigit },
      { label: t('register.dir.rule_special', "Un caractère spécial (ex: @, #, $, !)"), met: hasSpecial },
    ]
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!form.civilite) newErrors.civilite = t('errors.civilite_required', "La civilité est requise.")
    if (!form.nom.trim()) newErrors.nom = t('errors.lastname_required', "Le nom de famille est requis.")
    if (!form.prenom.trim()) newErrors.prenom = t('errors.firstname_required', "Le prénom est requis.")
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim()) {
      newErrors.email = t('errors.email_required', "L'adresse e-mail est requise.")
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = t('errors.email_invalid', "Veuillez saisir une adresse e-mail valide.")
    }

    const phoneClean = form.telephone.replace(/\s+/g, '')
    if (!form.telephone.trim()) {
      newErrors.telephone = t('errors.telephone_required', "Le numéro de téléphone est requis.")
    } else {
      const country = WEST_AFRICAN_COUNTRIES.find(c => c.prefix === form.phonePrefix)
      if (country && phoneClean.length !== country.digits) {
        newErrors.telephone = t('errors.telephone_digits', "Le numéro doit contenir exactement {digits} chiffres.").replace('{digits}', country.digits.toString())
      }
    }

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
      newErrors.motDePasse = t('errors.password_nist', "Le mot de passe ne respecte pas les critères NIST.")
    }

    if (!isMatch) {
      newErrors.confirmationMotDePasse = t('errors.password_match', "Les mots de passe ne correspondent pas.")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!form.nomEcole.trim()) newErrors.nomEcole = t('errors.school_name_required', "Le nom de l'établissement est requis.")
    if (!form.villeEcole.trim()) newErrors.villeEcole = t('errors.school_city_required', "La ville est requise.")
    if (!form.adresseEcole.trim()) newErrors.adresseEcole = t('errors.school_address_required', "L'adresse complète est requise.")
    
    const ecolePhoneClean = form.telephoneEcole.replace(/\s+/g, '')
    if (form.telephoneEcole.trim()) {
      const country = WEST_AFRICAN_COUNTRIES.find(c => c.prefix === form.ecolePhonePrefix)
      if (country && ecolePhoneClean.length !== country.digits) {
        newErrors.telephoneEcole = t('errors.telephone_digits', "Le numéro doit contenir exactement {digits} chiffres.").replace('{digits}', country.digits.toString())
      }
    }

    if (form.niveauxEcole.length === 0) {
      newErrors.niveauxEcole = t('errors.school_levels_required', "Sélectionnez au moins un niveau d'enseignement.")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep1()) {
      setStep(2)
      setErrors({})
    }
  }

  const prevStep = () => {
    setStep(1)
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent, skipSchool = false) => {
    e.preventDefault()

    if (step === 1 && !validateStep1()) return
    if (step === 2 && !skipSchool && !validateStep2()) return

    setIsSubmitting(true)

    try {
      const phoneFull = `${form.phonePrefix} ${form.telephone.trim()}`
      const ecolePhoneFull = (skipSchool || !form.telephoneEcole.trim())
        ? undefined 
        : `${form.ecolePhonePrefix} ${form.telephoneEcole.trim()}`
      
      const payload = {
        civilite: form.civilite as Civilite,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        telephone: phoneFull,
        motDePasse: form.motDePasse,
        nomEcole: skipSchool ? undefined : form.nomEcole.trim(),
        villeEcole: skipSchool ? undefined : form.villeEcole.trim(),
        adresseEcole: skipSchool ? undefined : form.adresseEcole.trim(),
        telephoneEcole: skipSchool ? undefined : ecolePhoneFull,
        niveauxEcole: skipSchool ? undefined : form.niveauxEcole,
        logo: skipSchool ? undefined : form.logo,
      }

      const result = await createDirecteurAccount(payload)

      if (!result.success) {
        setIsSubmitting(false)
        toast({
          title: t('toast.registration_failed', "Échec de l'inscription"),
          description: result.error || t('toast.registration_failed_desc', "Une erreur est survenue lors de l'inscription."),
          variant: "destructive"
        })
        return
      }

      toast({
        title: t('toast.account_created', "Compte créé !"),
        description: t('toast.auto_login', "Connexion automatique en cours..."),
        variant: "default"
      })

      // Connexion automatique directe après la création
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.motDePasse,
      })

      if (authError || !authData.user) {
        toast({
          title: t('toast.account_created', "Compte créé !"),
          description: t('toast.manual_login_required', "Votre compte a été créé avec succès. Veuillez vous connecter manuellement."),
          variant: "default"
        })
        router.push('/login')
        return
      }

      // Récupérer le profil utilisateur avec retry
      const { profile, error: retryError } = await chargerProfilAvecRetry(supabase, authData.user.id)
      if (retryError || !profile) {
        toast({
          title: t('toast.account_created', "Compte créé !"),
          description: t('toast.manual_login_required', "Votre compte a été créé avec succès. Veuillez vous connecter manuellement."),
          variant: "default"
        })
        router.push('/login')
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

      setCurrentUser(userProfile)

      toast({
        title: t('toast.login_success', "Connexion réussie !"),
        description: t('toast.welcome_message', "Bienvenue sur GestScol ! Redirection vers vos établissements..."),
        variant: "default"
      })

      // Redirection immédiate
      window.location.href = '/ecoles'
    } catch (err) {
      setIsSubmitting(false)
      toast({
        title: t('toast.server_error', "Erreur serveur"),
        description: t('toast.try_again_later', "Veuillez réessayer plus tard."),
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background animate-fadeIn relative" dir="ltr">
      {/* Panneau Gauche - Photo en plein écran */}
      <div className="hidden md:block md:flex-1 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/director_login_bg.png')` }}
        />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white dark:from-background to-transparent" />
      </div>

      {/* Panneau Droit - Formulaire */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 md:max-w-xl lg:max-w-2xl bg-white dark:bg-background border-l border-border dark:border-border/40 shadow-sm overflow-y-auto max-h-screen text-start relative" dir={dir}>
        {/* Sélecteur de langue absolu sur le formulaire */}
        <div className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-50`}>
          <LanguageToggle />
        </div>
        <div className="space-y-6 my-auto">
          {/* Brand Header */}
          <div className="flex flex-col items-center md:items-start text-center md:text-start">
            <Link href="/" className="mb-3 transition-transform duration-300 hover:scale-105 inline-block">
              <img src={logoImg.src} alt="GestScol Logo" className="h-16 w-auto object-contain" />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-wide font-display">GestScol</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 text-center md:text-start font-medium">
              {t('register.dir.space_subtitle', "Espace Directeur — Inscription en 2 étapes")}
            </p>
          </div>

          <Card className="w-full shadow-lg border-slate-200/80 dark:border-border/60 bg-white dark:bg-card text-slate-800 dark:text-slate-200 text-start">
            <CardHeader className="border-b border-slate-100 dark:border-border/60 pb-6 text-start">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                    {step === 1 ? t('register.dir.step1_title', "Étape 1 : Vos Informations") : t('register.dir.step2_title', "Étape 2 : Votre École (Optionnel)")}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    {step === 1 
                      ? t('register.dir.step1_desc', "Créez vos identifiants d'administrateur principal.")
                      : t('register.dir.step2_desc', "Vous pourrez configurer vos écoles plus tard si vous préférez.")}
                  </CardDescription>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <div className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-emerald-600' : 'w-3 bg-slate-200 dark:bg-slate-800'}`} />
                  <div className={`h-2 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-emerald-600' : 'w-3 bg-slate-200 dark:bg-slate-800'}`} />
                </div>
              </div>
            </CardHeader>

            <form onSubmit={(e) => step === 1 ? (e.preventDefault(), nextStep()) : handleSubmit(e)}>
              <CardContent className="py-6 space-y-5">
                {step === 1 ? (
                  <>
                    {/* Civilité */}
                    <div className="space-y-2">
                      <SelectCivilite
                        value={form.civilite}
                        onChange={(val) => setForm(prev => ({ ...prev, civilite: val }))}
                        error={errors.civilite}
                      />
                    </div>

                    {/* Nom et Prénom */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
                      <div className="space-y-2">
                        <Label htmlFor="prenom" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.firstname', "Prénom")} *</Label>
                        <Input
                          id="prenom"
                          placeholder={t('register.dir.firstname_placeholder', "Ex: Amenan")}
                          value={form.prenom}
                          onChange={(e) => setForm(prev => ({ ...prev, prenom: e.target.value }))}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                        />
                        {errors.prenom && (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1 text-start">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.prenom}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nom" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.lastname', "Nom de famille")} *</Label>
                        <Input
                          id="nom"
                          placeholder={t('register.dir.lastname_placeholder', "Ex: Kouakou")}
                          value={form.nom}
                          onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                        />
                        {errors.nom && (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1 text-start">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.nom}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2 text-start">
                      <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.email', "Email professionnel")} *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('register.dir.email_placeholder', "directeur@ecole.ci")}
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                      />
                      {errors.email && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1 text-start">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Téléphone */}
                    <div className="space-y-2 text-start">
                      <Label htmlFor="telephone" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.phone', "Numéro de téléphone mobile")} *</Label>
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
                          className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                        />
                      </div>
                      {errors.telephone && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1 text-start">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.telephone}
                        </p>
                      )}
                    </div>

                    {/* Mot de passe */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
                      <div className="space-y-2">
                        <Label htmlFor="motDePasse" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.password', "Mot de passe de sécurité")} *</Label>
                        <Input
                          id="motDePasse"
                          type="password"
                          placeholder="••••••••"
                          value={form.motDePasse}
                          onChange={(e) => setForm(prev => ({ ...prev, motDePasse: e.target.value }))}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmationMotDePasse" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.password_confirm', "Confirmer le mot de passe")} *</Label>
                        <Input
                          id="confirmationMotDePasse"
                          type="password"
                          placeholder="••••••••"
                          value={form.confirmationMotDePasse}
                          onChange={(e) => setForm(prev => ({ ...prev, confirmationMotDePasse: e.target.value }))}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                        />
                        {errors.confirmationMotDePasse && (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 text-start">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.confirmationMotDePasse}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Password validation panel */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border/60 rounded-xl p-4 space-y-2.5 text-start">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-start">
                        <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" /> {t('register.dir.password_strength', "Force du mot de passe (NIST 800-63B)")}
                      </h3>
                      <div className="space-y-1.5 text-start">
                        {handlePasswordRules().map((rule, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-start">
                            {rule.met ? (
                              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-slate-300 shrink-0" />
                            )}
                            <span className={rule.met ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>
                              {rule.label}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 text-xs pt-1.5 border-t border-slate-200 dark:border-border/60 text-start">
                          {isMatch ? (
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-slate-300 shrink-0" />
                          )}
                          <span className={isMatch ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>
                            {t('register.dir.rule_match', "Les deux mots de passe correspondent")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Étape 2 — Première école */}
                    <div className="space-y-4 text-start">
                      <div className="space-y-2">
                        <Label htmlFor="nomEcole" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.school_name', "Nom de l'établissement")} *</Label>
                        <Input
                          id="nomEcole"
                          placeholder={t('register.dir.school_name_placeholder', "Ex: Groupe Scolaire Les Flamboyants")}
                          value={form.nomEcole}
                          onChange={(e) => setForm(prev => ({ ...prev, nomEcole: e.target.value }))}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                        />
                        {errors.nomEcole && (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1 text-start">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.nomEcole}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
                        <div className="space-y-2">
                          <Label htmlFor="villeEcole" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.school_city', "Ville / Commune")} *</Label>
                          <Input
                            id="villeEcole"
                            placeholder={t('register.dir.school_city_placeholder', "Ex: Abidjan Cocody")}
                            value={form.villeEcole}
                            onChange={(e) => setForm(prev => ({ ...prev, villeEcole: e.target.value }))}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                          />
                          {errors.villeEcole && (
                            <p className="text-[11px] text-rose-600 flex items-center gap-1 text-start">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.villeEcole}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="adresseEcole" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.school_address', "Adresse complète")} *</Label>
                          <Input
                            id="adresseEcole"
                            placeholder={t('register.dir.school_address_placeholder', "Ex: Riviera Palmeraie, Rue de la Paix")}
                            value={form.adresseEcole}
                            onChange={(e) => setForm(prev => ({ ...prev, adresseEcole: e.target.value }))}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                          />
                          {errors.adresseEcole && (
                            <p className="text-[11px] text-rose-600 flex items-center gap-1 text-start">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.adresseEcole}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-start">
                        <Label htmlFor="telephoneEcole" className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.school_phone', "Téléphone de l'établissement")} *</Label>
                        <div className="flex gap-2">
                          <Select
                            value={form.ecolePhonePrefix}
                            onValueChange={(val) => setForm(prev => ({ ...prev, ecolePhonePrefix: val }))}
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
                            id="telephoneEcole"
                            placeholder="07 48 85 96 12"
                            value={form.telephoneEcole}
                            onChange={(e) => setForm(prev => ({ ...prev, telephoneEcole: e.target.value }))}
                            className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 rounded-xl text-start"
                          />
                        </div>
                        {errors.telephoneEcole && (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1 text-start">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.telephoneEcole}
                          </p>
                        )}
                      </div>

                      {/* Niveaux d'enseignement checkboxes */}
                      <div className="space-y-2.5 text-start">
                        <Label className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.niveaux', "Niveaux d'enseignement")} *</Label>
                        <div className="grid grid-cols-1 gap-2.5">
                          {niveauxOptions.map((opt) => {
                            const isChecked = form.niveauxEcole.includes(opt.value as any)
                            return (
                              <div
                                key={opt.value}
                                onClick={() => {
                                    const alreadyChecked = form.niveauxEcole.includes(opt.value as any)
                                    const nextNiveaux = alreadyChecked
                                      ? form.niveauxEcole.filter(n => n !== opt.value)
                                      : [...form.niveauxEcole, opt.value as any]
                                    setForm(prev => ({ ...prev, niveauxEcole: nextNiveaux }))
                                }}
                                className={`p-3.5 rounded-xl border text-start cursor-pointer transition-all duration-200 flex items-center gap-3.5 rtl:space-x-reverse ${
                                  isChecked
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-450 font-semibold shadow-sm shadow-emerald-500/5'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${
                                  isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-border/60 bg-white dark:bg-slate-900'
                                }`}>
                                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                                <div className="flex-1 text-start">
                                  <p className={`text-xs font-bold text-start ${isChecked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-750 dark:text-slate-350'}`}>{opt.label}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 text-start">{opt.description}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {errors.niveauxEcole && (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 text-start">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.niveauxEcole}
                          </p>
                        )}
                      </div>

                      {/* Logo de l'établissement */}
                      <div className="space-y-2 text-start">
                        <Label className="text-slate-700 dark:text-slate-300 text-start block">{t('register.dir.logo', "Logo de l'établissement")}</Label>
                        <div className="flex items-center gap-4 rtl:space-x-reverse">
                          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border/60 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                            {form.logo ? (
                              <img src={form.logo} alt="Logo preview" className="h-full w-full object-cover" />
                            ) : (
                              <Upload className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 text-start">
                            <input
                              type="file"
                              id="logo-input-directeur"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('logo-input-directeur')?.click()}
                              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-850 text-xs rounded-xl"
                            >
                              {t('register.dir.choose_image', "Choisir une image")}
                            </Button>
                            <span className="text-[10px] text-slate-400 block mt-1 leading-normal text-start">
                              {t('register.dir.logo_formats', "Format JPEG, PNG, WebP uniquement (Max. 1 Mo)")}
                            </span>
                          </div>
                        </div>
                        {errors.logo && (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 text-start">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.logo}
                          </p>
                        )}
                      </div>

                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-250/20 dark:border-emerald-800/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 leading-normal flex items-start gap-2.5 mt-2 text-start rtl:space-x-reverse">
                        <Building2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
                        <p className="text-start">
                          {t('register.dir.skip_step_info', "La saisie de votre école est facultative à cette étape. Vous pouvez sauter cette étape et configurer vos écoles plus tard depuis votre console de gestion multi-établissement.")}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-slate-100 dark:border-border/60 pt-6">
                {step === 1 ? (
                  <>
                    <Link
                      href="/register"
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('register.dir.back', "Retour")}
                    </Link>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-1 transition-all duration-200"
                    >
                      {t('register.dir.continue', "Continuer")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={prevStep}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('register.dir.your_info', "Vos informations")}
                    </button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={isSubmitting}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {t('register.dir.skip_step', "Passer cette étape")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-1 transition-all duration-200 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            {t('register.dir.creating', "Création...")} <Loader2 className="h-4 w-4 animate-spin" />
                          </>
                        ) : (
                          <>
                            {t('register.dir.create_account', "Créer mon compte")}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="mt-8 text-center space-y-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-border/60 pt-4 text-start">
          <p className="text-center">{t('register.dir.already_registered', "Déjà inscrit ?")} <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">{t('register.dir.login', "Se connecter")}</Link></p>
          <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 text-center">
            <PhoneCall className="h-3.5 w-3.5" /> {t('register.dir.support_question', "Une question technique ? Contactez l'assistance au +225 05 86 03 79 74")}
          </p>
        </div>
      </div>
    </div>
  )
}
