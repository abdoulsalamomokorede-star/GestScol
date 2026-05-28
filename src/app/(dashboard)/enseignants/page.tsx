'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Briefcase, Mail, Phone, Edit, Trash2, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitiales } from '@/lib/utils'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function EnseignantsPage() {
  const router = useRouter()
  const { enseignants, addEnseignant, updateEnseignant, deleteEnseignant, currentUser, isAbonnementExpired } = useSchoolStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [civiliteFiltre, setCiviliteFiltre] = useState('tous')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<{
    civilite: 'M.' | 'Mme' | 'Mlle',
    nom: string,
    prenom: string,
    email: string,
    telephone: string
  }>({ civilite: 'M.', nom: '', prenom: '', email: '', telephone: '' })

  const filteredEnseignants = enseignants.filter(e => {
    const matchSearch = `${e.prenom} ${e.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) || e.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCivilite = civiliteFiltre === 'tous' || e.civilite === civiliteFiltre
    return matchSearch && matchCivilite
  })

  const handleOpen = (ens?: any) => {
    if (ens) {
      setEditingId(ens.id)
      setFormData({ civilite: (ens.civilite as 'M.' | 'Mme' | 'Mlle') || 'M.', nom: ens.nom, prenom: ens.prenom, email: ens.email, telephone: ens.telephone })
    } else {
      setEditingId(null)
      setFormData({ civilite: 'M.', nom: '', prenom: '', email: '', telephone: '' })
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
    if (!formData.nom || !formData.prenom) return toast({ title: "Erreur", description: "Veuillez remplir le nom et prénom.", variant: "destructive" })
    
    if (formData.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return toast({ title: "Erreur", description: "Veuillez entrer une adresse email valide ou laisser le champ vide.", variant: "destructive" })
    }
    
    try {
      if (editingId) {
        await updateEnseignant(editingId, formData)
        toast({ title: "Succès", description: "Enseignant modifié avec succès." })
      } else {
        await addEnseignant({ 
          id: `ens-${Date.now()}`,
          role: 'enseignant',
          ecoleId: currentUser?.ecoleId || '',
          ...formData 
        })
        toast({ title: "Succès", description: "Enseignant ajouté avec succès." })
      }
      setIsModalOpen(false)
    } catch (err: any) {
      toast({ 
        title: "Erreur d'enregistrement", 
        description: "Impossible d'enregistrer l'enseignant dans la base de données. " + err.message, 
        variant: "destructive" 
      })
    }
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
      deleteEnseignant(deleteId)
      toast({ title: "Succès", description: "Enseignant supprimé." })
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">Gestion des Enseignants</h2>
          <p className="text-sm text-muted-foreground">{filteredEnseignants.length} enseignant(s)</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary text-white hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Enseignant
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50 flex flex-col sm:flex-row gap-4">
        <Input 
          placeholder="Rechercher par nom ou email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={civiliteFiltre} onValueChange={setCiviliteFiltre}>
          <SelectTrigger className="w-full sm:w-48 bg-background border-border">
            <SelectValue placeholder="Toutes civilités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Toutes civilités</SelectItem>
            <SelectItem value="M.">Monsieur (M.)</SelectItem>
            <SelectItem value="Mme">Madame (Mme)</SelectItem>
            <SelectItem value="Mlle">Mademoiselle (Mlle)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Enseignant</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredEnseignants.map(enseignant => (
                <tr key={enseignant.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {getInitiales(enseignant.nom, enseignant.prenom)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-text">{enseignant.civilite ? `${enseignant.civilite} ` : ''}{enseignant.prenom} {enseignant.nom}</p>
                        <p className="text-xs text-muted-foreground">ID: {enseignant.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm flex items-center text-muted-foreground">
                        <Mail className="h-3 w-3 mr-2" />
                        {enseignant.email}
                      </p>
                      <p className="text-sm flex items-center text-muted-foreground">
                        <Phone className="h-3 w-3 mr-2" />
                        {enseignant.telephone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button onClick={() => router.push(`/enseignants/${enseignant.id}/assignations`)} variant="ghost" size="icon" className="text-primary hover:text-white hover:bg-primary transition-colors" title="Assigner (Classes & Matières)">
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleOpen(enseignant)} variant="ghost" size="icon" className="text-muted-foreground hover:text-text hover:bg-muted transition-colors" title="Modifier">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(enseignant.id)} variant="ghost" size="icon" className="text-destructive hover:text-white hover:bg-destructive transition-colors" title="Supprimer">
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
            <DialogTitle>{editingId ? "Modifier l'enseignant" : "Ajouter un enseignant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label>Civilité</Label>
                <Select
                  value={formData.civilite}
                  onValueChange={(value) => setFormData({...formData, civilite: value as 'M.' | 'Mme' | 'Mlle'})}
                >
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue placeholder="Civilité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M.">M.</SelectItem>
                    <SelectItem value="Mme">Mme</SelectItem>
                    <SelectItem value="Mlle">Mlle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Nom</Label>
                <Input 
                  value={formData.nom} 
                  onChange={e => setFormData({...formData, nom: e.target.value})} 
                />
              </div>
              <div className="space-y-2 sm:col-span-4">
                <Label>Prénoms</Label>
                <Input 
                  value={formData.prenom} 
                  onChange={e => setFormData({...formData, prenom: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className={formData.email === '' ? '' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'border-success focus-visible:ring-success' : 'border-destructive focus-visible:ring-destructive'}
              />
              {formData.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <p className="text-xs text-destructive">
                  Format d'email invalide. Veuillez corriger ou laisser vide.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input 
                value={formData.telephone} 
                onChange={e => setFormData({...formData, telephone: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleSave} 
              disabled={formData.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
              className="bg-primary text-white"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        description="Voulez-vous vraiment supprimer cet enseignant ? Cette action est irréversible."
      />
    </div>
  )
}
