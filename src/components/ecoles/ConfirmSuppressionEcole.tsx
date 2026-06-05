'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmSuppressionEcoleProps {
  isOpen: boolean
  ecoleId: string
  ecoleNom: string
  onClose: () => void
  onConfirm: (ecoleId: string) => Promise<void>
}

export default function ConfirmSuppressionEcole({
  isOpen,
  ecoleId,
  ecoleNom,
  onClose,
  onConfirm
}: ConfirmSuppressionEcoleProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [typedNom, setTypedNom] = useState('')

  const isCorrect = typedNom.trim().toLowerCase() === ecoleNom.trim().toLowerCase()

  const handleConfirmClick = async () => {
    if (!isCorrect) return

    setIsDeleting(true)
    try {
      await onConfirm(ecoleId)
      onClose()
      setTypedNom('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 mb-1">
            <AlertTriangle className="h-5 w-5 animate-pulse shrink-0" />
            <DialogTitle className="text-lg font-bold">⚠️ Action Irréversible !</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Vous êtes sur le point de supprimer définitivement l&apos;école <strong className="text-slate-900 dark:text-white">{ecoleNom}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avertissement fort */}
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 text-xs text-rose-700 dark:text-rose-400 space-y-1.5 leading-normal">
            <p className="font-bold">Les données suivantes seront supprimées définitivement :</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Tous les élèves de l&apos;établissement et leurs fiches de profil</li>
              <li>Toutes les classes, matières et coefficients configurés</li>
              <li>L&apos;historique complet des paiements, versements et dettes</li>
              <li>Toutes les notes de classe et tous les bulletins scolaires générés</li>
              <li>Toutes les absences et feuilles d&apos;appel</li>
              <li>Toutes les affectations d&apos;enseignants liées à cette école</li>
            </ul>
          </div>

          {/* Saisie de validation */}
          <div className="space-y-2">
            <Label htmlFor="confirm-nom-ecole" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Pour confirmer, tapez le nom exact de l&apos;école : <strong className="text-slate-900 dark:text-white">{ecoleNom}</strong>
            </Label>
            <Input
              id="confirm-nom-ecole"
              placeholder="Nom de l'établissement"
              value={typedNom}
              onChange={(e) => setTypedNom(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-rose-500 text-slate-900 dark:text-white focus-visible:ring-rose-550/20 rounded-xl"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 dark:border-slate-800/60 pt-4 flex gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleConfirmClick}
            disabled={isDeleting || !isCorrect}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl px-5 flex items-center gap-1 disabled:opacity-40"
          >
            {isDeleting ? (
              <>
                Suppression... <Loader2 className="h-4.5 w-4.5 animate-spin" />
              </>
            ) : (
              "Supprimer définitivement"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
