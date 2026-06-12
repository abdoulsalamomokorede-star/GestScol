'use client'
 
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Upload, Loader2, Check } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface EcoleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (donnees: {
    nom: string
    ville: string
    adresse: string
    telephone: string
    niveaux: ('prescolaire' | 'primaire' | 'secondaire')[]
    logo?: string
    anneeScolaire: string
  }) => Promise<void>
}

export default function EcoleFormModal({ isOpen, onClose, onSave }: EcoleFormModalProps) {
  const { t, dir } = useTranslation()
  const [isSaving, setIsSaving] = useState(false)
  const [nom, setNom] = useState('')
  const [ville, setVille] = useState('')
  const [adresse, setAdresse] = useState('')
  const [telephone, setTelephone] = useState('')
  const [niveaux, setNiveaux] = useState<('prescolaire' | 'primaire' | 'secondaire')[]>(['primaire'])
  const [logo, setLogo] = useState<string | undefined>(undefined)
  const [anneeScolaire, setAnneeScolaire] = useState('2026-2027')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Traiter le chargement d'image en Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérification de la taille (max 1 Mo)
    if (file.size > 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: t('errors.logo_size_limit', "L'image ne doit pas dépasser 1 Mo.") }))
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
      setLogo(reader.result as string)
      setErrors(prev => {
        const { logo, ...rest } = prev
        return rest
      })
    }
    reader.readAsDataURL(file)
  }

  const handleNiveauToggle = (niveau: 'prescolaire' | 'primaire' | 'secondaire') => {
    if (niveaux.includes(niveau)) {
      if (niveaux.length > 1) {
        setNiveaux(niveaux.filter(n => n !== niveau))
      }
    } else {
      setNiveaux([...niveaux, niveau])
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!nom.trim()) newErrors.nom = t('errors.school_name_required', "Le nom de l'établissement est requis.")
    if (!ville.trim()) newErrors.ville = t('errors.school_city_required', "La ville est requise.")
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveClick = async () => {
    if (!validate()) return

    setIsSaving(true)
    try {
      await onSave({
        nom: nom.trim(),
        ville: ville.trim(),
        adresse: adresse.trim(),
        telephone: telephone.trim(),
        niveaux,
        logo,
        anneeScolaire
      })
      onClose()
      // Réinitialiser les champs
      setNom('')
      setVille('')
      setAdresse('')
      setTelephone('')
      setLogo(undefined)
      setNiveaux(['primaire'])
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto shadow-xl"
        dir={dir}
      >
        <DialogHeader className="text-start">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            {t('ecoles.modal.create_title', "Ajouter un établissement")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {t('ecoles.modal.create_desc', "Configurez les détails administratifs de votre nouvelle école.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-start">
          {/* Nom de l'école */}
          <div className="space-y-2">
            <Label htmlFor="school-nom" className="text-slate-700 dark:text-slate-300 font-medium">
              {t('parametres.school.name', "Nom de l'établissement")} *
            </Label>
            <Input
              id="school-nom"
              placeholder={t('register.dir.school_name_placeholder', "Ex: GS Les Flamboyants")}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-emerald-500 text-slate-900 dark:text-white focus-visible:ring-emerald-500/20 rounded-xl"
            />
            {errors.nom && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.nom}
              </p>
            )}
          </div>

          {/* Ville */}
          <div className="space-y-2">
            <Label htmlFor="school-ville" className="text-slate-700 dark:text-slate-300 font-medium">
              {t('ecoles.modal.city', "Ville / Commune")} *
            </Label>
            <Input
              id="school-ville"
              placeholder={t('register.dir.school_city_placeholder', "Ex: Abidjan Cocody")}
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-emerald-500 text-slate-900 dark:text-white focus-visible:ring-emerald-500/20 rounded-xl"
            />
            {errors.ville && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.ville}
              </p>
            )}
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="school-adresse" className="text-slate-700 dark:text-slate-300 font-medium">
              {t('register.dir.school_address', "Adresse géographique complète")}
            </Label>
            <Input
              id="school-adresse"
              placeholder={t('register.dir.school_address_placeholder', "Ex: Riviera Palmeraie, Rue Ministre")}
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-emerald-500 text-slate-900 dark:text-white focus-visible:ring-emerald-500/20 rounded-xl"
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="school-telephone" className="text-slate-700 dark:text-slate-300 font-medium">
              {t('parametres.school.phone', "Téléphone de l'école")}
            </Label>
            <Input
              id="school-telephone"
              placeholder={t('ecoles.modal.phone_placeholder', "Ex: +225 07 48 85 96 12")}
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-emerald-500 text-slate-900 dark:text-white focus-visible:ring-emerald-500/20 rounded-xl animate-none"
            />
          </div>

          {/* Niveaux enseignés */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">
              {t('ecoles.modal.levels', "Niveaux d'enseignement")}
            </Label>
            <div className="flex gap-2">
              {['prescolaire', 'primaire', 'secondaire'].map((lvl) => {
                const isSelected = niveaux.includes(lvl as any)
                const lvlLabel = lvl === 'prescolaire' 
                  ? t('level.prescolaire', 'Maternelle') 
                  : lvl === 'primaire' 
                    ? t('level.primaire', 'Primaire') 
                    : t('level.secondaire', 'Secondaire')
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleNiveauToggle(lvl as any)}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-500 dark:border-emerald-900/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    {lvlLabel}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Logo upload Base64 */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">
              {t('parametres.school.logo', "Logo de l'établissement")} ({t('common.optional', "Optionnel")})
            </Label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                {logo ? (
                  <img src={logo} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="logo-input"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-input')?.click()}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-xs"
                >
                  {t('register.dir.choose_image', "Choisir une image")}
                </Button>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1 leading-normal">
                  {t('register.dir.logo_formats', "Format JPEG, PNG, WebP uniquement (Max. 1 Mo)")}
                </span>
              </div>
            </div>
            {errors.logo && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.logo}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 dark:border-slate-800/60 pt-4 flex gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold"
          >
            {t('action.cancel', "Annuler")}
          </Button>
          <Button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl px-5 flex items-center gap-1"
          >
            {isSaving ? (
              <>
                {t('action.creating', "Création...")} <Loader2 className="h-4.5 w-4.5 animate-spin" />
              </>
            ) : (
              t('ecoles.create_btn', "Créer l'établissement")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
