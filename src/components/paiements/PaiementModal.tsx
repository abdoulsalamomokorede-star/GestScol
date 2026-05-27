'use client'

import { useState } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useToast } from '@/hooks/use-toast'
import { formatCFA } from '@/lib/utils'
import { Paiement, ModePaiement } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Wallet, Coins, Smartphone, Check, Loader2 } from 'lucide-react'

interface PaiementModalProps {
  isOpen: boolean
  onClose: () => void
  paiement: Paiement
  eleveName: string
  classeNom: string
}

export default function PaiementModal({
  isOpen,
  onClose,
  paiement,
  eleveName,
  classeNom,
}: PaiementModalProps) {
  const { enregistrerPaiementInstallment } = useSchoolStore()
  const { toast } = useToast()
  
  const resteAPayer = paiement.montant - (paiement.montantPaye || 0)
  
  const [mode, setMode] = useState<ModePaiement>('wave')
  const [montantSaisi, setMontantSaisi] = useState<string>(resteAPayer.toString())
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getPaiementTypeLabel = (type: string) => {
    switch (type) {
      case 'inscription':
        return "Frais d'inscription"
      case 'scolarite':
        return 'Scolarité Globale'
      case 'cantine':
        return 'Cantine Scolaire'
      case 'transport':
        return 'Transport Scolaire'
      default:
        return type
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amt = parseInt(montantSaisi, 10)
    if (isNaN(amt) || amt <= 0) {
      setError('Veuillez saisir un montant de versement valide.')
      return
    }

    if (amt > resteAPayer) {
      setError(`Le montant ne peut pas dépasser le reste à payer (${formatCFA(resteAPayer)}).`)
      return
    }

    // Validation référence pour paiement mobile
    if (mode !== 'especes' && !reference.trim()) {
      setError('La référence de transaction est obligatoire pour les paiements mobiles.')
      return
    }

    setLoading(true)

    // Simulation de chargement (800ms) pour un effet premium et réaliste
    setTimeout(() => {
      try {
        enregistrerPaiementInstallment(
          paiement.id,
          amt,
          mode,
          mode === 'especes' ? undefined : reference.trim()
        )
        
        const nouveauReste = resteAPayer - amt
        toast({
          title: nouveauReste === 0 ? 'Paiement soldé avec succès' : 'Versement enregistré avec succès',
          description: nouveauReste === 0 
            ? `Le règlement pour ${eleveName} a été soldé en totalité.`
            : `Le versement de ${formatCFA(amt)} pour ${eleveName} a été validé. Solde restant : ${formatCFA(nouveauReste)}.`,
          variant: 'default',
        })
        
        onClose()
      } catch (err) {
        toast({
          title: 'Erreur',
          description: "Une erreur est survenue lors de l'enregistrement.",
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }, 800)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[480px] max-h-[90vh] overflow-y-auto bg-card border-border/50 text-text scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">Encaisser un règlement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* Fiche récapitative de la dette */}
          <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Élève</p>
                <p className="font-bold text-text text-base mt-0.5">{eleveName}</p>
                <p className="text-xs text-muted-foreground">Classe: <span className="font-medium text-text">{classeNom}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Type de frais</p>
                <p className="font-medium text-text text-sm mt-0.5">{getPaiementTypeLabel(paiement.type)}</p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-border/40 space-y-1.5 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Montant total dû :</span>
                <span className="font-semibold text-text">{formatCFA(paiement.montant)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Déjà réglé :</span>
                <span className="font-semibold text-success">{formatCFA(paiement.montantPaye || 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-border/40 font-bold text-text">
                <span>Reste à payer :</span>
                <span className="text-lg text-danger font-extrabold">{formatCFA(resteAPayer)}</span>
              </div>
            </div>
          </div>

          {/* Champ de saisie du montant du versement */}
          <div className="space-y-2">
            <Label htmlFor="montantVersement" className="text-sm font-semibold text-text">
              Montant du versement actuel (FCFA) <span className="text-danger">*</span>
            </Label>
            <Input
              id="montantVersement"
              type="number"
              min="1"
              max={resteAPayer}
              placeholder={`ex: ${resteAPayer}`}
              value={montantSaisi}
              onChange={(e) => {
                setMontantSaisi(e.target.value)
                setError('')
              }}
              className="bg-background border-border text-text font-bold"
            />
            <p className="text-[11px] text-muted-foreground">
              Entrez le montant en FCFA du règlement en cours (maximum {formatCFA(resteAPayer)}).
            </p>
          </div>

          {/* Sélection du mode de paiement */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-text">Mode de règlement</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Wave */}
              <button
                type="button"
                onClick={() => { setMode('wave'); setError('') }}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                  mode === 'wave'
                    ? 'border-[#1E90FF] bg-[#1E90FF]/5 ring-1 ring-[#1E90FF]'
                    : 'border-border/50 hover:bg-muted/10'
                }`}
              >
                <div className={`p-2 rounded-lg ${mode === 'wave' ? 'bg-[#1E90FF] text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text">Wave</p>
                  <p className="text-xs text-muted-foreground truncate">Paiement Mobile</p>
                </div>
                {mode === 'wave' && <Check className="h-4 w-4 text-[#1E90FF] shrink-0" />}
              </button>

              {/* Orange Money */}
              <button
                type="button"
                onClick={() => { setMode('orange_money'); setError('') }}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                  mode === 'orange_money'
                    ? 'border-[#FF6600] bg-[#FF6600]/5 ring-1 ring-[#FF6600]'
                    : 'border-border/50 hover:bg-muted/10'
                }`}
              >
                <div className={`p-2 rounded-lg ${mode === 'orange_money' ? 'bg-[#FF6600] text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text">Orange Money</p>
                  <p className="text-xs text-muted-foreground truncate">Paiement Mobile</p>
                </div>
                {mode === 'orange_money' && <Check className="h-4 w-4 text-[#FF6600] shrink-0" />}
              </button>

              {/* MTN MoMo */}
              <button
                type="button"
                onClick={() => { setMode('mtn_momo'); setError('') }}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                  mode === 'mtn_momo'
                    ? 'border-[#FFCC00] bg-[#FFCC00]/5 ring-1 ring-[#FFCC00]'
                    : 'border-border/50 hover:bg-muted/10'
                }`}
              >
                <div className={`p-2 rounded-lg ${mode === 'mtn_momo' ? 'bg-[#FFCC00] text-[#1E293B]' : 'bg-muted text-muted-foreground'}`}>
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text">MTN MoMo</p>
                  <p className="text-xs text-muted-foreground truncate">Paiement Mobile</p>
                </div>
                {mode === 'mtn_momo' && <Check className="h-4 w-4 text-[#FFCC00] shrink-0" />}
              </button>

              {/* Espèces */}
              <button
                type="button"
                onClick={() => { setMode('especes'); setError(''); setReference('') }}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                  mode === 'especes'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border/50 hover:bg-muted/10'
                }`}
              >
                <div className={`p-2 rounded-lg ${mode === 'especes' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Coins className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text">Espèces</p>
                  <p className="text-xs text-muted-foreground truncate">Physique de caisse</p>
                </div>
                {mode === 'especes' && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            </div>
          </div>

          {/* Saisie de référence pour le paiement mobile */}
          {mode !== 'especes' && (
            <div className="space-y-2 animate-in fade-in duration-250">
              <Label htmlFor="ref" className="text-sm font-semibold text-text">
                Référence de transaction <span className="text-danger">*</span>
              </Label>
              <Input
                id="ref"
                type="text"
                placeholder={
                  mode === 'wave' ? 'ex: WV-240902-11' :
                  mode === 'orange_money' ? 'ex: OM-584732' : 'ex: MTN-903482'
                }
                value={reference}
                onChange={(e) => { setReference(e.target.value); setError('') }}
                className="bg-background border-border text-text placeholder-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Saisissez le code de confirmation reçu par SMS ou sur la console partenaire.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-danger font-medium">{error}</p>
          )}

          <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-3 text-xs text-[#B45309] space-y-1">
            <p className="font-semibold flex items-center">
              ⚠️ Attention & Contrôle de Sécurité
            </p>
            <p>
              Avant de valider, veuillez vous assurer que la somme de <strong className="font-bold">{formatCFA(parseInt(montantSaisi, 10) || 0)}</strong> a bien été créditée sur le compte de l&apos;école ou reçue en espèces.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-border text-text hover:bg-muted hover:text-text w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-dark text-white font-bold w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Valider l&apos;encaissement'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
