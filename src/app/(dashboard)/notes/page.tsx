'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import NoteInput from '@/components/notes/NoteInput'
import { Note } from '@/types'
import { PremiumGuard } from '@/components/ui/PremiumGuard'
import { useTranslation } from '@/hooks/useTranslation'

export default function NotesPage() {
  const { classes, eleves, matieres, notes, inscriptions, currentUser, addNote, updateNote, deleteNote, anneesScolaires, activeAnneeScolaire, ecole } = useSchoolStore()
  const { t, dir, isAr } = useTranslation()

  const [selectedClasseId, setSelectedClasseId] = useState<string>('')
  const [selectedTrimestre, setSelectedTrimestre] = useState<1 | 2 | 3>(1)
  const [selectedMatiereId, setSelectedMatiereId] = useState<string>('')
  const [selectedAnneeScolaire, setSelectedAnneeScolaire] = useState<string>(activeAnneeScolaire?.id || '')
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrer les classes selon le rôle pour la synchronisation
  const matieresEnseignees = currentUser?.role === 'enseignant' ? matieres.filter(m => m.enseignantIds?.includes(currentUser.id)) : []
  const classesIdsEnseignees = Array.from(new Set([
    ...classes.filter(c => c.enseignantPrincipalId === currentUser?.id).map(c => c.id),
    ...matieresEnseignees.map(m => m.classeId)
  ]))
  const filteredClasses = currentUser?.role === 'enseignant' 
    ? classes.filter(c => classesIdsEnseignees.includes(c.id))
    : classes

  // Synchroniser l'année scolaire et la classe active au montage ou lors des mises à jour du store
  useEffect(() => {
    if (activeAnneeScolaire) {
      setSelectedAnneeScolaire(activeAnneeScolaire.id)
    } else if (anneesScolaires.length > 0 && !selectedAnneeScolaire) {
      setSelectedAnneeScolaire(anneesScolaires[0].id)
    }
  }, [activeAnneeScolaire, anneesScolaires])

  useEffect(() => {
    if (filteredClasses.length > 0 && !selectedClasseId) {
      setSelectedClasseId(filteredClasses[0].id)
    }
  }, [filteredClasses, selectedClasseId])



  if (currentUser?.role === 'parent') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" dir={dir}>
        <AlertCircle className="h-12 w-12 text-danger shrink-0" />
        <h2 className="text-xl font-bold">{t('notes.access_denied', "Accès Refusé")}</h2>
        <p className="text-muted-foreground text-center">
          {t('notes.parent_access_denied_desc', "Les parents n'ont pas accès à l'interface globale de saisie des notes. Veuillez consulter le dossier de votre enfant.")}
        </p>
      </div>
    )
  }

  const currentClasseEleves = useMemo(() => {
    // Récupérer les élèves qui ont une inscription validée pour cette classe et cette année
    const inscriptionsAnnee = inscriptions.filter(i => 
      i.classeId === selectedClasseId && 
      i.anneeScolaire === selectedAnneeScolaire && 
      i.statut === 'validee'
    )
    const elevesInscritsIds = inscriptionsAnnee.map(i => i.eleveId)

    let baseEleves = eleves
      .filter(e => elevesInscritsIds.includes(e.id) && e.statut === 'actif')
      .sort((a, b) => a.nom.localeCompare(b.nom))

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      baseEleves = baseEleves.filter(e => 
        e.nom.toLowerCase().includes(term) || 
        e.prenom.toLowerCase().includes(term) ||
        e.matricule.toLowerCase().includes(term)
      )
    }
    return baseEleves
  }, [eleves, inscriptions, selectedClasseId, selectedAnneeScolaire, searchTerm])

  const classMatieres = useMemo(() => {
    return matieres.filter(m => m.classeId === selectedClasseId)
  }, [matieres, selectedClasseId])

  // Obtenir toutes les notes existantes pour la sélection actuelle
  const existingNotes = useMemo(() => {
    if (!selectedClasseId || !selectedMatiereId) return []
    return notes.filter(n => 
      n.matiereId === selectedMatiereId && 
      n.trimestre === selectedTrimestre &&
      (n.anneeScolaire === selectedAnneeScolaire || !n.anneeScolaire) &&
      currentClasseEleves.some(e => e.id === n.eleveId)
    )
  }, [notes, selectedMatiereId, selectedTrimestre, selectedAnneeScolaire, currentClasseEleves])

  const maxDevoirs = useMemo(() => {
    const devoirs = existingNotes.filter(n => n.type === 'devoir')
    const maxNum = Math.max(0, ...devoirs.map(d => d.numero || 1))
    return Math.max(1, maxNum) // Au moins 1 colonne devoir
  }, [existingNotes])

  const [numDevoirs, setNumDevoirs] = useState<number>(1)

  // Synchroniser numDevoirs quand les filtres changent
  useMemo(() => {
    if (maxDevoirs > numDevoirs) {
      setNumDevoirs(maxDevoirs)
    }
  }, [maxDevoirs, numDevoirs])

  const handleAddDevoirCol = () => {
    setNumDevoirs(prev => prev + 1)
  }

  const handleNoteChange = (eleveId: string, type: 'devoir' | 'composition', numero: number, valeur: number | '') => {
    const existing = existingNotes.find(n => n.eleveId === eleveId && n.type === type && (type === 'composition' || n.numero === numero))

    if (valeur === '') {
      if (existing) deleteNote(existing.id)
      return
    }

    if (existing) {
      updateNote(existing.id, { valeur })
    } else {
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        eleveId,
        matiereId: selectedMatiereId,
        valeur,
        type,
        numero: type === 'devoir' ? numero : undefined,
        trimestre: selectedTrimestre,
        anneeScolaire: selectedAnneeScolaire,
        date: new Date().toISOString().split('T')[0]
      }
      addNote(newNote)
    }
  }

  const getNoteValue = (eleveId: string, type: 'devoir' | 'composition', numero: number): number | '' => {
    const note = existingNotes.find(n => n.eleveId === eleveId && n.type === type && (type === 'composition' || n.numero === numero))
    return note ? note.valeur : ''
  }

  const matiereSelected = matieres.find(m => m.id === selectedMatiereId)

  // Calcul moyenne matière
  const getMoyenneMatiere = (eleveId: string) => {
    const eleveNotes = existingNotes.filter(n => n.eleveId === eleveId)
    const devoirs = eleveNotes.filter(n => n.type === 'devoir')
    const compo = eleveNotes.find(n => n.type === 'composition')

    let moyDevoir = 0
    if (devoirs.length > 0) {
      moyDevoir = devoirs.reduce((sum, n) => sum + n.valeur, 0) / devoirs.length
    }

    if (compo) {
      // Formule: (MoyenneDevoirs + Compo * 2) / 3
      return ((moyDevoir + compo.valeur * 2) / 3).toFixed(2)
    } else if (devoirs.length > 0) {
      return moyDevoir.toFixed(2)
    }
    return '-'
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text text-start">{t('notes.title', "Saisie des Notes")}</h2>
          <p className="text-sm text-muted-foreground text-start">{t('notes.subtitle', "Sélectionnez une classe et une matière pour saisir les notes.")}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-start">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('notes.class', "Classe")}</label>
          <Combobox
            options={filteredClasses.map(c => ({ value: c.id, label: `${c.nom} (${c.niveau})` }))}
            value={selectedClasseId}
            onChange={(val) => { setSelectedClasseId(val); setSelectedMatiereId(''); setNumDevoirs(1); }}
            placeholder={t('notes.select_class', "Sélectionner la classe")}
            emptyText={t('inscriptions.no_class_found', "Aucune classe trouvée.")}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('notes.subject', "Matière")}</label>
          <Select value={selectedMatiereId} onValueChange={setSelectedMatiereId} disabled={!selectedClasseId}>
            <SelectTrigger>
              <SelectValue placeholder={t('notes.select_subject', "Sélectionner la matière")} />
            </SelectTrigger>
            <SelectContent>
              {classMatieres.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.nom} (Coeff {m.coefficient})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('notes.trimestre', "Trimestre")}</label>
          <Select value={selectedTrimestre.toString()} onValueChange={(val) => setSelectedTrimestre(Number(val) as 1|2|3)}>
            <SelectTrigger>
              <SelectValue placeholder={t('notes.select_trimestre', "Sélectionner le trimestre")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('notes.t1', "1er Trimestre")}</SelectItem>
              <SelectItem value="2">{t('notes.t2', "2ème Trimestre")}</SelectItem>
              <SelectItem value="3">{t('notes.t3', "3ème Trimestre")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('dashboard.school_year', "Année Scolaire")}</label>
          <Select value={selectedAnneeScolaire} onValueChange={setSelectedAnneeScolaire}>
            <SelectTrigger>
              <SelectValue placeholder={t('dashboard.school_year', "Année scolaire")} />
            </SelectTrigger>
            <SelectContent>
              {anneesScolaires.map(annee => (
                <SelectItem key={annee.id} value={annee.id}>{annee.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Zone de saisie */}
      {!selectedClasseId || !selectedMatiereId ? (
        <div className="bg-muted/30 border border-dashed border-muted p-12 rounded-lg text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3 shrink-0" />
          <h3 className="text-lg font-medium text-text">{t('notes.ready_to_enter', "Prêt pour la saisie")}</h3>
          <p className="text-muted-foreground mt-1">{t('notes.enter_filters', "Veuillez sélectionner une classe et une matière pour afficher la grille de notes.")}</p>
        </div>
      ) : currentClasseEleves.length === 0 ? (
        <div className="bg-muted/30 border border-dashed border-muted p-12 rounded-lg text-center">
          <p className="text-muted-foreground">{t('notes.no_student', "Aucun élève trouvé dans cette classe.")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-3 rounded-lg shadow-sm border border-border/50 gap-4 sm:gap-0">
            <h3 className="text-lg font-medium text-text flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm">
                {matiereSelected?.nom}
              </span>
              <span>{filteredClasses.find(c => c.id === selectedClasseId)?.nom}</span>
            </h3>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={t('eleves.search_placeholder', "Rechercher un élève...")} 
                  className="ps-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={handleAddDevoirCol} variant="outline" size="sm" className="w-full sm:w-auto text-primary border-primary/20 hover:bg-primary hover:text-white transition-colors gap-2">
                <Plus className="h-4 w-4 shrink-0" />
                {t('notes.add_devoir_col', "Ajouter une colonne Devoir")}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start min-w-[800px]">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3 sticky ltr:left-0 rtl:right-0 bg-muted/90 z-20 w-[200px] border-e border-border/50 ltr:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rtl:shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-start">
                      {t('notes.table.eleve', "Élève")}
                    </th>
                    {Array.from({ length: numDevoirs }).map((_, i) => (
                      <th key={`th-dev-${i}`} className="px-4 py-3 text-center min-w-[100px]">
                        {t('notes.devoir', "Devoir")} {i + 1}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center min-w-[120px] border-l-2 border-border/80 bg-primary/5 text-primary">
                      {t('notes.composition', "Composition")}
                    </th>
                    <th className="px-4 py-3 text-center min-w-[80px] font-bold text-text bg-muted/20 border-l border-border/50">
                      {t('notes.table.moyenne', "Moy.")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {currentClasseEleves.map((eleve) => (
                    <tr key={eleve.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-4 py-3 sticky ltr:left-0 rtl:right-0 bg-card group-hover:bg-muted/10 z-10 border-e border-border/50 ltr:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rtl:shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors min-w-[150px] max-w-[200px] text-start">
                        <div className="font-medium text-text truncate w-full">{eleve.prenom} {eleve.nom}</div>
                        <div className="text-xs text-muted-foreground truncate w-full">{eleve.matricule}</div>
                      </td>
                      
                      {Array.from({ length: numDevoirs }).map((_, i) => (
                        <td key={`td-dev-${eleve.id}-${i}`} className="px-4 py-2 text-center">
                          <NoteInput 
                            value={getNoteValue(eleve.id, 'devoir', i + 1)} 
                            onChange={(val) => handleNoteChange(eleve.id, 'devoir', i + 1, val)}
                          />
                        </td>
                      ))}

                      <td className="px-4 py-2 text-center border-l-2 border-border/80 bg-primary/[0.02]">
                        <NoteInput 
                          value={getNoteValue(eleve.id, 'composition', 1)} 
                          onChange={(val) => handleNoteChange(eleve.id, 'composition', 1, val)}
                        />
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-text bg-muted/10 border-l border-border/50">
                        {getMoyenneMatiere(eleve.id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end text-xs text-muted-foreground text-start">
            {t('notes.auto_save_desc', "* Sauvegarde automatique : vos notes sont enregistrées dès que vous quittez le champ.")}
          </div>
        </div>
      )}
    </div>
  )
}
