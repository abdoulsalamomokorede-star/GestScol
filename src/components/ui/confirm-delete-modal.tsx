import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/hooks/useTranslation"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText
}: ConfirmDeleteModalProps) {
  const { t, dir } = useTranslation()

  const finalTitle = title || t('confirm_delete.title', "Confirmer la suppression")
  const finalDescription = description || t('confirm_delete.desc', "Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.")
  const finalConfirmText = confirmText || t('action.delete_confirm', "Supprimer définitivement")
  const finalCancelText = cancelText || t('action.cancel', "Annuler")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir={dir}>
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2 text-start">
            {finalTitle}
          </DialogTitle>
          <DialogDescription className="pt-2 text-start">
            {finalDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            {finalCancelText}
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {finalConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
