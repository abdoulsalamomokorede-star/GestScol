'use client'

import { useState } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Users, BookOpen, CalendarOff, Filter } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getInitiales, formatDate } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'

export default function EnseignantDashboardPage() {
  const router = useRouter()
  const { classes, eleves, matieres, absences, currentUser, inscriptions, activeAnneeScolaire } = useSchoolStore()
  
  // Date du jour par défaut
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  if (!currentUser || currentUser.role !== 'enseignant') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Accès réservé aux enseignants.
      </div>
    )
  }

  // 1. Les classes dont il est le professeur principal OU dans lesquelles il enseigne
  const matieresEnseignees = matieres.filter(m => m.enseignantIds?.includes(currentUser.id))
  const classesIdsEnseignees = Array.from(new Set([
    ...classes.filter(c => c.enseignantPrincipalId === currentUser.id).map(c => c.id),
    ...matieresEnseignees.map(m => m.classeId)
  ]))

  const mesClasses = classes.filter(c => classesIdsEnseignees.includes(c.id))
  
  // 2. Tous les élèves actifs inscrits dans ces classes avec une inscription validée pour l'année en cours
  const mesEleves = eleves.filter(e => {
    if (e.statut !== 'actif') return false;
    
    const inscription = inscriptions.find(ins => 
      ins.eleveId === e.id && 
      ins.statut === 'validee' &&
      (ins.anneeScolaire === activeAnneeScolaire?.id || ins.anneeScolaire === activeAnneeScolaire?.nom)
    );
    
    if (!inscription) return false;
    return classesIdsEnseignees.includes(inscription.classeId);
  })

  // 3. Absences de ces élèves à la date sélectionnée
  const absencesDuJour = absences.filter(a => 
    a.date === filterDate && 
    mesEleves.some(e => e.id === a.eleveId)
  )

  const absencesNonJustifiees = absencesDuJour.filter(a => !a.justifiee)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">Espace Enseignant</h2>
          <p className="text-sm text-muted-foreground">Bienvenue, {currentUser.prenom} {currentUser.nom}.</p>
        </div>
        <div className="flex items-center space-x-2">
          <DatePicker
            date={filterDate ? new Date(filterDate) : undefined}
            setDate={(date) => {
              if (date) {
                const offset = date.getTimezoneOffset()
                const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000))
                setFilterDate(adjustedDate.toISOString().split('T')[0])
              } else {
                setFilterDate('')
              }
            }}
            className="w-[240px] bg-card"
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard 
          title="Mes Classes" 
          value={mesClasses.length} 
          icon={BookOpen} 
          subtitle="Classes assignées"
        />
        <KpiCard 
          title="Total Élèves" 
          value={mesEleves.length} 
          icon={Users} 
          subtitle="Effectif total"
        />
        <KpiCard 
          title="Absences (Non justifiées)" 
          value={`${absencesDuJour.length} (${absencesNonJustifiees.length})`} 
          icon={CalendarOff} 
          subtitle={`À la date du ${formatDate(filterDate)}`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Effectif par Classe ({formatDate(filterDate)})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mesClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune classe assignée.</p>
            ) : (
              mesClasses.map(classe => {
                const elevesDeLaClasse = mesEleves.filter(e => {
                  const inscription = inscriptions.find(ins => 
                    ins.eleveId === e.id && 
                    ins.statut === 'validee' &&
                    (ins.anneeScolaire === activeAnneeScolaire?.id || ins.anneeScolaire === activeAnneeScolaire?.nom)
                  );
                  return inscription?.classeId === classe.id;
                })
                const total = elevesDeLaClasse.length
                
                // Nombre d'absents de la classe aujourd'hui
                const absentsClasse = absencesDuJour.filter(a => elevesDeLaClasse.some(e => e.id === a.eleveId)).length
                const presents = total - absentsClasse

                return (
                  <div key={classe.id} className="space-y-2 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text">{classe.nom}</span>
                      <span className="text-muted-foreground">
                        {presents}/{total} présents
                      </span>
                    </div>
                    <div className="h-2 w-full bg-danger/20 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-success transition-all"
                        style={{ width: `${total > 0 ? (presents / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Détail des Absences</CardTitle>
          </CardHeader>
          <CardContent>
            {absencesDuJour.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                <div className="bg-success/10 p-3 rounded-full text-success mb-3">
                  <Users className="h-6 w-6" />
                </div>
                <p>Tous les élèves sont présents aujourd'hui !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {absencesDuJour.map(absence => {
                  const eleve = mesEleves.find(e => e.id === absence.eleveId)
                  if (!eleve) return null
                  
                  const inscription = inscriptions.find(ins => 
                    ins.eleveId === eleve.id && 
                    ins.statut === 'validee' &&
                    (ins.anneeScolaire === activeAnneeScolaire?.id || ins.anneeScolaire === activeAnneeScolaire?.nom)
                  );
                  const currentClasseId = inscription?.classeId;
                  if (!currentClasseId) return null;
                  const classe = mesClasses.find(c => c.id === currentClasseId)

                  return (
                    <div key={absence.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitiales(eleve.nom, eleve.prenom)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-text text-sm">{eleve.prenom} {eleve.nom}</p>
                          <p className="text-xs text-muted-foreground">{classe?.nom} • {absence.seance}</p>
                        </div>
                      </div>
                      <Badge variant={absence.justifiee ? "default" : "destructive"} className={absence.justifiee ? "bg-success hover:bg-success" : ""}>
                        {absence.justifiee ? 'Justifiée' : 'Non justifiée'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
