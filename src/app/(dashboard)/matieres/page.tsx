'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Plus, BookOpen, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { Label } from '@/components/ui/label'
import { PremiumGuard } from '@/components/ui/PremiumGuard'

function MatieresContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialClasseId = searchParams.get('classeId') || 'toutes'

  const { matieres, classes, addMatiere, updateMatiere, deleteMatiere, isAbonnementExpired, ecole } = useSchoolStore()

  if (ecole?.abonnement?.plan === 'gratuit') {
    return (
      <PremiumGuard 
        title="Gestion des Matières" 
        description="Configurez les matières enseignées dans votre établissement, définissez leurs coefficients respectifs par classe, et organisez le cursus pédagogique pour assurer un calcul précis des moyennes de vos élèves."
      />
    )
  }
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState(initialClasseId)

  useEffect(() => {
    if (initialClasseId !== classFilter) {
      setClassFilter(initialClasseId)
    }
  }, [initialClasseId])

  const handleClassFilterChange = (value: string) => {
    setClassFilter(value)
    if (value === 'toutes') {
      router.replace('/matieres')
    } else {
      router.replace(`/matieres?classeId=${value}`)
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({ nom: '', coefficient: 1, classeId: '' })

  const filteredMatieres = matieres.filter(m => {
    const matchesSearch = m.nom.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = classFilter === 'toutes' || m.classeId === classFilter
    return matchesSearch && matchesClass
  })

  const getClasseName = (id: string) => classes.find(c => c.id === id)?.nom || 'Inconnue'

  const handleOpen = (matiere?: any) => {
    if (matiere) {
      setEditingId(matiere.id)
      setFormData({ nom: matiere.nom, coefficient: matiere.coefficient, classeId: matiere.classeId })
    } else {
      setEditingId(null)
      setFormData({ nom: '', coefficient: 1, classeId: classFilter !== 'toutes' ? classFilter : '' })
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
    if (!formData.nom || !formData.classeId) return toast({ title: "Erreur", description: "Veuillez remplir les champs.", variant: "destructive" })
    
    if (editingId) {
      updateMatiere(editingId, formData)
      toast({ title: "Succès", description: "Matière modifiée avec succès." })
    } else {
      addMatiere({ id: `m-${Date.now()}`, enseignantIds: [], ...formData })
      toast({ title: "Succès", description: "Matière ajoutée avec succès." })
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
      deleteMatiere(deleteId)
      toast({ title: "Succès", description: "Matière supprimée." })
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/classes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-display font-bold text-text">Gestion des Matières</h2>
            <p className="text-sm text-muted-foreground">{filteredMatieres.length} matière(s)</p>
          </div>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary text-white hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Matière
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50 flex flex-col sm:flex-row gap-4">
        <Input 
          placeholder="Rechercher une matière..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex items-center w-full sm:w-[250px] px-3 py-2 border border-border/50 rounded-md bg-muted/20 text-sm font-medium text-text">
          {classFilter === 'toutes' ? 'Toutes les classes' : getClasseName(classFilter)}
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Nom de la matière</th>
                <th className="px-6 py-4">Classe</th>
                <th className="px-6 py-4 text-center">Coefficient</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredMatieres.map(matiere => (
                <tr key={matiere.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center">
                    <div className="bg-primary/10 p-2 rounded-md mr-3 text-primary">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    {matiere.nom}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{getClasseName(matiere.classeId)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-text bg-muted/50 px-2 py-1 rounded">
                      {matiere.coefficient}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button onClick={() => handleOpen(matiere)} variant="ghost" size="icon" className="text-muted-foreground hover:text-text hover:bg-muted transition-colors">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(matiere.id)} variant="ghost" size="icon" className="text-destructive hover:text-white hover:bg-destructive transition-colors">
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
            <DialogTitle>{editingId ? "Modifier la matière" : "Ajouter une matière"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de la matière</Label>
              <Input 
                value={formData.nom} 
                onChange={e => setFormData({...formData, nom: e.target.value})} 
                placeholder="Ex: Mathématiques" 
              />
            </div>
            <div className="space-y-2">
              <Label>Classe</Label>
              <div className="w-full px-3 py-2 border rounded-md bg-muted/30 text-sm font-medium text-muted-foreground">
                {formData.classeId ? getClasseName(formData.classeId) : 'Aucune classe sélectionnée'}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Coefficient</Label>
              <Input 
                type="number" 
                value={formData.coefficient} 
                onChange={e => setFormData({...formData, coefficient: parseInt(e.target.value) || 1})} 
              />
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
        description="Voulez-vous vraiment supprimer cette matière ? Cette action est irréversible."
      />
    </div>
  )
}

export default function MatieresPage() {
  return (
    <Suspense fallback={<div>Chargement des matières...</div>}>
      <MatieresContent />
    </Suspense>
  )
}
