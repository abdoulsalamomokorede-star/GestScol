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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
      q: "Est-ce que l'outil est adapté aux exigences du Ministère de l'Éducation Nationale de Côte d'Ivoire ?",
      a: "Absolument. GestScol a été conçu en étroite collaboration avec des secrétariats et directeurs d'écoles ivoiriennes. Notre système de bulletins trimestriels calcule automatiquement les moyennes pondérées par coefficients, détermine les classements par classe, et génère un document PDF A4 respectant scrupuleusement la mise en page officielle de la MENA (DREN, République de Côte d'Ivoire, cachets)."
    },
    {
      q: "Comment fonctionne la gestion des paiements par Wave ou Mobile Money ?",
      a: "L'application permet d'enregistrer des règlements partiels (acomptes / tranches) en FCFA. Lors de l'encaissement, l'intendant spécifie le canal de transaction (Wave, Orange Money, MTN MoMo, ou Espèces) et renseigne la référence officielle du versement. L'historique et les reçus de caisse s'impriment sous format professionnel avec toutes ces coordonnées de traçabilité financière."
    },
    {
      q: "Est-ce que l'application est rapide sur mobile ou avec une faible connexion 3G/4G ?",
      a: "Oui, la fluidité a été notre priorité absolue. Nous savons que la connexion peut être capricieuse ou lente dans certaines localités. Notre stack moderne est optimisée et n'utilise pas de ressources graphiques lourdes, permettant à un enseignant de faire l'appel ou de saisir les notes en classe directement sur un téléphone Tecno ou Infinix d'entrée de gamme sans le moindre ralentissement."
    },
    {
      q: "Les données des élèves sont-elles sécurisées et confidentielles ?",
      a: "Toutes les données sont stockées sur des serveurs sécurisés avec des politiques de sauvegarde quotidienne automatisée. De plus, l'accès est strictement protégé par rôles : le Directeur contrôle l'intégralité du tableau de bord financier et de scolarité, l'Enseignant ne gère que ses matières assignées, et chaque Parent accède uniquement et en toute confidentialité aux notes et absences de son propre enfant."
    }
  ]

  return (
    <div className="bg-background text-text min-h-screen font-sans selection:bg-primary/20 selection:text-primary-dark">
      
      {/* Toast interactif pour la simulation */}
      {paymentSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce max-w-sm">
          <div className="bg-white/20 p-2 rounded-full">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Simulation d'Encaissement Réussie !</p>
            <p className="text-xs text-emerald-100">Le reçu A4 a été généré et le solde mis à jour.</p>
          </div>
        </div>
      )}

      {/* --- EN-TÊTE DE PRESTIGE --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/60 transition-all duration-300">
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
            <a href="#features" className="hover:text-primary transition-colors">Fonctionnalités</a>
            <a href="#demo" className="hover:text-primary transition-colors">Démo Interactive</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Tarification</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm font-semibold text-text hover:text-primary transition-colors px-4 py-2 outline-none">
                Se Connecter
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/login" className="cursor-pointer w-full font-medium">Espace Directeur</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/login/enseignant" className="cursor-pointer w-full font-medium">Espace Enseignant</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/login/parent" className="cursor-pointer w-full font-medium">Espace Parent</Link>
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
                Inscrire mon École <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          {/* Menu Mobile Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-text hover:bg-muted"
            id="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-border/80 px-4 pt-2 pb-6 space-y-4 shadow-xl">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 hover:text-primary"
            >
              Fonctionnalités
            </a>
            <a 
              href="#demo" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 hover:text-primary"
            >
              Démo Interactive
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 hover:text-primary"
            >
              Tarification
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 hover:text-primary"
            >
              FAQ
            </a>
            <div className="border-t border-border/80 pt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-2 w-full pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Se Connecter :</p>
                <Link 
                  href="/login" 
                  className="w-full text-center font-medium py-2 border border-border rounded-lg text-text hover:bg-muted"
                >
                  Directeur
                </Link>
                <Link 
                  href="/login/enseignant" 
                  className="w-full text-center font-medium py-2 border border-border rounded-lg text-text hover:bg-muted"
                >
                  Enseignant
                </Link>
                <Link 
                  href="/login/parent" 
                  className="w-full text-center font-medium py-2 border border-border rounded-lg text-text hover:bg-muted"
                >
                  Parent
                </Link>
              </div>
              <Link 
                href="/register" 
                className="w-full text-center font-semibold py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark shadow-md"
                id="register-btn-mobile"
              >
                Inscrire mon École
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-16 pb-28 md:pt-28 md:pb-40 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
        {/* Cercles luminescents en arrière-plan */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/80 text-emerald-700 text-xs font-semibold border border-emerald-200/50 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>La plateforme n°1 des écoles privées d'Afrique de l'Ouest</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-extrabold leading-tight tracking-tight text-slate-900">
              Pilotez votre établissement avec{' '}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent font-extrabold">
                intelligence
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              La solution complète pour digitaliser la gestion de votre école : encaissements Wave & Mobile Money, bulletins conformes MENA, et suivi en temps réel pour les parents.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link 
                href="/register" 
                className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base px-8 py-4 rounded-full shadow-xl shadow-slate-900/10 transition-all gap-2 group border border-slate-800"
                id="hero-primary-cta"
              >
                Inscrire mon École
                <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#demo" 
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-base px-8 py-4 rounded-full shadow-sm hover:shadow transition-all"
                id="hero-secondary-cta"
              >
                Découvrir la démo
              </a>
            </div>

            {/* Avantages en 3 mots */}
            <div className="flex flex-wrap justify-center gap-6 pt-12 text-xs font-semibold text-slate-500 uppercase tracking-widest">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span>Conforme MENA</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span>Wave & Mobile Money</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span>Mobile-First</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span>Cloud Sécurisé</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- GRILLE DE FONCTIONNALITÉS MÉTIERS --- */}
      <section id="features" className="py-24 bg-white border-y border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
            <h2 className="text-xs uppercase tracking-widest text-emerald-500 font-bold">Fonctionnalités Clés</h2>
            <p className="text-3xl md:text-4xl font-display font-bold text-slate-900">Spécialement taillé pour les établissements d'Afrique Francophone</p>
            <p className="text-slate-500 text-lg">Une gestion fluide pour les directeurs, rapide pour les enseignants et transparente pour les parents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Carte 1 : Scolarité & Mobile Money */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-5">
                <div className="bg-emerald-50 p-4 rounded-2xl w-fit text-emerald-600 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">Scolarité Multi-Versements</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Enregistrez des acomptes réguliers en FCFA. Support des opérateurs locaux (Wave, Orange, MTN) avec reçus de caisse certifiés A4 prêts pour l'impression ou l'exportation PDF.
                </p>
              </div>
            </div>

            {/* Carte 2 : Bulletins Trimestriels MENA */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-accent/30 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-5">
                <div className="bg-amber-50 p-4 rounded-2xl w-fit text-amber-600 group-hover:scale-110 transition-transform">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">Bulletins PDF Officiels</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Calcul automatisé des moyennes pondérées selon les coefficients de chaque classe. Classement des rangs instantané et impression globale ou individuelle en A4.
                </p>
              </div>
            </div>

            {/* Carte 3 : Absences (Appel Rapide) */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-teal-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-5">
                <div className="bg-teal-50 p-4 rounded-2xl w-fit text-teal-600 group-hover:scale-110 transition-transform">
                  <UserCheck className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">Feuille d'Appel Mobile</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Faites l'appel en classe par séance (Matin/Après-midi) en 1 minute. Le directeur justifie les motifs à la volée, et le parent reçoit un rapport d'assiduité en temps réel.
                </p>
              </div>
            </div>

            {/* Carte 4 : Espace Parent Mobile-First */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-5">
                <div className="bg-blue-50 p-4 rounded-2xl w-fit text-blue-600 group-hover:scale-110 transition-transform">
                  <Smartphone className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">Suivi pour les Familles</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Un espace parent allégé et mobile-first. Les familles suivent le solde scolarité, déchargent des reçus officiels, et signalent des motifs d'absences directement depuis leur smartphone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION DÉMO INTERACTIVE --- */}
      <section id="demo" className="py-20 bg-gradient-to-b from-background to-slate-50 relative scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
            <h2 className="text-xs uppercase tracking-widest text-primary font-bold">Démo en Direct</h2>
            <h3 className="text-3xl font-display font-bold text-text">Découvrez notre cockpit de démonstration</h3>
            <p className="text-muted-foreground">Cliquez sur les onglets ci-dessous pour tester l'application directement dans votre navigateur web.</p>
          </div>

          <div className="bg-white rounded-3xl border border-border/70 shadow-2xl overflow-hidden max-w-5xl mx-auto">
            {/* Header de la fausse app */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400 font-medium ml-2 select-none">GestScol - Espace Directeur (Aperçu)</span>
              </div>
              <div className="bg-slate-800 text-[10px] text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Démonstration Interactive
              </div>
            </div>

            {/* Onglets sélecteurs */}
            <div className="bg-slate-50 border-b border-border/80 flex flex-wrap">
              <button 
                onClick={() => setActiveTab('scolarite')}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 font-semibold text-sm transition-all outline-none ${
                  activeTab === 'scolarite' 
                    ? 'border-primary text-primary bg-white' 
                    : 'border-transparent text-muted-foreground hover:bg-slate-100 hover:text-text'
                }`}
                id="demo-tab-scolarite"
              >
                <Coins className="h-4 w-4" />
                Suivi de la Scolarité
              </button>
              <button 
                onClick={() => setActiveTab('bulletins')}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 font-semibold text-sm transition-all outline-none ${
                  activeTab === 'bulletins' 
                    ? 'border-primary text-primary bg-white' 
                    : 'border-transparent text-muted-foreground hover:bg-slate-100 hover:text-text'
                }`}
                id="demo-tab-bulletins"
              >
                <FileText className="h-4 w-4" />
                Bulletins MENA
              </button>
              <button 
                onClick={() => setActiveTab('appel')}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 font-semibold text-sm transition-all outline-none ${
                  activeTab === 'appel' 
                    ? 'border-primary text-primary bg-white' 
                    : 'border-transparent text-muted-foreground hover:bg-slate-100 hover:text-text'
                }`}
                id="demo-tab-appel"
              >
                <UserCheck className="h-4 w-4" />
                Feuille d'Appel Rapide
              </button>
            </div>

            {/* Contenu de la Démo */}
            <div className="p-6 md:p-8 min-h-[420px]">
              
              {/* ONGLET 1 : SCOLARITÉ */}
              {activeTab === 'scolarite' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  
                  {/* Partie gauche : Formulaire simulation paiement */}
                  <div className="lg:col-span-1 bg-slate-50 p-5 rounded-2xl border border-border/80 space-y-4">
                    <h4 className="font-semibold text-sm text-text flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Simuler un encaissement
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sélectionnez un élève débiteur, définissez le versement et validez pour voir le solde recalculé à droite.
                    </p>

                    <form onSubmit={handleSimulatePayment} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Élève concerné</label>
                        <select 
                          value={selectedDemoEleveId} 
                          onChange={(e) => setSelectedDemoEleveId(e.target.value)}
                          className="w-full bg-white border border-border rounded-lg text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary"
                        >
                          {demoEleves.map(e => (
                            <option key={e.id} value={e.id}>
                              {e.nom} ({e.paiementStatut === 'paye' ? 'Solfé' : `Reste: ${formatCFA(e.montantDu - e.montantPaye)}`})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Montant à verser</label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(Math.max(1000, Number(e.target.value)))}
                            max={selectedEleveForPayment ? selectedEleveForPayment.montantDu - selectedEleveForPayment.montantPaye : 70000}
                            className="w-full bg-white border border-border rounded-lg text-xs p-2.5 pr-14 outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground">FCFA</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Opérateur de Paiement</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button 
                            type="button"
                            onClick={() => setPaymentOperator('wave')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              paymentOperator === 'wave' 
                                ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-sm' 
                                : 'bg-white border-border text-muted-foreground hover:bg-slate-50'
                            }`}
                          >
                            Wave
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPaymentOperator('orange')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              paymentOperator === 'orange' 
                                ? 'bg-orange-50 text-orange-700 border-orange-300 shadow-sm' 
                                : 'bg-white border-border text-muted-foreground hover:bg-slate-50'
                            }`}
                          >
                            Orange
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPaymentOperator('mtn')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              paymentOperator === 'mtn' 
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-300 shadow-sm' 
                                : 'bg-white border-border text-muted-foreground hover:bg-slate-50'
                            }`}
                          >
                            MTN
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPaymentOperator('especes')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              paymentOperator === 'especes' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
                                : 'bg-white border-border text-muted-foreground hover:bg-slate-50'
                            }`}
                          >
                            Espèces
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
                            Traitement en cours...
                          </>
                        ) : selectedEleveForPayment?.paiementStatut === 'paye' ? (
                          'Scolarité Déjà Soldée'
                        ) : (
                          `Encaisser ${formatCFA(paymentAmount)}`
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Partie droite : Tableau des règlements */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm text-text">Scolarité de la classe : CM2 A (Démo)</h4>
                      <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-muted-foreground font-semibold uppercase tracking-wider">Trimestre 1</span>
                    </div>

                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider border-b border-border">
                            <tr>
                              <th className="p-3">Élève</th>
                              <th className="p-3">Total dû</th>
                              <th className="p-3">Déjà Réglé</th>
                              <th className="p-3">Reste à payer</th>
                              <th className="p-3">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {demoEleves.map(eleve => {
                              const remaining = eleve.montantDu - eleve.montantPaye
                              return (
                                <tr key={eleve.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3 font-semibold text-text">{eleve.nom}</td>
                                  <td className="p-3 font-mono">{formatCFA(eleve.montantDu)}</td>
                                  <td className="p-3 font-mono text-emerald-600 font-semibold">{formatCFA(eleve.montantPaye)}</td>
                                  <td className={`p-3 font-mono font-semibold ${remaining > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                    {formatCFA(remaining)}
                                  </td>
                                  <td className="p-3">
                                    {eleve.paiementStatut === 'paye' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">Payé</span>
                                    ) : eleve.paiementStatut === 'partiel' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">Acompte</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200">Non payé</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-medium">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>Toutes les transactions sont enregistrées dans le store persistant.</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-white px-2 py-1 rounded shadow-sm border border-emerald-200/50">
                        Total Encaissé : {formatCFA(demoEleves.reduce((acc, e) => acc + e.montantPaye, 0))}
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* ONGLET 2 : BULLETINS */}
              {activeTab === 'bulletins' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h4 className="font-semibold text-base text-text">Prévisualisation du Bulletin Trimestriel Officiel</h4>
                      <p className="text-xs text-muted-foreground">Aperçu conforme aux exigences de la DREN et du Ministère (MENA).</p>
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={selectedDemoEleveId} 
                        onChange={(e) => setSelectedDemoEleveId(e.target.value)}
                        className="bg-white border border-border rounded-lg text-xs px-3 py-2 outline-none"
                      >
                        {demoEleves.map(e => (
                          <option key={e.id} value={e.id}>{e.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Faux document papier Bulletin A4 */}
                  {selectedEleveForPayment && (
                    <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-md max-w-3xl mx-auto space-y-6 relative overflow-hidden select-none font-serif">
                      
                      {/* Liseré Tricolore Ivoirien (Orange, Blanc, Vert) */}
                      <div className="absolute top-0 left-0 right-0 h-1 flex">
                        <div className="flex-1 bg-[#F77F00]" />
                        <div className="flex-1 bg-[#FFFFFF]" />
                        <div className="flex-1 bg-[#009B77]" />
                      </div>

                      {/* En-tête MENA */}
                      <div className="grid grid-cols-2 text-[9px] font-sans text-slate-800 uppercase tracking-tight leading-normal">
                        <div>
                          <p className="font-bold text-[10px]">RÉPUBLIQUE DE CÔTE D'IVOIRE</p>
                          <p>MINISTÈRE DE L'ÉDUCATION NATIONALE</p>
                          <p>ET DE L'ALPHABÉTISATION (MENA)</p>
                          <p>DREN ABIDJAN 1 — CÔTE D'IVOIRE</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[10px]">ÉTABLISSEMENT LES FLAMBOYANTS</p>
                          <p>ANNÉE SCOLAIRE : 2024-2025</p>
                          <p className="text-primary font-semibold">MATRICULE : {selectedEleveForPayment.matricule}</p>
                        </div>
                      </div>

                      {/* Titre bulletin */}
                      <div className="text-center py-2 border-y border-slate-300/80 bg-slate-50/50">
                        <h5 className="font-sans font-bold text-sm tracking-widest text-slate-900">BULLETIN DE NOTES DU 1ER TRIMESTRE</h5>
                        <p className="text-[10px] font-sans font-medium text-muted-foreground mt-0.5">Élève : <span className="font-bold text-slate-900">{selectedEleveForPayment.nom}</span> — Classe : CM2 A</p>
                      </div>

                      {/* Tableau de notes fictif */}
                      <table className="w-full text-[10px] border-collapse border border-slate-300 text-left font-sans">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                            <th className="p-2 border-r border-slate-300">Discipline</th>
                            <th className="p-2 border-r border-slate-300 text-center">Note /20</th>
                            <th className="p-2 border-r border-slate-300 text-center">Coeff</th>
                            <th className="p-2 border-r border-slate-300 text-center">Note × Coeff</th>
                            <th className="p-2">Appréciation Enseignant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          <tr>
                            <td className="p-2 border-r border-slate-300 font-semibold">Français (Lecture/Écriture)</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">14.00</td>
                            <td className="p-2 border-r border-slate-300 text-center">3</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">42.00</td>
                            <td className="p-2 text-slate-600">Bon trimestre, bon dynamisme en classe.</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r border-slate-300 font-semibold">Mathématiques (Calcul/Géométrie)</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">{(selectedEleveForPayment.moyenne * 0.9).toFixed(2)}</td>
                            <td className="p-2 border-r border-slate-300 text-center">4</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">{(selectedEleveForPayment.moyenne * 0.9 * 4).toFixed(2)}</td>
                            <td className="p-2 text-slate-600">Travail rigoureux et logique appliquée.</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r border-slate-300 font-semibold">Histoire-Géographie</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">{(selectedEleveForPayment.moyenne * 1.1).toFixed(2)}</td>
                            <td className="p-2 border-r border-slate-300 text-center">2</td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono">{(selectedEleveForPayment.moyenne * 1.1 * 2).toFixed(2)}</td>
                            <td className="p-2 text-slate-600">Excellente participation, élève très curieux.</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Résumé des calculs */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10px] font-sans">
                        <div className="space-y-1">
                          <p>Moyenne de classe : <span className="font-mono font-bold">13.40 / 20</span></p>
                          <p>Total Coefficients : <span className="font-bold">9</span></p>
                          <p>Assiduité (Absences) : <span className="font-mono font-bold text-emerald-700">0 heure non-justifiée</span></p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-xs">Moyenne Générale : <span className="font-mono font-bold text-primary text-sm">{selectedEleveForPayment.moyenne.toFixed(2)} / 20</span></p>
                          <p>Rang trimestriel : <span className="font-bold text-slate-900">{selectedEleveForPayment.moyenne >= 15 ? '1er' : '3e'} de la classe</span></p>
                          <p>Appréciation générale : <span className="font-bold text-primary">
                            {selectedEleveForPayment.moyenne >= 16 ? 'Excellent' : selectedEleveForPayment.moyenne >= 14 ? 'Très Bien' : 'Bien'}
                          </span></p>
                        </div>
                      </div>

                      {/* Signature Directeur */}
                      <div className="flex justify-between items-center text-[8px] font-sans pt-4 border-t border-slate-200">
                        <div>
                          <p className="font-bold uppercase">Signature du Titulaire</p>
                          <p className="text-slate-400 mt-6">Renseigné en ligne</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold uppercase">Le Directeur (Cachet Officiel)</p>
                          <p className="text-slate-400 mt-6">K. Bernard (Signé Numériquement)</p>
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="text-center">
                    <Link 
                      href="/login" 
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                    >
                      <span>Imprimer tous les bulletins de la classe sur le vrai dashboard</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* ONGLET 3 : APPEL / ABSENCES */}
              {activeTab === 'appel' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  
                  {/* Partie gauche : statistiques d'appel */}
                  <div className="lg:col-span-1 bg-slate-50 p-5 rounded-2xl border border-border/80 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-text flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-primary" />
                        Feuille d'Appel Interactive
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Simulez la prise d'appel. Cliquez sur le bouton d'absence à côté d'un élève pour le marquer absent et observer le taux de présence de la classe s'ajuster instantanément.
                      </p>
                    </div>

                    <div className="py-6 flex flex-col items-center justify-center space-y-2">
                      {/* Indicateur circulaire en CSS simple */}
                      <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-slate-100 bg-white shadow-inner">
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-slow opacity-20" />
                        <div className="text-center">
                          <span className="text-3xl font-mono font-bold text-primary">{attendanceRate}%</span>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Présence</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {presentCount} Présents sur {totalCount} Élèves
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Date d'appel :</span>
                        <span className="font-semibold text-text">{new Date().toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Séance :</span>
                        <span className="font-semibold text-primary capitalize">Matin (7h-12h)</span>
                      </div>
                    </div>
                  </div>

                  {/* Partie droite : Tableau des absences */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm text-text">Liste de présence (CM2 A)</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setDemoEleves(prev => prev.map(e => ({ ...e, statutAppel: 'present' })))}
                          className="bg-white hover:bg-slate-100 border border-border text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Tous Présents
                        </button>
                        <button 
                          onClick={() => setDemoEleves(prev => prev.map(e => ({ ...e, statutAppel: 'absent' })))}
                          className="bg-white hover:bg-slate-100 border border-border text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Tous Absents
                        </button>
                      </div>
                    </div>

                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                      <div className="divide-y divide-border/60">
                        {demoEleves.map(eleve => (
                          <div key={eleve.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div>
                              <p className="text-xs font-semibold text-text">{eleve.nom}</p>
                              <p className="text-[9px] text-muted-foreground font-mono">{eleve.matricule}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                eleve.statutAppel === 'present' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {eleve.statutAppel === 'present' ? 'Présent' : 'Absent'}
                              </span>

                              <button 
                                onClick={() => toggleDemoAppel(eleve.id)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                  eleve.statutAppel === 'present'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {eleve.statutAppel === 'present' ? 'Marquer Absent' : 'Marquer Présent'}
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
              <p className="text-5xl font-mono font-bold bg-gradient-to-r from-emerald-400 to-primary text-transparent bg-clip-text">15 000 +</p>
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Élèves Suivis</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Gérés quotidiennement dans notre base de données sécurisée.</p>
            </div>
            <div className="space-y-2 border-y md:border-y-0 md:border-x border-slate-800 py-8 md:py-0">
              <p className="text-5xl font-mono font-bold bg-gradient-to-r from-accent to-amber-500 text-transparent bg-clip-text">98.5%</p>
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Taux de Recouvrement</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Grâce au suivi transparent des règlements en plusieurs fois.</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-mono font-bold bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text">0 min</p>
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Perte administrative</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Plus de papier égaré : tout est numérisé et accessible à l'instant.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-primary font-bold">Tarification Transparente</h2>
            <h3 className="text-3xl font-display font-bold text-text">Des tarifs équitables et sans surprises</h3>
            <p className="text-muted-foreground">Une facturation claire basée sur le nombre réel d'élèves. Payez annuellement, sans frais de maintenance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Gratuit */}
            <div className="bg-background rounded-3xl p-8 border border-border/60 hover:border-slate-300 transition-all flex flex-col justify-between space-y-8 shadow-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">Formule Gratuite</span>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold text-text">0 FCFA</p>
                  <p className="text-xs text-muted-foreground">Gratuit à vie</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Essentiel pour découvrir la plateforme. Limité à 50 élèves.
                </p>
                
                <div className="border-t border-border/80 pt-6 space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span>Jusqu'à 50 élèves</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span>Fonctionnalités de base</span>
                  </div>
                </div>
              </div>

              <Link 
                href="/register?plan=gratuit" 
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-center py-3.5 rounded-xl text-sm transition-all"
                id="pricing-free-cta"
              >
                Commencer Gratuitement
              </Link>
            </div>

            {/* Plan Standard (Recommandé) */}
            <div className="bg-gradient-to-b from-white to-emerald-50/10 rounded-3xl p-8 border-2 border-primary transition-all flex flex-col justify-between space-y-8 shadow-md relative">
              <div className="absolute -top-3.5 right-6 bg-primary text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-400 shadow-md">
                <Check className="h-3 w-3 inline-block mr-1" /> Recommandé
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Formule Standard</span>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold text-text">150 000 FCFA</p>
                  <p className="text-xs text-muted-foreground">par établissement / an</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Idéal pour les structures de taille intermédiaire ou en lancement (Recommandé jusqu'à 300 élèves).
                </p>
                
                <div className="border-t border-primary/20 pt-6 space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>Inscriptions & fiches d'élèves</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>Bulletins A4 conformes MENA</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>Suivi encaissements (FCFA)</span>
                  </div>
                </div>
              </div>

              <Link 
                href="/register?plan=standard" 
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold text-center py-3.5 rounded-xl text-sm transition-all shadow-md shadow-primary/20 border border-primary/20"
                id="pricing-standard-cta"
              >
                Choisir Standard
              </Link>
            </div>

            {/* Plan Premium */}
            <div className="bg-background rounded-3xl p-8 border border-border/60 hover:border-slate-300 transition-all flex flex-col justify-between space-y-8 shadow-sm relative">
              <div className="absolute -top-3.5 right-6 bg-accent text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-amber-400 shadow-md">
                Premium
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">Formule Premium</span>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold text-text">250 000 FCFA</p>
                  <p className="text-xs text-muted-foreground">par établissement / an</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Élèves illimités, sauvegardes quotidiennes automatisées, assistance prioritaire 24h/7 via WhatsApp.
                </p>
                
                <div className="border-t border-border/80 pt-6 space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>Tout le contenu Standard</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span className="font-bold text-primary">Nombre d'élèves illimité</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text">
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span>Assistance technique WhatsApp 24h/7</span>
                  </div>
                </div>
              </div>

              <Link 
                href="/register?plan=premium" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-center py-3.5 rounded-xl text-sm transition-all"
                id="pricing-premium-cta"
              >
                Choisir Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION FAQ --- */}
      <section id="faq" className="py-24 bg-slate-50 border-t border-slate-200 scroll-mt-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-xs uppercase tracking-widest text-emerald-500 font-bold">Une question ?</h2>
            <h3 className="text-3xl font-display font-bold text-slate-900">Questions fréquemment posées</h3>
            <p className="text-slate-500">Voici toutes les réponses aux interrogations de nos futurs établissements partenaires.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm hover:shadow"
              >
                <button 
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full text-left p-6 font-semibold text-sm sm:text-base text-slate-900 flex items-center justify-between gap-4 outline-none hover:bg-slate-50/50 transition-colors"
                  id={`faq-btn-${idx}`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                    openFaqIndex === idx ? 'transform rotate-180 text-emerald-500' : ''
                  }`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-4 animate-slideDown">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 text-center mt-12 space-y-3">
            <p className="font-semibold text-sm text-emerald-800 flex items-center justify-center gap-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-emerald-600" />
              Des besoins spécifiques ou besoin d'une présentation privée ?
            </p>
            <p className="text-xs text-emerald-600/80">
              Notre équipe d'assistance basée à Abidjan est à votre écoute pour organiser une démonstration sur place ou en visioconférence.
            </p>
            <div className="pt-2">
              <a 
                href="https://wa.me/2250586037974" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-4 py-2 rounded-lg border border-emerald-200 shadow-sm transition-all"
                id="contact-support-faq"
              >
                Contacter notre conseiller WhatsApp
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-white pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            {/* Colonne 1 : À propos */}
            <div className="space-y-4 col-span-1 md:col-span-1">
              <div className="flex items-center gap-2">
                <img src={logoImg.src} alt="GestScol Logo" className="h-10 w-auto object-contain" />
                <span className="text-xl font-display font-bold">GestScol</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le partenaire numérique de confiance pour les établissements d'enseignement primaire et secondaire en Afrique de l'Ouest.
              </p>
            </div>

            {/* Colonne 2 : Liens rapides */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-bold tracking-widest text-slate-200">Fonctionnalités</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#features" className="hover:text-primary transition-colors">Scolarité FCFA</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Bulletins MENA</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Absences en ligne</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Espace Parent Mobile</a></li>
              </ul>
            </div>

            {/* Colonne 3 : Tarifs & FAQ */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-bold tracking-widest text-slate-200">Ressources</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#pricing" className="hover:text-primary transition-colors">Tarifs Académie</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Abonnement Premium</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Portail Administrateur</Link></li>
              </ul>
            </div>

            {/* Colonne 4 : Coordonnées locales */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-bold tracking-widest text-slate-200">Siège Social & Contact</h4>
              <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
                <li className="font-semibold text-slate-300">GestScol Afrique de l'Ouest</li>
                <li>Abidjan, Cocody, Boulevard Hassan II</li>
                <li>République de Côte d'Ivoire</li>
                <li className="pt-2 font-semibold text-primary">Support : +225 05 86 03 79 74</li>
                <li className="text-slate-500">Email : contact@gestscol.ci</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} GestScol. Tous droits réservés. Conçu pour le développement éducatif ouest-africain.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-400">Mentions Légales</a>
              <a href="#" className="hover:text-slate-400">Politique de Confidentialité</a>
              <a href="#" className="hover:text-slate-400">CGU</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}
