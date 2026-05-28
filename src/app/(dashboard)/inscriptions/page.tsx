'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Plus, Search, UserCheck, Eye, Edit, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { useToast } from '@/hooks/use-toast'
import InscriptionModal from '@/components/inscriptions/InscriptionModal'
import { Inscription } from '@/types'
import { Check, ChevronsUpDown } from 'lucide-react'

function InscriptionsPageContent() {
  const router = useRouter()
  const { inscriptions, eleves, classes, deleteInscription, anneesScolaires, activeAnneeScolaire, isAbonnementExpired } = useSchoolStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('toutes')
  const [classSearchQuery, setClassSearchQuery] = useState('')
  const [isClassComboboxOpen, setIsClassComboboxOpen] = useState(false)
  const [anneeFilter, setAnneeFilter] = useState(activeAnneeScolaire?.id || 'toutes')
  const [statutFilter, setStatutFilter] = useState('tous')
  const [sexeFilter, setSexeFilter] = useState('tous')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inscriptionToEdit, setInscriptionToEdit] = useState<Inscription | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [eleveIdInitial, setEleveIdInitial] = useState<string | undefined>(undefined)

  const searchParams = useSearchParams()
  const eleveIdParam = searchParams.get('eleveId')

  useEffect(() => {
    if (eleveIdParam) {
      setEleveIdInitial(eleveIdParam)
      setIsModalOpen(true)
      // Optional: Clean URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [eleveIdParam])



  const filteredInscriptions = useMemo(() => {
    return inscriptions.filter(ins => {
      const eleve = eleves.find(e => e.id === ins.eleveId)
      const eleveName = eleve ? `${eleve.prenom} ${eleve.nom} ${eleve.matricule}`.toLowerCase() : ''

      const matchesSearch = eleveName.includes(searchTerm.toLowerCase())
      const matchesClass = classFilter === 'toutes' || ins.classeId === classFilter
      const matchesAnnee = anneeFilter === 'toutes' || ins.anneeScolaire === anneeFilter
      const matchesStatut = statutFilter === 'tous' || ins.statut === statutFilter
      const matchesSexe = sexeFilter === 'tous' || (eleve && eleve.sexe === sexeFilter)

      return matchesSearch && matchesClass && matchesAnnee && matchesStatut && matchesSexe
    })
  }, [inscriptions, eleves, searchTerm, classFilter, anneeFilter, statutFilter, sexeFilter])

  const getClasseName = (id: string) => classes.find(c => c.id === id)?.nom || 'Inconnue'
  const getEleve = (id: string) => eleves.find(e => e.id === id)

  const handleOpen = (inscription?: Inscription) => {
    setInscriptionToEdit(inscription)
    setIsModalOpen(true)
  }

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
      deleteInscription(deleteId)
      toast({ title: "Succès", description: "Inscription supprimée." })
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">Gestion des Inscriptions</h2>
          <p className="text-sm text-muted-foreground">{filteredInscriptions.length} inscription(s) trouvée(s)</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary text-white hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Inscription
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un élève..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={anneeFilter} onValueChange={setAnneeFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-background">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes les années</SelectItem>
            {anneesScolaires.map(annee => (
              <SelectItem key={annee.id} value={annee.id}>{annee.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={isClassComboboxOpen} onOpenChange={setIsClassComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isClassComboboxOpen}
              className="w-full justify-between"
            >
              {classFilter === 'toutes'
                ? "Toutes les classes"
                : classes.find((c) => c.id === classFilter)?.nom || "Toutes les classes"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <div className="flex flex-col">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 shadow-none"
                  placeholder="Rechercher une classe..."
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto p-1">
                <div
                  className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${classFilter === 'toutes' ? 'bg-accent/50' : ''}`}
                  onClick={() => { setClassFilter('toutes'); setIsClassComboboxOpen(false); }}
                >
                  <Check className={`mr-2 h-4 w-4 ${classFilter === 'toutes' ? 'opacity-100' : 'opacity-0'}`} />
                  Toutes les classes
                </div>
                {classes
                  .filter(c => c.nom.toLowerCase().includes(classSearchQuery.toLowerCase()))
                  .map((c) => (
                    <div
                      key={c.id}
                      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${classFilter === c.id ? 'bg-accent/50' : ''}`}
                      onClick={() => { setClassFilter(c.id); setIsClassComboboxOpen(false); }}
                    >
                      <Check className={`mr-2 h-4 w-4 ${classFilter === c.id ? 'opacity-100' : 'opacity-0'}`} />
                      {c.nom}
                    </div>
                  ))}
                {classes.filter(c => c.nom.toLowerCase().includes(classSearchQuery.toLowerCase())).length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">Aucune classe trouvée.</p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="validee">Validée</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sexeFilter} onValueChange={setSexeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrer par sexe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les sexes</SelectItem>
            <SelectItem value="M">Masculin</SelectItem>
            <SelectItem value="F">Féminin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Élève</th>
                <th className="px-6 py-4">Classe & Année</th>
                <th className="px-6 py-4">Frais Inscr.</th>
                <th className="px-6 py-4">Documents</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredInscriptions.map(ins => {
                const eleve = getEleve(ins.eleveId)
                return (
                  <tr key={ins.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-text">{eleve?.prenom} {eleve?.nom}</p>
                      <p className="text-xs text-muted-foreground">{eleve?.matricule}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-text">{getClasseName(ins.classeId)}</p>
                      <p className="text-xs text-muted-foreground">{ins.anneeScolaire}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-text">
                      {new Intl.NumberFormat('fr-FR').format(ins.fraisInscription)} FCFA
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
                        {ins.documentsRecus.length} / 6
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        ins.statut === 'validee' ? 'bg-success/10 text-success border-success/20' :
                          ins.statut === 'annulee' ? 'bg-danger/10 text-danger border-danger/20' :
                            'bg-warning/10 text-warning border-warning/20'
                      }>
                        {ins.statut === 'validee' ? 'Validée' : ins.statut === 'annulee' ? 'Annulée' : 'En attente'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eleve && router.push(`/eleves/${eleve.id}`)}
                          className="text-primary hover:text-white hover:bg-primary transition-colors"
                          title="Voir le dossier"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpen(ins)}
                          className="text-muted-foreground hover:text-text hover:bg-muted transition-colors"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ins.id)}
                          className="text-destructive hover:text-white hover:bg-destructive transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredInscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    Aucune inscription trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InscriptionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEleveIdInitial(undefined)
          setInscriptionToEdit(undefined)
        }}
        inscriptionToEdit={inscriptionToEdit}
        eleveIdInitial={eleveIdInitial}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        description="Voulez-vous vraiment supprimer cette inscription ? L'élève ne sera pas supprimé, mais cette inscription pour l'année scolaire sera perdue."
      />
    </div>
  )
}

export default function InscriptionsPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <InscriptionsPageContent />
    </Suspense>
  )
}
