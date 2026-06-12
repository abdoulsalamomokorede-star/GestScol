'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Eleve } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { format } from "date-fns"
import { Calendar as CalendarIcon, Search, Check, ChevronsUpDown, Camera } from "lucide-react"
import { cn, getInitiales } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatePicker } from '@/components/ui/date-picker'
import { uploadStudentPhoto } from '@/app/actions/upload'
import { useTranslation } from '@/hooks/useTranslation'

interface EleveModalProps {
  isOpen: boolean
  onClose: () => void
  eleveToEdit?: Eleve
}

const generateMatricule = () => {
  let digits = ''
  for (let i = 0; i < 8; i++) {
    digits += Math.floor(Math.random() * 10).toString()
  }
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const randomLetter = letters[Math.floor(Math.random() * letters.length)]
  return `${digits}${randomLetter}`
}

export default function EleveModal({ isOpen, onClose, eleveToEdit }: EleveModalProps) {
  const { classes, eleves, addEleve, updateEleve, isAbonnementExpired } = useSchoolStore()
  const { toast } = useToast()
  const { t, dir, isAr } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<Partial<Eleve>>({
    matricule: '',
    prenom: '',
    nom: '',
    dateNaissance: '',
    sexe: 'M',
    classeId: '',
    statut: 'actif',
    parentNom: '',
    parentTelephone: '',
    parentEmail: '',
    photoUrl: ''
  })

  const [classeSearchQuery, setClasseSearchQuery] = useState('')
  const [isClasseComboboxOpen, setIsClasseComboboxOpen] = useState(false)

  const isEmailInvalid = formData.parentEmail !== '' && formData.parentEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)

  useEffect(() => {
    if (eleveToEdit) {
      setFormData({
        ...eleveToEdit,
        matricule: eleveToEdit.matricule || generateMatricule()
      })
    } else {
      setFormData({
        matricule: generateMatricule(),
        prenom: '',
        nom: '',
        dateNaissance: '',
        sexe: 'M',
        classeId: '',
        statut: 'actif',
        parentNom: '',
        parentTelephone: '',
        parentEmail: '',
        photoUrl: ''
      })
    }
  }, [eleveToEdit, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({
          title: t('toast.file_too_large', "Fichier trop volumineux"),
          description: t('eleves.modal.photo_max_size', "La taille de l'image ne doit pas dépasser 1 Mo."),
          variant: "destructive"
        })
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleSelectChange('photoUrl', reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isAbonnementExpired()) {
      toast({
        title: t('toast.impossible_action', "Action impossible"),
        description: t('toast.expired_desc', "Abonnement expiré. Veuillez le renouveler pour effectuer cette action."),
        variant: "destructive"
      })
      return
    }
    
    // Validation basique
    if (!formData.matricule || !formData.prenom || !formData.nom || !formData.classeId || !formData.parentTelephone) {
      toast({
        title: t('toast.validation_error', "Erreur de validation"),
        description: t('toast.validation_error_desc', "Veuillez remplir les champs obligatoires (Matricule, Prénom, Nom, Classe, Téléphone parent)"),
        variant: "destructive"
      })
      return
    }

    // Vérification anti-doublon matricule
    const isDuplicate = eleves.some(e => e.matricule === formData.matricule && e.id !== eleveToEdit?.id)
    if (isDuplicate) {
      toast({
        title: t('toast.duplicate_matricule', "Erreur"),
        description: t('toast.duplicate_matricule_desc', "Ce matricule est déjà attribué à un autre élève."),
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      if (eleveToEdit) {
        if (formData.photoUrl && formData.photoUrl !== eleveToEdit.photoUrl) {
          const uploadRes = await uploadStudentPhoto(eleveToEdit.id, formData.photoUrl)
          if (!uploadRes.success) {
            toast({
              title: t('toast.photo_error', "Erreur de photo"),
              description: uploadRes.error || t('toast.photo_error_desc', "La validation ou le transfert de la photo a échoué."),
              variant: "destructive"
            })
            setIsLoading(false)
            return
          }
        }
        const res = await updateEleve(eleveToEdit.id, formData)
        if (res && !res.success) {
          toast({ title: t('toast.error', "Erreur"), description: res.error || t('toast.update_failed_desc', "La modification a échoué."), variant: "destructive" })
        } else {
          toast({ title: t('toast.success', "Succès"), description: t('toast.student_updated', "Les informations de l'élève ont été mises à jour.") })
          onClose()
        }
      } else {
        const res = await addEleve({
          ...formData,
          id: `eleve-${Date.now()}`,
          dateInscription: new Date().toISOString().split('T')[0]
        } as Eleve)
        if (res && !res.success) {
          toast({ title: t('toast.error', "Erreur"), description: res.error || t('toast.add_failed_desc', "L'ajout a échoué."), variant: "destructive" })
        } else {
          toast({ title: t('toast.success', "Succès"), description: t('toast.student_added', "Le nouvel élève a été ajouté.") })
          onClose()
        }
      }
    } catch (err: any) {
      toast({ title: t('toast.error', "Erreur"), description: err.message || "Une erreur est survenue.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto text-start" dir={dir}>
        <DialogHeader>
          <DialogTitle className="text-start">{eleveToEdit ? t('eleves.modal.edit_title', "Modifier l'élève") : t('eleves.modal.add_title', "Ajouter un nouvel élève")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-start">{t('eleves.modal.student_info', "Informations de l'élève")}</h3>
            
            {/* Photo de l'élève */}
            <div className="flex flex-col items-center justify-center space-y-2 mb-4 border-b border-border/40 pb-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">{t('eleves.modal.photo', "Photo de l'élève")}</Label>
              <div className="relative group cursor-pointer">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
                  {formData.photoUrl ? (
                    <AvatarImage src={formData.photoUrl} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary/5 text-primary text-xl font-extrabold">
                    {getInitiales(formData.nom || '', formData.prenom || '')}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                  <Camera className="h-4 w-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleStudentPhotoChange} />
                </label>
              </div>
              <span className="text-[10px] text-muted-foreground">{t('eleves.modal.photo_formats', "Formats acceptés : JPG ou PNG, max 1 Mo")}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="matricule" className="text-start block">{t('eleves.modal.matricule', "Matricule *")}</Label>
                <Input id="matricule" name="matricule" value={formData.matricule || ''} onChange={handleChange} required className="text-start" />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="prenom" className="text-start block">{t('eleves.modal.firstname', "Prénom *")}</Label>
                <Input id="prenom" name="prenom" value={formData.prenom || ''} onChange={handleChange} placeholder="Ex: Koffi" required className="text-start" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nom" className="text-start block">{t('eleves.modal.lastname', "Nom *")}</Label>
                <Input id="nom" name="nom" value={formData.nom || ''} onChange={handleChange} placeholder="Ex: Kouadio" required className="text-start" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateNaissance" className="text-start block">{t('eleves.modal.birthdate', "Date de naissance")}</Label>
                <DatePicker
                  id="dateNaissance"
                  date={formData.dateNaissance ? new Date(formData.dateNaissance) : undefined}
                  setDate={(date) => {
                    if (date) {
                      const offset = date.getTimezoneOffset()
                      const adjustedDate = new Date(date.getTime() - (offset*60*1000))
                      handleSelectChange('dateNaissance', adjustedDate.toISOString().split('T')[0])
                    } else {
                      handleSelectChange('dateNaissance', '')
                    }
                  }}
                  className="w-full bg-background text-start"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-start block">{t('eleves.modal.gender', "Sexe")}</Label>
                <Select value={formData.sexe} onValueChange={(val) => handleSelectChange('sexe', val)}>
                  <SelectTrigger className="text-start">
                    <SelectValue placeholder={t('eleves.modal.select_gender', "Sélectionner le sexe")} />
                  </SelectTrigger>
                  <SelectContent align={isAr ? 'end' : 'start'}>
                    <SelectItem value="M" className="text-start">{t('eleves.modal.gender_m', "Masculin")}</SelectItem>
                    <SelectItem value="F" className="text-start">{t('eleves.modal.gender_f', "Féminin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-start">
                <Label className="text-start block">{t('eleves.modal.class', "Classe *")}</Label>
                <Popover open={isClasseComboboxOpen} onOpenChange={setIsClasseComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isClasseComboboxOpen}
                      className="w-full justify-between font-normal text-start"
                    >
                      {formData.classeId
                        ? classes.find(c => c.id === formData.classeId)?.nom || t('eleves.modal.select_class', "Sélectionner une classe")
                        : t('eleves.modal.select_class', "Sélectionner une classe")}
                      <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[300px] p-0" align={isAr ? 'end' : 'start'}>
                    <div className="flex flex-col text-start">
                      <div className="flex items-center border-b px-3">
                        <Search className="me-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-0 focus-visible:ring-0 shadow-none text-start"
                          placeholder={t('eleves.modal.search_class', "Rechercher une classe...")}
                          value={classeSearchQuery}
                          onChange={(e) => setClasseSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-1">
                        {classes
                          .filter(c => c.nom.toLowerCase().includes(classeSearchQuery.toLowerCase()))
                          .map((c) => (
                            <div
                              key={c.id}
                              className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-start ${formData.classeId === c.id ? 'bg-accent/50' : ''}`}
                              onClick={() => { handleSelectChange('classeId', c.id); setIsClasseComboboxOpen(false); }}
                            >
                              <Check className={`me-2 h-4 w-4 ${formData.classeId === c.id ? 'opacity-100' : 'opacity-0'}`} />
                              {c.nom}
                            </div>
                          ))}
                        {classes.filter(c => c.nom.toLowerCase().includes(classeSearchQuery.toLowerCase())).length === 0 && (
                          <p className="p-4 text-center text-sm text-muted-foreground">{t('eleves.modal.no_class_found', "Aucune classe trouvée.")}</p>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-start block">{t('eleves.modal.status', "Statut")}</Label>
                <Select value={formData.statut} onValueChange={(val) => handleSelectChange('statut', val)}>
                  <SelectTrigger className="text-start">
                    <SelectValue placeholder={t('eleves.modal.select_status', "Statut de l'élève")} />
                  </SelectTrigger>
                  <SelectContent align={isAr ? 'end' : 'start'}>
                    <SelectItem value="actif" className="text-start">{t('eleves.modal.status_active', "Actif")}</SelectItem>
                    <SelectItem value="suspendu" className="text-start">{t('eleves.modal.status_suspended', "Suspendu")}</SelectItem>
                    <SelectItem value="exclu" className="text-start">{t('eleves.modal.status_excluded', "Exclu")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-start">{t('eleves.modal.parent_contact', "Contact Parent/Tuteur")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentNom" className="text-start block">{t('eleves.modal.parent_name', "Nom complet")}</Label>
                <Input id="parentNom" name="parentNom" value={formData.parentNom || ''} onChange={handleChange} placeholder={t('eleves.modal.parent_name_placeholder', "Nom du tuteur")} className="text-start" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentTelephone" className="text-start block">{t('eleves.modal.parent_phone', "Téléphone (WhatsApp) *")}</Label>
                <Input id="parentTelephone" name="parentTelephone" value={formData.parentTelephone || ''} onChange={handleChange} placeholder="+225 01 23 45 67 89" required className="text-start" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="parentEmail" className="text-start block">{t('eleves.modal.parent_email', "Adresse Email")}</Label>
                <Input 
                  type="email" 
                  id="parentEmail" 
                  name="parentEmail" 
                  value={formData.parentEmail || ''} 
                  onChange={handleChange} 
                  placeholder="email@exemple.com"
                  className={cn("text-start", (formData.parentEmail === '' || formData.parentEmail === undefined ? '' : !isEmailInvalid ? 'border-success focus-visible:ring-success' : 'border-destructive focus-visible:ring-destructive'))} 
                />
                {isEmailInvalid && (
                  <p className="text-xs text-destructive text-start">
                    {t('eleves.modal.invalid_email', "Format d'email invalide. Veuillez corriger ou laisser vide.")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>{t('action.cancel', "Annuler")}</Button>
            <Button 
              type="submit" 
              className="bg-primary text-white hover:bg-primary-dark"
              disabled={isEmailInvalid || isLoading}
            >
              {isLoading ? t('action.saving', "Enregistrement...") : (eleveToEdit ? t('eleves.modal.save_changes', "Enregistrer les modifications") : t('eleves.modal.add_student', "Ajouter l'élève"))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
