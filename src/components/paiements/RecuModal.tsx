'use client'

import { formatCFA, formatDate } from '@/lib/utils'
import { Paiement, Eleve, Classe } from '@/types'
import { ecoleMock } from '@/data/mockData'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Award, CheckCircle, Trash2, Lock } from 'lucide-react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface RecuModalProps {
  isOpen: boolean
  onClose: () => void
  paiement: Paiement
  eleve: Eleve
  classe: Classe
}

export default function RecuModal({
  isOpen,
  onClose,
  paiement: initialPaiement,
  eleve,
  classe,
}: RecuModalProps) {
  const { currentUser, annulerVersement, paiements, ecole, activeAnneeScolaire } = useSchoolStore()
  const { toast } = useToast()
  const { t, dir, isAr } = useTranslation()
  const [confirmCancelData, setConfirmCancelData] = useState<{idx: number, montant: number} | null>(null)

  const paiement = paiements.find(p => p.id === initialPaiement.id) || initialPaiement

  const getPaiementTypeLabel = (type: string) => {
    switch (type) {
      case 'inscription':
        return t('receipt.fees_enroll', "Frais d'inscription")
      case 'scolarite':
        return t('receipt.fees_tuition', "Scolarité Globale")
      case 'cantine':
        return t('receipt.fees_canteen', "Cantine Scolaire")
      case 'transport':
        return t('receipt.fees_transport', "Transport Scolaire")
      default:
        return type
    }
  }

  const getModeLabel = (mode?: string) => {
    switch (mode) {
      case 'especes':
        return t('receipt.mode_cash', "Espèces")
      case 'wave':
        return t('receipt.mode_wave', "Wave Mobile Money")
      case 'orange_money':
        return t('receipt.mode_orange', "Orange Money")
      case 'mtn_momo':
        return t('receipt.mode_mtn', "MTN Mobile Money")
      default:
        return t('receipt.mode_unspecified', "Non renseigné")
    }
  }

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `Recu_${recuId}_${eleve.matricule}_${eleve.nom}_${eleve.prenom}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 100)
  }

  const handleAnnulerVersement = (idx: number, montant: number) => {
    setConfirmCancelData({ idx, montant })
  }

  const executeAnnulerVersement = () => {
    if (!confirmCancelData) return
    try {
      annulerVersement(paiement.id, confirmCancelData.idx)
      toast({
        title: t('toast.success', "Succès"),
        description: t('receipt.delete_confirm_success', "Le versement de {montant} a été annulé avec succès.").replace('{montant}', formatCFA(confirmCancelData.montant)),
        variant: "default",
      })
    } catch (err) {
      toast({
        title: t('toast.error', "Erreur"),
        description: t('receipt.delete_confirm_error', "Une erreur est survenue lors de l'annulation du versement."),
        variant: "destructive",
      })
    }
    setConfirmCancelData(null)
  }

  const recuId = `REC-${paiement.id.toUpperCase().replace('P-', '').replace('P', '')}`

  // Reconstruction ou simulation de l'historique de versements
  const versements = paiement.historiquePaiements && paiement.historiquePaiements.length > 0
    ? paiement.historiquePaiements
    : (paiement.montantPaye > 0
        ? [{
            date: paiement.datePaiement || '2024-09-02',
            montant: paiement.montantPaye,
            mode: paiement.modePaiement || 'especes',
            reference: paiement.reference
          }]
        : []
      )

  const resteAPayer = paiement.montant - (paiement.montantPaye || 0)

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[500px] max-h-[85vh] overflow-y-auto bg-card border-border/50 text-text p-0 print:w-full print:max-w-none print:h-full print:bg-white print:text-black print:border-none print:shadow-none scrollbar-thin" dir={dir}>
        <DialogHeader className="sr-only">
          <DialogTitle>{t('receipt.payment_receipt', "Reçu de paiement")} - {eleve.nom} {eleve.prenom}</DialogTitle>
        </DialogHeader>
        
        {/* Style spécifique d'impression injecté pour forcer le masquage de tout le reste du site */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
              background: white;
              color: black;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        <div id="print-area" className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 bg-card print:bg-white w-full min-w-0 text-start" dir={dir}>
          {/* En-tête du reçu */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-dashed border-border print:border-black/30">
            {ecole?.logo ? (
              <img src={ecole.logo} alt="Logo" className="h-16 w-16 object-contain rounded-xl mb-3 print:h-16 print:w-16" />
            ) : (
              <div className="flex items-center space-x-2 text-primary print:text-black mb-2 no-print">
                <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-display font-extrabold text-base sm:text-lg">{(ecole?.nom || ecoleMock.nom).toUpperCase()}</span>
              </div>
            )}
            <h3 className="font-display font-bold text-sm sm:text-base text-text print:text-black uppercase">
              {ecole?.nom || ecoleMock.nom}
            </h3>
            <p className="text-xs text-muted-foreground print:text-black/80 mt-0.5">
              {ecole?.adresse || ecoleMock.adresse} • Tél: {ecole?.telephone || ecoleMock.telephone}
            </p>
            <p className="text-xs font-semibold text-primary print:text-black mt-1">
              {t('receipt.school_year', "Année Scolaire")}: {activeAnneeScolaire?.nom || ecole?.anneeScolaire || ecoleMock.anneeScolaire}
            </p>
          </div>

          {/* Numéro de reçu & Date */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-muted/30 print:bg-black/5 p-3 rounded-lg text-xs min-w-0 text-start">
            <div className="text-start">
              <span className="text-muted-foreground print:text-black/80 font-medium">{t('receipt.number', "REÇU N°")} : </span>
              <strong className="text-text print:text-black font-bold font-mono text-sm">{recuId}</strong>
            </div>
            <div className="text-start sm:text-end">
              <span className="text-muted-foreground print:text-black/80 font-medium">{t('receipt.date', "Date")} : </span>
              <strong className="text-text print:text-black font-semibold">
                {paiement.datePaiement ? formatDate(paiement.datePaiement) : '-'}
              </strong>
            </div>
          </div>

          {/* Informations Élève */}
          <div className="space-y-2 min-w-0 overflow-hidden text-start">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/80 font-bold border-b border-border/40 pb-1">
              {t('receipt.student_info', "Informations Élève")}
            </h4>
            <div className="grid grid-cols-2 gap-y-2 text-sm text-start">
              <div className="text-start">
                <span className="text-xs text-muted-foreground print:text-black/80 block">{t('receipt.matricule', "Matricule")}</span>
                <span className="font-bold text-text print:text-black font-mono">{eleve.matricule}</span>
              </div>
              <div className="text-start">
                <span className="text-xs text-muted-foreground print:text-black/80 block">{t('receipt.class', "Classe")}</span>
                <span className="font-semibold text-text print:text-black">{classe.nom}</span>
              </div>
              <div className="col-span-2 text-start">
                <span className="text-xs text-muted-foreground print:text-black/80 block">{t('receipt.student_name', "Nom & Prénom")}</span>
                <span className="font-bold text-text print:text-black text-base">{eleve.prenom} {eleve.nom}</span>
              </div>
            </div>
          </div>

          {/* Détails du Paiement */}
          <div className="space-y-3 min-w-0 text-start">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground print:text-black/80 font-bold border-b border-border/40 pb-1">
              {t('receipt.payment_history', "Historique des Versements")} — {getPaiementTypeLabel(paiement.type)}
            </h4>
            <div className="border border-border/60 print:border-black/20 rounded-xl overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap" dir={dir}>
                <thead>
                  <tr className="bg-muted/50 print:bg-black/5 text-start border-b border-border/60 print:border-black/20 text-xs text-muted-foreground print:text-black font-bold">
                    <th className="p-3 text-start">{t('receipt.table_date', "Date")}</th>
                    <th className="p-3 text-start">{t('receipt.table_mode', "Mode")}</th>
                    <th className="p-3 text-start">{t('receipt.table_ref', "Référence")}</th>
                    <th className="p-3 text-end">{t('receipt.table_amount', "Montant")}</th>
                    {currentUser?.role === 'directeur' && (
                      <th className="p-3 text-center no-print w-16">{t('receipt.table_action', "Action")}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {versements.length === 0 ? (
                    <tr>
                      <td colSpan={currentUser?.role === 'directeur' ? 5 : 4} className="p-3 text-center text-xs text-muted-foreground">{t('receipt.no_payments', "Aucun versement enregistré.")}</td>
                    </tr>
                  ) : (
                    versements.map((v, idx) => (
                      <tr key={idx} className="border-b border-border/40 print:border-black/10 last:border-0 text-xs">
                        <td className="p-3 text-text print:text-black font-medium">{formatDate(v.date)}</td>
                        <td className="p-3 text-text print:text-black">{getModeLabel(v.mode)}</td>
                        <td className="p-3 text-text print:text-black font-mono font-semibold">{v.reference || '-'}</td>
                        <td className="p-3 text-end font-bold text-text print:text-black">{formatCFA(v.montant)}</td>
                        {currentUser?.role === 'directeur' && (
                          <td className="p-3 text-center no-print">
                            <button
                              type="button"
                              onClick={() => handleAnnulerVersement(idx, v.montant)}
                              className="p-1.5 rounded-lg hover:bg-danger/10 text-danger hover:text-danger-dark transition-all duration-200"
                              title="Annuler ce versement"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* Mode de règlement & Transaction */}
          <div className="bg-muted/15 print:bg-black/5 p-4 rounded-xl space-y-2.5 border border-border/40 print:border-black/10 text-xs min-w-0 text-start">
            <div className="flex justify-between items-center text-muted-foreground print:text-black/80">
              <span>{t('receipt.total_due', "Montant total dû")} :</span>
              <strong className="text-text print:text-black font-bold text-sm">{formatCFA(paiement.montant)}</strong>
            </div>
            <div className="flex justify-between items-center text-muted-foreground print:text-black/80">
              <span>{t('receipt.total_paid', "Cumul déjà réglé")} :</span>
              <strong className="text-success print:text-black font-bold text-sm">{formatCFA(paiement.montantPaye || 0)}</strong>
            </div>
            
            <div className="pt-2.5 border-t border-dashed border-border/50 print:border-black/20 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 text-start">
              <span className="text-xs sm:text-sm font-extrabold text-text print:text-black">{t('receipt.remaining_balance', "SOLDE RESTANT À PAYER")} :</span>
              <strong className={`text-lg font-display font-extrabold print:text-black ${resteAPayer > 0 ? 'text-danger' : 'text-success'}`}>
                {formatCFA(resteAPayer)}
              </strong>
            </div>
            
            {resteAPayer === 0 && (
              <div className="text-center font-bold text-success text-[10px] uppercase tracking-wider pt-1 animate-pulse print:hidden">
                {t('receipt.paid_in_full', "★ Scolarité Soldée en Totalité ★")}
              </div>
            )}
          </div>

          {/* Blocs de Signatures */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-xs text-start">
            <div className="text-center space-y-12">
              <span className="text-muted-foreground print:text-black/80 block">{t('receipt.parent_signature', "Le Parent d'Élève")}</span>
              <div className="h-0 border-t border-dashed border-border/60 print:border-black/30 w-3/4 mx-auto"></div>
            </div>
            <div className="text-center space-y-12">
              <span className="text-muted-foreground print:text-black/80 block font-semibold">{t('receipt.cashier_signature', "Le Caissier / L'Intendance")}</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground print:text-black/70 mb-1">{t('receipt.signed_digitally', "Signé numériquement")}</span>
                <div className="flex items-center space-x-1 text-success print:text-black font-bold">
                  <CheckCircle className="h-4 w-4" />
                  <span>{(ecole?.nom || 'LES FLAMBOYANTS').toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mentions de bas de page */}
          <div className="text-center text-[10px] text-muted-foreground print:text-black/60 pt-4 border-t border-dashed border-border/60 print:border-black/30">
            {t('receipt.footer_certify', "Ce reçu certifie le règlement de la scolarité / des frais de l'élève.")}
            <br />
            {t('receipt.footer_save', "Merci de le conserver précieusement.")}
          </div>
        </div>

        {/* Footer no-print */}
        <DialogFooter className="p-4 bg-muted/30 border-t border-border/40 flex justify-end space-x-2 no-print">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-border text-text hover:bg-muted hover:text-text"
          >
            {t('action.close', "Fermer")}
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="bg-primary hover:bg-primary-dark text-white font-bold flex items-center gap-2"
          >
            <Printer className="h-4 w-4 shrink-0" />
            <span>{t('receipt.print', "Imprimer le reçu")}</span>
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
    <ConfirmDeleteModal
      isOpen={!!confirmCancelData}
      onClose={() => setConfirmCancelData(null)}
      onConfirm={executeAnnulerVersement}
      title={t('receipt.delete_confirm_title', "Confirmer l'annulation")}
      description={t('receipt.delete_confirm_desc', "Êtes-vous sûr de vouloir annuler ce versement de {montant} ? Cette opération mettra à jour le solde restant et le statut de la scolarité.").replace('{montant}', formatCFA(confirmCancelData?.montant || 0))}
    />
    </>
  )
}
