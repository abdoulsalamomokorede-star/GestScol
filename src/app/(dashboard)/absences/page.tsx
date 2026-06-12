'use client'

import { useState, useEffect } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useToast } from '@/hooks/use-toast'
import { formatDate, getInitiales } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import FeuilleAppel from '@/components/absences/FeuilleAppel'
import { 
  Calendar, 
  Users, 
  Search, 
  FileText, 
  Check, 
  X, 
  AlertCircle, 
  Sun, 
  Moon, 
  ShieldAlert,
  Clock,
  UserCheck,
  Plus,
  Send,
  HeartPulse,
  Info,
  SlidersHorizontal,
  BookmarkCheck,
  Lock
} from 'lucide-react'

import { PremiumGuard } from '@/components/ui/PremiumGuard'
import { useTranslation } from '@/hooks/useTranslation'
import ParentPremiumPaywallModal from '@/components/parent/ParentPremiumPaywallModal'

export default function AbsencesPage() {
  const { 
    currentUser, 
    absences, 
    eleves, 
    classes, 
    inscriptions,
    justifierAbsence,
    addAbsence,
    addNotification,
    anneesScolaires,
    activeAnneeScolaire,
    ecole,
    fetchSupabaseData,
    ecoleId
  } = useSchoolStore()
  
  const { toast } = useToast()
  const { t, dir, isAr } = useTranslation()

  // --- DÉCLARATION DES HOOKS ---
  const [selectedClasseId, setSelectedClasseId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'appel' | 'historique'>('appel')
  
  // Filtres Historique
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'tous' | 'justifiees' | 'non_justifiees'>('tous')
  const [filterClasse, setFilterClasse] = useState<string>('toutes')
  const [selectedAnneeId, setSelectedAnneeId] = useState<string>(activeAnneeScolaire?.id || 'all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Boîte de dialogue Justification (Directeur uniquement)
  const [justifyDialogOpen, setJustifyDialogOpen] = useState(false)
  const [selectedAbsenceId, setSelectedAbsenceId] = useState<string | null>(null)
  const [justificationMotif, setJustificationMotif] = useState('')

  // Logique enfants / parent réorganisée
  const enfants = currentUser
    ? eleves.filter(e => 
        e.parentUserId === currentUser.id &&
        e.ecoleId === ecoleId &&
        inscriptions.some(ins => ins.eleveId === e.id && ins.anneeScolaire === activeAnneeScolaire?.id && ins.statut === 'validee')
      )
    : []
  const [selectedEnfantId, setSelectedEnfantId] = useState<string>('')
  
  // Formulaire Signalement Parent
  const [signalDate, setSignalDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [signalSeance, setSignalSeance] = useState<'matin' | 'apres-midi'>('matin')
  const [signalMotif, setSignalMotif] = useState('')
  const [signalLoading, setSignalLoading] = useState(false)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)

  // Initialisation de selectedEnfantId
  useEffect(() => {
    if (enfants.length > 0) {
      if (!selectedEnfantId || !enfants.some(e => e.id === selectedEnfantId)) {
        setSelectedEnfantId(enfants[0].id)
      }
    } else {
      setSelectedEnfantId('')
    }
  }, [enfants, selectedEnfantId])

  // --- LOGIQUE DIRECTEUR & ENSEIGNANT ---
  const classesEnseignant = currentUser ? classes.filter(c => c.enseignantPrincipalId === currentUser.id) : []
  const classesDisponibles = currentUser 
    ? (currentUser.role === 'directeur' ? classes : classesEnseignant)
    : []

  // Initialisation classe par défaut
  useEffect(() => {
    if (classesDisponibles.length > 0 && !selectedClasseId) {
      setSelectedClasseId(classesDisponibles[0].id)
    }
  }, [classesDisponibles, selectedClasseId])

  // Recharger les absences de Supabase
  useEffect(() => {
    if (activeTab === 'historique') {
      fetchSupabaseData()
    }
  }, [activeTab, fetchSupabaseData])

  if (!currentUser) return null



  if (currentUser.role === 'parent' && enfants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" dir={dir}>
        <AlertCircle className="h-12 w-12 text-muted-foreground shrink-0" />
        <h2 className="text-xl font-bold">{t('absences.parent.no_child', "Aucun enfant trouvé")}</h2>
        <p className="text-muted-foreground text-center">
          {t('absences.parent.no_child_desc', "Nous n'avons trouvé aucun élève associé à votre compte parent.")}
        </p>
      </div>
    )
  }

  // Rôles
  const isDirecteur = currentUser.role === 'directeur'
  const isEnseignant = currentUser.role === 'enseignant'
  const isParent = currentUser.role === 'parent'

  // Formater les absences
  const absencesDetaillees = absences.map(a => {
    const eleve = eleves.find(e => e.id === a.eleveId)
    const inscription = inscriptions.find(ins => 
      ins.eleveId === a.eleveId && 
      (ins.anneeScolaire === activeAnneeScolaire?.id || ins.anneeScolaire === activeAnneeScolaire?.nom)
    )
    const currentClasseId = inscription ? inscription.classeId : eleve?.classeId
    const classe = currentClasseId ? classes.find(c => c.id === currentClasseId) : undefined
    
    return {
      ...a,
      eleve,
      classe
    }
  })

  // Filtrer les absences
  const filteredAbsences = absencesDetaillees.filter(item => {
    if (!item.eleve) return false

    const estInscrit = inscriptions.some(i => 
      i.eleveId === item.eleveId && 
      i.statut === 'validee' &&
      (selectedAnneeId === 'all' || i.anneeScolaire === selectedAnneeId)
    )
    if (!estInscrit) return false
    
    if (isEnseignant) {
      const enseigneClasse = classesEnseignant.some(c => c.id === item.classe?.id)
      if (!enseigneClasse) return false
    }

    const matchesSearch = 
      `${item.eleve.prenom} ${item.eleve.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.eleve.matricule.toLowerCase().includes(searchQuery.toLowerCase())
      
    const matchesStatus = 
      filterStatus === 'tous' ||
      (filterStatus === 'justifiees' && item.justifiee) ||
      (filterStatus === 'non_justifiees' && !item.justifiee)
      
    const matchesClasse = 
      filterClasse === 'toutes' || 
      item.eleve.classeId === filterClasse
      
    const matchesStartDate = !startDate || item.date >= startDate
    const matchesEndDate = !endDate || item.date <= endDate
    const matchesAnnee = selectedAnneeId === 'all' || item.anneeScolaire === selectedAnneeId
    
    return matchesSearch && matchesStatus && matchesClasse && matchesStartDate && matchesEndDate && matchesAnnee
  }).sort((a, b) => b.date.localeCompare(a.date))

  const totalAbsences = filteredAbsences.length
  const totalNonJustifiees = filteredAbsences.filter(a => !a.justifiee).length
  const totalJustifiees = totalAbsences - totalNonJustifiees
  const totalSessionsBase = 160
  
  const totalElevesPoches = eleves.filter(e => {
    if (e.statut !== 'actif') return false
    const inscription = inscriptions.find(ins => 
      ins.eleveId === e.id && 
      ins.statut === 'validee' &&
      (ins.anneeScolaire === activeAnneeScolaire?.id || ins.anneeScolaire === activeAnneeScolaire?.nom)
    )
    if (!inscription) return false
    
    return isEnseignant ? classesEnseignant.some(c => c.id === inscription.classeId) : true
  }).length

  const calculTauxGlobal = () => {
    if (totalElevesPoches === 0) return 100
    const totalAbsencesPossibles = totalElevesPoches * totalSessionsBase
    const totalAbsencesReelles = absences.filter(a => {
      const isEleveInscritActif = inscriptions.some(ins =>
        ins.eleveId === a.eleveId &&
        ins.statut === 'validee' &&
        (ins.anneeScolaire === activeAnneeScolaire?.id || ins.anneeScolaire === activeAnneeScolaire?.nom)
      )
      if (!isEleveInscritActif) return false

      if (isEnseignant) {
        const el = eleves.find(e => e.id === a.eleveId)
        if (!el) return false
        
        const inscription = inscriptions.find(ins => 
          ins.eleveId === a.eleveId && 
          ins.statut === 'validee' &&
          (ins.anneeScolaire === activeAnneeScolaire?.id || ins.anneeScolaire === activeAnneeScolaire?.nom)
        )
        if (!inscription) return false
        
        return classesEnseignant.some(c => c.id === inscription.classeId)
      }
      return true
    }).length
    return Math.max(0, Math.min(100, Math.round(((totalAbsencesPossibles - totalAbsencesReelles) / totalAbsencesPossibles) * 100)))
  }
  const tauxAssiduiteGlobal = calculTauxGlobal()

  // Déclencher le dialogue de justification
  const handleOpenJustifyDialog = (absenceId: string, currentMotif: string) => {
    if (!isDirecteur) {
      toast({
        title: t('toast.forbidden', "Action interdite"),
        description: t('toast.only_director_justify', "Seul le Directeur a l'autorité légale pour approuver les justificatifs d'absence."),
        variant: "destructive",
      })
      return
    }
    setSelectedAbsenceId(absenceId)
    setJustificationMotif(currentMotif)
    setJustifyDialogOpen(true)
  }

  // Confirmer la justification
  const handleSaveJustification = () => {
    if (!selectedAbsenceId) return
    
    justifierAbsence(selectedAbsenceId, justificationMotif)
    setJustifyDialogOpen(false)
    
    toast({
      title: t('toast.absence_justified', "Absence Justifiée"),
      description: t('toast.absence_justified_desc', "Le justificatif officiel a été enregistré et approuvé avec succès."),
      variant: "default",
    })
  }

  const aAccesPremiumParent = () => {
    const status = currentUser?.parentSubscriptionStatus
    if (!status || status === 'gratuit') return false
    
    // Rétrocompatibilité (ancien format)
    if (status === 'premium') return true
    if (!status.includes(':')) {
      return status.split(',').some(s => ['t1', 't2', 't3', 'premium'].includes(s))
    }
    
    // Nouveau format par année
    const anneeId = activeAnneeScolaire?.id
    if (!anneeId) return false
    
    const abonnements = status.split(';').filter(Boolean)
    const abonnementAnnee = abonnements.find(a => a.startsWith(`${anneeId}:`))
    
    if (!abonnementAnnee) return false
    
    const statutAnnee = abonnementAnnee.split(':')[1]
    if (statutAnnee === 'premium') return true
    return statutAnnee.split(',').some(s => ['t1', 't2', 't3'].includes(s))
  }

  // Soumission Signalement Parent
  const handleSignalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasPremiumAccess = aAccesPremiumParent()
    if (!hasPremiumAccess) {
      setIsPaywallOpen(true)
      return
    }

    if (!selectedEnfantId) {
      toast({
        title: t('toast.error', "Erreur"),
        description: t('toast.select_child', "Veuillez sélectionner un enfant."),
        variant: "destructive",
      })
      return
    }
    if (!signalMotif.trim()) {
      toast({
        title: t('toast.error', "Erreur"),
        description: t('toast.enter_motif', "Veuillez renseigner le motif de l'absence."),
        variant: "destructive",
      })
      return
    }

    setSignalLoading(true)
    try {
      const enfantActif = eleves.find(el => el.id === selectedEnfantId)
      if (!enfantActif) throw new Error("Élève introuvable")

      const classeEnfant = classes.find(c => c.id === enfantActif.classeId)

      const newAbsence = {
        id: `abs-parent-${Date.now()}`,
        eleveId: selectedEnfantId,
        date: signalDate,
        seance: signalSeance,
        justifiee: false,
        motif: signalMotif,
        anneeScolaire: activeAnneeScolaire?.nom || '2024-2025'
      }
      await addAbsence(newAbsence)

      const seanceLabel = signalSeance === 'matin' ? t('absences.seance.matin', 'Matin') : t('absences.seance.apres_midi', 'Après-midi')
      const dateLabel = formatDate(signalDate)

      await addNotification({
        titre: `Signalement d'absence : ${enfantActif.prenom} ${enfantActif.nom}`,
        description: `Le parent de l'élève ${enfantActif.prenom} ${enfantActif.nom} (Classe : ${classeEnfant?.nom || 'N/A'}) signale son absence pour la séance du ${seanceLabel} le ${dateLabel}. Motif : ${signalMotif}`,
        type: 'absence',
        eleveId: selectedEnfantId,
        classeId: enfantActif.classeId,
        destinataireRole: 'directeur'
      })

      toast({
        title: t('toast.report_sent', "Signalement Transmis"),
        description: t('toast.report_sent_desc', "Votre signalement a été envoyé à la direction de l'école. N'oubliez pas de fournir un justificatif officiel (certificat médical, etc.) dès le retour de l'élève."),
        className: "bg-success text-white border-none shadow-lg"
      })
      
      setSignalMotif('')
    } catch (err: any) {
      console.error(err)
      toast({
        title: t('toast.error', "Erreur"),
        description: t('toast.report_failed', "Impossible de transmettre votre signalement. Veuillez réessayer."),
        variant: "destructive"
      })
    } finally {
      setSignalLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300" dir={dir}>
      {/* HEADER DE LA PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-3 text-start">
            <span className="p-2 rounded-2xl bg-primary/10 text-primary">
              <Clock className="h-8 w-8" />
            </span>
            {t('absences.title', "Gestion des Absences & Assiduité")}
          </h1>
          <p className="text-muted-foreground text-sm mt-2 text-start">
            {isParent 
              ? t('absences.parent.subtitle', "Suivi de l'assiduité de vos enfants et transmission des motifs d'absences en temps réel.")
              : t('absences.subtitle_desc', "Appel journalier par classe, statistiques de présence, et gestion officielle des justifications.")}
          </p>
        </div>

        {/* Sélecteur de classe pour Directeur et Enseignant */}
        {(isDirecteur || isEnseignant) && classesDisponibles.length > 0 && (
          <div className="flex items-center gap-3 bg-card border border-border/50 px-4 py-2.5 rounded-2xl shadow-sm shrink-0">
            <Label htmlFor="classe-select" className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">
              {t('absences.active_class', "Classe active :")}
            </Label>
            <Combobox
              options={classesDisponibles.map((c) => ({ label: `${c.nom} (${c.niveau})`, value: c.id }))}
              value={selectedClasseId}
              onChange={setSelectedClasseId}
              placeholder={t('absences.select_class', "Sélectionner une classe")}
              className="w-[180px] h-10 text-start"
            />
          </div>
        )}
      </div>

      {/* VUE : DIRECTEUR / ENSEIGNANT */}
      {(isDirecteur || isEnseignant) && (
        <div className="space-y-6">
          {/* Menu Onglets */}
          <div className="flex border-b border-border/50">
            <button
              onClick={() => setActiveTab('appel')}
              className={`pb-4 px-6 font-display font-bold text-sm transition-all duration-200 relative ${
                activeTab === 'appel'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-text'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('absences.take_attendance', "Faire l'Appel")}
              </span>
              {activeTab === 'appel' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`pb-4 px-6 font-display font-bold text-sm transition-all duration-200 relative ${
                activeTab === 'historique'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-text'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('absences.history_tracking', "Historique & Suivi")}
                {totalAbsences > 0 && (
                  <Badge variant="secondary" className="ms-1 bg-rose-50 text-rose-600 hover:bg-rose-100 font-extrabold text-[10px]">
                    {totalAbsences}
                  </Badge>
                )}
              </span>
              {activeTab === 'historique' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
          </div>

          {/* CONTENU : SAISIE DE L'APPEL */}
          {activeTab === 'appel' && (
            <div className="animate-in fade-in-50 duration-200">
              {selectedClasseId ? (
                <FeuilleAppel classeId={selectedClasseId} />
              ) : (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center bg-card border border-border/50 rounded-2xl">
                  <ShieldAlert className="h-10 w-10 text-amber-500 mb-3 animate-pulse shrink-0" />
                  <p className="font-semibold text-text">{t('absences.no_assigned_class', "Aucune classe assignée.")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('absences.no_assigned_class_desc', "Vous n'avez pas de classe principale sous votre responsabilité.")}</p>
                </div>
              )}
            </div>
          )}

          {/* CONTENU : HISTORIQUE ET SUIVI */}
          {activeTab === 'historique' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* KPIs */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="shadow-sm border-border/50 bg-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-muted/60 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('absences.total_count', "Total Absences").split(':')[0]}</p>
                      <p className="text-xl font-extrabold text-text">{totalAbsences}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/50 bg-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('absences.table.justified', "Justifiées")}</p>
                      <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalJustifiees}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/50 bg-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('absences.table.unjustified', "Non Justifiées")}</p>
                      <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{totalNonJustifiees}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/50 bg-gradient-to-br from-primary/10 to-primary-dark/5 border-primary/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                      <BookmarkCheck className="h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('absences.class_attendance', "Assiduité Classe")}</p>
                      <p className="text-xl font-extrabold text-primary">{tauxAssiduiteGlobal}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* FILTRES INTERACTIFS */}
              <Card className="shadow-sm border-border/50 bg-card text-start">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      {t('action.search_filters', "Filtres de recherche")}
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSearchQuery('')
                        setFilterStatus('tous')
                        setFilterClasse('toutes')
                        setStartDate('')
                        setEndDate('')
                      }}
                      className="text-xs text-primary hover:text-primary-dark font-semibold h-7"
                    >
                      {t('action.reset', "Réinitialiser")}
                    </Button>
                  </div>
                  
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Année Scolaire */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t('inscriptions.year', "Année")}</Label>
                      <Select value={selectedAnneeId} onValueChange={setSelectedAnneeId}>
                        <SelectTrigger className="w-full bg-background border-border h-10 px-3 rounded-xl text-xs font-semibold">
                          <SelectValue placeholder={t('inscriptions.all_years', "Toutes les années")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('inscriptions.all_years', "Toutes les années")}</SelectItem>
                          {anneesScolaires.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Recherche par nom */}
                    <div className="space-y-1">
                      <Label htmlFor="search" className="text-[10px] font-bold text-muted-foreground uppercase">{t('action.search', "Recherche")}</Label>
                      <div className="relative">
                        <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground/60" />
                        <Input
                          id="search"
                          placeholder={t('absences.search_placeholder_eleve', "Élève ou Matricule...")}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="ps-9 pe-3 h-10 rounded-xl text-xs font-semibold border-border bg-background"
                        />
                      </div>
                    </div>

                    {/* Filtrer par Classe */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t('notes.class', "Classe")}</Label>
                      <Combobox
                        options={[{label: t('inscriptions.all_classes', "Toutes les classes"), value: "toutes"}, ...classes.map((c) => ({ label: c.nom, value: c.id }))]}
                        value={filterClasse}
                        onChange={setFilterClasse}
                        disabled={isEnseignant}
                        className="h-10 w-full text-xs text-start"
                      />
                    </div>

                    {/* Statut justification */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t('absences.modal.justify_title', "Justification")}</Label>
                      <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as any)}>
                        <SelectTrigger className="w-full bg-background border-border h-10 px-3 rounded-xl text-xs font-semibold">
                          <SelectValue placeholder={t('inscriptions.all_statuses', "Tous les statuts")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tous">{t('inscriptions.all_statuses', "Tous les statuts")}</SelectItem>
                          <SelectItem value="justifiees">{t('absences.table.justified', "Justifiées")}</SelectItem>
                          <SelectItem value="non_justifiees">{t('absences.table.unjustified', "Non justifiées")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Début */}
                    <div className="space-y-1">
                      <Label htmlFor="start-date" className="text-[10px] font-bold text-muted-foreground uppercase">{t('absences.start_date', "Date Début")}</Label>
                      <DatePicker
                        id="start-date"
                        date={startDate ? new Date(startDate) : undefined}
                        setDate={(d) => setStartDate(d ? format(d, 'yyyy-MM-dd') : '')}
                        className="h-10 pe-3 rounded-xl text-xs font-semibold w-full text-start"
                      />
                    </div>

                    {/* Date Fin */}
                    <div className="space-y-1">
                      <Label htmlFor="end-date" className="text-[10px] font-bold text-muted-foreground uppercase">{t('absences.end_date', "Date Fin")}</Label>
                      <DatePicker
                        id="end-date"
                        date={endDate ? new Date(endDate) : undefined}
                        setDate={(d) => setEndDate(d ? format(d, 'yyyy-MM-dd') : '')}
                        className="h-10 pe-3 rounded-xl text-xs font-semibold w-full text-start"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* TABLEAU HISTORIQUE */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden">
                <CardContent className="p-0">
                  {filteredAbsences.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                      <Search className="h-10 w-10 text-muted-foreground/30 mb-2 shrink-0" />
                      <p className="font-semibold text-text">{t('absences.no_records_found', "Aucun enregistrement trouvé")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('absences.no_records_found_desc', "Modifiez vos filtres ou effectuez un nouvel appel.")}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start border-collapse">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-start">
                            <th className="py-3 px-4 text-start">{t('absences.table.eleve', "Élève")}</th>
                            <th className="py-3 px-4 text-start">{t('absences.class', "Classe")}</th>
                            <th className="py-3 px-4 text-start">{t('absences.table.date_seance', "Date & Séance")}</th>
                            <th className="py-3 px-4 text-start">{t('absences.table.status', "Statut")}</th>
                            <th className="py-3 px-4 text-start">{t('absences.table.motif_saved', "Motif enregistré")}</th>
                            {isDirecteur && <th className="py-3 px-4 text-end pe-6">{t('absences.table.actions', "Actions")}</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-xs sm:text-sm">
                          {filteredAbsences.map((abs) => (
                            <tr key={abs.id} className="hover:bg-muted/5 transition-colors duration-150">
                              {/* Élève */}
                              <td className="py-3.5 px-4 text-start">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 shrink-0">
                                    {abs.eleve?.photoUrl ? (
                                      <AvatarImage src={abs.eleve.photoUrl} className="object-cover" />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                      {abs.eleve ? getInitiales(abs.eleve.nom, abs.eleve.prenom) : '??'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-bold text-text leading-snug">
                                      {abs.eleve ? `${abs.eleve.prenom} ${abs.eleve.nom}` : t('eleves.not_found', "Élève inconnu")}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
                                      {abs.eleve?.matricule}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Classe */}
                              <td className="py-3.5 px-4 font-semibold text-text text-start">
                                {abs.classe?.nom || t('eleves.no_class', 'Non assignée')}
                              </td>

                              {/* Date & Séance */}
                              <td className="py-3.5 px-4 text-start">
                                <div className="space-y-0.5">
                                  <p className="font-medium text-text">{formatDate(abs.date)}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                                    {abs.seance === 'matin' ? (
                                      <>
                                        <Sun className="h-3 w-3 text-amber-500 shrink-0" />
                                        <span>{t('absences.seance.matin_hours', "Matin (7h-12h)")}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Moon className="h-3 w-3 text-blue-500 shrink-0" />
                                        <span>{t('absences.seance.apres_midi_hours', "Après-midi (13h-17h)")}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Statut */}
                              <td className="py-3.5 px-4 text-start">
                                <Badge
                                  className={`rounded-full font-bold px-2 py-0.5 text-[9px] uppercase tracking-wider ${
                                    abs.justifiee
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                  }`}
                                  variant="outline"
                                >
                                  {abs.justifiee ? t('absences.table.justified', "Justifiée") : t('absences.table.unjustified', "Non justifiée")}
                                </Badge>
                              </td>

                              {/* Motif */}
                              <td className="py-3.5 px-4 max-w-[200px] truncate text-start">
                                {abs.motif ? (
                                  <p className="text-text font-medium flex items-center gap-1">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    {abs.motif}
                                  </p>
                                ) : (
                                  <span className="text-muted-foreground/60 italic text-[11px]">{t('absences.table.no_motif', "Aucun motif")}</span>
                                )}
                              </td>

                              {/* Action Justifier (Directeur uniquement) */}
                              {isDirecteur && (
                                <td className="py-3.5 px-4 text-end pe-6">
                                  <div className="flex items-center justify-end gap-2">
                                    {abs.justifiee ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => justifierAbsence(abs.id, '', false)}
                                          className="font-semibold text-xs rounded-lg px-2.5 py-1 text-danger border-danger/30 hover:bg-danger/10 hover:text-danger"
                                        >
                                          {t('absences.btn_unjustify', "Déjustifier")}
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleOpenJustifyDialog(abs.id, abs.motif || '')}
                                          className="font-semibold text-xs rounded-lg px-2.5 py-1 bg-muted hover:bg-muted/80 text-text"
                                        >
                                          {t('action.edit', "Modifier")}
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => handleOpenJustifyDialog(abs.id, abs.motif || '')}
                                        className="font-semibold text-xs rounded-lg px-2.5 py-1 bg-primary hover:bg-primary-dark text-white shadow-sm"
                                      >
                                        {t('absences.btn_justify', "Justifier")}
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* VUE : PARENT */}
      {isParent && (
        <div className="space-y-6">
          {enfants.length === 0 ? (
            <Card className="shadow-sm border-border/50 bg-card p-8 text-center flex flex-col items-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-3 shrink-0" />
              <h3 className="text-lg font-bold text-text">{t('absences.parent.no_child', "Aucun élève rattaché")}</h3>
              <p className="text-sm text-muted-foreground">{t('absences.parent.no_child_desc', "Votre compte parent n'est associé à aucun élève actif de l'établissement.")}</p>
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {/* Colonne gauche : Synthèse enfants et assiduité */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Sélecteur d'enfant actif (si plusieurs) */}
                {enfants.length > 1 && (
                  <div className="bg-card border border-border/50 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{t('absences.parent.select_child', "Sélectionner l'enfant :")}</span>
                    <div className="flex gap-2">
                      {enfants.map(enf => (
                        <Button
                          key={enf.id}
                          size="sm"
                          variant={selectedEnfantId === enf.id ? 'default' : 'outline'}
                          onClick={() => setSelectedEnfantId(enf.id)}
                          className="font-bold text-xs rounded-xl"
                        >
                          {enf.prenom}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synthèse globale et KPIs de l'enfant sélectionné */}
                {(() => {
                  const enfantActif = eleves.find(e => e.id === selectedEnfantId)
                  if (!enfantActif) return null

                  const classeEnfant = classes.find(c => c.id === enfantActif.classeId)
                  const absencesEnfant = absences.filter(a => a.eleveId === enfantActif.id)
                  const absNonJustifiees = absencesEnfant.filter(a => !a.justifiee).length
                  const absJustifiees = absencesEnfant.length - absNonJustifiees
                  const assiduiteEnfant = Math.max(0, Math.min(100, Math.round(((totalSessionsBase - absencesEnfant.length) / totalSessionsBase) * 100)))

                  return (
                    <div className="space-y-6">
                      {/* Fiche Élève */}
                      <Card className="shadow-sm border-border/50 bg-card overflow-hidden text-start">
                        <CardHeader className="bg-muted/20 border-b border-border/40 p-4 flex flex-row items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                            {enfantActif.photoUrl ? (
                              <AvatarImage src={enfantActif.photoUrl} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                              {getInitiales(enfantActif.nom, enfantActif.prenom)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg font-bold text-text">{enfantActif.prenom} {enfantActif.nom}</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                              <span>{t('absences.parent.class_prefix', "Classe : ")}{classeEnfant?.nom}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                              <span>{t('absences.parent.matricule_prefix', "Matricule : ")}{enfantActif.matricule}</span>
                            </CardDescription>
                          </div>
                        </CardHeader>

                        {/* KPIs enfant */}
                        <CardContent className="p-4 grid gap-3 grid-cols-3">
                          <div className="bg-muted/20 border border-border/40 p-3 rounded-xl text-center">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t('absences.total_count', "Total Absences").split(':')[0]}</p>
                            <p className="text-lg font-extrabold text-text mt-1">{absencesEnfant.length}</p>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 p-3 rounded-xl text-center">
                            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('absences.table.justified', "Justifiées")}</p>
                            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{absJustifiees}</p>
                          </div>
                          <div className="bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 p-3 rounded-xl text-center">
                            <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">{t('absences.table.unjustified', "Non Justifiées")}</p>
                            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">{absNonJustifiees}</p>
                          </div>
                          <div className="col-span-3 bg-gradient-to-r from-primary to-primary-dark p-3.5 rounded-xl text-white flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-white/10 shrink-0">
                                <BookmarkCheck className="h-5 w-5" />
                              </div>
                              <div className="text-start">
                                <p className="text-xs text-white/80 font-bold uppercase tracking-wider">{t('absences.parent.attendance_rate', "Taux d'Assiduité Scolaire")}</p>
                                <p className="text-xs text-white/60">{t('absences.parent.estimated_on_year', "Estimé sur les séances de l'année")}</p>
                              </div>
                            </div>
                            <p className="text-2xl font-extrabold">{assiduiteEnfant}%</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Liste historique absences */}
                      <Card className="shadow-sm border-border/50 bg-card overflow-hidden text-start">
                        <div className="p-4 bg-muted/20 border-b border-border/40">
                          <h3 className="font-display font-bold text-sm text-text flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                            {t('absences.parent.detailed_history', "Historique détaillé des absences")}
                          </h3>
                        </div>
                        <CardContent className="p-0 divide-y divide-border/40">
                          {absencesEnfant.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground flex flex-col items-center">
                              <Check className="h-10 w-10 text-emerald-500 mb-2 animate-bounce shrink-0" />
                              <p className="font-bold text-emerald-600">{t('absences.parent.no_absences_recorded', "Parfait ! Aucune absence enregistrée.")}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{t('absences.parent.no_absences_recorded_desc', "Cet élève a été présent à toutes les séances.")}</p>
                            </div>
                          ) : (
                            absencesEnfant.map((abs) => (
                              <div key={abs.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div>
                                  <p className="font-bold text-text text-sm">{formatDate(abs.date)}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold mt-0.5">
                                    {abs.seance === 'matin' ? (
                                      <>
                                        <Sun className="h-3 w-3 text-amber-500 shrink-0" />
                                        <span>{t('absences.seance.matin_hours', "Séance du Matin (7h-12h)")}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Moon className="h-3 w-3 text-blue-500 shrink-0" />
                                        <span>{t('absences.seance.apres_midi_hours', "Séance de l'Après-midi (13h-17h)")}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 self-start sm:self-center">
                                  {abs.motif && (
                                    <div className="text-end hidden sm:block">
                                      <p className="text-xs font-semibold text-text">{abs.motif}</p>
                                      <p className="text-[10px] text-muted-foreground">{t('absences.parent.motif_approved', "Motif approuvé")}</p>
                                    </div>
                                  )}
                                  <Badge
                                    className={`rounded-full font-bold px-2.5 py-0.5 text-[9px] uppercase tracking-wider ${
                                      abs.justifiee
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-amber-50 border-amber-200 text-amber-700'
                                    }`}
                                    variant="outline"
                                  >
                                    {abs.justifiee ? t('absences.table.justified', "Justifiée") : t('absences.parent.pending_justification', "En attente de justificatif")}
                                  </Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </div>

              {/* Colonne droite : Signalement absence Parent */}
              <div className="space-y-6 text-start">
                <div className="relative">
                  {(() => {
                    const hasPremiumAccess = currentUser?.parentSubscriptionStatus && currentUser.parentSubscriptionStatus !== 'gratuit';
                    return (
                      <>
                        {!hasPremiumAccess && (
                          <div 
                            className="absolute inset-0 z-30 cursor-pointer flex flex-col items-center justify-center bg-card/10 backdrop-blur-[0.5px] rounded-2xl border border-dashed border-amber-500/30 transition-all hover:bg-card/25"
                            onClick={() => setIsPaywallOpen(true)}
                          >
                            <div className="bg-amber-100 dark:bg-amber-955/50 text-amber-700 dark:text-amber-400 p-2.5 rounded-2xl shadow-md flex items-center justify-center gap-1.5 font-bold text-xs uppercase animate-pulse border border-amber-200 dark:border-amber-900/40">
                              <Lock className="w-4 h-4 shrink-0" /> 👑 Premium
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold text-center mt-2.5 px-6 leading-relaxed max-w-[220px]">
                              {t('absences.parent.btn_report_desc', "Débloquez le signalement d'absences en direct pour votre enfant")}
                            </p>
                          </div>
                        )}
                        <Card className={`shadow-sm border-border/50 bg-card border-l-4 border-l-primary ${!hasPremiumAccess ? 'opacity-30 select-none pointer-events-none' : ''}`}>
                          <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-text flex items-center gap-2">
                      <Plus className="h-4.5 w-4.5 text-primary shrink-0" />
                      {t('absences.parent.report_absence', "Signaler une absence")}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {t('absences.parent.report_absence_desc', "Votre enfant est malade ou absent ? Informez immédiatement l'école via ce formulaire de liaison.")}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <form onSubmit={handleSignalSubmit} className="space-y-4">
                      {/* Choix Enfant */}
                      <div className="space-y-1">
                        <Label htmlFor="signal-enfant" className="text-[10px] font-bold text-muted-foreground uppercase">{t('absences.parent.child_concerned', "Enfant concerné")}</Label>
                        <Select
                          value={selectedEnfantId}
                          onValueChange={setSelectedEnfantId}
                        >
                          <SelectTrigger id="signal-enfant" className="w-full bg-background border-border text-text rounded-xl font-semibold text-xs h-9 focus:ring-1 focus:ring-primary focus:border-primary">
                            <SelectValue placeholder={t('absences.parent.select_child_placeholder', "Sélectionner l'enfant")} />
                          </SelectTrigger>
                          <SelectContent>
                            {enfants.map(enf => (
                              <SelectItem key={enf.id} value={enf.id} className="text-xs font-semibold">
                                {enf.prenom} {enf.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date de l'absence */}
                      <div className="space-y-1">
                        <Label htmlFor="signal-date" className="text-[10px] font-bold text-muted-foreground uppercase">{t('absences.parent.absence_date', "Date de l'absence")}</Label>
                        <DatePicker
                          id="signal-date"
                          date={signalDate ? new Date(signalDate) : undefined}
                          setDate={(d) => setSignalDate(d ? format(d, 'yyyy-MM-dd') : '')}
                          className="h-9 pe-3 rounded-xl text-xs font-semibold w-full text-start"
                        />
                      </div>

                      {/* Séance */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('absences.seance', "Séance")}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSignalSeance('matin')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl font-bold text-xs transition-colors duration-150 ${
                              signalSeance === 'matin'
                                ? 'bg-primary/5 border-primary text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted/10'
                            }`}
                          >
                            <Sun className="h-3.5 w-3.5 shrink-0" />
                            {t('absences.seance.matin', "Matin")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignalSeance('apres-midi')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl font-bold text-xs transition-colors duration-150 ${
                              signalSeance === 'apres-midi'
                                ? 'bg-primary/5 border-primary text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted/10'
                            }`}
                          >
                            <Moon className="h-3.5 w-3.5 shrink-0" />
                            {t('absences.seance.apres_midi', "Après-midi")}
                          </button>
                        </div>
                      </div>

                      {/* Motif de l'absence */}
                      <div className="space-y-1">
                        <Label htmlFor="signal-motif" className="text-[10px] font-bold text-muted-foreground uppercase">{t('absences.modal.motif', "Motif de l'absence")}</Label>
                        <textarea
                          id="signal-motif"
                          rows={3}
                          value={signalMotif}
                          onChange={(e) => setSignalMotif(e.target.value)}
                          placeholder={t('absences.parent.motif_placeholder_input', "Ex: Grippe, Paludisme (rendez-vous chez le pédiatre à 9h)...")}
                          className="w-full bg-background border border-border text-text rounded-xl p-3 placeholder-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shrink-0 resize-none text-start"
                          required
                        />
                      </div>

                      {/* Bouton de validation */}
                      <Button
                        type="submit"
                        disabled={signalLoading}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-xl flex items-center justify-center gap-2 py-2 shadow-md"
                      >
                        {signalLoading ? (
                          <span>{t('action.submitting', "Transmission en cours...")}</span>
                        ) : (
                          <>
                            <Send className="h-4 w-4 shrink-0" />
                            <span>{t('absences.parent.btn_report', "Signaler l'absence")}</span>
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>

                {/* Note informative */}
                <Card className="shadow-sm border-border/50 bg-muted/20 border border-border/40 p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text uppercase">{t('absences.parent.official_proof', "Justificatif officiel")}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t('absences.parent.proof_info_desc', "Conformément au règlement de <strong>{name}</strong>, tout signalement numérique doit être appuyé par un justificatif papier signé (certificat médical, dispense) remis au directeur ou à l'enseignant lors du retour de l'élève en classe.").replace('{name}', ecole?.nom || "l'établissement")}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIALOG : VALIDATION ET JUSTIFICATION (Directeur uniquement) */}
      <Dialog open={justifyDialogOpen} onOpenChange={setJustifyDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6" dir={dir}>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold text-text flex items-center gap-2 text-start">
              <HeartPulse className="h-5.5 w-5.5 text-primary shrink-0" />
              {t('absences.modal.justify_title', "Valider le justificatif d'absence")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-start">
              {t('absences.modal.justify_desc', "Renseignez le motif officiel pour approuver l'absence de cet élève. L'état passera automatiquement en statut « Justifiée ».")}
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const abs = absencesDetaillees.find(a => a.id === selectedAbsenceId)
            if (!abs) return null

            return (
              <div className="space-y-4 py-3 text-start">
                {/* Récapitulatif Absence */}
                <div className="bg-muted/20 border border-border/40 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-extrabold text-text">
                      {abs.eleve ? `${abs.eleve.prenom} ${abs.eleve.nom}` : t('eleves.not_found', "Élève inconnu")}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t('absences.parent.class_prefix', "Classe : ")}{abs.classe?.nom}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold text-text">{formatDate(abs.date)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                      {t('absences.parent.seance_prefix', "Séance : ")}{abs.seance === 'matin' ? t('absences.seance.matin', 'Matin') : t('absences.seance.apres_midi', 'Après-midi')}
                    </p>
                  </div>
                </div>

                {/* Saisie motif */}
                <div className="space-y-1.5">
                  <Label htmlFor="dialog-motif" className="text-xs font-bold text-muted-foreground uppercase">
                    {t('absences.modal.motif', "Motif officiel de justification")}
                  </Label>
                  <Input
                    id="dialog-motif"
                    placeholder={t('absences.modal.motif_placeholder', "Ex: Certificat médical fourni (Paludisme), Deuil familial...")}
                    value={justificationMotif}
                    onChange={(e) => setJustificationMotif(e.target.value)}
                    className="text-xs h-9 border-border bg-background focus:ring-primary focus:border-primary"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {t('absences.modal.motif_desc', "Ce motif sera visible par l'enseignant de la classe et les parents sur leur espace privé.")}
                  </p>
                </div>
              </div>
            )
          })()}

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setJustifyDialogOpen(false)}
              className="font-semibold text-xs rounded-xl"
            >
              {t('action.cancel', "Annuler")}
            </Button>
            <Button
              type="button"
              onClick={handleSaveJustification}
              className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs"
            >
              {t('absences.modal.confirm', "Valider la justification")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ParentPremiumPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        initialTrimestre="1"
        anneeId={activeAnneeScolaire?.id || 'all'}
      />
    </div>
  )
}
