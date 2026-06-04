'use client'

import { useState, useEffect } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { GraduationCap, FileText, CreditCard, CalendarOff } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getInitiales, formatDate, formatCFA, cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ParentDashboardPage() {
  const router = useRouter()
  const { 
    eleves, 
    classes, 
    notes, 
    paiements, 
    absences, 
    currentUser, 
    inscriptions, 
    anneesScolaires, 
    activeAnneeScolaire,
    fetchSupabaseData,
    ecoleId
  } = useSchoolStore()
  
  const [selectedAnneeId, setSelectedAnneeId] = useState<string>(() => {
    return activeAnneeScolaire?.id || (anneesScolaires.find(as => as.statut === 'active')?.id) || (anneesScolaires[0]?.id) || ''
  })

  // Charger les données fraîches depuis Supabase au montage
  useEffect(() => {
    fetchSupabaseData()
  }, [fetchSupabaseData])

  // S'assurer de mettre à jour l'année sélectionnée si l'année active dans le store change
  useEffect(() => {
    if (activeAnneeScolaire) {
      setSelectedAnneeId(activeAnneeScolaire.id)
    }
  }, [activeAnneeScolaire])
  
  if (!currentUser || currentUser.role !== 'parent') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Accès réservé aux parents.
      </div>
    )
  }

  const parentFullName = `${currentUser.nom} ${currentUser.prenom}`
  
  // 1. Filtrer les enfants liés à ce parent et à l'école active
  const mesEnfantsBase = eleves.filter(
    e => (e.parentUserId === currentUser.id || e.parentNom === parentFullName || e.parentNom?.includes(currentUser.nom)) && e.ecoleId === ecoleId
  )

  // 2. Filtrer uniquement les enfants qui ont une inscription ACTIVE/VALIDÉE pour l'année scolaire sélectionnée
  const mesEnfants = mesEnfantsBase.filter(e =>
    inscriptions.some(ins => ins.eleveId === e.id && ins.anneeScolaire === selectedAnneeId && ins.statut === 'validee')
  )

  const mesPaiements = paiements.filter(p => mesEnfants.some(e => e.id === p.eleveId) && p.anneeScolaire === selectedAnneeId)
  const mesAbsences = absences.filter(a => mesEnfants.some(e => e.id === a.eleveId) && a.anneeScolaire === selectedAnneeId)

  const paiementsEnRetard = mesPaiements.filter(p => p.statut === 'retard').length
  const absencesNonJustifiees = mesAbsences.filter(a => !a.justifiee).length

  // Calcul de la moyenne T1 pour le trimestre et l'année sélectionnés
  const getMoyenneElevePourAnnee = (eleveId: string, trimestre: 1 | 2 | 3) => {
    const notesTrimestre = notes.filter(n => n.eleveId === eleveId && n.trimestre === trimestre && n.anneeScolaire === selectedAnneeId)
    const matieresStore = useSchoolStore.getState().matieres
    let totalCoeff = 0
    let totalNotes = 0

    notesTrimestre.forEach(note => {
      const matiere = matieresStore.find(m => m.id === note.matiereId)
      if (matiere) {
        totalNotes += note.valeur * matiere.coefficient
        totalCoeff += matiere.coefficient
      }
    })

    return totalCoeff > 0 ? Number((totalNotes / totalCoeff).toFixed(2)) : 0
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">Espace Parent</h2>
          <p className="text-sm text-muted-foreground">Bienvenue, {currentUser.prenom} {currentUser.nom}.</p>
        </div>
        
        {/* Sélecteur d'Année Scolaire */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Année Scolaire :</span>
          <Select value={selectedAnneeId} onValueChange={setSelectedAnneeId}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <SelectValue placeholder="Année Scolaire" />
            </SelectTrigger>
            <SelectContent>
              {anneesScolaires.map(annee => (
                <SelectItem key={annee.id} value={annee.id}>
                  {annee.nom} {annee.statut === 'active' ? '(Courante)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard 
          title="Mes Enfants" 
          value={mesEnfants.length} 
          icon={GraduationCap} 
          subtitle="Enfants inscrits"
        />
        <KpiCard 
          title="Paiements en Retard" 
          value={paiementsEnRetard} 
          icon={CreditCard} 
          subtitle="Scolarité"
          trend={paiementsEnRetard > 0 ? { value: 'À régler', isPositive: false } : undefined}
        />
        <KpiCard 
          title="Absences (Non justifiées)" 
          value={absencesNonJustifiees} 
          icon={CalendarOff} 
          subtitle="Depuis la rentrée"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-border/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display">Dossiers de mes enfants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mesEnfants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun enfant trouvé pour ce compte ou non inscrit pour cette année.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mesEnfants.map(enfant => {
                  const studentInscription = inscriptions.find(
                    ins => ins.eleveId === enfant.id && ins.anneeScolaire === selectedAnneeId && ins.statut === 'validee'
                  )
                  const classeId = studentInscription?.classeId || enfant.classeId
                  const classe = classes.find(c => c.id === classeId)
                  const moyenneT1 = getMoyenneElevePourAnnee(enfant.id, 1)

                  return (
                    <div key={enfant.id} onClick={() => router.push(`/eleves/${enfant.id}?anneeId=${selectedAnneeId}`)} className="flex items-center justify-between border border-border/50 p-4 rounded-lg hover:border-primary/50 cursor-pointer transition-colors bg-muted/5">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 border border-primary/20">
                           <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                            {getInitiales(enfant.nom, enfant.prenom)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-text">{enfant.prenom} {enfant.nom}</p>
                          <p className="text-sm text-muted-foreground">Classe: <span className="font-medium text-text">{classe?.nom || 'N/A'}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-background">
                          Moy. T1: <strong className="ml-1 text-primary">{moyenneT1 > 0 ? `${moyenneT1}/20` : '-'}</strong>
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Derniers Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            {mesPaiements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement enregistré pour cette année.</p>
            ) : (
              <div className="space-y-4">
                {mesPaiements.slice(0, 5).map(paiement => {
                  const enfant = mesEnfants.find(e => e.id === paiement.eleveId)
                  return (
                    <div key={paiement.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-text text-sm">{paiement.type.replace('_', ' ').toUpperCase()} - {enfant?.prenom}</p>
                        <p className="text-xs text-muted-foreground">Échéance: {formatDate(paiement.dateLimite)}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold text-sm", paiement.statut === 'paye' ? 'text-success' : paiement.statut === 'retard' ? 'text-danger' : 'text-warning')}>
                          {paiement.statut === 'paye' 
                            ? formatCFA(paiement.montantPaye || paiement.montant) 
                            : formatCFA(Math.max(0, paiement.montant - (paiement.montantPaye || 0)))}
                        </p>
                        <Badge variant="outline" className={
                          paiement.statut === 'paye' ? 'bg-success/10 text-success border-success/20 mt-1' : 
                          paiement.statut === 'retard' ? 'bg-danger/10 text-danger border-danger/20 mt-1' : 
                          'bg-warning/10 text-warning border-warning/20 mt-1'
                        }>
                          {paiement.statut === 'paye' ? 'Payé' : paiement.statut === 'retard' ? 'En retard' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Absences Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {mesAbsences.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                <div className="bg-success/10 p-3 rounded-full text-success mb-3">
                  <CalendarOff className="h-6 w-6" />
                </div>
                <p>Aucune absence enregistrée pour cette année.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mesAbsences.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(absence => {
                  const enfant = mesEnfants.find(e => e.id === absence.eleveId)
                  return (
                    <div key={absence.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-text text-sm">{enfant?.prenom} {enfant?.nom}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(absence.date)} ({absence.seance})</p>
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
