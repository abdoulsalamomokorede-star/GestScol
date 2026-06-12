'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Plus, Users, GraduationCap, Edit, Trash2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/hooks/useTranslation'

export default function ClassesPage() {
  const router = useRouter()
  const { classes, eleves, inscriptions, activeAnneeScolaire, addClasse, updateClasse, deleteClasse, isAbonnementExpired, ecole } = useSchoolStore()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [niveauFilter, setNiveauFilter] = useState('tous')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({ nom: '', niveau: '', montantScolarite: 0, montantInscription: 0 })

  const filteredClasses = classes.filter(c => {
    const matchesSearch = c.nom.toLowerCase().includes(searchTerm.toLowerCase()) || c.niveau.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesNiveau = niveauFilter === 'tous' || c.niveau.toLowerCase() === niveauFilter.toLowerCase()
    return matchesSearch && matchesNiveau
  })

  const handleOpen = (classe?: any) => {
    if (classe) {
      setEditingId(classe.id)
      setFormData({ nom: classe.nom, niveau: classe.niveau.toLowerCase(), montantScolarite: classe.montantScolarite || 0, montantInscription: classe.montantInscription || 0 })
    } else {
      setEditingId(null)
      setFormData({ nom: '', niveau: '', montantScolarite: 0, montantInscription: 0 })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (!formData.nom || !formData.niveau) return toast({ title: "Erreur", description: "Veuillez remplir les champs.", variant: "destructive" })
    
    setIsLoading(true)
    try {
      if (editingId) {
        const res = await updateClasse(editingId, formData)
        if (res && !res.success) {
          toast({ title: "Erreur", description: res.error || "La modification a échoué.", variant: "destructive" })
        } else {
          toast({ title: "Succès", description: "Classe modifiée avec succès." })
          setIsModalOpen(false)
        }
      } else {
        const res = await addClasse({ 
          id: `c-${Date.now()}`, 
          enseignantPrincipalId: '', 
          ecoleId: ecole?.id || '', 
          ...formData 
        })
        if (res && !res.success) {
          toast({ title: "Erreur", description: res.error || "L'ajout a échoué.", variant: "destructive" })
        } else {
          toast({ title: "Succès", description: "Classe ajoutée avec succès." })
          setIsModalOpen(false)
        }
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Une erreur est survenue.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (deleteId) {
      setIsLoading(true)
      try {
        const res = await deleteClasse(deleteId)
        if (res && !res.success) {
          toast({ title: "Erreur", description: res.error || "La suppression a échoué.", variant: "destructive" })
        } else {
          toast({ title: "Succès", description: "Classe supprimée." })
          setDeleteId(null)
        }
      } catch (e: any) {
        toast({ title: "Erreur", description: e.message || "Une erreur est survenue.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">{t('classes.title', 'Gestion des Classes')}</h2>
          <p className="text-sm text-muted-foreground">{filteredClasses.length} {t('classes.found', 'classe(s)')}</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary text-white hover:bg-primary-dark">
          <Plus className="me-2 h-4 w-4" />
          {t('classes.new', 'Nouvelle Classe')}
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50 flex flex-col sm:flex-row gap-4">
        <Input 
          placeholder={t('classes.search_placeholder', 'Rechercher une classe...')} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={niveauFilter} onValueChange={setNiveauFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('classes.filter_level', 'Filtrer par niveau')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{t('classes.level.all', 'Tous les niveaux')}</SelectItem>
            <SelectItem value="prescolaire">{t('classes.level.prescolaire', 'Préscolaire')}</SelectItem>
            <SelectItem value="primaire">{t('classes.level.primaire', 'Primaire')}</SelectItem>
            <SelectItem value="secondaire">{t('classes.level.secondaire', 'Secondaire')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4 text-start">{t('classes.table.name', 'Nom de la classe')}</th>
                <th className="px-6 py-4 text-start">{t('classes.table.level', 'Niveau')}</th>
                <th className="px-6 py-4 text-start">{t('classes.table.effectif', 'Effectif')}</th>
                <th className="px-6 py-4 text-end">{t('classes.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredClasses.map(classe => (
                <tr key={classe.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center text-start">
                    <div className="bg-primary/10 p-2 rounded-md me-3 text-primary">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    {classe.nom}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-start">{classe.niveau}</td>
                  <td className="px-6 py-4 text-start">
                    <span className="flex items-center text-text font-medium">
                      <Users className="h-4 w-4 me-2 text-muted-foreground" />
                      {inscriptions.filter(i => i.classeId === classe.id && i.anneeScolaire === activeAnneeScolaire?.id && i.statut === 'validee').length} {t('bulletins.eleves_count', 'élèves')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={() => router.push(`/matieres?classeId=${classe.id}`)} variant="ghost" size="icon" className="text-primary hover:text-white hover:bg-primary transition-colors" title={t('classes.action.view_subjects', 'Voir les matières')}>
                        <BookOpen className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleOpen(classe)} variant="ghost" size="icon" className="text-muted-foreground hover:text-text hover:bg-muted transition-colors" title={t('classes.action.edit', 'Modifier')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(classe.id)} variant="ghost" size="icon" className="text-destructive hover:text-white hover:bg-destructive transition-colors" title={t('classes.action.delete', 'Supprimer')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t('classes.modal.title_edit', 'Modifier la classe') : t('classes.modal.title_add', 'Ajouter une classe')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('classes.modal.name_label', 'Nom de la classe')}</Label>
              <Input 
                value={formData.nom} 
                onChange={e => setFormData({...formData, nom: e.target.value})} 
                placeholder="Ex: CM2 A" 
              />
            </div>
            <div className="space-y-2">
              <Label>{t('classes.modal.level_label', 'Niveau')}</Label>
              <Select value={formData.niveau} onValueChange={(val) => setFormData({...formData, niveau: val})}>
                <SelectTrigger>
                  <SelectValue placeholder={t('classes.modal.level_placeholder', 'Sélectionner le niveau')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prescolaire">{t('classes.level.prescolaire', 'Préscolaire')}</SelectItem>
                  <SelectItem value="primaire">{t('classes.level.primaire', 'Primaire')}</SelectItem>
                  <SelectItem value="secondaire">{t('classes.level.secondaire', 'Secondaire')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('classes.modal.fees_enroll_label', "Frais d'inscription (FCFA)")}</Label>
                <Input 
                  type="number" 
                  value={formData.montantInscription} 
                  onChange={e => setFormData({...formData, montantInscription: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-2">
                <Label>{t('classes.modal.fees_tuition_label', 'Scolarité (FCFA)')}</Label>
                <Input 
                  type="number" 
                  value={formData.montantScolarite} 
                  onChange={e => setFormData({...formData, montantScolarite: parseInt(e.target.value) || 0})} 
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isLoading}>{t('classes.modal.cancel', 'Annuler')}</Button>
            <Button onClick={handleSave} className="bg-primary text-white" disabled={isLoading}>
              {isLoading ? t('classes.modal.saving', 'Enregistrement...') : t('classes.modal.save', 'Enregistrer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('classes.delete.title', 'Confirmer la suppression')}
        description={t('classes.delete.desc', 'Voulez-vous vraiment supprimer cette classe ? Cette action est irréversible.')}
      />
    </div>
  )
}
