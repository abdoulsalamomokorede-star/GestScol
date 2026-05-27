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
import { Calendar as CalendarIcon, Search, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  const { classes, eleves, addEleve, updateEleve } = useSchoolStore()
  const { toast } = useToast()
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
    parentEmail: ''
  })

  const [typedDate, setTypedDate] = useState('')
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
        parentEmail: ''
      })
    }
  }, [eleveToEdit, isOpen])

  // Synchroniser le champ texte avec la date du state (format JJ/MM/AAAA)
  useEffect(() => {
    if (formData.dateNaissance) {
      const parts = formData.dateNaissance.split('-')
      if (parts.length === 3) {
        setTypedDate(`${parts[2]}/${parts[1]}/${parts[0]}`)
      }
    } else {
      setTypedDate('')
    }
  }, [formData.dateNaissance])

  const handleTypedDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    // Permettre l'effacement normal avec Backspace
    if (val.length < typedDate.length) {
      setTypedDate(val)
      if (val === '') handleSelectChange('dateNaissance', '')
      return
    }

    // Extraire uniquement les chiffres
    const digits = val.replace(/\D/g, '')
    
    // Appliquer le masque DD/MM/YYYY
    let formatted = digits
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
    }
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
    }

    setTypedDate(formatted)
    
    // Si le format est valide (JJ/MM/AAAA), on met à jour le store
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = formatted.match(regex)
    if (match) {
      const [, d, m, y] = match
      handleSelectChange('dateNaissance', `${y}-${m}-${d}`)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation basique
    if (!formData.matricule || !formData.prenom || !formData.nom || !formData.classeId || !formData.parentTelephone) {
      alert("Veuillez remplir les champs obligatoires (Matricule, Prénom, Nom, Classe, Téléphone parent)")
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

    if (eleveToEdit) {
      updateEleve(eleveToEdit.id, formData)
      toast({ title: "Succès", description: "Les informations de l'élève ont été mises à jour." })
    } else {
      addEleve({
        ...formData,
        id: `eleve-${Date.now()}`,
        dateInscription: new Date().toISOString().split('T')[0]
      } as Eleve)
      toast({ title: "Succès", description: "Le nouvel élève a été ajouté." })
    }
    onClose()
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
                <div className="flex gap-2">
                  <Input 
                    id="dateNaissance"
                    placeholder="JJ/MM/AAAA" 
                    value={typedDate} 
                    onChange={handleTypedDateChange}
                    className="flex-1"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0" type="button">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={formData.dateNaissance ? new Date(formData.dateNaissance) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const offset = date.getTimezoneOffset()
                            const adjustedDate = new Date(date.getTime() - (offset*60*1000))
                            handleSelectChange('dateNaissance', adjustedDate.toISOString().split('T')[0])
                          } else {
                            handleSelectChange('dateNaissance', '')
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
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
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button 
              type="submit" 
              className="bg-primary text-white hover:bg-primary-dark"
              disabled={isEmailInvalid}
            >
              {eleveToEdit ? "Enregistrer les modifications" : "Ajouter l'élève"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
