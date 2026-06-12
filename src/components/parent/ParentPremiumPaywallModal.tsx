'use client'

import { useState, useEffect } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { 
  Zap, 
  Check, 
  Loader2, 
  Smartphone, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/hooks/useTranslation'

type PaymentProvider = 'wave' | 'orange' | 'mtn'

interface ParentPremiumPaywallModalProps {
  isOpen: boolean
  onClose: () => void
  initialTrimestre?: '1' | '2' | '3' // Trimestre à cibler par défaut
  anneeId: string
}

export default function ParentPremiumPaywallModal({ 
  isOpen, 
  onClose, 
  initialTrimestre = '1',
  anneeId
}: ParentPremiumPaywallModalProps) {
  const { currentUser, upgradeParentToPremium } = useSchoolStore()
  const { t, dir } = useTranslation()
  const { toast } = useToast()

  // États du formulaire de paiement
  const [optionAchat, setOptionAchat] = useState<'annuel' | 'trimestre'>(() => {
    return 'annuel'
  })
  const [trimestreCible, setTrimestreCible] = useState<'t1' | 't2' | 't3'>(() => {
    return `t${initialTrimestre}` as 't1' | 't2' | 't3'
  })
  
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('wave')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select')
  const [processingStatus, setProcessingStatus] = useState('')

  // Récupérer les trimestres déjà achetés pour cette année
  const getTrimestresAchetes = (): string[] => {
    const status = currentUser?.parentSubscriptionStatus || 'gratuit'
    if (status === 'premium') return ['t1', 't2', 't3']
    if (!status.includes(':')) {
      return status.split(',').filter(s => s.startsWith('t'))
    }
    const abonnements = status.split(';').filter(Boolean)
    const abonnementAnnee = abonnements.find(a => a.startsWith(`${anneeId}:`))
    if (!abonnementAnnee) return []
    const statutAnnee = abonnementAnnee.split(':')[1]
    if (statutAnnee === 'premium') return ['t1', 't2', 't3']
    return statutAnnee.split(',').filter(s => s.startsWith('t'))
  }

  const trimestresAchetes = getTrimestresAchetes()
  const estPremiumAnnuel = trimestresAchetes.length === 3 || currentUser?.parentSubscriptionStatus === 'premium'

  // Mettre à jour le trimestre cible si initialTrimestre change ou si déjà acheté
  useEffect(() => {
    const trimestresNonAchetes = (['t1', 't2', 't3'] as const).filter(t => !trimestresAchetes.includes(t))
    if (trimestresNonAchetes.length > 0) {
      const targetDefault = `t${initialTrimestre}` as 't1' | 't2' | 't3'
      if (trimestresAchetes.includes(targetDefault)) {
        setTrimestreCible(trimestresNonAchetes[0])
      } else {
        setTrimestreCible(targetDefault)
      }
    }
  }, [initialTrimestre, currentUser, anneeId])

  // Reset de l'état quand la modale s'ouvre/se ferme
  useEffect(() => {
    if (isOpen) {
      setPaymentStep('select')
      setPhoneNumber(currentUser?.telephone || '')
      setPhoneError('')
    }
  }, [isOpen, currentUser])

  const formatCFA = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA'
  }

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\s+/g, '')
    // Format ivoirien standard : 10 chiffres (optionnellement précédés de +225 ou 225)
    const phoneRegex = /^(?:\+225|225)?(01|05|07|[0-9]{2})[0-9]{8}$/
    
    if (!cleanPhone) {
      setPhoneError(t('parent.paywall.phone_required', "Le numéro de téléphone est obligatoire."))
      return false
    }
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError(t('parent.paywall.phone_invalid', "Veuillez entrer un numéro ivoirien valide à 10 chiffres (ex: 07 07 07 07 07)."))
      return false
    }
    
    setPhoneError('')
    return true
  }

  const handleProceedPayment = () => {
    if (!validatePhone(phoneNumber)) return
    
    setPaymentStep('processing')
    
    // Messages animés réalistes de chargement
    const steps = [
      "Initialisation de la transaction avec les serveurs Mobile Money...",
      "Génération de la demande de paiement en attente...",
      "Notification push envoyée sur votre mobile. Veuillez taper votre code PIN pour valider...",
      "Validation de la transaction reçue de l'opérateur...",
      "Finalisation de l'activation de votre accès Premium..."
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
    }, 1600)
  }

  const finalizeSubscription = async () => {
    const typeOption = optionAchat === 'annuel' ? 'annuel' : trimestreCible
    
    if (typeOption !== 'annuel' && trimestresAchetes.includes(typeOption)) {
      toast({
        title: "Trimestre déjà débloqué",
        description: `Le Trimestre ${typeOption.replace('t', '')} est déjà débloqué pour cette année scolaire.`,
        variant: "destructive"
      })
      setPaymentStep('select')
      return
    }
    
    try {
      const res = await upgradeParentToPremium(typeOption, anneeId)
      
      if (res.success) {
        setPaymentStep('success')
        toast({
          title: "Accès Premium Activé !",
          description: optionAchat === 'annuel' 
            ? "Félicitations ! Vous avez débloqué l'accès Premium complet pour toute l'année scolaire."
            : `Félicitations ! Vous avez débloqué l'accès Premium pour le Trimestre ${trimestreCible.replace('t', '')}.`,
          className: "bg-success text-white border-none shadow-lg"
        })
      } else {
        throw new Error(res.error || "Erreur de facturation")
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Erreur d'activation",
        description: error.message || "Impossible d'activer votre offre Premium. Veuillez réessayer.",
        variant: "destructive"
      })
      setPaymentStep('select')
    }
  }

  const getMontant = () => {
    return optionAchat === 'annuel' ? 2500 : 1000
  }

  const getTrimestreLabel = (tVal: 't1' | 't2' | 't3') => {
    if (tVal === 't1') return "1er Trimestre"
    if (tVal === 't2') return "2ème Trimestre"
    return "3ème Trimestre"
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border border-border shadow-2xl rounded-2xl p-4 md:p-5 max-h-[90vh] overflow-y-auto" dir={dir}>
        {estPremiumAnnuel ? (
          <div className="py-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400 animate-bounce shrink-0" />
            </div>
            <h3 className="font-display font-bold text-text text-base">{t('parent.paywall.already_premium', "Accès Premium déjà actif")}</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {t('parent.paywall.already_premium_desc', "Vous disposez déjà de l'accès Premium complet pour l'ensemble des trimestres de cette année scolaire.")}
            </p>
            <Button
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 shadow-md"
            >
              {t('action.cancel', "Fermer")}
            </Button>
          </div>
        ) : paymentStep === 'select' && (
          <div className="space-y-3.5">
            <DialogHeader className="space-y-1">
              <div className="flex justify-center mb-1">
                <div className="p-2 bg-amber-100 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 rounded-full shrink-0">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
              </div>
              <DialogTitle className="text-lg font-bold font-display text-text text-center">
                {t('parent.paywall.title', "Débloquez l'Espace Parents Premium")}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground text-center">
                {t('parent.paywall.desc', "Suivez les notes, accédez au classement en temps réel et signalez les absences de votre enfant en un clic.")}
              </DialogDescription>
            </DialogHeader>

            {/* Avantages Premium */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-border/60 rounded-xl p-2.5 space-y-1.5 text-[11px] text-start">
              <div className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-text"><strong className="font-bold">{t('parent.paywall.benefit1_title', "Relevé de notes & évaluations")}</strong> : {t('parent.paywall.benefit1_desc', "Visualisez les notes détaillées de classe par matière.")}</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-text"><strong className="font-bold">{t('parent.paywall.benefit2_title', "Rang en temps réel")}</strong> : {t('parent.paywall.benefit2_desc', "Suivez la position et la progression de votre enfant en classe.")}</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-text"><strong className="font-bold">{t('parent.paywall.benefit3_title', "Téléchargement de Bulletins PDF")}</strong> : {t('parent.paywall.benefit3_desc', "Imprimez le bulletin scolaire officiel validé.")}</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-text"><strong className="font-bold">{t('parent.paywall.benefit4_title', "Signalement d'absences")}</strong> : {t('parent.paywall.benefit4_desc', "Prévenez directement l'établissement en cas d'absence.")}</p>
              </div>
            </div>

            {/* Choix de l'abonnement */}
            <div className="space-y-2">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase block text-start">{t('parent.paywall.select_plan', "Choisissez votre formule")}</Label>
              <div className="grid gap-2">
                {/* Option Annuelle */}
                <div 
                  onClick={() => setOptionAchat('annuel')}
                  className={`border-2 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                    optionAchat === 'annuel' 
                      ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10' 
                      : 'border-border/60 hover:border-muted-foreground/30 bg-card'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-350 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {optionAchat === 'annuel' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                    </div>
                    <div className="text-start">
                      <p className="font-bold text-xs text-text flex items-center gap-1.5">
                        {t('parent.paywall.full_year', "Année complète")}
                        <span className="bg-amber-100 dark:bg-amber-955/40 text-amber-700 dark:text-amber-400 font-extrabold text-[8px] px-1 py-0.5 rounded uppercase">{t('parent.paywall.recommended', "Recommandé")}</span>
                      </p>
                      <p className="text-[9px] text-muted-foreground">{t('parent.paywall.full_year_desc', "Accès illimité à tous les trimestres + Signalement")}</p>
                    </div>
                  </div>
                  <p className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{formatCFA(2500)}</p>
                </div>

                {/* Option Trimestrielle */}
                <div 
                  onClick={() => setOptionAchat('trimestre')}
                  className={`border-2 rounded-xl p-2.5 flex flex-col cursor-pointer transition-all ${
                    optionAchat === 'trimestre' 
                      ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10' 
                      : 'border-border/60 hover:border-muted-foreground/30 bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-350 dark:border-slate-700 flex items-center justify-center shrink-0">
                        {optionAchat === 'trimestre' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                      </div>
                      <div className="text-start">
                        <p className="font-bold text-xs text-text">{t('parent.paywall.quarterly', "Abonnement Trimestriel")}</p>
                        <p className="text-[9px] text-muted-foreground font-medium">{t('parent.paywall.quarterly_desc', "Débloque le trimestre de votre choix")}</p>
                      </div>
                    </div>
                    <p className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{formatCFA(1000)}</p>
                  </div>
                  
                  {optionAchat === 'trimestre' && (
                    <div className="mt-2 pt-2 border-t border-border/55 flex justify-between items-center gap-2 animate-fadeIn">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{t('parent.paywall.quarter_label', "Trimestre :")}</span>
                      <Select 
                        value={trimestreCible} 
                        onValueChange={(val: any) => setTrimestreCible(val)}
                      >
                        <SelectTrigger className="w-[140px] h-7 text-[11px] font-bold border-border bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="t1" disabled={trimestresAchetes.includes('t1')} className="text-[11px] font-semibold">
                            {t('dashboard.t1', "1er Trimestre")} {trimestresAchetes.includes('t1') && ` (${t('bulletins.status.validated', "Débloqué").replace(' ✓', '')})`}
                          </SelectItem>
                          <SelectItem value="t2" disabled={trimestresAchetes.includes('t2')} className="text-[11px] font-semibold">
                            {t('dashboard.t2', "2ème Trimestre")} {trimestresAchetes.includes('t2') && ` (${t('bulletins.status.validated', "Débloqué").replace(' ✓', '')})`}
                          </SelectItem>
                          <SelectItem value="t3" disabled={trimestresAchetes.includes('t3')} className="text-[11px] font-semibold">
                            {t('dashboard.t3', "3ème Trimestre")} {trimestresAchetes.includes('t3') && ` (${t('bulletins.status.validated', "Débloqué").replace(' ✓', '')})`}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Choix Opérateur Mobile Money */}
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase block text-start">{t('parent.paywall.payment_method', "Moyen de Paiement Mobile Money")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['wave', 'orange', 'mtn'] as PaymentProvider[]).map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setPaymentProvider(provider)}
                    className={`flex flex-col items-center justify-center py-1.5 px-2 border-2 rounded-xl transition-all ${
                      paymentProvider === provider
                        ? provider === 'wave' ? 'border-sky-500 bg-sky-50/10' :
                          provider === 'orange' ? 'border-orange-500 bg-orange-50/10' :
                          'border-amber-500 bg-amber-50/10'
                        : 'border-border/60 hover:border-muted-foreground/30'
                    }`}
                  >
                    <span className="font-bold text-[10px] uppercase font-display tracking-wider">
                      {provider === 'wave' ? 'Wave' : provider === 'orange' ? 'Orange' : 'MTN'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Saisie Numéro de téléphone */}
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-[9px] font-bold text-muted-foreground uppercase block text-start">{t('parent.paywall.phone_label', "Numéro Mobile Money (ivoirien)")}</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07 07 07 07 07"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="rounded-xl border-border bg-background h-8.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                />
              </div>
              {phoneError && <p className="text-[9px] text-danger font-semibold text-start">{phoneError}</p>}
            </div>

            {/* Actions */}
            <div className="pt-1.5 flex gap-2.5">
              <Button 
                onClick={onClose}
                type="button"
                className="w-1/2 rounded-xl font-bold text-xs h-9 border border-border bg-transparent text-text hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text shadow-none"
              >
                {t('action.cancel', "Fermer")}
              </Button>
              <Button
                onClick={handleProceedPayment}
                className="w-1/2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs h-9 flex items-center justify-center gap-1 shadow-md shadow-primary/10"
              >
                {t('parent.paywall.btn_pay', "Payer")} {formatCFA(getMontant())}
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              </Button>
            </div>
          </div>
        )}

        {/* Étape de traitement de transaction */}
        {paymentStep === 'processing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto shrink-0" />
            <h3 className="font-bold text-text text-base">{t('parent.paywall.processing', "Traitement sécurisé en cours...")}</h3>
            <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto animate-pulse">
              {processingStatus}
            </p>
          </div>
        )}

        {/* Étape de succès de transaction */}
        {paymentStep === 'success' && (
          <div className="py-6 text-center space-y-5">
            <div className="flex justify-center">
              <CheckCircle2 className="h-14 w-14 text-success animate-bounce shrink-0" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg text-text">{t('parent.paywall.success_title', "Paiement effectué avec succès !")}</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {optionAchat === 'annuel' 
                  ? t('parent.paywall.success_full', "Votre compte est désormais Premium. L'ensemble des fonctionnalités de l'Espace Parents a été débloqué.")
                  : `${t('parent.paywall.success_quarter', "Votre compte est désormais Premium pour le")} ${getTrimestreLabel(trimestreCible)}. ${t('parent.paywall.success_quarter_desc', "Les fonctionnalités du trimestre ont été débloquées.")}`
                }
              </p>
            </div>
            <Button
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs py-5 shadow-lg shadow-emerald-600/10"
            >
              {t('parent.paywall.btn_discover', "Découvrir mes accès premium")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
