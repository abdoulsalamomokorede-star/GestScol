'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Users, TrendingUp, Calendar, FileText, Filter, GraduationCap, School, Lock } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import PaiementsParClasseChart from '@/components/dashboard/PaiementsParClasseChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCFA, formatDate } from '@/lib/utils'
import { ecoleMock } from '@/data/mockData'

export default function DashboardPage() {
  const { eleves, paiements, absences, classes, enseignants, bulletins, inscriptions, currentUser, notes, anneesScolaires, activeAnneeScolaire, ecole } = useSchoolStore()

  // Filtres
  const [anneeScolaire, setAnneeScolaire] = useState(activeAnneeScolaire?.id || ecoleMock.anneeScolaire)
  const [moisAbsences, setMoisAbsences] = useState('tous')
  const [trimestre, setTrimestre] = useState('tous')

  const router = useRouter()

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'enseignant') router.push('/enseignant/dashboard')
      if (currentUser.role === 'parent') router.push('/parent/dashboard')
    }
  }, [currentUser, router])

  // Synchroniser l'année active locale avec celle du store (notamment après le chargement des données de Supabase)
  useEffect(() => {
    if (activeAnneeScolaire) {
      setAnneeScolaire(activeAnneeScolaire.id)
    }
  }, [activeAnneeScolaire])

  if (!currentUser || currentUser.role !== 'directeur') return null

  // 1. Filtrage global par Année Scolaire
  // Résoudre le nom de l'année scolaire (ex: '2024-2025') à partir de son ID (ex: 'as-2024-2025')
  const selectedAnneeNom = anneesScolaires.find(a => a.id === anneeScolaire)?.nom || anneeScolaire

  const inscriptionsAnnee = inscriptions.filter(i => (i.anneeScolaire === anneeScolaire || i.anneeScolaire === selectedAnneeNom) && i.statut === 'validee')
  const elevesInscritsIds = inscriptionsAnnee.map(i => i.eleveId)

  const elevesActifs = eleves.filter(e => e.statut === 'actif' && elevesInscritsIds.includes(e.id))
  const elevesActifsIds = elevesActifs.map(e => e.id)
  const totalElevesActifs = elevesActifs.length

  const totalEnseignants = enseignants.length
  const totalClasses = classes.length

  // 2. Filtrage des Paiements (Global)
  // Filtré par anneeScolaire et limité aux élèves actifs
  const paiementsFiltres = paiements.filter(p => (p.anneeScolaire === anneeScolaire || p.anneeScolaire === selectedAnneeNom || !p.anneeScolaire) && elevesActifsIds.includes(p.eleveId))

  const totalCollecte = paiementsFiltres.reduce((acc, p) => acc + (p.statut === 'paye' ? Math.max(p.montant, p.montantPaye || 0) : (p.montantPaye || 0)), 0)
  const totalRetards = paiementsFiltres.filter(p => p.statut === 'retard').reduce((acc, p) => acc + Math.max(0, p.montant - (p.montantPaye || 0)), 0)
  const totalEnAttente = paiementsFiltres.filter(p => p.statut === 'en_attente').reduce((acc, p) => acc + Math.max(0, p.montant - (p.montantPaye || 0)), 0)
  const totalDu = paiementsFiltres.reduce((acc, p) => acc + p.montant, 0)
  const tauxPaiement = totalDu > 0 ? Math.round((totalCollecte / totalDu) * 100) : 0

  // Derniers impayés
  const derniersImpayes = paiementsFiltres
    .filter(p => p.statut !== 'paye')
    .sort((a, b) => new Date(a.dateLimite).getTime() - new Date(b.dateLimite).getTime())
    .slice(0, 5)

  // 3. Filtrage des Absences (par Mois et Année)
  const absencesFiltrees = absences.filter(a => {
    if (a.anneeScolaire !== anneeScolaire && a.anneeScolaire !== selectedAnneeNom) return false
    if (!elevesActifsIds.includes(a.eleveId)) return false
    if (moisAbsences === 'tous') return true
    const month = new Date(a.date).getMonth() + 1 // 1-12
    return month.toString().padStart(2, '0') === moisAbsences
  })

  const absencesNonJustifiees = absencesFiltrees.filter(a => !a.justifiee).length

  const dernieresAbsences = [...absencesFiltrees]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // 4. Filtrage des Bulletins (par Trimestre et Année)
  // On considère qu'un bulletin est "généré" ou "prêt" si l'élève a au moins une note dans la période
  const elevesAvecNotes = new Set(
    notes
      .filter(n =>
        (n.anneeScolaire === anneeScolaire || n.anneeScolaire === selectedAnneeNom) &&
        elevesActifsIds.includes(n.eleveId) &&
        (trimestre === 'tous' ? true : n.trimestre === parseInt(trimestre))
      )
      .map(n => n.eleveId)
  )
  const nombreBulletinsGeneres = elevesAvecNotes.size

  // Approximation : 1 bulletin attendu par élève actif pour la période
  const bulletinsAttendus = trimestre === 'tous' ? totalElevesActifs * 3 : totalElevesActifs

  // 5. Calcul dynamique des effectifs par classe (sur les élèves actifs de l'année)
  const effectifsClasses = classes.map(c => {
    const effectif = elevesActifs.filter(e => {
      const inscription = inscriptionsAnnee.find(ins => ins.eleveId === e.id)
      const currentClasseId = inscription ? inscription.classeId : e.classeId
      return currentClasseId === c.id
    }).length
    return {
      nom: c.nom,
      effectif,
      max: 40 // On suppose 40 par défaut
    }
  }).sort((a, b) => b.effectif - a.effectif)

  return (
    <div className="space-y-6 pb-8">
      {/* En-tête avec filtres */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-card p-4 rounded-lg shadow-sm border border-border/50">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">Tableau de Bord</h2>
          <p className="text-sm text-muted-foreground">Aperçu en temps réel de votre établissement.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
              <SelectTrigger className="w-full sm:w-[150px] bg-background">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {anneesScolaires.map(annee => (
                  <SelectItem key={annee.id} value={annee.id}>{annee.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={trimestre} onValueChange={setTrimestre}>
            <SelectTrigger className="w-full sm:w-[160px] bg-background">
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les trimestres</SelectItem>
              <SelectItem value="1">1er Trimestre</SelectItem>
              <SelectItem value="2">2ème Trimestre</SelectItem>
              <SelectItem value="3">3ème Trimestre</SelectItem>
            </SelectContent>
          </Select>

          <Select value={moisAbsences} onValueChange={setMoisAbsences}>
            <SelectTrigger className="w-full sm:w-[150px] bg-background">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les mois</SelectItem>
              <SelectItem value="01">Janvier</SelectItem>
              <SelectItem value="02">Février</SelectItem>
              <SelectItem value="03">Mars</SelectItem>
              <SelectItem value="04">Avril</SelectItem>
              <SelectItem value="05">Mai</SelectItem>
              <SelectItem value="06">Juin</SelectItem>
              <SelectItem value="07">Juillet</SelectItem>
              <SelectItem value="08">Août</SelectItem>
              <SelectItem value="09">Septembre</SelectItem>
              <SelectItem value="10">Octobre</SelectItem>
              <SelectItem value="11">Novembre</SelectItem>
              <SelectItem value="12">Décembre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs (6 Cartes) en grille 3x2 sur grand écran */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Élèves Actifs de l'année scolaire"
          value={totalElevesActifs}
          icon={Users}
          subtitle="Total inscrits"
        />
        <KpiCard
          title="Enseignants de l'année scolaire"
          value={totalEnseignants}
          icon={GraduationCap}
          subtitle="Enseignants actifs"
          isLocked={ecole?.abonnement?.plan === 'gratuit'}
        />
        <KpiCard
          title="Classes de l'année scolaire"
          value={totalClasses}
          icon={School}
          subtitle="Classes ouvertes"
        />
        <KpiCard
          title="Recouvrement des Frais de scolarité"
          value={`${tauxPaiement}%`}
          icon={TrendingUp}
          subtitle="Scolarité globale payée"
          trend={tauxPaiement > 80 ? { value: '+', isPositive: true } : undefined}
        />
        <KpiCard
          title="Absences Non Justifiées"
          value={absencesNonJustifiees}
          icon={Calendar}
          subtitle={moisAbsences === 'tous' ? "Depuis le début de l'année scolaire" : `Pour le mois ${moisAbsences}`}
          isLocked={ecole?.abonnement?.plan === 'gratuit'}
        />
        <KpiCard
          title="Bulletins Générés"
          value={`${nombreBulletinsGeneres}/${bulletinsAttendus}`}
          icon={FileText}
          subtitle={trimestre === 'tous' ? "Générés sur l'année scolaire" : `Générés au T${trimestre}`}
          isLocked={ecole?.abonnement?.plan === 'gratuit'}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PaiementsParClasseChart 
          classes={classes} 
          eleves={eleves} 
          paiements={paiementsFiltres} 
          inscriptions={inscriptions} 
          anneeScolaire={anneeScolaire} 
        />

        <Card className="col-span-1 shadow-sm border-border/50 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-display">Effectifs par Classe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-y-auto max-h-[350px] no-scrollbar">
            {effectifsClasses.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm">Aucune classe enregistrée.</p>
            ) : (
              effectifsClasses.map(classe => (
                <div key={classe.nom} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text">{classe.nom}</span>
                    <span className="text-muted-foreground">{classe.effectif} élèves</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${(classe.effectif / classe.max) >= 1 ? 'bg-danger' :
                        (classe.effectif / classe.max) > 0.8 ? 'bg-warning' : 'bg-primary'
                        }`}
                      style={{ width: `${Math.min((classe.effectif / classe.max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ligne 3 : Tableaux */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Derniers impayés */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">
              Derniers Impayés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {derniersImpayes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">Aucun impayé trouvé.</p>
              ) : (
                derniersImpayes.map(paiement => {
                  const eleve = eleves.find(e => e.id === paiement.eleveId)
                  if (!eleve) return null
                  return (
                    <div key={paiement.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-text text-sm">{eleve.prenom} {eleve.nom}</p>
                        <p className="text-xs text-muted-foreground">Échéance: {formatDate(paiement.dateLimite)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-danger text-sm">{formatCFA(Math.max(0, paiement.montant - (paiement.montantPaye || 0)))}</p>
                        <Badge variant="outline" className={paiement.statut === 'retard' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-warning/10 text-warning border-warning/20'}>
                          {paiement.statut === 'retard' ? 'En Retard' : 'En Attente'}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dernières absences */}
        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              {moisAbsences === 'tous' ? "Absences Récentes" : `Absences du Mois (${moisAbsences})`}
            </CardTitle>
            {ecole?.abonnement?.plan === 'gratuit' && (
              <span className="text-[9px] bg-amber-500/20 text-amber-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                👑 Premium
              </span>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {ecole?.abonnement?.plan === 'gratuit' ? (
              <div className="text-center py-8 space-y-3">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-text">Suivi des Absences Verrouillé</h4>
                <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                  L'accès à l'assiduité en temps réel, aux feuilles d'appel et au suivi des retards est réservé aux formules payantes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dernieresAbsences.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">Aucune absence trouvée.</p>
                ) : (
                  dernieresAbsences.map(absence => {
                    const eleve = eleves.find(e => e.id === absence.eleveId)
                    if (!eleve) return null
                    return (
                      <div key={absence.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-text text-sm">{eleve.prenom} {eleve.nom}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(absence.date)} ({absence.seance})</p>
                        </div>
                        <Badge variant="outline" className={absence.justifiee ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}>
                          {absence.justifiee ? 'Justifiée' : 'Non justifiée'}
                        </Badge>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
