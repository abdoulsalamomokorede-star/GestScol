'use client'

import { useState, useEffect } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { GraduationCap, FileText, CreditCard, CalendarOff, Lock } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getInitiales, formatDate, formatCFA, cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/hooks/useTranslation'

export default function ParentDashboardPage() {
  const router = useRouter()
  const { t, dir } = useTranslation()
  const { 
    eleves, 
    classes, 
    notes, 
    paiements, 
    absences, 
    bulletins,
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
        {t('parent.dashboard.access_denied', "Accès réservé aux parents.")}
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

  const aAccesPremium = (trimestre: number) => {
    const status = currentUser?.parentSubscriptionStatus
    if (!status || status === 'gratuit') return false
    if (status === 'premium') return true
    if (!status.includes(':')) {
      return status.split(',').includes(`t${trimestre}`)
    }
    const abonnements = status.split(';').filter(Boolean)
    const abonnementAnnee = abonnements.find(a => a.startsWith(`${selectedAnneeId}:`))
    if (!abonnementAnnee) return false
    const statutAnnee = abonnementAnnee.split(':')[1]
    if (statutAnnee === 'premium') return true
    return statutAnnee.split(',').includes(`t${trimestre}`)
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-start">
          <h2 className="text-2xl font-display font-bold text-text">{t('parent.dashboard.title', "Espace Parent")}</h2>
          <p className="text-sm text-muted-foreground">{t('parent.dashboard.welcome', "Bienvenue,")} {currentUser.prenom} {currentUser.nom}.</p>
        </div>
        
        {/* Sélecteur d'Année Scolaire */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('parent.dashboard.school_year_label', "Année Scolaire :")}</span>
          <Select value={selectedAnneeId} onValueChange={setSelectedAnneeId}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <SelectValue placeholder={t('dashboard.school_year', "Année Scolaire")} />
            </SelectTrigger>
            <SelectContent>
              {anneesScolaires.map(annee => (
                <SelectItem key={annee.id} value={annee.id}>
                  {annee.nom} {annee.statut === 'active' ? ` (${t('parent.dashboard.current', "Courante")})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard 
          title={t('parent.dashboard.my_children', "Mes Enfants")} 
          value={mesEnfants.length} 
          icon={GraduationCap} 
          subtitle={t('parent.dashboard.enrolled_children', "Enfants inscrits")}
        />
        <KpiCard 
          title={t('parent.dashboard.late_payments', "Paiements en Retard")} 
          value={paiementsEnRetard} 
          icon={CreditCard} 
          subtitle={t('parent.dashboard.tuition', "Scolarité")}
          trend={paiementsEnRetard > 0 ? { value: t('parent.dashboard.to_pay', "À régler"), isPositive: false } : undefined}
        />
        <KpiCard 
          title={t('parent.dashboard.unexcused_absences', "Absences (Non justifiées)")} 
          value={absencesNonJustifiees} 
          icon={CalendarOff} 
          subtitle={t('parent.dashboard.since_start', "Depuis la rentrée")}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-border/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display text-start">{t('parent.dashboard.children_files', "Dossiers de mes enfants")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mesEnfants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-start">{t('parent.dashboard.no_children', "Aucun enfant trouvé pour ce compte ou non inscrit pour cette année.")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mesEnfants.map(enfant => {
                  const studentInscription = inscriptions.find(
                    ins => ins.eleveId === enfant.id && ins.anneeScolaire === selectedAnneeId && ins.statut === 'validee'
                  )
                  const classeId = studentInscription?.classeId || enfant.classeId
                  const classe = classes.find(c => c.id === classeId)

                  return (
                    <div key={enfant.id} onClick={() => router.push(`/eleves/${enfant.id}?anneeId=${selectedAnneeId}`)} className="flex items-center justify-between border border-border/50 p-4 rounded-lg hover:border-primary/50 cursor-pointer transition-colors bg-muted/5">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 border border-primary/20 shrink-0">
                          {enfant.photoUrl ? (
                            <AvatarImage src={enfant.photoUrl} className="object-cover" />
                          ) : null}
                           <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                            {getInitiales(enfant.nom, enfant.prenom)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-start">
                          <p className="font-bold text-text">{enfant.prenom} {enfant.nom}</p>
                          <p className="text-sm text-muted-foreground">{t('parent.dashboard.class_label', "Classe :")} <span className="font-medium text-text">{classe?.nom || 'N/A'}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const bulletinsEleve = bulletins.filter(
                            b => b.eleveId === enfant.id && b.anneeScolaire === selectedAnneeId && b.estValide === true
                          )
                          const dernierBulletin = bulletinsEleve.length > 0 
                            ? [...bulletinsEleve].sort((a, b) => b.trimestre - a.trimestre)[0] 
                            : null

                          if (!dernierBulletin) {
                            return null // N'affiche aucune moyenne si aucun trimestre n'est encore validé
                          }

                          const hasPaid = aAccesPremium(dernierBulletin.trimestre)
                          if (!hasPaid) {
                            return (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200/50 flex items-center gap-1 font-bold text-[10px]">
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>
                                  {t('parent.dashboard.moy_trimestre', 'Moy. T{trimestre} :').replace('{trimestre}', String(dernierBulletin.trimestre))} Premium
                                </span>
                              </Badge>
                            )
                          }

                          return (
                            <Badge variant="outline" className="bg-background">
                              <span>
                                {t('parent.dashboard.moy_trimestre', 'Moy. T{trimestre} :').replace('{trimestre}', String(dernierBulletin.trimestre))}
                              </span>
                              <strong className="ml-1 text-primary">
                                <span dir="ltr">{dernierBulletin.moyenneGenerale.toFixed(2)}/20</span>
                              </strong>
                            </Badge>
                          )
                        })()}
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
            <CardTitle className="text-lg font-display text-start">{t('parent.dashboard.recent_payments', "Derniers Paiements")}</CardTitle>
          </CardHeader>
          <CardContent>
            {mesPaiements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('parent.dashboard.no_payments', "Aucun paiement enregistré pour cette année.")}</p>
            ) : (
              <div className="space-y-4">
                {mesPaiements.slice(0, 5).map(paiement => {
                  const enfant = mesEnfants.find(e => e.id === paiement.eleveId)
                  return (
                    <div key={paiement.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="text-start">
                        <p className="font-medium text-text text-sm">{paiement.type.replace('_', ' ').toUpperCase()} - {enfant?.prenom}</p>
                        <p className="text-xs text-muted-foreground">{t('parent.dashboard.due_date_label', "Échéance :")} {formatDate(paiement.dateLimite)}</p>
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
                          {paiement.statut === 'paye' ? t('parent.dashboard.paid', 'Payé') : paiement.statut === 'retard' ? t('parent.dashboard.late', 'En retard') : t('parent.dashboard.pending', 'En attente')}
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
            <CardTitle className="text-lg font-display text-start">{t('parent.dashboard.recent_absences', "Absences Récentes")}</CardTitle>
          </CardHeader>
          <CardContent>
            {mesAbsences.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                <div className="bg-success/10 p-3 rounded-full text-success mb-3 shrink-0">
                  <CalendarOff className="h-6 w-6" />
                </div>
                <p>{t('parent.dashboard.no_absences', "Aucune absence enregistrée pour cette année.")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mesAbsences.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(absence => {
                  const enfant = mesEnfants.find(e => e.id === absence.eleveId)
                  return (
                    <div key={absence.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="text-start">
                        <p className="font-medium text-text text-sm">{enfant?.prenom} {enfant?.nom}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(absence.date)} ({absence.seance === 'matin' ? t('absences.seance.matin', 'Matin') : t('absences.seance.apres_midi', 'Après-midi')})</p>
                      </div>
                      <Badge variant={absence.justifiee ? "default" : "destructive"} className={absence.justifiee ? "bg-success hover:bg-success" : ""}>
                        {absence.justifiee ? t('parent.dashboard.excused', 'Justifiée') : t('parent.dashboard.unexcused', 'Non justifiée')}
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
