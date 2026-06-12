'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Search, Plus, UserCheck, AlertTriangle, Eye, Edit, Trash2, Check, ChevronsUpDown, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitiales, formatTelephone } from '@/lib/utils'
import EleveModal from '@/components/eleves/EleveModal'
import { Eleve } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { useTranslation } from '@/hooks/useTranslation'

export default function ElevesPage() {
  const router = useRouter()
  const { eleves, classes, inscriptions, activeAnneeScolaire, deleteEleve, ecole } = useSchoolStore()
  const { t, dir } = useTranslation()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('toutes')
  const [classSearchQuery, setClassSearchQuery] = useState('')
  const [isClassComboboxOpen, setIsClassComboboxOpen] = useState(false)
  const [sexeFilter, setSexeFilter] = useState('tous')
  const [statutFilter, setStatutFilter] = useState('tous')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eleveToEdit, setEleveToEdit] = useState<Eleve | undefined>(undefined)
  const [eleveToDelete, setEleveToDelete] = useState<string | null>(null)

  // Filtrage
  const filteredEleves = eleves.filter(eleve => {
    const matchesSearch = `${eleve.prenom} ${eleve.nom} ${eleve.matricule}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = classFilter === 'toutes' || eleve.classeId === classFilter
    const matchesSexe = sexeFilter === 'tous' || eleve.sexe === sexeFilter
    const matchesStatut = statutFilter === 'tous' || eleve.statut === statutFilter
    return matchesSearch && matchesClass && matchesSexe && matchesStatut
  })

  const getClasseName = (id: string) => classes.find(c => c.id === id)?.nom || 'Inconnue'

  const handleEdit = (eleve: Eleve) => {
    setEleveToEdit(eleve)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setEleveToDelete(id)
  }

  const confirmDelete = async () => {
    if (eleveToDelete) {
      setIsLoading(true)
      try {
        const res = await deleteEleve(eleveToDelete)
        if (res && !res.success) {
          toast({
            title: "Erreur",
            description: res.error || "La suppression de l'élève a échoué.",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Élève supprimé",
            description: "L'élève a été retiré de la base avec succès.",
          })
          setEleveToDelete(null)
        }
      } catch (e: any) {
        toast({
          title: "Erreur",
          description: e.message || "Une erreur est survenue.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleAdd = () => {
    setEleveToEdit(undefined)
    setIsModalOpen(true)
  }

  const isLimitReached = ecole?.abonnement && eleves.length >= ecole.abonnement.maxEleves
  const isFreePlan = ecole?.abonnement?.plan === 'gratuit'

  return (
    <div className="space-y-6" dir={dir}>
      {isLimitReached && (
        <div className="bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/30 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 mt-0.5">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-text text-base">
                {isFreePlan ? "Limite d'élèves atteinte (Forfait Gratuit)" : t('eleves.limit_reached', "Limite d'élèves atteinte")}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {isFreePlan 
                  ? "Vous avez atteint la limite de 50 élèves pour la formule gratuite. Veuillez passer à la Formule Standard ou Premium pour ajouter d'autres élèves."
                  : t('eleves.limit_desc', "Votre école a atteint le quota maximum de {maxEleves} élèves autorisés dans la formule actuelle. Passez à la vitesse supérieure en mettant à niveau votre abonnement via **CinetPay** pour inscrire de nouveaux élèves sans restriction !").replace('{maxEleves}', String(ecole.abonnement?.maxEleves || 0))
                }
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/abonnement')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold self-stretch md:self-auto shrink-0 shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4 fill-current" />
            {t('eleves.upgrade', 'Mettre à niveau')}
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">{t('eleves.title', 'Gestion des Élèves')}</h2>
          <p className="text-sm text-muted-foreground">{filteredEleves.length} {t('eleves.found', 'élève(s) trouvé(s)')} {t('eleves.out_of', 'sur un total de')} {eleves.length}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button 
            onClick={handleAdd} 
            disabled={isLimitReached}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            <Plus className="me-2 h-4 w-4" />
            {t('eleves.new', 'Nouvel Élève')}
          </Button>
          {isLimitReached && (
            <span className="text-[10px] text-amber-600 font-bold max-w-[200px] text-end leading-tight">
              {isFreePlan 
                ? "Limite de 50 élèves atteinte"
                : t('eleves.upgrade_required', 'Abonnement à mettre à niveau')
              }
            </span>
          )}
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('eleves.search_placeholder', 'Rechercher (nom, matricule)...')} 
            className="ps-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Popover open={isClassComboboxOpen} onOpenChange={setIsClassComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isClassComboboxOpen}
              className="w-full justify-between font-normal"
            >
              {classFilter === 'toutes'
                ? t('inscriptions.all_classes', 'Toutes les classes')
                : classes.find((c) => c.id === classFilter)?.nom || t('inscriptions.all_classes', 'Toutes les classes')}
              <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <div className="flex flex-col">
              <div className="flex items-center border-b px-3">
                <Search className="me-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 shadow-none"
                  placeholder={t('inscriptions.search_class_placeholder', 'Rechercher une classe...')}
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto p-1">
                <div
                  className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${classFilter === 'toutes' ? 'bg-accent/50' : ''}`}
                  onClick={() => { setClassFilter('toutes'); setIsClassComboboxOpen(false); }}
                >
                  <Check className={`me-2 h-4 w-4 ${classFilter === 'toutes' ? 'opacity-100' : 'opacity-0'}`} />
                  {t('inscriptions.all_classes', 'Toutes les classes')}
                </div>
                {classes
                  .filter(c => c.nom.toLowerCase().includes(classSearchQuery.toLowerCase()))
                  .map((c) => (
                    <div
                      key={c.id}
                      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${classFilter === c.id ? 'bg-accent/50' : ''}`}
                      onClick={() => { setClassFilter(c.id); setIsClassComboboxOpen(false); }}
                    >
                      <Check className={`me-2 h-4 w-4 ${classFilter === c.id ? 'opacity-100' : 'opacity-0'}`} />
                      {c.nom}
                    </div>
                  ))}
                {classes.filter(c => c.nom.toLowerCase().includes(classSearchQuery.toLowerCase())).length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">{t('inscriptions.no_class_found', 'Aucune classe trouvée.')}</p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Select value={sexeFilter} onValueChange={setSexeFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t('inscriptions.filter_gender', 'Filtrer par sexe')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{t('inscriptions.all_genders', 'Tous les sexes')}</SelectItem>
            <SelectItem value="M">{t('inscriptions.gender.M', 'Masculin')}</SelectItem>
            <SelectItem value="F">{t('inscriptions.gender.F', 'Féminin')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t('eleves.filter_status', 'Filtrer par statut')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{t('eleves.status.all', 'Tous les statuts')}</SelectItem>
            <SelectItem value="actif">{t('eleves.status.actif', 'Actif')}</SelectItem>
            <SelectItem value="suspendu">{t('eleves.status.suspendu', 'Suspendu')}</SelectItem>
            <SelectItem value="exclu">{t('eleves.status.exclu', 'Exclu')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start" dir={dir}>
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4 text-start">{t('eleves.table.eleve', 'Élève')}</th>
                <th className="px-6 py-4 text-start">{t('eleves.table.class', 'Classe')}</th>
                <th className="px-6 py-4 text-start">{t('eleves.table.parent', 'Contact Parent')}</th>
                <th className="px-6 py-4 text-start">{t('eleves.table.status', 'Statut')}</th>
                <th className="px-6 py-4 text-end">{t('inscriptions.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredEleves.map(eleve => {
                const estDejaInscrit = inscriptions.some(
                  ins => ins.eleveId === eleve.id && 
                        (ins.anneeScolaire === activeAnneeScolaire?.id || ins.anneeScolaire === activeAnneeScolaire?.nom)
                )
                
                return (
                <tr key={eleve.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-primary/20">
                        {eleve.photoUrl ? (
                          <AvatarImage src={eleve.photoUrl} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {getInitiales(eleve.nom, eleve.prenom)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-text">{eleve.prenom} {eleve.nom}</p>
                        <p className="text-xs text-muted-foreground">{eleve.matricule}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-start">
                    {getClasseName(eleve.classeId)}
                  </td>
                  <td className="px-6 py-4 text-start">
                    <p className="text-text"><span className="inline-block" dir="ltr">{formatTelephone(eleve.parentTelephone)}</span></p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{eleve.parentNom}</p>
                  </td>
                  <td className="px-6 py-4 text-start">
                    <Badge variant="outline" className={
                      eleve.statut === 'actif' ? 'bg-success/10 text-success border-success/20' : 
                      eleve.statut === 'suspendu' ? 'bg-warning/10 text-warning border-warning/20' : 
                      'bg-danger/10 text-danger border-danger/20'
                    }>
                      {eleve.statut === 'actif' ? t('eleves.status.actif', 'Actif') : eleve.statut === 'suspendu' ? t('eleves.status.suspendu', 'Suspendu') : t('eleves.status.exclu', 'Exclu')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      {!estDejaInscrit && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (eleve.statut !== 'actif') {
                              toast({
                                title: "Action refusée",
                                description: "Impossible d'inscrire cet élève car son statut n'est pas 'Actif'.",
                                variant: "destructive"
                              });
                              return;
                            }
                            router.push(`/inscriptions?eleveId=${eleve.id}`)
                          }}
                          className="text-success hover:text-white hover:bg-success transition-colors"
                          title={t('eleves.action.enroll', "Inscrire l'élève")}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.push(`/eleves/${eleve.id}`)}
                        className="text-primary hover:text-white hover:bg-primary transition-colors"
                        title={t('eleves.action.view', 'Voir le dossier')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(eleve)}
                        className="text-muted-foreground hover:text-text hover:bg-muted transition-colors"
                        title={t('eleves.action.edit', 'Modifier')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(eleve.id)}
                        className="text-destructive hover:text-white hover:bg-destructive transition-colors"
                        title={t('eleves.action.delete', 'Supprimer')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )})}
              {filteredEleves.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    {t('eleves.no_student_found', 'Aucun élève trouvé correspondant à vos critères.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EleveModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        eleveToEdit={eleveToEdit}
      />

      <ConfirmDeleteModal
        isOpen={!!eleveToDelete}
        onClose={() => setEleveToDelete(null)}
        onConfirm={confirmDelete}
        title={t('eleves.delete.title', 'Confirmer la suppression')}
        description={t('eleves.delete.desc', "Voulez-vous vraiment supprimer cet élève ? Cette action est irréversible et supprimera toutes ses données (notes, paiements, absences).")}
      />
    </div>
  )
}

