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
  const [isLoading, setIsLoading] = useState(false)
  // For shadcn, usually it's `useToast` hook that returns `{ toast }`.
  // Wait, shadcn toaster might not be fully configured, but I will use the standard hook if available.
  // Actually, I'll just skip complex validation for MVP and use basic state.
  
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
          title: "Fichier trop volumineux",
          description: "La taille de l'image ne doit pas dépasser 1 Mo.",
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
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    
    // Validation basique
    if (!formData.matricule || !formData.prenom || !formData.nom || !formData.classeId || !formData.parentTelephone) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir les champs obligatoires (Matricule, Prénom, Nom, Classe, Téléphone parent)",
        variant: "destructive"
      })
      return
    }

    // Vérification anti-doublon matricule
    const isDuplicate = eleves.some(e => e.matricule === formData.matricule && e.id !== eleveToEdit?.id)
    if (isDuplicate) {
      toast({
        title: "Erreur",
        description: "Ce matricule est déjà attribué à un autre élève.",
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
              title: "Erreur de photo",
              description: uploadRes.error || "La validation ou le transfert de la photo a échoué.",
              variant: "destructive"
            })
            setIsLoading(false)
            return
          }
        }
        const res = await updateEleve(eleveToEdit.id, formData)
        if (res && !res.success) {
          toast({ title: "Erreur", description: res.error || "La modification a échoué.", variant: "destructive" })
        } else {
          toast({ title: "Succès", description: "Les informations de l'élève ont été mises à jour." })
          onClose()
        }
      } else {
        const res = await addEleve({
          ...formData,
          id: `eleve-${Date.now()}`,
          dateInscription: new Date().toISOString().split('T')[0]
        } as Eleve)
        if (res && !res.success) {
          toast({ title: "Erreur", description: res.error || "L'ajout a échoué.", variant: "destructive" })
        } else {
          toast({ title: "Succès", description: "Le nouvel élève a été ajouté." })
          onClose()
        }
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Une erreur est survenue.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{eleveToEdit ? "Modifier l'élève" : "Ajouter un nouvel élève"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Informations de l'élève</h3>
            
            {/* Photo de l'élève */}
            <div className="flex flex-col items-center justify-center space-y-2 mb-4 border-b border-border/40 pb-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Photo de l&apos;élève</Label>
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
              <span className="text-[10px] text-muted-foreground">Formats acceptés : JPG ou PNG, max 1 Mo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="matricule">Matricule *</Label>
                <Input id="matricule" name="matricule" value={formData.matricule || ''} onChange={handleChange} required />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" name="prenom" value={formData.prenom || ''} onChange={handleChange} placeholder="Ex: Koffi" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" name="nom" value={formData.nom || ''} onChange={handleChange} placeholder="Ex: Kouadio" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateNaissance">Date de naissance</Label>
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
                  className="w-full bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Sexe</Label>
                <Select value={formData.sexe} onValueChange={(val) => handleSelectChange('sexe', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le sexe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classe *</Label>
                <Popover open={isClasseComboboxOpen} onOpenChange={setIsClasseComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isClasseComboboxOpen}
                      className="w-full justify-between"
                    >
                      {formData.classeId
                        ? classes.find(c => c.id === formData.classeId)?.nom || "Sélectionner une classe"
                        : "Sélectionner une classe"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[300px] p-0" align="start">
                    <div className="flex flex-col">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-0 focus-visible:ring-0 shadow-none"
                          placeholder="Rechercher une classe..."
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
                              className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${formData.classeId === c.id ? 'bg-accent/50' : ''}`}
                              onClick={() => { handleSelectChange('classeId', c.id); setIsClasseComboboxOpen(false); }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${formData.classeId === c.id ? 'opacity-100' : 'opacity-0'}`} />
                              {c.nom}
                            </div>
                          ))}
                        {classes.filter(c => c.nom.toLowerCase().includes(classeSearchQuery.toLowerCase())).length === 0 && (
                          <p className="p-4 text-center text-sm text-muted-foreground">Aucune classe trouvée.</p>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formData.statut} onValueChange={(val) => handleSelectChange('statut', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut de l'élève" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="suspendu">Suspendu</SelectItem>
                    <SelectItem value="exclu">Exclu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact Parent/Tuteur</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentNom">Nom complet</Label>
                <Input id="parentNom" name="parentNom" value={formData.parentNom || ''} onChange={handleChange} placeholder="Nom du tuteur" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentTelephone">Téléphone (WhatsApp) *</Label>
                <Input id="parentTelephone" name="parentTelephone" value={formData.parentTelephone || ''} onChange={handleChange} placeholder="+225 01 23 45 67 89" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="parentEmail">Adresse Email</Label>
                <Input 
                  type="email" 
                  id="parentEmail" 
                  name="parentEmail" 
                  value={formData.parentEmail || ''} 
                  onChange={handleChange} 
                  placeholder="email@exemple.com"
                  className={formData.parentEmail === '' || formData.parentEmail === undefined ? '' : !isEmailInvalid ? 'border-success focus-visible:ring-success' : 'border-destructive focus-visible:ring-destructive'} 
                />
                {isEmailInvalid && (
                  <p className="text-xs text-destructive">
                    Format d'email invalide. Veuillez corriger ou laisser vide.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
            <Button 
              type="submit" 
              className="bg-primary text-white hover:bg-primary-dark"
              disabled={isEmailInvalid || isLoading}
            >
              {isLoading ? "Enregistrement..." : eleveToEdit ? "Enregistrer les modifications" : "Ajouter l'élève"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
