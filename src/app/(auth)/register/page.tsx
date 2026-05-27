'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { registerSchoolAndAdmin } from '@/app/actions/register'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { 
  GraduationCap, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  CreditCard, 
  Loader2, 
  AlertCircle,
  PhoneCall
} from 'lucide-react'
import logoImg from '@/app/logo.png'

const WEST_AFRICAN_COUNTRIES = [
  { label: "Côte d'Ivoire", value: "CI", prefix: "+225", placeholder: "07 48 85 96 12", digits: 10, cities: ["Abidjan", "Yamoussoukro", "Bouaké", "San-Pédro", "Korhogo", "Daloa", "Man", "Autre"] },
  { label: "Sénégal", value: "SN", prefix: "+221", placeholder: "77 123 45 67", digits: 9, cities: ["Dakar", "Thiès", "Rufisque", "Saint-Louis", "Autre"] },
  { label: "Mali", value: "ML", prefix: "+223", placeholder: "70 12 34 56", digits: 8, cities: ["Bamako", "Sikasso", "Mopti", "Koutiala", "Ségou", "Autre"] },
  { label: "Burkina Faso", value: "BF", prefix: "+226", placeholder: "70 12 34 56", digits: 8, cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya", "Autre"] },
  { label: "Togo", value: "TG", prefix: "+228", placeholder: "90 12 34 56", digits: 8, cities: ["Lomé", "Sokodé", "Kara", "Kpalimé", "Autre"] },
  { label: "Bénin", value: "BJ", prefix: "+229", placeholder: "97 12 34 56", digits: 8, cities: ["Cotonou", "Porto-Novo", "Parakou", "Djougou", "Autre"] },
  { label: "Niger", value: "NE", prefix: "+227", placeholder: "90 12 34 56", digits: 8, cities: ["Niamey", "Zinder", "Maradi", "Tahoua", "Autre"] },
  { label: "Guinée", value: "GN", prefix: "+224", placeholder: "62 012 34 56", digits: 9, cities: ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Autre"] },
  { label: "Mauritanie", value: "MR", prefix: "+222", placeholder: "46 12 34 56", digits: 8, cities: ["Nouakchott", "Nouadhibou", "Rosso", "Autre"] },
  { label: "Guinée-Bissau", value: "GW", prefix: "+245", placeholder: "95 123 4567", digits: 9, cities: ["Bissau", "Bafatá", "Gabú", "Autre"] },
]

const getPlaceholderForPrefix = (prefix: string) => {
  const country = WEST_AFRICAN_COUNTRIES.find(c => c.prefix === prefix)
  return country ? `Ex: ${country.placeholder}` : "Ex: 07 48 85 96 12"
}

// Types stricts pour les données du wizard
interface SchoolFormState {
  schoolName: string
  levels: ('prescolaire' | 'primaire' | 'secondaire')[]
  country: string
  city: string
  address: string
  phoneSecPrefix: string
  phoneSec: string
}

interface AdminFormState {
  civility: 'M.' | 'Mme' | 'Mlle'
  firstName: string
  lastName: string
  email: string
  phoneMobilePrefix: string
  phoneMobile: string
  password: string
}

const PROVISION_STEPS = [
  "Initialisation de votre serveur d'établissement...",
  "Création des tables de la base de données scolaire...",
  "Génération du portail sécurisé GestScol...",
  "Finalisation de votre abonnement annuel..."
]

function RegisterWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setCurrentUser, clearSchoolData } = useSchoolStore()
  const { toast } = useToast()

  // --- États généraux du formulaire ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [plan, setPlan] = useState<'gratuit' | 'standard' | 'premium'>('standard')

  const [schoolInfo, setSchoolInfo] = useState<SchoolFormState>({
    schoolName: '',
    levels: ['primaire'],
    country: 'CI',
    city: 'Abidjan',
    address: '',
    phoneSecPrefix: '+225',
    phoneSec: ''
  })

  const [adminInfo, setAdminInfo] = useState<AdminFormState>({
    civility: 'M.',
    firstName: '',
    lastName: '',
    email: '',
    phoneMobilePrefix: '+225',
    phoneMobile: '',
    password: ''
  })

  // --- États pour la simulation de déploiement ---
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [provisionStep, setProvisionStep] = useState(0)

  // --- Paiement ---
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'wave' as 'wave' | 'orange_money' | 'mtn_momo',
    phone: '',
  })

  // --- Erreurs locales de validation ---
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Dérivations & Helpers pour les Comboboxes de Pays et Villes
  const selectedCountryData = WEST_AFRICAN_COUNTRIES.find(c => c.value === schoolInfo.country) || WEST_AFRICAN_COUNTRIES[0]
  const cityOptions = selectedCountryData.cities.map(city => ({ label: city, value: city }))
  const countryOptions = WEST_AFRICAN_COUNTRIES.map(c => ({ label: c.label, value: c.value }))

  const handleCountryChange = (countryValue: string) => {
    if (!countryValue) return
    const newCountryData = WEST_AFRICAN_COUNTRIES.find(c => c.value === countryValue) || WEST_AFRICAN_COUNTRIES[0]
    setSchoolInfo(prev => ({
      ...prev,
      country: countryValue,
      city: newCountryData.cities[0], // Select first city by default
      phoneSecPrefix: newCountryData.prefix
    }))
    setAdminInfo(prev => ({
      ...prev,
      phoneMobilePrefix: newCountryData.prefix
    }))
  }

  // Pré-sélectionner le plan à partir des paramètres d'URL
  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (planParam === 'premium') {
      setPlan('premium')
    } else if (planParam === 'standard') {
      setPlan('standard')
    } else if (planParam === 'gratuit') {
      setPlan('gratuit')
    }
  }, [searchParams])

  // --- Validations ---
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!schoolInfo.schoolName.trim()) {
      newErrors.schoolName = "Le nom de l'établissement est requis."
    }
    if (schoolInfo.levels.length === 0) {
      newErrors.levels = "Veuillez cocher au moins un niveau d'enseignement."
    }
    if (!schoolInfo.address.trim()) {
      newErrors.address = "L'adresse de l'école est requise."
    }
    const phoneClean = schoolInfo.phoneSec.replace(/\s+/g, '')
    if (!schoolInfo.phoneSec.trim()) {
      newErrors.phoneSec = "Le numéro du secrétariat est requis."
    } else {
      const countryData = WEST_AFRICAN_COUNTRIES.find(c => c.prefix === schoolInfo.phoneSecPrefix)
      if (countryData && phoneClean.length !== countryData.digits) {
        newErrors.phoneSec = `Le numéro doit contenir exactement ${countryData.digits} chiffres pour ce pays.`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!adminInfo.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis."
    }
    if (!adminInfo.lastName.trim()) {
      newErrors.lastName = "Le nom de famille est requis."
    }
    
    // Regex e-mail simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!adminInfo.email.trim()) {
      newErrors.email = "L'adresse e-mail est requise."
    } else if (!emailRegex.test(adminInfo.email)) {
      newErrors.email = "Veuillez saisir une adresse e-mail valide."
    }

    // Validation du numéro de téléphone stricte selon le pays
    const mobileClean = adminInfo.phoneMobile.replace(/\s+/g, '')
    if (!adminInfo.phoneMobile.trim()) {
      newErrors.phoneMobile = "Le numéro mobile du directeur est requis."
    } else {
      const countryData = WEST_AFRICAN_COUNTRIES.find(c => c.prefix === adminInfo.phoneMobilePrefix)
      if (countryData && mobileClean.length !== countryData.digits) {
        newErrors.phoneMobile = `Le numéro doit contenir exactement ${countryData.digits} chiffres pour ce pays.`
      }
    }

    if (!adminInfo.password) {
      newErrors.password = "Le mot de passe est requis."
    } else if (adminInfo.password.length < 6) {
      newErrors.password = "Le mot de passe doit faire au moins 6 caractères."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // --- Navigation inter-étapes ---
  const maxSteps = plan === 'gratuit' ? 3 : 4

  const handleNextStep = () => {
    setErrors({})
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3)
      }
    } else if (step === 3 && maxSteps === 4) {
      if (validateStep3()) {
        setStep(4)
      }
    }
  }

  const handlePrevStep = () => {
    setErrors({})
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
    if (step === 4) setStep(3)
  }

  // --- Soumission finale & Provisionnement ---
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault()

    // Si on appuie sur "Entrée" avant la dernière étape, on avance
    if (step < maxSteps) {
      handleNextStep()
      return
    }

    if (step === 3 && !validateStep3()) return
    // Validation basique pour l'étape 4
    if (step === 4) {
      if (!paymentInfo.phone.trim()) {
        setErrors({ paymentPhone: "Le numéro de facturation est requis." })
        return
      }
    }

    setIsProvisioning(true)
    setProvisionStep(0)

    // Progression animée des étapes d'installation
    const interval = setInterval(() => {
      setProvisionStep((prev) => {
        if (prev < PROVISION_STEPS.length - 1) {
          return prev + 1
        } else {
          clearInterval(interval)
          return prev
        }
      })
    }, 1500)

    const startTime = Date.now()

    try {
      const result = await registerSchoolAndAdmin({
        plan: plan,
        schoolName: schoolInfo.schoolName,
        address: schoolInfo.address,
        city: schoolInfo.city,
        countryPrefix: schoolInfo.phoneSecPrefix,
        phone: schoolInfo.phoneSec,
        levels: schoolInfo.levels,
        adminFirstName: adminInfo.firstName,
        adminLastName: adminInfo.lastName,
        adminCivilite: adminInfo.civility,
        adminEmail: adminInfo.email,
        adminPhonePrefix: adminInfo.phoneMobilePrefix,
        adminPhone: adminInfo.phoneMobile,
        adminPassword: adminInfo.password,
        paymentMethod: paymentInfo.method,
        paymentPhone: paymentInfo.phone
      })

      if (!result.success) {
        clearInterval(interval)
        setIsProvisioning(false)
        toast({ title: "Erreur", description: result.error || "Échec de l'inscription.", variant: "destructive" })
        return
      }

      const elapsed = Date.now() - startTime
      const waitTime = Math.max(0, 4500 - elapsed)

      setTimeout(() => {
        clearInterval(interval)

        // Connexion automatique après inscription
        if (result.user && result.ecole) {
          // Vider les données de démonstration pour cette nouvelle école
          clearSchoolData(result.ecole)
          import('@/types').then(types => {
            const userWithProperType = {
              ...result.user,
              role: result.user.role as 'directeur' | 'enseignant' | 'parent',
              civilite: result.user.civilite as 'M.' | 'Mme' | 'Mlle' | undefined
            }
            setCurrentUser(userWithProperType)
          })
        }
        
        // 4. Succès et Redirection
        toast({
          title: "Inscription et abonnement validés !",
          description: `Bienvenue sur GestScol, ${adminInfo.civility} ${adminInfo.lastName}. Votre établissement ${schoolInfo.schoolName} est configuré.`,
          variant: "default",
        })

        router.push('/dashboard')
      }, waitTime)
    } catch (error) {
      clearInterval(interval)
      setIsProvisioning(false)
      toast({ title: "Erreur serveur", description: "Veuillez réessayer plus tard.", variant: "destructive" })
    }
  }

  const formatCFA = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA"
  }

  // --- Rendu Simulation Provisioning en plein écran ---
  if (isProvisioning) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 p-6 select-none overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] animate-pulse delay-75" />

        <div className="relative z-10 max-w-lg w-full text-center space-y-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center">
              {/* Spinner réactif */}
              <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-primary border-r-primary animate-spin" />
              <div className="absolute bg-slate-950 p-3.5 rounded-full border border-slate-800">
                <GraduationCap className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">Déploiement en cours...</h3>
            <p className="text-sm text-slate-400">
              Veuillez patienter pendant la configuration de l'espace de votre école.
            </p>
          </div>

          {/* Liste des étapes de provision */}
          <div className="text-left space-y-4 pt-4 border-t border-slate-800">
            {PROVISION_STEPS.map((stepText, idx) => {
              const isDone = idx < provisionStep
              const isActive = idx === provisionStep
              return (
                <div key={idx} className="flex items-center gap-3 transition-opacity duration-500">
                  {isDone ? (
                    <div className="h-5 w-5 bg-primary/20 text-primary border border-primary/40 rounded-full flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : isActive ? (
                    <div className="h-5 w-5 border border-primary text-primary rounded-full flex items-center justify-center shrink-0">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 border border-slate-700 text-slate-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    </div>
                  )}
                  <span className={`text-xs font-medium ${
                    isDone ? 'text-primary' : isActive ? 'text-white' : 'text-slate-500'
                  }`}>
                    {stepText}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase bg-slate-950/40 py-2.5 rounded-xl border border-slate-800/60">
            Période de souscription active : 2026-2027
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] -z-10" />

      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center">
        <Link href="/" className="mb-3 transition-transform duration-300 hover:scale-105 inline-block">
          <img src={logoImg.src} alt="GestScol Logo" className="h-16 w-auto object-contain" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-text tracking-wide">GestScol</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 text-center font-medium max-w-sm">
          Enregistrez votre établissement et offrez le meilleur suivi à vos familles.
        </p>
      </div>

      <Card className="w-full max-w-2xl shadow-xl border-border/80 bg-white">
        <CardHeader className="border-b border-border/60 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-text">
                {step === 1 && "Étape 1 : Choix de la Formule"}
                {step === 2 && "Étape 2 : Fiche Administrative de l'École"}
                {step === 3 && "Étape 3 : Compte Directeur"}
                {step === 4 && "Étape 4 : Paiement Sécurisé"}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {step === 1 && "Sélectionnez l'abonnement annuel le plus adapté à votre école"}
                {step === 2 && "Configurez l'identité et les coordonnées de l'établissement"}
                {step === 3 && "Créez votre profil d'administrateur principal de l'école"}
                {step === 4 && "Finalisez votre abonnement via Mobile Money"}
              </CardDescription>
            </div>
            
            {/* Step badges */}
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-2.5 rounded-full transition-all duration-300 ${step >= i ? 'w-8 bg-primary' : 'w-4 bg-slate-200'} ${i > maxSteps ? 'hidden' : ''}`} />
              ))}
              {maxSteps === 4 && (
                <div className={`h-2.5 rounded-full transition-all duration-300 ${step >= 4 ? 'w-8 bg-primary' : 'w-4 bg-slate-200'}`} />
              )}
            </div>
          </div>
        </CardHeader>

        {/* Form Wizard Core */}
        <form onSubmit={handleSubmitRegistration}>
          <CardContent className="py-6 space-y-6">
            
            {/* ==================================================== */}
            {/* ÉTAPE 1 : CHOIX DU PLAN D'ABONNEMENT */}
            {/* ==================================================== */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                
                {/* Carte Formule Gratuite */}
                <div 
                  onClick={() => setPlan('gratuit')}
                  className={`group cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden select-none hover:shadow-lg ${
                    plan === 'gratuit' 
                      ? 'border-primary bg-emerald-50/20 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {plan === 'gratuit' && (
                    <div className="absolute top-3 right-3 bg-primary text-white p-1 rounded-full">
                      <Check className="h-4.5 w-4.5" />
                    </div>
                  )}
                  <div className="space-y-4">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      plan === 'gratuit' ? 'bg-primary/20 text-primary-dark' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Formule Gratuite
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-3xl font-display font-black text-slate-900">0 FCFA</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">Gratuit à vie</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Essentiel pour découvrir la plateforme. Limité à 50 élèves.
                    </p>
                    <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${plan === 'gratuit' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={plan === 'gratuit' ? 'text-slate-900' : 'text-slate-500'}>Jusqu'à 50 élèves</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${plan === 'gratuit' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={plan === 'gratuit' ? 'text-slate-900' : 'text-slate-500'}>Fonctionnalités de base</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carte Formule Standard */}
                <div 
                  onClick={() => setPlan('standard')}
                  className={`group cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden select-none hover:shadow-lg ${
                    plan === 'standard' 
                      ? 'border-primary bg-emerald-50/20 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {plan !== 'standard' && (
                      <span className="bg-emerald-100 text-emerald-700 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm">
                        Recommandé
                      </span>
                    )}
                    {plan === 'standard' && (
                      <div className="bg-primary text-white p-1 rounded-full">
                        <Check className="h-4.5 w-4.5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      plan === 'standard' ? 'bg-primary/20 text-primary-dark' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Formule Standard
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-3xl font-display font-black text-slate-900">150 000 FCFA</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">par établissement / an</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Idéal pour les structures de taille intermédiaire ou en lancement (Recommandé jusqu'à 300 élèves).
                    </p>
                    <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${plan === 'standard' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={plan === 'standard' ? 'text-slate-900' : 'text-slate-500'}>Inscriptions & fiches d'élèves</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${plan === 'standard' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={plan === 'standard' ? 'text-slate-900' : 'text-slate-500'}>Bulletins A4 conformes MENA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${plan === 'standard' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={plan === 'standard' ? 'text-slate-900' : 'text-slate-500'}>Suivi encaissements (FCFA)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carte Formule Premium */}
                <div 
                  onClick={() => setPlan('premium')}
                  className={`group cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden select-none hover:shadow-lg ${
                    plan === 'premium' 
                      ? 'border-primary bg-emerald-50/20 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300 shadow-sm">
                      Premium
                    </span>
                    {plan === 'premium' && (
                      <div className="bg-primary text-white p-1 rounded-full">
                        <Check className="h-4.5 w-4.5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      plan === 'premium' ? 'bg-primary/20 text-primary-dark' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Formule Premium
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-3xl font-display font-black text-slate-900">250 000 FCFA</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">par établissement / an</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Élèves illimités, sauvegardes automatisées, assistance prioritaire 24h/7 via WhatsApp.
                    </p>
                    <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${plan === 'premium' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={plan === 'premium' ? 'text-slate-900' : 'text-slate-500'}>Tout le contenu Standard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${plan === 'premium' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={`font-semibold ${plan === 'premium' ? 'text-primary' : 'text-slate-700'}`}>Nombre d'élèves illimité</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${plan === 'premium' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={plan === 'premium' ? 'text-slate-900' : 'text-slate-500'}>Assistance technique 24h/7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* ÉTAPE 2 : FICHE ADMINISTRATIVE DE L'ÉCOLE */}
            {/* ==================================================== */}
            {step === 2 && (
              <div className="space-y-5 pt-2 animate-fadeIn">
                
                {/* School Name */}
                <div className="space-y-2">
                  <Label htmlFor="schoolName">Nom de l'établissement scolaire *</Label>
                  <Input 
                    id="schoolName" 
                    placeholder="Ex: Groupe Scolaire Les Flamboyants" 
                    value={schoolInfo.schoolName}
                    onChange={(e) => setSchoolInfo(prev => ({ ...prev, schoolName: e.target.value }))}
                    className={errors.schoolName ? 'border-danger focus-visible:ring-danger' : 'focus-visible:ring-primary'}
                  />
                  {errors.schoolName && (
                    <p className="text-xs text-danger font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.schoolName}
                    </p>
                  )}
                </div>

                {/* Cycle checkboxes */}
                <div className="space-y-3">
                  <Label>Cycle / Niveaux d'enseignement assurés *</Label>
                  <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-border/60">
                    
                    {/* Preschool */}
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="level-preschool" 
                        checked={schoolInfo.levels.includes('prescolaire')}
                        onCheckedChange={(checked) => {
                          setSchoolInfo(prev => {
                            const newLevels = checked 
                              ? [...prev.levels, 'prescolaire' as const]
                              : prev.levels.filter(l => l !== 'prescolaire')
                            return { ...prev, levels: newLevels }
                          })
                        }}
                      />
                      <label htmlFor="level-preschool" className="text-xs font-semibold cursor-pointer select-none">
                        Préscolaire
                      </label>
                    </div>

                    {/* Primary */}
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="level-primary" 
                        checked={schoolInfo.levels.includes('primaire')}
                        onCheckedChange={(checked) => {
                          setSchoolInfo(prev => {
                            const newLevels = checked 
                              ? [...prev.levels, 'primaire' as const]
                              : prev.levels.filter(l => l !== 'primaire')
                            return { ...prev, levels: newLevels }
                          })
                        }}
                      />
                      <label htmlFor="level-primary" className="text-xs font-semibold cursor-pointer select-none">
                        CM / Primaire
                      </label>
                    </div>

                    {/* Secondary */}
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="level-secondary" 
                        checked={schoolInfo.levels.includes('secondaire')}
                        onCheckedChange={(checked) => {
                          setSchoolInfo(prev => {
                            const newLevels = checked 
                              ? [...prev.levels, 'secondaire' as const]
                              : prev.levels.filter(l => l !== 'secondaire')
                            return { ...prev, levels: newLevels }
                          })
                        }}
                      />
                      <label htmlFor="level-secondary" className="text-xs font-semibold cursor-pointer select-none">
                        Secondaire
                      </label>
                    </div>

                  </div>
                  {errors.levels && (
                    <p className="text-xs text-danger font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.levels}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Country */}
                  <div className="space-y-2">
                    <Label>Pays d'implantation *</Label>
                    <Combobox
                      options={countryOptions}
                      value={schoolInfo.country}
                      onChange={handleCountryChange}
                      placeholder="Sélectionner le pays"
                      emptyText="Aucun pays trouvé."
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label>Ville de résidence administrative *</Label>
                    <Combobox
                      options={cityOptions}
                      value={schoolInfo.city}
                      onChange={(val) => {
                        if (val) setSchoolInfo(prev => ({ ...prev, city: val }))
                      }}
                      placeholder="Sélectionner la ville"
                      emptyText="Aucune ville trouvée."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Secretariat Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneSec">Téléphone du Secrétariat *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={schoolInfo.phoneSecPrefix}
                        onValueChange={(val) => setSchoolInfo(prev => ({ ...prev, phoneSecPrefix: val }))}
                      >
                        <SelectTrigger className="w-[110px] shrink-0">
                          <SelectValue placeholder="Devise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+225">CI (+225)</SelectItem>
                          <SelectItem value="+221">SN (+221)</SelectItem>
                          <SelectItem value="+223">ML (+223)</SelectItem>
                          <SelectItem value="+226">BF (+226)</SelectItem>
                          <SelectItem value="+228">TG (+228)</SelectItem>
                          <SelectItem value="+229">BJ (+229)</SelectItem>
                          <SelectItem value="+227">NE (+227)</SelectItem>
                          <SelectItem value="+224">GN (+224)</SelectItem>
                          <SelectItem value="+222">MR (+222)</SelectItem>
                          <SelectItem value="+245">GW (+245)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        id="phoneSec" 
                        placeholder={getPlaceholderForPrefix(schoolInfo.phoneSecPrefix)} 
                        value={schoolInfo.phoneSec}
                        onChange={(e) => setSchoolInfo(prev => ({ ...prev, phoneSec: e.target.value }))}
                        className={`flex-1 ${errors.phoneSec ? 'border-danger focus-visible:ring-danger' : 'focus-visible:ring-primary'}`}
                      />
                    </div>
                    {errors.phoneSec && (
                      <p className="text-xs text-danger font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.phoneSec}
                      </p>
                    )}
                  </div>
                </div>

                {/* School Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse géographique de l'école *</Label>
                  <Input 
                    id="address" 
                    placeholder="Ex: Cocody, Riviera 2, Rue des Jardins" 
                    value={schoolInfo.address}
                    onChange={(e) => setSchoolInfo(prev => ({ ...prev, address: e.target.value }))}
                    className={errors.address ? 'border-danger focus-visible:ring-danger' : 'focus-visible:ring-primary'}
                  />
                  {errors.address && (
                    <p className="text-xs text-danger font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.address}
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* ==================================================== */}
            {/* ÉTAPE 3 : INFORMATIONS DU DIRECTEUR */}
            {/* ==================================================== */}
            {step === 3 && (
              <div className="space-y-5 pt-2 animate-fadeIn">
                
                {/* Civility, First & Last names */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="space-y-2 sm:col-span-3">
                    <Label htmlFor="civility">Civilité</Label>
                    <Select 
                      value={adminInfo.civility} 
                      onValueChange={(val: 'M.' | 'Mme' | 'Mlle') => setAdminInfo(prev => ({ ...prev, civility: val }))}
                    >
                      <SelectTrigger id="civility">
                        <SelectValue placeholder="Civilité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M.">M.</SelectItem>
                        <SelectItem value="Mme">Mme</SelectItem>
                        <SelectItem value="Mlle">Mlle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-4">
                    <Label htmlFor="firstName">Prénom du Directeur *</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Ex: Kouakou Bernard" 
                      value={adminInfo.firstName}
                      onChange={(e) => setAdminInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      className={errors.firstName ? 'border-danger focus-visible:ring-danger' : 'focus-visible:ring-primary'}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-danger font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-5">
                    <Label htmlFor="lastName">Nom de famille *</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Ex: Konan" 
                      value={adminInfo.lastName}
                      onChange={(e) => setAdminInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      className={errors.lastName ? 'border-danger focus-visible:ring-danger' : 'focus-visible:ring-primary'}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-danger font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Professionnel */}
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail professionnelle *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="directeur@flamboyants.ci" 
                    value={adminInfo.email}
                    onChange={(e) => setAdminInfo(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? 'border-danger focus-visible:ring-danger' : 'focus-visible:ring-primary'}
                  />
                  {errors.email && (
                    <p className="text-xs text-danger font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneMobile">Numéro mobile du Directeur *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={adminInfo.phoneMobilePrefix}
                        onValueChange={(val) => setAdminInfo(prev => ({ ...prev, phoneMobilePrefix: val }))}
                      >
                        <SelectTrigger className="w-[110px] shrink-0">
                          <SelectValue placeholder="Devise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+225">CI (+225)</SelectItem>
                          <SelectItem value="+221">SN (+221)</SelectItem>
                          <SelectItem value="+223">ML (+223)</SelectItem>
                          <SelectItem value="+226">BF (+226)</SelectItem>
                          <SelectItem value="+228">TG (+228)</SelectItem>
                          <SelectItem value="+229">BJ (+229)</SelectItem>
                          <SelectItem value="+227">NE (+227)</SelectItem>
                          <SelectItem value="+224">GN (+224)</SelectItem>
                          <SelectItem value="+222">MR (+222)</SelectItem>
                          <SelectItem value="+245">GW (+245)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        id="phoneMobile" 
                        placeholder={getPlaceholderForPrefix(adminInfo.phoneMobilePrefix)} 
                        value={adminInfo.phoneMobile}
                        onChange={(e) => setAdminInfo(prev => ({ ...prev, phoneMobile: e.target.value }))}
                        className={`flex-1 ${errors.phoneMobile ? 'border-danger focus-visible:ring-danger' : 'focus-visible:ring-primary'}`}
                      />
                    </div>
                    {errors.phoneMobile && (
                      <p className="text-xs text-danger font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.phoneMobile}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe de sécurité *</Label>
                    <Input 
                      id="password" 
                      type="password"
                      placeholder="••••••••" 
                      value={adminInfo.password}
                      onChange={(e) => setAdminInfo(prev => ({ ...prev, password: e.target.value }))}
                      className={errors.password ? 'border-danger focus-visible:ring-danger' : 'focus-visible:ring-primary'}
                    />
                    {errors.password ? (
                      <p className="text-xs text-danger font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.password}
                      </p>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Longueur minimale: 6 caractères</span>
                    )}
                  </div>
                </div>

                {/* Submitting context safety card */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-primary/10 text-xs text-slate-700 leading-normal flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p>
                    En finalisant votre inscription, votre école sera enregistrée en période de test sous la formule <span className="font-semibold text-primary">{plan === 'gratuit' ? 'Gratuite (0 FCFA)' : plan === 'premium' ? 'Premium (250 000 FCFA)' : 'Standard (150 000 FCFA)'}</span>. Aucun versement immédiat n'est requis.
                  </p>
                </div>

              </div>
            )}

            {/* ==================================================== */}
            {/* ÉTAPE 4 : PAIEMENT (Si plan payant) */}
            {/* ==================================================== */}
            {step === 4 && (
              <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-start gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Abonnement {plan === 'premium' ? 'Premium' : 'Standard'}</h3>
                    <p className="text-sm text-slate-600 mt-1">Montant à régler : <span className="font-bold text-primary">{plan === 'premium' ? '250 000 FCFA' : '150 000 FCFA'}</span> / an</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Sélectionnez votre moyen de paiement Mobile Money</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      onClick={() => setPaymentInfo(prev => ({ ...prev, method: 'wave' }))}
                      className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentInfo.method === 'wave' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">WAVE</div>
                      <span className="text-xs font-semibold text-slate-700">Wave</span>
                    </div>
                    <div 
                      onClick={() => setPaymentInfo(prev => ({ ...prev, method: 'orange_money' }))}
                      className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentInfo.method === 'orange_money' ? 'border-orange-500 bg-orange-500/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">OM</div>
                      <span className="text-xs font-semibold text-slate-700">Orange Money</span>
                    </div>
                    <div 
                      onClick={() => setPaymentInfo(prev => ({ ...prev, method: 'mtn_momo' }))}
                      className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentInfo.method === 'mtn_momo' ? 'border-yellow-400 bg-yellow-400/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className="h-10 w-10 bg-yellow-400 rounded-full flex items-center justify-center text-slate-800 font-bold text-xs">MOMO</div>
                      <span className="text-xs font-semibold text-slate-700">MTN MoMo</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentPhone">Numéro de facturation (Mobile Money) *</Label>
                  <Input 
                    id="paymentPhone" 
                    placeholder="Ex: 07 48 85 96 12" 
                    value={paymentInfo.phone}
                    onChange={(e) => {
                      setPaymentInfo(prev => ({ ...prev, phone: e.target.value }))
                      if (errors.paymentPhone) setErrors(prev => { const {paymentPhone, ...rest} = prev; return rest; })
                    }}
                    className={errors.paymentPhone ? 'border-danger focus-visible:ring-danger' : 'focus-visible:ring-primary'}
                  />
                  {errors.paymentPhone && (
                    <p className="text-xs text-danger font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.paymentPhone}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                    <ShieldCheck className="h-3 w-3" /> Vos données de paiement sont cryptées et sécurisées.
                  </p>
                </div>
              </div>
            )}

          </CardContent>

          {/* Card Navigation Footer */}
          <CardFooter className="flex items-center justify-between border-t border-border/60 pt-6">
            <div>
              {step > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Retour
                </Button>
              )}
            </div>

            <div>
              {step < maxSteps ? (
                <Button 
                  type="button" 
                  onClick={handleNextStep}
                  className="bg-primary hover:bg-primary-dark text-white flex items-center gap-1.5"
                >
                  Continuer <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-dark text-white flex items-center gap-1.5 font-bold"
                >
                  {plan !== 'gratuit' ? 'Payer et déployer' : 'Confirmer et déployer'} <Sparkles className="h-4.5 w-4.5" />
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Under footer contact notes */}
      <div className="mt-8 text-center space-y-2 text-xs text-muted-foreground">
        <p>Déjà un compte ? <Link href="/login" className="text-primary hover:underline font-bold">Se connecter à son espace</Link></p>
        <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
          <PhoneCall className="h-3.5 w-3.5" /> Une question technique ? Contactez l'assistance GestScol au +225 05 86 03 79 74
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Chargement de l'assistant...</p>
        </div>
      </div>
    }>
      <RegisterWizard />
    </Suspense>
  )
}
