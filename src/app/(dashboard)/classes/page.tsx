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

export default function ClassesPage() {
  const router = useRouter()
  const { classes, eleves, inscriptions, activeAnneeScolaire, addClasse, updateClasse, deleteClasse, isAbonnementExpired } = useSchoolStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [niveauFilter, setNiveauFilter] = useState('tous')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
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

  const handleSave = () => {
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (!formData.nom || !formData.niveau) return toast({ title: "Erreur", description: "Veuillez remplir les champs.", variant: "destructive" })
    
    if (editingId) {
      updateClasse(editingId, formData)
      toast({ title: "Succès", description: "Classe modifiée avec succès." })
    } else {
      addClasse({ id: `c-${Date.now()}`, enseignantPrincipalId: '', ecoleId: 'ecole-1', ...formData })
      toast({ title: "Succès", description: "Classe ajoutée avec succès." })
    }
    setIsModalOpen(false)
  }

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = () => {
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (deleteId) {
      deleteClasse(deleteId)
      toast({ title: "Succès", description: "Classe supprimée." })
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">Gestion des Classes</h2>
          <p className="text-sm text-muted-foreground">{filteredClasses.length} classe(s)</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary text-white hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Classe
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50 flex flex-col sm:flex-row gap-4">
        <Input 
          placeholder="Rechercher une classe..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={niveauFilter} onValueChange={setNiveauFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrer par niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les niveaux</SelectItem>
            <SelectItem value="prescolaire">Préscolaire</SelectItem>
            <SelectItem value="primaire">Primaire</SelectItem>
            <SelectItem value="secondaire">Secondaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Nom de la classe</th>
                <th className="px-6 py-4">Niveau</th>
                <th className="px-6 py-4">Effectif</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredClasses.map(classe => (
                <tr key={classe.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center">
                    <div className="bg-primary/10 p-2 rounded-md mr-3 text-primary">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    {classe.nom}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{classe.niveau}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center text-text font-medium">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      {inscriptions.filter(i => i.classeId === classe.id && i.anneeScolaire === activeAnneeScolaire?.id && i.statut === 'validee').length} élèves
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button onClick={() => router.push(`/matieres?classeId=${classe.id}`)} variant="ghost" size="icon" className="text-primary hover:text-white hover:bg-primary transition-colors" title="Voir les matières">
                        <BookOpen className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleOpen(classe)} variant="ghost" size="icon" className="text-muted-foreground hover:text-text hover:bg-muted transition-colors" title="Modifier">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(classe.id)} variant="ghost" size="icon" className="text-destructive hover:text-white hover:bg-destructive transition-colors" title="Supprimer">
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
            <DialogTitle>{editingId ? "Modifier la classe" : "Ajouter une classe"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de la classe</Label>
              <Input 
                value={formData.nom} 
                onChange={e => setFormData({...formData, nom: e.target.value})} 
                placeholder="Ex: CM2 A" 
              />
            </div>
            <div className="space-y-2">
              <Label>Niveau</Label>
              <Select value={formData.niveau} onValueChange={(val) => setFormData({...formData, niveau: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prescolaire">Préscolaire</SelectItem>
                  <SelectItem value="primaire">Primaire</SelectItem>
                  <SelectItem value="secondaire">Secondaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frais d'inscription (FCFA)</Label>
                <Input 
                  type="number" 
                  value={formData.montantInscription} 
                  onChange={e => setFormData({...formData, montantInscription: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Scolarité (FCFA)</Label>
                <Input 
                  type="number" 
                  value={formData.montantScolarite} 
                  onChange={e => setFormData({...formData, montantScolarite: parseInt(e.target.value) || 0})} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} className="bg-primary text-white">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        description="Voulez-vous vraiment supprimer cette classe ? Cette action est irréversible."
      />
    </div>
  )
}
