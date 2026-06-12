'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Inscription, DocumentInscription } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Search, Check, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface InscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  inscriptionToEdit?: Inscription
  eleveIdInitial?: string
}

const DOCUMENTS_REQUIS: { id: DocumentInscription }[] = [
  { id: 'extrait_naissance' },
  { id: 'carnet_sante' },
  { id: 'bulletin_precedent' },
  { id: 'photos_identite' },
  { id: 'certificat_scolarite' },
  { id: 'fiche_renseignements' },
]

export default function InscriptionModal({ isOpen, onClose, inscriptionToEdit, eleveIdInitial }: InscriptionModalProps) {
  const { eleves, classes, inscriptions, bulletins, addInscription, updateInscription, anneesScolaires, activeAnneeScolaire } = useSchoolStore()
  const { toast } = useToast()
  const { t, dir, isAr } = useTranslation()

  const [eleveId, setEleveId] = useState(eleveIdInitial || '')
  const [classeId, setClasseId] = useState('')
  const [anneeScolaire, setAnneeScolaire] = useState(activeAnneeScolaire?.nom || '2024-2025')
  const [fraisInscription, setFraisInscription] = useState<number>(0)
  const [statut, setStatut] = useState<'validee' | 'en_attente' | 'annulee'>('en_attente')
  const [documentsRecus, setDocumentsRecus] = useState<DocumentInscription[]>([])
  const [commentaire, setCommentaire] = useState('')

  const [eleveSearchQuery, setEleveSearchQuery] = useState('')
  const [isEleveComboboxOpen, setIsEleveComboboxOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [classeSearchQuery, setClasseSearchQuery] = useState('')
  const [isClasseComboboxOpen, setIsClasseComboboxOpen] = useState(false)

  // Traduire les types de documents
  const getDocLabel = (docId: DocumentInscription) => {
    switch (docId) {
      case 'extrait_naissance':
        return t('inscriptions.docs.birth_certificate', "Extrait de naissance")
      case 'carnet_sante':
        return t('inscriptions.docs.health_card', "Carnet de santé")
      case 'bulletin_precedent':
        return t('inscriptions.docs.previous_report', "Bulletin de l'année précédente")
      case 'photos_identite':
        return t('inscriptions.docs.photos', "Photos d'identité (x4)")
      case 'certificat_scolarite':
        return t('inscriptions.docs.school_cert', "Certificat de scolarité")
      case 'fiche_renseignements':
        return t('inscriptions.docs.info_sheet', "Fiche de renseignements")
      default:
        return docId
    }
  }

  // Filtrer les élèves non encore inscrits pour l'année scolaire sélectionnée
  const elevesNonInscrits = eleves.filter(e => {
    // Si on modifie une inscription, on inclut toujours l'élève actuel
    if (inscriptionToEdit && inscriptionToEdit.eleveId === e.id) return true
    
    // Exclure les élèves suspendus ou exclus
    if (e.statut !== 'actif') return false
    
    // Vérifier si l'élève a déjà une inscription pour cette année scolaire
    const dejaInscrit = inscriptions.some(ins => ins.eleveId === e.id && ins.anneeScolaire === anneeScolaire)
    return !dejaInscrit
  })

  useEffect(() => {
    if (inscriptionToEdit) {
      setEleveId(inscriptionToEdit.eleveId)
      setClasseId(inscriptionToEdit.classeId)
      setAnneeScolaire(inscriptionToEdit.anneeScolaire)
      setFraisInscription(inscriptionToEdit.fraisInscription)
      setStatut(inscriptionToEdit.statut)
      setDocumentsRecus(inscriptionToEdit.documentsRecus)
      setCommentaire(inscriptionToEdit.commentaire || '')
    } else {
      setEleveId(eleveIdInitial || '')
      setClasseId('')
      setAnneeScolaire(activeAnneeScolaire?.id || 'as-2024-2025')
      setFraisInscription(25000) // Valeur par défaut indicative
      setStatut('en_attente')
      setDocumentsRecus([])
      setCommentaire('')
    }
  }, [inscriptionToEdit, isOpen, eleveIdInitial, activeAnneeScolaire])

  // Quand on choisit un élève, on calcule automatiquement la "Classe affectée"
  useEffect(() => {
    if (!inscriptionToEdit && eleveId) {
      const eleve = eleves.find(e => e.id === eleveId)
      if (!eleve) return

      // Trouver les inscriptions précédentes de cet élève
      const studentInscriptions = inscriptions.filter(ins => ins.eleveId === eleveId)
      
      // Trier par année scolaire pour avoir la plus récente (qui n'est pas l'année en cours)
      const previousInscriptions = studentInscriptions
        .filter(ins => ins.anneeScolaire !== anneeScolaire)
        .sort((a, b) => b.anneeScolaire.localeCompare(a.anneeScolaire))

      if (previousInscriptions.length > 0) {
        const lastInscription = previousInscriptions[0]
        const previousClasseId = lastInscription.classeId
        
        // Vérifier s'il a été admis l'année précédente (moyenne annuelle >= 10)
        const studentBulletins = bulletins.filter(b => b.eleveId === eleveId && b.anneeScolaire === lastInscription.anneeScolaire)
        
        let isAdmis = false
        if (studentBulletins.length > 0) {
          const sum = studentBulletins.reduce((acc, b) => acc + b.moyenneGenerale, 0)
          const moyenneAnnuelle = sum / studentBulletins.length
          isAdmis = moyenneAnnuelle >= 10
        }

        if (isAdmis) {
          // Trouver la classe supérieure
          const previousClasse = classes.find(c => c.id === previousClasseId)
          if (previousClasse) {
            const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
            const getNextClassePrefix = (currentName: string): string => {
              const name = normalizeString(currentName)
              if (name.includes('petite section')) return 'moyenne section'
              if (name.includes('moyenne section')) return 'grande section'
              if (name.includes('grande section')) return 'cp1'
              if (name.includes('cp1')) return 'cp2'
              if (name.includes('cp2')) return 'ce1'
              if (name.includes('ce1')) return 'ce2'
              if (name.includes('ce2')) return 'cm1'
              if (name.includes('cm1')) return 'cm2'
              if (name.includes('cm2')) return '6eme'
              if (name.includes('6eme')) return '5eme'
              if (name.includes('5eme')) return '4eme'
              if (name.includes('4eme')) return '3eme'
              if (name.includes('3eme')) return '2nde'
              if (name.includes('2nde')) return '1ere'
              if (name.includes('1ere')) return 'terminale'
              return currentName
            }

            const nextPrefix = getNextClassePrefix(previousClasse.nom)
            const nextClasse = classes.find(c => normalizeString(c.nom).includes(nextPrefix))
            
            if (nextClasse && nextPrefix !== normalizeString(previousClasse.nom)) {
              setClasseId(nextClasse.id)
              if (nextClasse.montantInscription) setFraisInscription(nextClasse.montantInscription)
              toast({ title: t('toast.promotion_title', "Passage en classe supérieure"), description: t('toast.promotion_desc', "Élève admis. Classe pré-remplie : {name}").replace('{name}', nextClasse.nom) })
            } else {
              setClasseId(previousClasseId) // Classe sup non trouvée
              const c = classes.find(c => c.id === previousClasseId)
              if (c && c.montantInscription) setFraisInscription(c.montantInscription)
            }
          } else {
            setClasseId(previousClasseId)
            const c = classes.find(c => c.id === previousClasseId)
            if (c && c.montantInscription) setFraisInscription(c.montantInscription)
          }
        } else {
          // Non admis -> redoublement
          setClasseId(previousClasseId)
          const c = classes.find(c => c.id === previousClasseId)
          if (c && c.montantInscription) setFraisInscription(c.montantInscription)
          toast({ title: t('toast.repeater_title', "⚠️ Redoublement"), description: t('toast.repeater_desc', "L'élève n'a pas obtenu la moyenne l'année précédente.") })
        }
      } else {
        // Nouvel élève
        if (eleve.classeId) {
          setClasseId(eleve.classeId)
          const classe = classes.find(c => c.id === eleve.classeId)
          if (classe && classe.montantInscription) {
            setFraisInscription(classe.montantInscription)
          }
        }
      }
    }
  }, [eleveId, inscriptionToEdit, anneeScolaire, eleves])

  const toggleDocument = (docId: DocumentInscription) => {
    setDocumentsRecus(prev => 
      prev.includes(docId) ? prev.filter(d => d !== docId) : [...prev, docId]
    )
  }

  const handleSave = async () => {
    if (!eleveId || !classeId || !anneeScolaire) {
      toast({ title: t('toast.error', "Erreur"), description: t('toast.required_fields_desc', "Veuillez remplir tous les champs obligatoires."), variant: "destructive" })
      return
    }

    // Sécurité: Empêcher la modification des frais d'inscription si un versement a déjà été effectué
    if (inscriptionToEdit && fraisInscription !== inscriptionToEdit.fraisInscription) {
      const paiementsState = useSchoolStore.getState().paiements
      const paiementInsc = paiementsState.find(p => p.inscriptionId === inscriptionToEdit.id && p.type === 'inscription')
      
      if (paiementInsc && (paiementInsc.montantPaye || 0) > 0) {
        toast({ 
          title: t('toast.modification_denied', "Modification refusée"), 
          description: t('toast.modification_denied_fees', "Des paiements ont déjà été encaissés pour ces frais d'inscription. Veuillez d'abord annuler ces encaissements dans l'historique des paiements avant de modifier le montant."), 
          variant: "destructive" 
        })
        return
      }
    }

    // Sécurité: Empêcher la modification de la classe si un versement a déjà été effectué pour la scolarité
    if (inscriptionToEdit && classeId !== inscriptionToEdit.classeId) {
      const paiementsState = useSchoolStore.getState().paiements
      const paiementScolarite = paiementsState.find(p => p.inscriptionId === inscriptionToEdit.id && p.type === 'scolarite')
      
      if (paiementScolarite && (paiementScolarite.montantPaye || 0) > 0) {
        toast({ 
          title: t('toast.modification_denied', "Modification refusée"), 
          description: t('toast.modification_denied_class', "Des paiements ont déjà été encaissés pour la scolarité de cette classe. Veuillez d'abord annuler ces encaissements avant de changer la classe de l'élève."), 
          variant: "destructive" 
        })
        return
      }
    }

    setIsSubmitting(true)

    const data: Inscription = {
      id: inscriptionToEdit ? inscriptionToEdit.id : `ins-${Date.now()}`,
      eleveId,
      classeId,
      ecoleId: '',
      anneeScolaire,
      dateInscription: inscriptionToEdit ? inscriptionToEdit.dateInscription : new Date().toISOString().split('T')[0],
      statut,
      fraisInscription,
      documentsRecus,
      commentaire
    }

    if (inscriptionToEdit) {
      const result = await updateInscription(data.id, data)
      if (result && !result.success) {
        toast({ title: t('toast.error', "Erreur"), description: `${t('toast.update_failed', "Erreur lors de la mise à jour:")} ${result.error}`, variant: "destructive" })
        setIsSubmitting(false)
        return
      }
      toast({ title: t('toast.success', "Succès"), description: t('toast.inscription_updated', "L'inscription a été mise à jour.") })
    } else {
      const result = await addInscription(data)
      if (result && !result.success) {
        toast({ title: t('toast.error', "Erreur"), description: `${t('toast.add_failed', "Erreur lors de la création:")} ${result.error}`, variant: "destructive" })
        setIsSubmitting(false)
        return
      }
      toast({ title: t('toast.success', "Succès"), description: t('toast.inscription_created', "Nouvelle inscription créée avec succès.") })
    }
    
    setIsSubmitting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto text-start" dir={dir}>
        <DialogHeader>
          <DialogTitle className="text-start">{inscriptionToEdit ? t('inscriptions.modal.edit_title', "Modifier l'inscription") : t('inscriptions.modal.add_title', "Nouvelle Inscription")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-start block">{t('inscriptions.modal.student', "Élève *")}</Label>
            <Popover open={isEleveComboboxOpen} onOpenChange={setIsEleveComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isEleveComboboxOpen}
                  disabled={!!inscriptionToEdit}
                  className="w-full justify-between text-start font-normal"
                >
                  {eleveId
                    ? (() => {
                        const e = eleves.find(el => el.id === eleveId)
                        return e ? `${e.matricule} - ${e.nom} ${e.prenom}` : t('inscriptions.modal.select_student', "Sélectionner un élève")
                      })()
                    : t('inscriptions.modal.select_student', "Sélectionner un élève")}
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align={isAr ? 'end' : 'start'}>
                <div className="flex flex-col text-start">
                  <div className="flex items-center border-b px-3 text-start">
                    <Search className="me-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                      className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 shadow-none text-start"
                      placeholder={t('inscriptions.modal.search_student', "Rechercher un élève (nom ou matricule)...")}
                      value={eleveSearchQuery}
                      onChange={(e) => setEleveSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1 text-start">
                    {elevesNonInscrits
                      .filter(e => 
                        e.nom.toLowerCase().includes(eleveSearchQuery.toLowerCase()) || 
                        e.prenom.toLowerCase().includes(eleveSearchQuery.toLowerCase()) ||
                        e.matricule.toLowerCase().includes(eleveSearchQuery.toLowerCase())
                      )
                      .map((e) => (
                        <div
                          key={e.id}
                          className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-start ${eleveId === e.id ? 'bg-accent/50' : ''}`}
                          onClick={() => { setEleveId(e.id); setIsEleveComboboxOpen(false); }}
                        >
                          <Check className={`me-2 h-4 w-4 ${eleveId === e.id ? 'opacity-100' : 'opacity-0'}`} />
                          {e.matricule} - {e.nom} {e.prenom}
                        </div>
                      ))}
                    {elevesNonInscrits.filter(e => e.nom.toLowerCase().includes(eleveSearchQuery.toLowerCase()) || e.prenom.toLowerCase().includes(eleveSearchQuery.toLowerCase()) || e.matricule.toLowerCase().includes(eleveSearchQuery.toLowerCase())).length === 0 && (
                      <p className="p-4 text-center text-sm text-muted-foreground">{t('inscriptions.modal.no_student_found', "Aucun élève trouvé ou tous sont déjà inscrits.")}</p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 text-start">
              <Label className="text-start block">{t('inscriptions.modal.class', "Classe affectée *")}</Label>
              <Popover open={isClasseComboboxOpen} onOpenChange={setIsClasseComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isClasseComboboxOpen}
                    className="w-full justify-between text-start font-normal"
                  >
                    {classeId
                      ? classes.find(c => c.id === classeId)?.nom || t('inscriptions.modal.select_class', "Sélectionner une classe")
                      : t('inscriptions.modal.select_class', "Sélectionner une classe")}
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align={isAr ? 'end' : 'start'}>
                  <div className="flex flex-col text-start">
                    <div className="flex items-center border-b px-3 text-start">
                      <Search className="me-2 h-4 w-4 shrink-0 opacity-50" />
                      <Input
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-0 focus-visible:ring-0 shadow-none text-start"
                        placeholder={t('inscriptions.modal.search_class', "Rechercher une classe...")}
                        value={classeSearchQuery}
                        onChange={(e) => setClasseSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1 text-start">
                      {classes
                        .filter(c => c.nom.toLowerCase().includes(classeSearchQuery.toLowerCase()))
                        .map((c) => (
                          <div
                            key={c.id}
                            className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-start ${classeId === c.id ? 'bg-accent/50' : ''}`}
                            onClick={() => { 
                              setClasseId(c.id) 
                              if (c.montantInscription) setFraisInscription(c.montantInscription)
                              setIsClasseComboboxOpen(false) 
                            }}
                          >
                            <Check className={`me-2 h-4 w-4 ${classeId === c.id ? 'opacity-100' : 'opacity-0'}`} />
                            {c.nom}
                          </div>
                        ))}
                      {classes.filter(c => c.nom.toLowerCase().includes(classeSearchQuery.toLowerCase())).length === 0 && (
                        <p className="p-4 text-center text-sm text-muted-foreground">{t('inscriptions.modal.no_class_found', "Aucune classe trouvée.")}</p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-start block">{t('inscriptions.modal.year', "Année Scolaire *")}</Label>
              <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
                <SelectTrigger className="text-start">
                  <SelectValue placeholder={t('inscriptions.modal.select_year', "Sélectionner une année")} />
                </SelectTrigger>
                <SelectContent align={isAr ? 'end' : 'start'}>
                  {anneesScolaires.map(a => (
                    <SelectItem key={a.id} value={a.id} className="text-start">{a.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-start block">{t('inscriptions.modal.fees', "Frais d'inscription (FCFA) *")}</Label>
              <Input 
                type="number" 
                value={fraisInscription} 
                onChange={e => setFraisInscription(Number(e.target.value))} 
                className="text-start"
              />
              <p className="text-xs text-muted-foreground text-start">{t('inscriptions.modal.fees_info', "Le paiement se fera via la page Paiements.")}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-start block">{t('inscriptions.modal.status', "Statut")}</Label>
              <Select value={statut} onValueChange={(v: any) => setStatut(v)}>
                <SelectTrigger className="text-start">
                  <SelectValue placeholder={t('inscriptions.modal.status_placeholder', "Statut")} />
                </SelectTrigger>
                <SelectContent align={isAr ? 'end' : 'start'}>
                  <SelectItem value="validee" className="text-start">{t('inscriptions.modal.status_validee', "Validée")}</SelectItem>
                  <SelectItem value="en_attente" className="text-start">{t('inscriptions.modal.status_en_attente', "En attente")}</SelectItem>
                  <SelectItem value="annulee" className="text-start">{t('inscriptions.modal.status_annulee', "Annulée")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-start">
            <Label className="text-start block">{t('inscriptions.modal.documents', "Documents fournis par les parents")}</Label>
            <div className="grid grid-cols-1 gap-2 bg-muted/20 p-3 rounded-md border border-border">
              {DOCUMENTS_REQUIS.map(doc => (
                <div key={doc.id} className="flex items-center gap-2">
                  <Checkbox 
                    id={`doc-${doc.id}`}
                    checked={documentsRecus.includes(doc.id)}
                    onCheckedChange={() => toggleDocument(doc.id)}
                  />
                  <label htmlFor={`doc-${doc.id}`} className="text-sm font-medium leading-none cursor-pointer select-none">
                    {getDocLabel(doc.id)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-start block">{t('inscriptions.modal.comment', "Commentaire / Notes")}</Label>
            <Input 
              value={commentaire} 
              onChange={e => setCommentaire(e.target.value)} 
              placeholder={t('inscriptions.modal.comment_placeholder', "Pièce manquante, remarque...")}
              className="text-start"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>{t('action.cancel', "Annuler")}</Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="bg-primary text-white hover:bg-primary-dark">
            {isSubmitting ? t('action.saving', "Enregistrement...") : t('inscriptions.modal.save', "Enregistrer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
