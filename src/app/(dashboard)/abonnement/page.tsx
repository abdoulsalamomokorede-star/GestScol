'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { 
  Zap, 
  Check, 
  Loader2, 
  ShieldCheck, 
  AlertCircle, 
  Smartphone, 
  ArrowRight,
  HelpCircle,
  Users,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

// Types locaux pour le processus de paiement CinetPay
type PaymentProvider = 'wave' | 'orange' | 'mtn' | 'moov'

interface PlanInfo {
  id: 'gratuit' | 'standard' | 'premium'
  nom: string
  prix: number
  description: string
  maxEleves: number
  maxElevesLabel: string
  features: string[]
  accentColor: string
  bgGradient: string
}

export default function AbonnementPage() {
  const router = useRouter()
  const { ecole, eleves, currentUser, updateAbonnement } = useSchoolStore()
  const { toast } = useToast()
  
  // États de la page
  const [loading, setLoading] = useState(false)
  const [activePlan, setActivePlan] = useState<'gratuit' | 'standard' | 'premium'>('gratuit')
  
  // États de la modale CinetPay
  const [isCinetPayOpen, setIsCinetPayOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null)
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('wave')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [paymentStep, setPaymentStep] = useState<'select' | 'input' | 'processing' | 'success'>('select')
  const [processingStatus, setProcessingStatus] = useState('')
  
  // Sécurité et redirection si ce n'est pas le directeur
  useEffect(() => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    if (currentUser.role !== 'directeur') {
      router.push('/dashboard')
      toast({
        title: "Accès restreint",
        description: "Seul le directeur de l'école est habilité à gérer l'abonnement.",
        variant: "destructive"
      })
    }
  }, [currentUser, router])

  // Charger le forfait actuel
  useEffect(() => {
    if (ecole?.abonnement?.plan) {
      setActivePlan(ecole.abonnement.plan)
    }
  }, [ecole])

  if (!currentUser || currentUser.role !== 'directeur') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Grille des forfaits calquée à 100% sur la capture d'écran
  const plans: PlanInfo[] = [
    {
      id: 'gratuit',
      nom: 'Formule Gratuite',
      prix: 0,
      description: 'Essentiel pour découvrir la plateforme. Limité à 50 élèves.',
      maxEleves: 50,
      maxElevesLabel: 'Jusqu\'à 50 élèves',
      accentColor: 'border-slate-300 text-slate-500',
      bgGradient: 'from-slate-50 to-slate-100/50',
      features: [
        'Jusqu\'à 50 élèves',
        'Fonctionnalités de base'
      ]
    },
    {
      id: 'standard',
      nom: 'Formule Standard',
      prix: 150000,
      description: 'Idéal pour les structures de taille intermédiaire ou en lancement (Recommandé jusqu\'à 300 élèves).',
      maxEleves: 300,
      maxElevesLabel: 'Recommandé jusqu\'à 300 élèves',
      accentColor: 'border-emerald-600 text-emerald-600 ring-2 ring-emerald-500/10',
      bgGradient: 'from-emerald-500/5 to-emerald-500/10',
      features: [
        'Inscriptions & fiches d\'élèves',
        'Bulletins A4 conformes MENA',
        'Suivi encaissements (FCFA)'
      ]
    },
    {
      id: 'premium',
      nom: 'Formule Premium',
      prix: 250000,
      description: 'Élèves illimités, sauvegardes automatisées, assistance prioritaire 24h/7 via WhatsApp.',
      maxEleves: 99999,
      maxElevesLabel: 'Élèves illimités',
      accentColor: 'border-amber-500 text-amber-600 ring-2 ring-amber-500/30',
      bgGradient: 'from-amber-500/5 to-amber-500/10',
      features: [
        'Tout le contenu Standard',
        'Nombre d\'élèves illimité',
        'Assistance technique 24h/7'
      ]
    }
  ]

  // Formateur monétaire pour le Franc CFA
  const formatCFA = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA'
  }

  // Ouvrir la passerelle CinetPay pour un plan
  const handleUpgradeClick = (plan: PlanInfo) => {
    setSelectedPlan(plan)
    setPaymentProvider('wave')
    setPhoneNumber('')
    setPhoneError('')
    setPaymentStep('select')
    setIsCinetPayOpen(true)
  }

  // Validation du numéro de téléphone ivoirien
  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\s+/g, '')
    const phoneRegex = /^(?:\+225|225)?(01|05|07|[0-9]{2})[0-9]{8}$/
    
    if (!cleanPhone) {
      setPhoneError('Le numéro de téléphone est obligatoire.')
      return false
    }
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Veuillez entrer un numéro ivoirien valide à 10 chiffres (ex: 07 07 07 07 07).')
      return false
    }
    
    setPhoneError('')
    return true
  }

  // Lancement de la simulation du paiement CinetPay
  const handleProceedPayment = () => {
    if (!validatePhone(phoneNumber)) return
    
    setPaymentStep('processing')
    
    // Séquence de messages de chargement pour faire "réaliste" et premium
    const steps = [
      'Initialisation de la transaction avec les serveurs CinetPay...',
      'Génération de la demande de prélèvement Mobile Money...',
      'Notification envoyée sur votre téléphone portable. En attente de validation...',
      'Saisie du code PIN détectée... Autorisation en cours...',
      'Transaction validée ! Enregistrement de l\'abonnement...'
    ]
    
    let currentSubStep = 0
    setProcessingStatus(steps[0])
    
    const interval = setInterval(() => {
      currentSubStep++
      if (currentSubStep < steps.length) {
        setProcessingStatus(steps[currentSubStep])
      } else {
        clearInterval(interval)
        finalizeSubscription()
      }
    }, 1800)
  }

  // Finaliser la souscription et mettre à jour Zustand / Supabase
  const finalizeSubscription = async () => {
    if (!selectedPlan) return
    
    try {
      const dateDebut = new Date()
      const dateFin = new Date()
      dateFin.setFullYear(dateFin.getFullYear() + 1) // Facturation uniquement annuelle

      const txRef = `CP-${Math.random().toString(36).substring(2, 11).toUpperCase()}`

      await updateAbonnement({
        plan: selectedPlan.id,
        statut: 'actif',
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
        maxEleves: selectedPlan.maxEleves,
        montantPaye: selectedPlan.prix,
        modePaiement: paymentProvider as any,
        transactionRef: txRef
      })

      setPaymentStep('success')
      
      toast({
        title: "Abonnement activé !",
        description: `Votre école est désormais sous l'offre ${selectedPlan.nom}.`,
        variant: "default",
        className: "bg-success text-white border-none shadow-lg"
      })
      
    } catch (error) {
      console.error(error)
      toast({
        title: "Erreur de facturation",
        description: "Une erreur est survenue lors de l'activation de votre abonnement. Veuillez contacter le support.",
        variant: "destructive"
      })
      setIsCinetPayOpen(false)
    }
  }

  // Calcul du taux d'occupation des élèves
  const maxElevesActuel = ecole?.abonnement?.maxEleves || 50
  const elevesCount = eleves.length
  const pourcentageOccupation = Math.min(Math.round((elevesCount / maxElevesActuel) * 100), 100)

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <div>
        <h2 className="text-3xl font-display font-extrabold text-text tracking-tight">
          Abonnement & Facturation
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Gérez votre forfait, suivez votre quota d'élèves et activez de nouvelles fonctionnalités pour votre établissement.
        </p>
      </div>

      {/* État actuel de l'abonnement */}
      <Card className="border border-border/60 shadow-md bg-card overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary to-amber-500" />
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Statut du plan */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Formule Active</span>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold font-display text-text capitalize">
                  {plans.find(p => p.id === activePlan)?.nom || activePlan}
                </h3>
                {activePlan !== 'gratuit' && (() => {
                  const isExpired = ecole?.abonnement?.dateFin && new Date(ecole.abonnement.dateFin) < new Date()
                  const status = isExpired ? 'expire' : (ecole?.abonnement?.statut || 'actif')
                  
                  if (status === 'expire') {
                    return (
                      <Badge className="bg-danger text-white text-[11px] font-bold border-none px-2 py-0.5 animate-pulse">
                        Expiré
                      </Badge>
                    )
                  }
                  if (status === 'suspendu') {
                    return (
                      <Badge className="bg-danger text-white text-[11px] font-bold border-none px-2 py-0.5">
                        Suspendu
                      </Badge>
                    )
                  }
                  return (
                    <Badge className="bg-success text-white text-[11px] font-bold border-none px-2 py-0.5">
                      Actif
                    </Badge>
                  )
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                {activePlan === 'gratuit' 
                  ? "Idéal pour tester GestScol avec un petit groupe d'élèves." 
                  : (() => {
                      const isExpired = ecole?.abonnement?.dateFin && new Date(ecole.abonnement.dateFin) < new Date()
                      if (isExpired) {
                        return `Abonnement expiré le ${new Date(ecole.abonnement!.dateFin!).toLocaleDateString('fr-FR')}.`
                      }
                      return `Prochaine facturation prévue le ${ecole?.abonnement?.dateFin ? new Date(ecole.abonnement.dateFin).toLocaleDateString('fr-FR') : 'Non définie'}.`
                    })()
                }
              </p>
            </div>

            {/* Quota d'élèves */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                <span className="uppercase tracking-wider">Capacité Élèves</span>
                <span className="text-text font-bold">{elevesCount} / {maxElevesActuel === 99999 ? 'Illimité' : `${maxElevesActuel} élèves`}</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    pourcentageOccupation >= 90 ? 'bg-danger' : pourcentageOccupation >= 75 ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${pourcentageOccupation}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                Quota consommé à <span className="font-bold text-text">{pourcentageOccupation}%</span>.
              </p>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 md:justify-end">
              {activePlan === 'gratuit' ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2 max-w-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Vous êtes limité à 50 élèves. Passez à la formule **Standard** pour débloquer 300 élèves.
                  </span>
                </div>
              ) : (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-xs text-primary-dark flex items-start gap-2 max-w-sm">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    Votre école bénéficie de la **{activePlan === 'standard' ? 'Formule Standard' : 'Formule Premium'}**. Quota d'élèves étendu.
                  </span>
                </div>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Titre grille */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <h3 className="text-2xl font-extrabold font-display text-text text-center">
          Formules adaptées à votre établissement
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-xl">
          Sélectionnez l'abonnement annuel le plus adapté pour débloquer le potentiel complet de votre école.
        </p>
      </div>

      {/* Grille des Forfaits (100% cohérente avec l'image) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = plan.id === activePlan
          const isExpired = ecole?.abonnement?.dateFin && new Date(ecole.abonnement.dateFin) < new Date()
          
          return (
            <Card 
              key={plan.id}
              className={`flex flex-col border border-border/60 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group rounded-2xl ${
                isCurrent 
                  ? plan.id === 'standard' 
                    ? 'ring-2 ring-emerald-600 bg-gradient-to-b ' + plan.bgGradient
                    : plan.id === 'premium'
                    ? 'ring-2 ring-amber-500 bg-gradient-to-b ' + plan.bgGradient
                    : 'bg-slate-50 dark:bg-slate-900/50'
                  : 'bg-card'
              }`}
            >
              {/* Badge d'en-tête de formule */}
              <div className="p-6 pb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  plan.id === 'gratuit' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60' 
                    : plan.id === 'standard'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                }`}>
                  {plan.id === 'gratuit' ? 'Formule Gratuite' : plan.id === 'standard' ? 'Formule Standard' : 'Formule Premium'}
                </span>
              </div>
              
              {/* Prix */}
              <CardHeader className="p-6 pt-0">
                <div className="flex flex-col mt-2">
                  <span className="text-4xl font-extrabold font-display text-text">
                    {plan.prix === 0 ? '0 FCFA' : formatCFA(plan.prix)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    {plan.prix === 0 ? 'Gratuit à vie' : 'par établissement / an'}
                  </span>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-4 leading-relaxed min-h-[40px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              {/* Contenu */}
              <CardContent className="p-6 flex-1 space-y-4 border-t border-border/40">
                <ul className="space-y-3.5">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      <div className={`p-0.5 rounded-full shrink-0 mt-0.5 ${
                        plan.id === 'gratuit' 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
                          : plan.id === 'standard'
                          ? 'bg-emerald-100 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950/35 text-amber-600 dark:text-amber-400'
                      }`}>
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              {/* Bouton de confirmation */}
              <CardFooter className="p-6 border-t border-border/40 bg-slate-50/50 dark:bg-slate-900/50">
                <Button
                  disabled={(isCurrent && !isExpired) || plan.id === 'gratuit'}
                  onClick={() => handleUpgradeClick(plan)}
                  className={`w-full font-bold text-xs py-5 rounded-xl ${
                    (isCurrent && !isExpired)
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-not-allowed border border-slate-200 dark:border-border/40'
                      : plan.id === 'premium'
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 hover:scale-[1.01] transition-all'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:scale-[1.01] transition-all'
                  }`}
                >
                  {isCurrent 
                    ? isExpired 
                      ? `Renouveler la formule ${plan.nom.split(' ')[1]}`
                      : 'Votre formule actuelle' 
                    : plan.id === 'gratuit'
                    ? 'Formule par défaut'
                    : `S'abonner à l'offre ${plan.nom.split(' ')[1]}`
                  }
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="bg-card p-6 md:p-8 rounded-2xl border border-border/60 shadow-md">
        <h3 className="text-lg font-bold font-display text-text mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Questions Fréquentes sur l'Abonnement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-foreground">
          <div className="space-y-1.5">
            <h4 className="font-bold text-text text-sm">Comment s'effectue le paiement ?</h4>
            <p>
              Nous intégrons la passerelle ivoirienne de référence **CinetPay** qui vous permet de régler vos factures en toute sécurité via vos comptes mobiles locaux (Wave, Orange Money, MTN MoMo, Moov Money). Aucun compte bancaire ou carte de crédit n'est requis.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-text text-sm">Que se passe-t-il si la limite d'élèves est dépassée ?</h4>
            <p>
              Sous la formule gratuite, dès que le quota de 50 élèves est atteint, la création de nouveaux profils élèves est temporairement bloquée. Toutes vos données existantes restent accessibles. Il vous suffit d'upgrader via CinetPay pour lever immédiatement ce blocage.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-text text-sm">Puis-je changer de formule à tout moment ?</h4>
            <p>
              Oui. Vous pouvez passer d'une formule Standard à une formule Premium en cours d'année. Le montant restant de votre forfait actuel sera déduit au prorata de votre prochaine facture.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-text text-sm">Besoin d'une formule sur-mesure pour un groupe d'écoles ?</h4>
            <p>
              Si vous gérez un réseau d'établissements scolaires privées en Côte d'Ivoire, contactez directement notre service commercial GestScol pour obtenir un devis personnalisé et des remises groupées.
            </p>
          </div>
        </div>
      </div>

      {/* Dialog CinetPay */}
      <Dialog open={isCinetPayOpen} onOpenChange={setIsCinetPayOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border border-amber-500/20 shadow-2xl rounded-xl bg-white dark:bg-slate-950">
          
          {/* Header style CinetPay */}
          <div className="bg-[#1E293B] p-5 flex items-center justify-between text-white border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center font-bold text-[#1E293B] text-lg font-display tracking-tighter">
                CP
              </div>
              <div>
                <DialogTitle className="text-sm font-bold font-display text-white tracking-wide">
                  CinetPay Secure Payment
                </DialogTitle>
                <p className="text-[10px] text-white/60">
                  Passerelle de paiement agréée UEMOA
                </p>
              </div>
            </div>
            <div className="bg-amber-500/20 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Simulation
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Infos de facturation */}
            {selectedPlan && (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-border/40 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-250 text-xs">{selectedPlan.nom}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Abonnement Annuel GestScol
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-sm text-[#1E293B] dark:text-slate-100">
                    {formatCFA(selectedPlan.prix)}
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Montant net
                  </p>
                </div>
              </div>
            )}

            {/* Étape 1 : Choix de l'opérateur mobile */}
            {paymentStep === 'select' && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  1. Choisissez votre moyen de paiement :
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Wave */}
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('wave')}
                    className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentProvider === 'wave'
                        ? 'border-[#1E90FF] bg-[#1E90FF]/5 text-[#1E90FF] shadow-sm'
                        : 'border-slate-200 dark:border-border/60 text-slate-600 dark:text-slate-400 hover:border-[#1E90FF]/30'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 shrink-0" />
                    <span>Wave</span>
                  </button>

                  {/* Orange Money */}
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('orange')}
                    className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentProvider === 'orange'
                        ? 'border-[#FF6600] bg-[#FF6600]/5 text-[#FF6600] shadow-sm'
                        : 'border-slate-200 dark:border-border/60 text-slate-600 dark:text-slate-400 hover:border-[#FF6600]/30'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 shrink-0" />
                    <span>Orange Money</span>
                  </button>

                  {/* MTN MoMo */}
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('mtn')}
                    className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentProvider === 'mtn'
                        ? 'border-[#FFCC00] bg-[#FFCC00]/5 text-[#CC9900] shadow-sm'
                        : 'border-slate-200 dark:border-border/60 text-slate-600 dark:text-slate-400 hover:border-[#FFCC00]/30'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 shrink-0" />
                    <span>MTN MoMo</span>
                  </button>

                  {/* Moov Money */}
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('moov')}
                    className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentProvider === 'moov'
                        ? 'border-[#008080] bg-[#008080]/5 text-[#008080] shadow-sm'
                        : 'border-slate-200 dark:border-border/60 text-slate-600 dark:text-slate-400 hover:border-[#008080]/30'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 shrink-0" />
                    <span>Moov Money</span>
                  </button>
                </div>

                <Button
                  onClick={() => setPaymentStep('input')}
                  className="w-full bg-[#1E293B] hover:bg-[#0F172A] text-white py-6 mt-4 font-bold text-xs"
                >
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Étape 2 : Numéro de téléphone */}
            {paymentStep === 'input' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                    2. Saisissez votre numéro {paymentProvider.toUpperCase()} :
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      +225
                    </span>
                    <Input
                      type="tel"
                      placeholder="07 07 07 07 07"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value)
                        if (phoneError) setPhoneError('')
                      }}
                      className="pl-14 py-6 font-bold text-sm tracking-widest text-[#1E293B] dark:text-slate-100 dark:bg-slate-950 dark:border-border/60"
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {phoneError}
                    </p>
                  )}
                  <p className="text-[9px] text-muted-foreground mt-2 leading-normal">
                    Assurez-vous de disposer du solde suffisant sur votre portefeuille mobile. Une demande d'approbation vous sera envoyée pour confirmation.
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentStep('select')}
                    className="flex-1 py-6 border-slate-200 dark:border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 font-bold text-xs"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleProceedPayment}
                    className="flex-2 py-6 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                  >
                    Confirmer le règlement
                  </Button>
                </div>
              </div>
            )}

            {/* Étape 3 : Chargement */}
            {paymentStep === 'processing' && (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-5">
                <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                <div className="space-y-2 max-w-[320px]">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Paiement en cours</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed animate-pulse">
                    {processingStatus}
                  </p>
                </div>
              </div>
            )}

            {/* Étape 4 : Succès */}
            {paymentStep === 'success' && selectedPlan && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-16 w-16 bg-success/15 text-success rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <div className="space-y-2 max-w-[300px]">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg">Paiement Validé !</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Votre abonnement à la formule **{selectedPlan.nom}** est maintenant actif ! Votre limite d'élèves est rehaussée à {selectedPlan.maxEleves === 99999 ? 'l\'infini' : selectedPlan.maxEleves}.
                  </p>
                </div>

                <Button
                  onClick={() => setIsCinetPayOpen(false)}
                  className="w-full bg-success hover:bg-success-dark text-white py-6 mt-4 font-bold text-xs shadow-lg shadow-success/20"
                >
                  Retourner au Tableau de bord
                </Button>
              </div>
            )}

          </div>

          {/* Footer sécurisé */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200/60 dark:border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              Cryptage SSL 256 bits
            </span>
            <span className="font-semibold text-slate-500">
              Powered by CinetPay
            </span>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  )
}
