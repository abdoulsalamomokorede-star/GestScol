'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  CreditCard, 
  Calendar, 
  ChevronDown, 
  TrendingUp, 
  UserCheck, 
  FileText, 
  Smartphone, 
  Sparkles, 
  Check, 
  Coins, 
  ShieldCheck, 
  MessageSquare,
  Users,
  Menu,
  X,
  Loader2
} from 'lucide-react'
import logoImg from '@/app/logo.png'
import ThemeToggle from '@/components/layout/ThemeToggle'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageToggle from '@/components/layout/LanguageToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- DONNÉES FAUSSES INTERACTIVES POUR LA DÉMO ---
interface DemoEleve {
  id: string
  nom: string
  matricule: string
  statutAppel: 'present' | 'absent'
  moyenne: number
  paiementStatut: 'paye' | 'partiel' | 'en_attente'
  montantDu: number
  montantPaye: number
}

const INITIAL_DEMO_ELEVES: DemoEleve[] = [
  { id: '1', nom: 'Kouassi Kouame Marc', matricule: 'SCH-2024-0012', statutAppel: 'present', moyenne: 14.5, paiementStatut: 'partiel', montantDu: 70000, montantPaye: 40000 },
  { id: '2', nom: 'Koffi Amenan Grace', matricule: 'SCH-2024-0042', statutAppel: 'present', moyenne: 16.2, paiementStatut: 'paye', montantDu: 70000, montantPaye: 70000 },
  { id: '3', nom: 'Yao N\'guessan Ariel', matricule: 'SCH-2024-0085', statutAppel: 'absent', moyenne: 9.8, paiementStatut: 'en_attente', montantDu: 70000, montantPaye: 0 },
  { id: '4', nom: 'Diarrassouba Fatoumata', matricule: 'SCH-2024-0104', statutAppel: 'present', moyenne: 15.8, paiementStatut: 'paye', montantDu: 70000, montantPaye: 70000 },
  { id: '5', nom: 'Bakayoko Moussa', matricule: 'SCH-2024-0155', statutAppel: 'present', moyenne: 11.4, paiementStatut: 'en_attente', montantDu: 70000, montantPaye: 0 }
]

