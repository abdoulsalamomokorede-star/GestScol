'use client'

import { useState, useEffect } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useToast } from '@/hooks/use-toast'
import { getInitiales } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Check, 
  X, 
  Loader2, 
  Users, 
  Calendar, 
  Sun, 
  Moon, 
  AlertCircle,
  FileText,
  BookmarkCheck,
  UserX,
  UserCheck,
  Search,
  ShieldAlert,
  Info
} from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { Absence } from '@/types'

interface FeuilleAppelProps {
  classeId: string
}

export default function FeuilleAppel({ classeId }: FeuilleAppelProps) {
  const { eleves, absences, enregistrerAbsences, currentUser, activeAnneeScolaire, inscriptions } = useSchoolStore()
  const { toast } = useToast()

  // Filtrer les élèves actifs de la classe qui ont une inscription validée pour l'année en cours
  const elevesClasse = eleves.filter(e => {
    if (e.statut !== 'actif') return false;
    
    // Trouver l'inscription de l'année active
    const inscriptionActive = inscriptions?.find(
      ins => ins.eleveId === e.id && 
             (ins.anneeScolaire === activeAnneeScolaire?.id || ins.anneeScolaire === activeAnneeScolaire?.nom)
    );
    
    // Si aucune inscription active pour l'année en cours ou si elle n'est pas validée, on l'exclut
    if (!inscriptionActive || inscriptionActive.statut !== 'validee') return false;
    
    // C'est l'inscription qui fait foi pour la classe de l'année en cours
    if (inscriptionActive.classeId !== classeId) return false;
    
    return true;
  })

  // États locaux
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [seance, setSeance] = useState<'matin' | 'apres-midi'>('matin')
  
  // localAttendance: map of eleveId -> { isAbsent: boolean, justifiee: boolean, motif: string }
  const [localAttendance, setLocalAttendance] = useState<Record<string, { isAbsent: boolean, justifiee: boolean, motif: string }>>({})
  const [loading, setLoading] = useState(false)

  // Synchronisation avec les données enregistrées
  useEffect(() => {
    const initialAttendance: Record<string, { isAbsent: boolean, justifiee: boolean, motif: string }> = {}
    
    // Par défaut, tous les élèves sont présents
    elevesClasse.forEach(e => {
      initialAttendance[e.id] = { isAbsent: false, justifiee: false, motif: '' }
    })
    
    // Charger les absences existantes pour cette date et séance
    const absencesExistantes = absences.filter(
      a => a.date === date && a.seance === seance
    )
    
    absencesExistantes.forEach(a => {
      if (initialAttendance[a.eleveId]) {
        initialAttendance[a.eleveId] = {
          isAbsent: true,
          justifiee: a.justifiee,
          motif: a.motif || ''
        }
      }
    })
    
    setLocalAttendance(initialAttendance)
  }, [classeId, date, seance, absences])

  // Toggles de présence
  const setPresent = (eleveId: string) => {
    setLocalAttendance(prev => ({
      ...prev,
      [eleveId]: { isAbsent: false, justifiee: false, motif: '' }
    }))
  }

  const setAbsent = (eleveId: string) => {
    setLocalAttendance(prev => ({
      ...prev,
      [eleveId]: { 
        isAbsent: true, 
        justifiee: prev[eleveId]?.justifiee || false, 
        motif: prev[eleveId]?.motif || '' 
      }
    }))
  }

  const toggleJustification = (eleveId: string) => {
    setLocalAttendance(prev => ({
      ...prev,
      [eleveId]: { 
        ...prev[eleveId], 
        justifiee: !prev[eleveId].justifiee 
      }
    }))
  }

  const handleMotifChange = (eleveId: string, val: string) => {
    setLocalAttendance(prev => ({
      ...prev,
      [eleveId]: { 
        ...prev[eleveId], 
        motif: val 
      }
    }))
  }

  // Actions globales de masse
  const markAllPresent = () => {
    const updated = { ...localAttendance }
    elevesClasse.forEach(e => {
      updated[e.id] = { isAbsent: false, justifiee: false, motif: '' }
    })
    setLocalAttendance(updated)
    toast({
      title: "Appel de masse",
      description: "Tous les élèves ont été marqués Présents.",
      variant: "default",
    })
  }

  const markAllAbsent = () => {
    const updated = { ...localAttendance }
    elevesClasse.forEach(e => {
      updated[e.id] = {
        isAbsent: true,
        justifiee: updated[e.id]?.justifiee || false,
        motif: updated[e.id]?.motif || ''
      }
    })
    setLocalAttendance(updated)
    toast({
      title: "Appel de masse",
      description: "Tous les élèves ont été marqués Absents.",
      variant: "default",
    })
  }

  // Statistiques calculées en temps réel
  const totalEleves = elevesClasse.length
  const nbAbsents = Object.values(localAttendance).filter(v => v.isAbsent).length
  const nbPresents = totalEleves - nbAbsents
  const tauxPresence = totalEleves > 0 ? Math.round((nbPresents / totalEleves) * 100) : 100

  // Sauvegarde globale
  const handleSave = () => {
    setLoading(true)
    
    // Effet de chargement réaliste (600ms)
    setTimeout(() => {
      try {
        const absencesAAjouter: Absence[] = []
        const eleveIds = elevesClasse.map(e => e.id)
        
        Object.entries(localAttendance).forEach(([eleveId, state]) => {
          if (state.isAbsent) {
            absencesAAjouter.push({
              id: `abs-${eleveId}-${date}-${seance}`,
              eleveId,
              date,
              seance,
              justifiee: state.justifiee,
              motif: state.motif || undefined,
              anneeScolaire: activeAnneeScolaire?.id || '2024-2025'
            })
          }
        })
        
        enregistrerAbsences(date, seance, absencesAAjouter, eleveIds)
        
        toast({
          title: "Feuille d'appel enregistrée",
          description: `L'appel du ${date} (${seance === 'matin' ? 'Matin' : 'Après-midi'}) a été enregistré avec succès. ${absencesAAjouter.length} absent(s) noté(s).`,
          variant: "default",
        })
      } catch (err) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'enregistrement.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }, 600)
  }

  const isDirecteur = currentUser?.role === 'directeur'

  if (totalEleves === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground flex flex-col items-center bg-card border border-border/50 rounded-2xl">
        <Users className="h-10 w-10 text-muted-foreground/40 mb-3 animate-pulse" />
        <p className="font-semibold text-text">Aucun élève actif dans cette classe.</p>
        <p className="text-xs text-muted-foreground mt-1">Veuillez d&apos;abord inscrire ou assigner des élèves.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barre de contrôles Date & Séance */}
      <Card className="shadow-sm border-border/50 bg-card">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Sélection Date */}
          <div className="w-full sm:w-auto flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/5 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1 sm:flex-initial">
              <Label htmlFor="appel-date" className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Date de l&apos;appel
              </Label>
              <DatePicker
                id="appel-date"
                date={date ? new Date(date) : undefined}
                setDate={(d) => setDate(d ? format(d, 'yyyy-MM-dd') : '')}
                className="h-10 pr-3 rounded-xl font-semibold text-sm max-w-[180px]"
              />
            </div>
          </div>

          {/* Sélection Séance */}
          <div className="w-full sm:w-auto flex flex-col items-start sm:items-end">
            <span className="text-xs font-bold text-muted-foreground uppercase mb-1.5">
              Séance de la journée
            </span>
            <div className="grid grid-cols-2 p-1 bg-muted/50 border border-border/40 rounded-xl w-full sm:w-[260px]">
              <button
                type="button"
                onClick={() => setSeance('matin')}
                className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  seance === 'matin'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-text'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Matin (7h - 12h)</span>
              </button>
              <button
                type="button"
                onClick={() => setSeance('apres-midi')}
                className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  seance === 'apres-midi'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-text'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Après-midi (13h - 17h)</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques en temps réel */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="bg-card border border-border/50 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Élèves</p>
            <p className="text-lg font-bold text-text">{totalEleves}</p>
          </div>
        </div>
        
        <div className="bg-card border border-border/50 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Présents</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{nbPresents}</p>
          </div>
        </div>

        <div className="bg-card border border-border/50 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
            <X className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Absents</p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{nbAbsents}</p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-primary to-primary-dark p-3 rounded-xl text-white flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white/10 text-white">
            <BookmarkCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/80 font-bold uppercase">Taux Présence</p>
            <p className="text-lg font-extrabold">{tauxPresence}%</p>
          </div>
        </div>
      </div>

      {/* Actions de masse et Liste d'appel */}
      <Card className="shadow-sm border-border/50 bg-card overflow-hidden">
        <div className="p-4 bg-muted/30 border-b border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-display font-bold text-sm text-text flex items-center">
            <Users className="h-4 w-4 text-primary mr-2" />
            Liste d&apos;appel des élèves
          </h3>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markAllPresent}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-950/20 font-semibold text-xs flex-1 sm:flex-initial"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Tous Présents
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markAllAbsent}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20 font-semibold text-xs flex-1 sm:flex-initial"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Tous Absents
            </Button>
          </div>
        </div>

        <CardContent className="p-0 divide-y divide-border/40">
          {elevesClasse.map(e => {
            const attState = localAttendance[e.id] || { isAbsent: false, justifiee: false, motif: '' }
            
            return (
              <div key={e.id} className="p-4 transition-all duration-200 hover:bg-muted/5">
                {/* Ligne principale de l'élève */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border border-primary/20">
                      {e.photoUrl ? (
                        <AvatarImage src={e.photoUrl} alt={`${e.prenom} ${e.nom}`} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {getInitiales(e.nom, e.prenom)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-text text-sm sm:text-base">{e.prenom} {e.nom}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">Matricule: {e.matricule}</p>
                    </div>
                  </div>

                  {/* Groupe de boutons Présent / Absent (Grands cibles tactiles pour Tecno/Infinix !) */}
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-[240px]">
                    <button
                      type="button"
                      onClick={() => setPresent(e.id)}
                      className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                        !attState.isAbsent
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400 font-extrabold ring-1 ring-emerald-300/40'
                          : 'border-border/60 hover:bg-muted/10 text-muted-foreground'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      <span>Présent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbsent(e.id)}
                      className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                        attState.isAbsent
                          ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400 font-extrabold ring-1 ring-rose-300/40'
                          : 'border-border/60 hover:bg-muted/10 text-muted-foreground'
                      }`}
                    >
                      <X className="h-4 w-4" />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>

                {/* Section Justification & Remarques (affichée uniquement si l'élève est Absent) */}
                {attState.isAbsent && (
                  <div className="mt-3.5 bg-muted/20 border border-border/40 p-3.5 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        <span className="text-xs font-semibold text-muted-foreground">
                          Élève absent le {date} ({seance === 'matin' ? 'Matin' : 'Après-midi'})
                        </span>
                      </div>

                      {/* Statut de la justification */}
                      <div>
                        {isDirecteur ? (
                          <label className="flex items-center space-x-2 cursor-pointer bg-card px-2.5 py-1 rounded-lg border border-border/50 select-none">
                            <input
                              type="checkbox"
                              checked={attState.justifiee}
                              onChange={() => toggleJustification(e.id)}
                              className="rounded text-primary border-border focus:ring-primary h-3.5 w-3.5"
                            />
                            <span className="text-xs font-bold text-text">Absence justifiée</span>
                          </label>
                        ) : (
                          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            attState.justifiee
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {attState.justifiee ? 'Justifiée (Approuvé)' : 'En attente de justification'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Champ de saisie du motif */}
                    <div className="space-y-1">
                      <Label htmlFor={`motif-${e.id}`} className="text-xs font-bold text-muted-foreground">
                        {isDirecteur ? 'Motif de justification officiel' : 'Remarque ou motif signalé par l&apos;enseignant'}
                      </Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                        <Input
                          id={`motif-${e.id}`}
                          type="text"
                          placeholder={
                            isDirecteur
                              ? "ex: Paludisme (Certificat médical fourni par le parent)"
                              : "ex: Parent a signalé maladie, retard transport..."
                          }
                          value={attState.motif}
                          onChange={(evt) => handleMotifChange(e.id, evt.target.value)}
                          className="pl-9 bg-background border-border text-text placeholder-muted-foreground text-xs h-9"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Actions de validation */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer la feuille d&apos;appel'
          )}
        </Button>
      </div>
    </div>
  )
}