export default function LandingPage() {
  const { t, dir, isAr } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'scolarite' | 'bulletins' | 'appel'>('scolarite')
  
  // États de simulation interactive
  const [demoEleves, setDemoEleves] = useState<DemoEleve[]>(INITIAL_DEMO_ELEVES)
  const [selectedDemoEleveId, setSelectedDemoEleveId] = useState<string>('1')
  const [paymentAmount, setPaymentAmount] = useState<number>(30000)
  const [paymentOperator, setPaymentOperator] = useState<'wave' | 'orange' | 'mtn' | 'especes'>('wave')
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false)
  const [paymentSuccessToast, setPaymentSuccessToast] = useState(false)
  
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Calcule du taux d'appel de démo
  const presentCount = demoEleves.filter(e => e.statutAppel === 'present').length
  const totalCount = demoEleves.length
  const attendanceRate = Math.round((presentCount / totalCount) * 100)

  // Simulation d'encaissement d'acompte
  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSimulatingPayment) return
    setIsSimulatingPayment(true)

    setTimeout(() => {
      setDemoEleves(prev => prev.map(eleve => {
        if (eleve.id === selectedDemoEleveId) {
          const newPayed = Math.min(eleve.montantDu, eleve.montantPaye + paymentAmount)
          const newStatut = newPayed === eleve.montantDu ? 'paye' : 'partiel'
          return {
            ...eleve,
            montantPaye: newPayed,
            paiementStatut: newStatut
          }
        }
        return eleve
      }))
      setIsSimulatingPayment(false)
      setPaymentSuccessToast(true)
      setTimeout(() => setPaymentSuccessToast(false), 4000)
    }, 1200)
  }

  // Toggle d'absence interactif
  const toggleDemoAppel = (id: string) => {
    setDemoEleves(prev => prev.map(e => {
      if (e.id === id) {
        return {
          ...e,
          statutAppel: e.statutAppel === 'present' ? 'absent' : 'present'
        }
      }
      return e
    }))
  }

  // Formatage FCFA
  const formatCFA = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA"
  }

  const selectedEleveForPayment = demoEleves.find(e => e.id === selectedDemoEleveId)

  // FAQ mock
  const faqs = [
    {
      q: t('landing.faq.q1', "Est-ce que l'outil est adapté aux exigences du Ministère de l'Éducation Nationale de Côte d'Ivoire ?"),
      a: t('landing.faq.a1', "Absolument. GestScol a été conçu en étroite collaboration avec des secrétariats et directeurs d'écoles ivoiriennes. Notre système de bulletins trimestriels calcule automatiquement les moyennes pondérées par coefficients, détermine les classements par classe, et génère un document PDF A4 respectant scrupuleusement la mise en page officielle de la MENA (DREN, République de Côte d'Ivoire, cachets).")
    },
    {
      q: t('landing.faq.q2', "Comment fonctionne la gestion des paiements par Wave ou Mobile Money ?"),
      a: t('landing.faq.a2', "L'application permet d'enregistrer des règlements partiels (acomptes / tranches) en FCFA. Lors de l'encaissement, l'intendant spécifie le canal de transaction (Wave, Orange Money, MTN MoMo, ou Espèces) et renseigne la référence officielle du versement. L'historique et les reçus de caisse s'impriment sous format professionnel avec toutes ces coordonnées de traçabilité financière.")
    },
    {
      q: t('landing.faq.q3', "Est-ce que l'application est rapide sur mobile ou avec une faible connexion 3G/4G ?"),
      a: t('landing.faq.a3', "Oui, la fluidité a été notre priorité absolue. Nous savons que la connexion peut être capricieuse ou lente dans certaines localités. Notre stack moderne est optimisée et n'utilise pas de ressources graphiques lourdes, permettant à un enseignant de faire l'appel ou de saisir les notes en classe directement sur un téléphone Tecno ou Infinix d'entrée de gamme sans le moindre ralentissement.")
    },
    {
      q: t('landing.faq.q4', "Les données des élèves sont-elles sécurisées et confidentielles ?"),
      a: t('landing.faq.a4', "Toutes les données sont stockées sur des serveurs sécurisés avec des politiques de sauvegarde quotidienne automatisée. De plus, l'accès est strictement protégé par rôles : le Directeur contrôle l'intégralité du tableau de bord financier et de scolarité, l'Enseignant ne gère que ses matières assignées, et chaque Parent accède uniquement et en toute confidentialité aux notes et absences de son propre enfant.")
    }
  ]

  return (
    <div className="bg-background text-text min-h-screen font-sans selection:bg-primary/20 selection:text-primary-dark" dir={dir}>
      
      {/* Toast interactif pour la simulation */}
      {paymentSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce max-w-sm">
          <div className="bg-white/20 p-2 rounded-full">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">{t('landing.demo.toast_success_title', "Simulation d'Encaissement Réussie !")}</p>
            <p className="text-xs text-emerald-100">{t('landing.demo.toast_success_desc', "Le reçu A4 a été généré et le solde mis à jour.")}</p>
          </div>
        </div>
      )}

      {/* --- EN-TÊTE DE PRESTIGE --- */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border/60 dark:border-border/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="transition-transform duration-300 hover:scale-105 shrink-0">
              <img src={logoImg.src} alt="GestScol Logo" className="h-12 w-auto object-contain" />
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-text to-primary bg-clip-text text-transparent">
              GestScol
            </span>
          </Link>

          {/* Navigation Bureau */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">{t('landing.nav.features', "Fonctionnalités")}</a>
            <a href="#demo" className="hover:text-primary transition-colors">{t('landing.nav.demo', "Démo Interactive")}</a>
            <a href="#pricing" className="hover:text-primary transition-colors">{t('landing.nav.pricing', "Tarification")}</a>
            <a href="#faq" className="hover:text-primary transition-colors">{t('landing.nav.faq', "FAQ")}</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <LanguageToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm font-semibold text-text hover:text-primary transition-colors px-4 py-2 outline-none">
                {t('landing.nav.connect', "Se Connecter")}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/login" className="cursor-pointer w-full font-medium">{t('landing.nav.space_director', "Espace Directeur")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/login/enseignant" className="cursor-pointer w-full font-medium">{t('landing.nav.space_teacher', "Espace Enseignant")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/login/parent" className="cursor-pointer w-full font-medium">{t('landing.nav.space_parent', "Espace Parent")}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link 
              href="/register" 
              className="relative inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10 overflow-hidden group border border-primary/30"
              id="register-btn-header"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-primary-dark transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              <span className="relative z-10 flex items-center gap-1.5">
                {t('landing.nav.register', "Créer un compte")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </span>
            </Link>
          </div>

          {/* Menu Mobile Button & ThemeToggle */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-text hover:bg-muted"
              id="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-b border-border/80 px-4 pt-2 pb-6 space-y-4 shadow-xl text-start">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 hover:text-primary text-text"
            >
              {t('landing.nav.features', "Fonctionnalités")}
            </a>
            <a 
              href="#demo" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 hover:text-primary text-text"
            >
              {t('landing.nav.demo', "Démo Interactive")}
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 hover:text-primary text-text"
            >
              {t('landing.nav.pricing', "Tarification")}
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 hover:text-primary text-text"
            >
              {t('landing.nav.faq', "FAQ")}
            </a>
            <div className="border-t border-border/80 pt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-2 w-full pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">{t('landing.nav.connect', "Se Connecter")} :</p>
                <Link 
                  href="/login" 
                  className="w-full text-center font-medium py-2 border border-border rounded-lg text-text hover:bg-muted"
                >
                  {t('landing.nav.space_director', "Directeur")}
                </Link>
                <Link 
                  href="/login/enseignant" 
                  className="w-full text-center font-medium py-2 border border-border rounded-lg text-text hover:bg-muted"
                >
                  {t('landing.nav.space_teacher', "Enseignant")}
                </Link>
                <Link 
                  href="/login/parent" 
                  className="w-full text-center font-medium py-2 border border-border rounded-lg text-text hover:bg-muted"
                >
                  {t('landing.nav.space_parent', "Parent")}
                </Link>
              </div>
              <Link 
                href="/register" 
                className="w-full text-center font-semibold py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark shadow-md"
                id="register-btn-mobile"
              >
                {t('landing.nav.register', "Créer un compte")}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden isolate">
        {/* Dégradé de fond de la section */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/35 via-slate-50/10 to-white dark:from-background dark:via-muted/20 dark:to-background -z-20" />
        {/* Image de fond thématique premium */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 dark:opacity-15 -z-10"
          style={{ backgroundImage: `url('/landing_bg.png')` }}
        />
        {/* Cercles luminescents en arrière-plan */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Colonne gauche : Textes & Appels à l'action */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200/50 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                <span>{t('landing.hero.badge', "La plateforme n°1 des écoles privées d'Afrique de l'Ouest")}</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-display font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
                {t('landing.hero.title_part1', "Pilotez votre établissement avec")}{' '}
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent font-extrabold">
                  {t('landing.hero.title_part2', "intelligence")}
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-slate-800 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                {t('landing.hero.subtitle', "La solution complète pour digitaliser la gestion de votre école : encaissements Wave & Mobile Money, bulletins conformes MENA, et suivi en temps réel pour les parents.")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link 
                  href="/register" 
                  className="relative w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-primary to-emerald-600 text-white font-semibold text-base px-8 py-4 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group gap-2"
                  id="hero-primary-cta"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-primary-dark transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                  <span className="relative z-10 flex items-center gap-2">
                    {t('landing.nav.register', "Créer un compte")}
                    <ArrowRight className="h-5 w-5 transform rtl:rotate-180 group-hover:translate-x-1.5 transition-transform duration-300 rtl:group-hover:-translate-x-1.5" />
                  </span>
                </Link>
                <a 
                  href="#demo" 
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-border text-slate-800 dark:text-slate-200 font-semibold text-base px-8 py-4 rounded-full shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98] hover:text-primary dark:hover:text-primary hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300"
                  id="hero-secondary-cta"
                >
                  {t('landing.hero.cta_demo', "Découvrir la démo")}
                </a>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 pt-2">
                {t('landing.hero.already_registered', "Déjà inscrit ?")} <Link href="/login" className="text-primary hover:underline font-bold transition-all">{t('landing.hero.login', "Se connecter")}</Link>
              </p>
            </div>

            {/* Colonne droite : Visuel / Illustration de marque */}
            <div className="lg:col-span-5 relative w-full flex justify-center">
              <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none">
                {/* Lueur d'accentuation en arrière-plan */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-30 animate-pulse" />
                
                {/* Cadre de l'image de prestige */}
                <div className="relative bg-white dark:bg-card p-2 sm:p-3 rounded-3xl border border-slate-200 dark:border-border shadow-2xl">
                  <img 
                    src="/landing_hero.png" 
                    alt="GestScol Éducation Afrique" 
                    className="w-full h-auto object-cover rounded-2xl shadow-inner aspect-[4/3] lg:aspect-[1.1]" 
                  />
                  
                  {/* Badge flottant 1 : Paiements Wave & Mobile Money */}
                  <div className="absolute bottom-6 -left-6 bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200 dark:border-border rounded-2xl p-3 shadow-lg flex items-center gap-3 animate-fadeIn max-w-[220px] hidden sm:flex">
                    <div className="bg-sky-100 dark:bg-sky-950/30 p-2 rounded-xl text-sky-600 dark:text-sky-400">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Paiements</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Wave & MoMo</p>
                    </div>
                  </div>

                  {/* Badge flottant 2 : Conformité MENA */}
                  <div className="absolute top-6 -right-6 bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200 dark:border-border rounded-2xl p-3 shadow-lg flex items-center gap-3 animate-fadeIn max-w-[220px] hidden sm:flex">
                    <div className="bg-emerald-100 dark:bg-emerald-950/30 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bulletins</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Conforme MENA</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Avantages en 4 mots clés */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-16 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest border-t border-slate-100 dark:border-border mt-16">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-pulse" /> <span>{t('landing.advantages.mena', 'Conforme MENA')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-pulse" /> <span>{t('landing.advantages.money', 'Wave & Mobile Money')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-pulse" /> <span>{t('landing.advantages.mobile', 'Mobile-First')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-pulse" /> <span>{t('landing.advantages.cloud', 'Cloud Sécurisé')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- GRILLE DE FONCTIONNALITÉS MÉTIERS --- */}
      <section id="features" className="py-24 bg-white dark:bg-background border-y border-slate-100 dark:border-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
            <h2 className="text-xs uppercase tracking-widest text-emerald-500 font-bold">{t('landing.features.title', 'Fonctionnalités Clés')}</h2>
            <p className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-100">{t('landing.features.subtitle', "Spécialement taillé pour les établissements d'Afrique Francophone")}</p>
            <p className="text-slate-500 dark:text-slate-400 text-lg">{t('landing.features.desc', 'Une gestion fluide pour les directeurs, rapide pour les enseignants et transparente pour les parents.')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Carte 1 : Scolarité & Mobile Money */}
            <div className="bg-white dark:bg-card rounded-3xl p-8 border border-slate-200 dark:border-border hover:border-emerald-200 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-5">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl w-fit text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">{t('landing.features.card1_title', 'Scolarité Multi-Versements')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('landing.features.card1_desc', "Enregistrez des acomptes réguliers en FCFA. Support des opérateurs locaux (Wave, Orange, MTN) avec reçus de caisse certifiés A4 prêts pour l'impression ou l'exportation PDF.")}
                </p>
              </div>
            </div>

            {/* Carte 2 : Bulletins Trimestriels MENA */}
            <div className="bg-white dark:bg-card rounded-3xl p-8 border border-slate-200 dark:border-border hover:border-accent/30 dark:hover:border-accent/50 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-5">
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl w-fit text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">{t('landing.features.card2_title', 'Bulletins PDF Officiels')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('landing.features.card2_desc', 'Calcul automatisé des moyennes pondérées selon les coefficients de chaque classe. Classement des rangs instantané et impression globale ou individuelle en A4.')}
                </p>
              </div>
            </div>

            {/* Carte 3 : Absences (Appel Rapide) */}
            <div className="bg-white dark:bg-card rounded-3xl p-8 border border-slate-200 dark:border-border hover:border-teal-200 dark:hover:border-teal-500/50 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-5">
                <div className="bg-teal-50 dark:bg-teal-950/20 p-4 rounded-2xl w-fit text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                  <UserCheck className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">{t('landing.features.card3_title', "Feuille d'Appel Mobile")}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('landing.features.card3_desc', "Faites l'appel en classe par séance (Matin/Après-midi) en 1 minute. Le directeur justifie les motifs à la volée, et le parent reçoit un rapport d'assiduité en temps réel.")}
                </p>
              </div>
            </div>

            {/* Carte 4 : Espace Parent Mobile-First */}
            <div className="bg-white dark:bg-card rounded-3xl p-8 border border-slate-200 dark:border-border hover:border-blue-200 dark:hover:border-blue-500/50 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-5">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl w-fit text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Smartphone className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">{t('landing.features.card4_title', 'Suivi pour les Familles')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('landing.features.card4_desc', 'Un espace parent allégé et mobile-first. Les familles suivent le solde scolarité, déchargent des reçus officiels, et signalent des motifs d\'absences directement depuis leur smartphone.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION DÉMO INTERACTIVE --- */}
      <section id="demo" className="py-20 bg-gradient-to-b from-background to-slate-50 dark:to-slate-950/40 relative scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
            <h2 className="text-xs uppercase tracking-widest text-primary font-bold">{t('landing.demo.title', "Démo en Direct")}</h2>
            <h3 className="text-3xl font-display font-bold text-text">{t('landing.demo.subtitle', "Découvrez notre cockpit de démonstration")}</h3>
            <p className="text-muted-foreground">{t('landing.demo.desc', "Cliquez sur les onglets ci-dessous pour tester l'application directement dans votre navigateur web.")}</p>
          </div>

          <div className="bg-white dark:bg-card rounded-3xl border border-border/70 dark:border-border/80 shadow-2xl overflow-hidden max-w-5xl mx-auto">
            {/* Header de la fausse app */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400 font-medium ml-2 select-none">{t('landing.demo.app_header', "GestScol - Espace Directeur (Aperçu)")}</span>
              </div>
              <div className="bg-slate-800 text-[10px] text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {t('landing.demo.app_badge', "Démonstration Interactive")}
              </div>
            </div>

            {/* Onglets sélecteurs */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-border/80 dark:border-border flex flex-wrap">
              <button 
                onClick={() => setActiveTab('scolarite')}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 font-semibold text-sm transition-all outline-none ${
                  activeTab === 'scolarite' 
                    ? 'border-primary text-primary bg-white dark:bg-card' 
                    : 'border-transparent text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-text dark:hover:text-slate-100'
                }`}
                id="demo-tab-scolarite"
              >
                <Coins className="h-4 w-4" />
                {t('landing.demo.tab_tuition', "Suivi de la Scolarité")}
              </button>
              <button 
                onClick={() => setActiveTab('bulletins')}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 font-semibold text-sm transition-all outline-none ${
                  activeTab === 'bulletins' 
                    ? 'border-primary text-primary bg-white dark:bg-card' 
                    : 'border-transparent text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-text dark:hover:text-slate-100'
                }`}
                id="demo-tab-bulletins"
              >
                <FileText className="h-4 w-4" />
                {t('landing.demo.tab_reports', "Bulletins MENA")}
              </button>
              <button 
                onClick={() => setActiveTab('appel')}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 font-semibold text-sm transition-all outline-none ${
                  activeTab === 'appel' 
                    ? 'border-primary text-primary bg-white dark:bg-card' 
                    : 'border-transparent text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-text dark:hover:text-slate-100'
                }`}
                id="demo-tab-appel"
              >
                <UserCheck className="h-4 w-4" />
                {t('landing.demo.tab_attendance', "Feuille d'Appel Rapide")}
              </button>
            </div>

            {/* Contenu de la Démo */}
            <div className="p-6 md:p-8 min-h-[420px]">
              
              {/* ONGLET 1 : SCOLARITÉ */}
              {activeTab === 'scolarite' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  
                  {/* Partie gauche : Formulaire simulation paiement */}
                  <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-border/80 dark:border-border space-y-4">
                    <h4 className="font-semibold text-sm text-text flex items-center gap-1.5 text-start">
                      <CreditCard className="h-4 w-4 text-primary" />
                      {t('landing.demo.simulate_payment', "Simuler un encaissement")}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed text-start">
                      {t('landing.demo.simulate_payment_desc', "Sélectionnez un élève débiteur, définissez le versement et validez pour voir le solde recalculé à droite.")}
                    </p>

                    <form onSubmit={handleSimulatePayment} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">{t('landing.demo.student_concerned', "Élève concerné")}</label>
                        <Select 
                          value={selectedDemoEleveId} 
                          onValueChange={setSelectedDemoEleveId}
                        >
                          <SelectTrigger className="w-full bg-white dark:bg-slate-900 border border-border rounded-lg text-xs h-10 px-3 outline-none focus:ring-1 focus:ring-primary text-start">
                            <SelectValue placeholder={t('landing.demo.select_student', "Choisir un élève")} />
                          </SelectTrigger>
                          <SelectContent>
                            {demoEleves.map(e => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.nom} ({e.paiementStatut === 'paye' ? t('landing.demo.paid', "Solfé") : (
                                  <span className="inline-flex gap-1">
                                    {t('landing.demo.remaining', "Reste")}: <span dir="ltr">{formatCFA(e.montantDu - e.montantPaye)}</span>
                                  </span>
                                )})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">{t('landing.demo.payment_amount', "Montant à verser")}</label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(Math.max(1000, Number(e.target.value)))}
                            max={selectedEleveForPayment ? selectedEleveForPayment.montantDu - selectedEleveForPayment.montantPaye : 70000}
                            className="w-full bg-white dark:bg-slate-900 border border-border rounded-lg text-xs p-2.5 pr-14 rtl:pl-14 rtl:pr-2.5 outline-none focus:ring-1 focus:ring-primary font-mono font-bold text-start"
                          />
                          <span className="absolute right-3 top-2.5 rtl:left-3 rtl:right-auto text-[10px] font-bold text-muted-foreground">FCFA</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-start">
                        <label className="text-xs font-semibold text-muted-foreground">{t('landing.demo.payment_operator', "Opérateur de Paiement")}</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button 
                            type="button"
                            onClick={() => setPaymentOperator('wave')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              paymentOperator === 'wave' 
                                ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800 shadow-sm' 
                                : 'bg-white dark:bg-slate-900 border-border dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            Wave
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPaymentOperator('orange')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              paymentOperator === 'orange' 
                                ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 shadow-sm' 
                                : 'bg-white dark:bg-slate-900 border-border dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            Orange
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPaymentOperator('mtn')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              paymentOperator === 'mtn' 
                                ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800 shadow-sm' 
                                : 'bg-white dark:bg-slate-900 border-border dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            MTN
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPaymentOperator('especes')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              paymentOperator === 'especes' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 shadow-sm' 
                                : 'bg-white dark:bg-slate-900 border-border dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {t('landing.demo.cash', "Espèces")}
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSimulatingPayment || (selectedEleveForPayment?.paiementStatut === 'paye')}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold text-xs py-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSimulatingPayment ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {t('landing.demo.processing', "Traitement en cours...")}
                          </>
                        ) : selectedEleveForPayment?.paiementStatut === 'paye' ? (
                          t('landing.demo.tuition_paid', "Scolarité Déjà Soldée")
                        ) : (
                          (() => {
                            const rawText = t('landing.demo.collect_amount', "Encaisser {amount}");
                            if (rawText.includes('{amount}')) {
                              const parts = rawText.split('{amount}');
                              return (
                                <>
                                  {parts[0]}
                                  <span dir="ltr">{formatCFA(paymentAmount)}</span>
                                  {parts[1]}
                                </>
                              );
                            }
                            return (
                              <>
                                {rawText} <span dir="ltr">{formatCFA(paymentAmount)}</span>
                              </>
                            );
                          })()
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Partie droite : Tableau des règlements */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center text-start">
                      <h4 className="font-semibold text-sm text-text">{t('landing.demo.class_tuition', "Scolarité de la classe : CM2 A (Démo)")}</h4>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-muted-foreground font-semibold uppercase tracking-wider">{t('landing.demo.t1', "Trimestre 1")}</span>
                    </div>

                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                          <thead className="bg-slate-50 dark:bg-slate-900/60 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider border-b border-border text-start">
                            <tr>
                              <th className="p-3 text-start">{t('landing.demo.student', "Élève")}</th>
                              <th className="p-3 text-start">{t('landing.demo.total_due', "Total dû")}</th>
                              <th className="p-3 text-start">{t('landing.demo.already_paid', "Déjà Réglé")}</th>
                              <th className="p-3 text-start">{t('landing.demo.remaining', "Reste à payer")}</th>
                              <th className="p-3 text-start">{t('landing.demo.status', "Statut")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {demoEleves.map(eleve => {
                              const remaining = eleve.montantDu - eleve.montantPaye
                              return (
                                <tr key={eleve.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="p-3 font-semibold text-text text-start">{eleve.nom}</td>
                                  <td className="p-3 font-mono text-start">
                                    <span dir="ltr">{formatCFA(eleve.montantDu)}</span>
                                  </td>
                                  <td className="p-3 font-mono text-emerald-600 font-semibold text-start">
                                    <span dir="ltr">{formatCFA(eleve.montantPaye)}</span>
                                  </td>
                                  <td className={`p-3 font-mono font-semibold text-start ${remaining > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                    <span dir="ltr">{formatCFA(remaining)}</span>
                                  </td>
                                  <td className="p-3 text-start">
                                    {eleve.paiementStatut === 'paye' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">{t('landing.demo.paid', "Payé")}</span>
                                    ) : eleve.paiementStatut === 'partiel' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">{t('landing.demo.partiel', "Acompte")}</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800">{t('landing.demo.unpaid', "Non payé")}</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/35 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-medium text-start">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{t('landing.demo.transactions_logged', "Toutes les transactions sont enregistrées dans la base de données de démonstration.")}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm border border-emerald-200/50 dark:border-emerald-800/50 shrink-0 text-start flex items-center gap-1 select-none">
                        {t('landing.demo.total_collected', "Total Encaissé : ")} <span dir="ltr">{formatCFA(demoEleves.reduce((acc, e) => acc + e.montantPaye, 0))}</span>
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* ONGLET 2 : BULLETINS */}
              {activeTab === 'bulletins' && (
                <div className="space-y-6 animate-fadeIn text-start">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4 text-start">
                    <div>
                      <h4 className="font-semibold text-base text-text">{t('landing.demo.preview_report', "Prévisualisation du Bulletin Trimestriel Officiel")}</h4>
                      <p className="text-xs text-muted-foreground">{t('landing.demo.preview_report_desc', "Aperçu conforme aux exigences de la DREN et du Ministère (MENA).")}</p>
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={selectedDemoEleveId} 
                        onChange={(e) => setSelectedDemoEleveId(e.target.value)}
                        className="bg-white border border-border rounded-lg text-xs px-3 py-2 outline-none text-slate-800"
                      >
                        {demoEleves.map(e => (
                          <option key={e.id} value={e.id}>{e.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Faux document papier Bulletin A4 */}
                  {selectedEleveForPayment && (
                    <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-md max-w-3xl mx-auto space-y-6 relative overflow-hidden select-none font-serif text-slate-900 text-start">
                      
                      {/* Liseré Tricolore Ivoirien (Orange, Blanc, Vert) */}
                      <div className="absolute top-0 left-0 right-0 h-1 flex">
                        <div className="flex-1 bg-[#F77F00]" />
                        <div className="flex-1 bg-[#FFFFFF]" />
                        <div className="flex-1 bg-[#009B77]" />
                      </div>

                      {/* En-tête MENA */}
                      <div className="grid grid-cols-2 text-[9px] font-sans text-slate-850 uppercase tracking-tight leading-normal">
                        <div className="text-start">
                          <p className="font-bold text-[10px]">{t('landing.demo.republic', "RÉPUBLIQUE DE CÔTE D'IVOIRE")}</p>
                          <p>{t('landing.demo.ministry', "MINISTÈRE DE L'ÉDUCATION NATIONALE")}</p>
                          <p>{t('landing.demo.ministry_desc', "ET DE L'ALPHABÉTISATION (MENA)")}</p>
                          <p>{t('landing.demo.dren', "DREN ABIDJAN 1 — CÔTE D'IVOIRE")}</p>
                        </div>
                        <div className="text-end">
                          <p className="font-bold text-[10px]">{t('landing.demo.school_name', "ÉTABLISSEMENT LES FLAMBOYANTS")}</p>
                          <p>{t('landing.demo.school_year', "ANNÉE SCOLAIRE : 2024-2025")}</p>
                          <p className="text-primary font-semibold">{t('landing.demo.matricule', "MATRICULE : ")} {selectedEleveForPayment.matricule}</p>
                        </div>
                      </div>

                      {/* Titre bulletin */}
                      <div className="text-center py-2 border-y border-slate-300/80 bg-slate-50/50">
                        <h5 className="font-sans font-bold text-sm tracking-widest text-slate-900">{t('landing.demo.report_title', "BULLETIN DE NOTES DU 1ER TRIMESTRE")}</h5>
                        <p className="text-[10px] font-sans font-medium text-muted-foreground mt-0.5">{t('landing.demo.student_label', "Élève : ")} <span className="font-bold text-slate-900">{selectedEleveForPayment.nom}</span> — {t('landing.demo.class_label', "Classe : CM2 A")}</p>
                      </div>

                      {/* Tableau de notes fictif */}
                      <table className="w-full text-[10px] border-collapse border border-slate-300 text-start font-sans">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-start">
                            <th className="p-2 border-r border-slate-300 text-start">{t('landing.demo.discipline', "Discipline")}</th>
                            <th className="p-2 border-r border-slate-300 text-center">{t('landing.demo.grade_out_of_20', "Note /20")}</th>
                            <th className="p-2 border-r border-slate-300 text-center">{t('landing.demo.coeff', "Coeff")}</th>
                            <th className="p-2 border-r border-slate-300 text-center">{t('landing.demo.grade_x_coeff', "Note × Coeff")}</th>
                            <th className="p-2 text-start">{t('landing.demo.teacher_comment', "Appréciation Enseignant")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          <tr className="text-start">
                            <td className="p-2 border-r border-slate-300 font-semibold text-start">{t('landing.demo.french', "Français (Lecture/Écriture)")}</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">14.00</td>
                            <td className="p-2 border-r border-slate-300 text-center">3</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">42.00</td>
                            <td className="p-2 text-slate-600 text-start">{t('landing.demo.french_comment', "Bon trimestre, bon dynamisme en classe.")}</td>
                          </tr>
                          <tr className="text-start">
                            <td className="p-2 border-r border-slate-300 font-semibold text-start">{t('landing.demo.math', "Mathématiques (Calcul/Géométrie)")}</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">{(selectedEleveForPayment.moyenne * 0.9).toFixed(2)}</td>
                            <td className="p-2 border-r border-slate-300 text-center">4</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">{(selectedEleveForPayment.moyenne * 0.9 * 4).toFixed(2)}</td>
                            <td className="p-2 text-slate-600 text-start">{t('landing.demo.math_comment', "Travail rigoureux et logique appliquée.")}</td>
                          </tr>
                          <tr className="text-start">
                            <td className="p-2 border-r border-slate-300 font-semibold text-start">{t('landing.demo.history_geo', "Histoire-Géographie")}</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">{(selectedEleveForPayment.moyenne * 1.1).toFixed(2)}</td>
                            <td className="p-2 border-r border-slate-300 text-center">2</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">{(selectedEleveForPayment.moyenne * 1.1 * 2).toFixed(2)}</td>
                            <td className="p-2 text-slate-600 text-start">{t('landing.demo.history_geo_comment', "Excellente participation, élève très curieux.")}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Résumé des calculs */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10px] font-sans">
                        <div className="space-y-1 text-start">
                          <p>{t('landing.demo.class_average', "Moyenne de classe : ")} <span className="font-mono font-bold">13.40 / 20</span></p>
                          <p>{t('landing.demo.total_coeff', "Total Coefficients : ")} <span className="font-bold">9</span></p>
                          <p>{t('landing.demo.attendance', "Assiduité (Absences) : ")} <span className="font-mono font-bold text-emerald-700">{t('landing.demo.no_absences', "0 heure non-justifiée")}</span></p>
                        </div>
                        <div className="space-y-1 text-end">
                          <p className="text-xs">{t('landing.demo.general_average', "Moyenne Générale : ")} <span className="font-mono font-bold text-primary text-sm">{selectedEleveForPayment.moyenne.toFixed(2)} / 20</span></p>
                          <p>{t('landing.demo.rank', "Rang trimestriel : ")} <span className="font-bold text-slate-900">{selectedEleveForPayment.moyenne >= 15 ? t('landing.demo.1st', "1er") : t('landing.demo.3rd', "3e")} {t('landing.demo.of_class', "de la classe")}</span></p>
                          <p>{t('landing.demo.general_comment', "Appréciation générale : ")} <span className="font-bold text-primary">
                            {selectedEleveForPayment.moyenne >= 16 ? t('appreciations.excellent', 'Excellent') : selectedEleveForPayment.moyenne >= 14 ? t('appreciations.tres_bien', 'Très Bien') : t('appreciations.bien', 'Bien')}
                          </span></p>
                        </div>
                      </div>

                      {/* Signature Directeur */}
                      <div className="flex justify-between items-center text-[8px] font-sans pt-4 border-t border-slate-200">
                        <div className="text-start">
                          <p className="font-bold uppercase">{t('landing.demo.parent_signature', "Signature du Titulaire")}</p>
                          <p className="text-slate-400 mt-6">{t('landing.demo.filled_online', "Renseigné en ligne")}</p>
                        </div>
                        <div className="text-end">
                          <p className="font-bold uppercase">{t('landing.demo.director_signature', "Le Directeur (Cachet Officiel)")}</p>
                          <p className="text-slate-400 mt-6">{t('landing.demo.director_name', "K. Bernard (Signé Numériquement)")}</p>
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="text-center">
                    <Link 
                      href="/login" 
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                    >
                      <span>{t('landing.demo.print_reports', "Imprimer tous les bulletins de la classe sur le vrai dashboard")}</span>
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              )}

              {/* ONGLET 3 : APPEL / ABSENCES */}
              {activeTab === 'appel' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  
                  {/* Partie gauche : statistiques d'appel */}
                  <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-border/80 dark:border-border flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-text flex items-center gap-1.5 text-start">
                        <UserCheck className="h-4 w-4 text-primary" />
                        {t('landing.demo.interactive_rollcall', "Feuille d'Appel Interactive")}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed text-start">
                        {t('landing.demo.rollcall_desc', "Simulez la prise d'appel. Cliquez sur le bouton d'absence à côté d'un élève pour le marquer absent et observer le taux de présence de la classe s'ajuster instantanément.")}
                      </p>
                    </div>

                    <div className="py-6 flex flex-col items-center justify-center space-y-2">
                      {/* Indicateur circulaire en CSS simple */}
                      <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner">
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-slow opacity-20" />
                        <div className="text-center">
                          <span className="text-3xl font-mono font-bold text-primary">{attendanceRate}%</span>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider font-sans">{t('landing.demo.presence', "Présence")}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {t('landing.demo.presents_out_of', "{presentCount} Présents sur {totalCount} Élèves")
                          .replace('{presentCount}', String(presentCount))
                          .replace('{totalCount}', String(totalCount))}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t('landing.demo.call_date', "Date d'appel :")}</span>
                        <span className="font-semibold text-text">{new Date().toLocaleDateString(isAr ? 'ar-EG' : 'fr-FR')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t('landing.demo.session', "Séance :")}</span>
                        <span className="font-semibold text-primary capitalize">{t('landing.demo.morning', "Matin (7h-12h)")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Partie droite : Tableau des absences */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm text-text text-start">{t('landing.demo.attendance_list', "Liste de présence (CM2 A)")}</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setDemoEleves(prev => prev.map(e => ({ ...e, statutAppel: 'present' })))}
                          className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border dark:border-border text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          {t('landing.demo.all_present', "Tous Présents")}
                        </button>
                        <button 
                          onClick={() => setDemoEleves(prev => prev.map(e => ({ ...e, statutAppel: 'absent' })))}
                          className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border dark:border-border text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          {t('landing.demo.all_absent', "Tous Absents")}
                        </button>
                      </div>
                    </div>

                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                      <div className="divide-y divide-border/60">
                        {demoEleves.map(eleve => (
                          <div key={eleve.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <div className="text-start">
                              <p className="text-xs font-semibold text-text">{eleve.nom}</p>
                              <p className="text-[9px] text-muted-foreground font-mono">{eleve.matricule}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                eleve.statutAppel === 'present' 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              }`}>
                                {eleve.statutAppel === 'present' ? t('landing.demo.present', 'Présent') : t('landing.demo.absent', 'Absent')}
                              </span>

                              <button 
                                onClick={() => toggleDemoAppel(eleve.id)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                  eleve.statutAppel === 'present'
                                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                }`}
                              >
                                {eleve.statutAppel === 'present' ? t('landing.demo.mark_absent', 'Marquer Absent') : t('landing.demo.mark_present', 'Marquer Présent')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* --- STATS D'IMPACT --- */}
      <section className="py-16 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-5xl font-mono font-bold bg-gradient-to-r from-emerald-400 to-primary text-transparent bg-clip-text" dir="ltr">15 000 +</p>
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">{t('landing.stats.enrolled_title', "Élèves Suivis")}</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('landing.stats.enrolled_desc', "Gérés quotidiennement dans notre base de données sécurisée.")}</p>
            </div>
            <div className="space-y-2 border-y md:border-y-0 md:border-x border-slate-800 py-8 md:py-0">
              <p className="text-5xl font-mono font-bold bg-gradient-to-r from-accent to-amber-500 text-transparent bg-clip-text" dir="ltr">98.5%</p>
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">{t('landing.stats.recovery_rate_title', "Taux de Recouvrement")}</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('landing.stats.recovery_rate_desc', "Grâce au suivi transparent des règlements en plusieurs fois.")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-mono font-bold bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text" dir="ltr">0 min</p>
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">{t('landing.stats.zero_loss_title', "Perte administrative")}</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('landing.stats.zero_loss_desc', "Plus de papier égaré : tout est numérisé et accessible à l'instant.")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-primary font-bold">{t('landing.pricing.section_title', "Tarification Transparente")}</h2>
            <h3 className="text-3xl font-display font-bold text-text">{t('landing.pricing.section_subtitle', "Des tarifs équitables et sans surprises")}</h3>
            <p className="text-muted-foreground">{t('landing.pricing.section_desc', "Une facturation claire basée sur le nombre réel d'élèves. Payez annuellement, sans frais de maintenance.")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Gratuit */}
            <div className="bg-background dark:bg-card rounded-3xl p-8 border border-border/60 dark:border-border/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-8 shadow-sm text-start">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">{t('pricing.free', "Formule Gratuite")}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold text-text">0 FCFA</p>
                  <p className="text-xs text-muted-foreground">{t('landing.pricing.free_lifetime', "Gratuit à vie")}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.pricing.free_desc', "Essentiel pour découvrir la plateforme. Limité à 50 élèves.")}
                </p>
                
                <div className="border-t border-border/80 pt-6 space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span>{t('landing.pricing.free_features', "Jusqu'à 50 élèves")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span>{t('landing.pricing.free_features_2', "Fonctionnalités de base")}</span>
                  </div>
                </div>
              </div>

              <Link 
                href="/register?plan=gratuit" 
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-center py-3.5 rounded-xl text-sm transition-all"
                id="pricing-free-cta"
              >
                {t('landing.pricing.free_cta', "Commencer Gratuitement")}
              </Link>
            </div>

            {/* Plan Standard (Recommandé) */}
            <div className="bg-gradient-to-b from-white to-emerald-50/10 dark:from-card dark:to-emerald-950/5 rounded-3xl p-8 border-2 border-primary transition-all flex flex-col justify-between space-y-8 shadow-md relative text-start">
              <div className="absolute -top-3.5 right-6 rtl:left-6 rtl:right-auto bg-primary text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-400 shadow-md">
                <Check className="h-3 w-3 inline-block mr-1 rtl:ml-1 rtl:mr-0" /> {t('landing.pricing.standard_rec', "Recommandé")}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">{t('pricing.standard_title', "Formule Standard")}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold text-text">150 000 FCFA</p>
                  <p className="text-xs text-muted-foreground">{t('landing.pricing.per_year', "par établissement / an")}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.pricing.standard_desc', "Idéal pour les structures de taille intermédiaire ou en lancement (Recommandé jusqu'à 300 élèves).")}
                </p>
                
                <div className="border-t border-primary/20 pt-6 space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>{t('landing.pricing.standard_features', "Inscriptions & fiches d'élèves")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>{t('landing.pricing.standard_features_2', "Bulletins A4 conformes MENA")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>{t('landing.pricing.standard_features_3', "Suivi encaissements (FCFA)")}</span>
                  </div>
                </div>
              </div>

              <Link 
                href="/register?plan=standard" 
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold text-center py-3.5 rounded-xl text-sm transition-all shadow-md shadow-primary/20 border border-primary/20"
                id="pricing-standard-cta"
              >
                {t('landing.pricing.standard_cta', "Choisir Standard")}
              </Link>
            </div>

            {/* Plan Premium */}
            <div className="bg-background dark:bg-card rounded-3xl p-8 border border-border/60 dark:border-border/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-8 shadow-sm relative text-start">
              <div className="absolute -top-3.5 right-6 rtl:left-6 rtl:right-auto bg-accent text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-amber-400 shadow-md">
                {t('pricing.premium_badge', "Premium")}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">{t('pricing.premium_title', "Formule Premium")}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold text-text">250 000 FCFA</p>
                  <p className="text-xs text-muted-foreground">{t('landing.pricing.per_year', "par établissement / an")}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.pricing.premium_desc', "Élèves illimités, sauvegardes quotidiennes automatisées, assistance prioritaire 24h/7 via WhatsApp.")}
                </p>
                
                <div className="border-t border-border/80 pt-6 space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>{t('landing.pricing.premium_features', "Tout le contenu Standard")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span className="font-bold text-primary">{t('landing.pricing.premium_features_2', "Nombre d'élèves illimité")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>{t('landing.pricing.premium_features_3', "Assistance technique WhatsApp 24h/7")}</span>
                  </div>
                </div>
              </div>

              <Link 
                href="/register?plan=premium" 
                className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-center py-3.5 rounded-xl text-sm transition-all"
                id="pricing-premium-cta"
              >
                {t('landing.pricing.premium_cta', "Choisir Premium")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION FAQ --- */}
      <section id="faq" className="py-24 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-border scroll-mt-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-xs uppercase tracking-widest text-emerald-500 font-bold">{t('landing.faq.title', "Une question ?")}</h2>
            <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">{t('landing.faq.subtitle', "Questions fréquemment posées")}</h3>
            <p className="text-slate-500 dark:text-slate-400">{t('landing.faq.desc', "Voici toutes les réponses aux interrogations de nos futurs établissements partenaires.")}</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border overflow-hidden transition-all shadow-sm hover:shadow"
              >
                <button 
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full text-start p-6 font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center justify-between gap-4 outline-none hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  id={`faq-btn-${idx}`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                    openFaqIndex === idx ? 'transform rotate-180 text-emerald-500' : ''
                  }`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-border pt-4 animate-slideDown text-start">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-950/20 p-6 text-center mt-12 space-y-3">
            <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-400 flex items-center justify-center gap-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-emerald-600" />
              {t('landing.faq.need_help', "Des besoins spécifiques ou besoin d'une présentation privée ?")}
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
              {t('landing.faq.need_help_desc', "Notre équipe d'assistance basée à Abidjan est à votre écoute pour organiser une démonstration sur place ou en visioconférence.")}
            </p>
            <div className="pt-2">
              <a 
                href="https://wa.me/2250586037974" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm transition-all"
                id="contact-support-faq"
              >
                {t('landing.faq.whatsapp_btn', "Contacter notre conseiller WhatsApp")}
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-white pt-16 pb-8 border-t border-slate-800 text-start">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            {/* Colonne 1 : À propos */}
            <div className="space-y-4 col-span-1 md:col-span-1 text-start">
              <div className="flex items-center gap-2">
                <img src={logoImg.src} alt="GestScol Logo" className="h-10 w-auto object-contain" />
                <span className="text-xl font-display font-bold">GestScol</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('landing.footer.desc', "Le partenaire numérique de confiance pour les établissements d'enseignement primaire et secondaire en Afrique de l'Ouest.")}
              </p>
            </div>

            {/* Colonne 2 : Liens rapides */}
            <div className="space-y-4 text-start">
              <h4 className="text-xs uppercase font-bold tracking-widest text-slate-200">{t('landing.nav.features', "Fonctionnalités")}</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#features" className="hover:text-primary transition-colors">{t('landing.features.card1_title', "Scolarité FCFA")}</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">{t('landing.features.card2_title', "Bulletins A4")}</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">{t('landing.features.card3_title', "Absences en ligne")}</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">{t('landing.features.card4_title', "Espace Parent Mobile")}</a></li>
              </ul>
            </div>

            {/* Colonne 3 : Tarifs & FAQ */}
            <div className="space-y-4 text-start">
              <h4 className="text-xs uppercase font-bold tracking-widest text-slate-200">{t('landing.footer.col3_title', "Ressources")}</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#pricing" className="hover:text-primary transition-colors">{t('landing.pricing.title_tariff', "Tarifs Académie")}</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">{t('pricing.premium_badge', "Abonnement Premium")}</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors">{t('landing.nav.faq', "FAQ")}</a></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">{t('landing.nav.connect', "Portail Administrateur")}</Link></li>
              </ul>
            </div>

            {/* Colonne 4 : Coordonnées locales */}
            <div className="space-y-4 text-start">
              <h4 className="text-xs uppercase font-bold tracking-widest text-slate-200">{t('landing.footer.address_label', "Siège Social & Contact")}</h4>
              <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
                <li className="font-semibold text-slate-300">{t('landing.footer.address_title', "GestScol Afrique de l'Ouest")}</li>
                <li>{t('landing.footer.address_city', "Abidjan, Cocody, Boulevard Hassan II")}</li>
                <li>{t('landing.footer.address_country', "République de Côte d'Ivoire")}</li>
                <li className="pt-2 font-semibold text-primary">{t('landing.footer.support', "Support : +225 05 86 03 79 74")}</li>
                <li className="text-slate-500">{t('landing.footer.email', "Email : contact@gestscol.ci")}</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 text-start">
            <p>{t('landing.footer.copyright', "© {year} GestScol. Tous droits réservés. Conçu pour le développement éducatif ouest-africain.").replace('{year}', new Date().getFullYear().toString())}</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-400">{t('landing.footer.terms', "Mentions Légales")}</a>
              <a href="#" className="hover:text-slate-400">{t('landing.footer.privacy', "Politique de Confidentialité")}</a>
              <a href="#" className="hover:text-slate-400">{t('landing.footer.cgu', "CGU")}</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}
