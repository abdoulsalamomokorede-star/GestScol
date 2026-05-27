'use client'

import { useState } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { formatCFA, formatDate, getInitiales } from '@/lib/utils'
import KpiCard from '@/components/dashboard/KpiCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  CreditCard, 
  Search, 
  Coins, 
  AlertTriangle, 
  TrendingUp, 
  Filter, 
  FileText, 
  Receipt,
  GraduationCap,
  Settings,
  Percent,
  ChevronRight,
  Sparkles,
  Loader2,
  Check,
  ChevronsUpDown
} from 'lucide-react'
import PaiementModal from '@/components/paiements/PaiementModal'
import RecuModal from '@/components/paiements/RecuModal'
import { Paiement, Classe } from '@/types'

export default function PaiementsPage() {
  const { 
    paiements, 
    eleves, 
    classes, 
    currentUser,
    updateClasseTarifs,
    anneesScolaires,
    activeAnneeScolaire,
    inscriptions
  } = useSchoolStore()

  const { toast } = useToast()

  // États pour les filtres (Directeur uniquement)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClasseId, setSelectedClasseId] = useState('all')
  const [selectedStatut, setSelectedStatut] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  
  const [classeSearchQuery, setClasseSearchQuery] = useState('')
  const [isClasseComboboxOpen, setIsClasseComboboxOpen] = useState(false)
  const [selectedAnneeId, setSelectedAnneeId] = useState<string>(activeAnneeScolaire?.id || 'all')

  const getEleveClasse = (eleveId: string, anneeScolaire?: string) => {
    const annee = anneeScolaire || activeAnneeScolaire?.id;
    const inscription = inscriptions.find(i => i.eleveId === eleveId && i.anneeScolaire === annee && i.statut === 'validee');
    if (inscription) {
      return classes.find(c => c.id === inscription.classeId);
    }
    const eleve = eleves.find(e => e.id === eleveId);
    return classes.find(c => c.id === eleve?.classeId);
  }

  // États pour les Modales
  const [isPaiementOpen, setIsPaiementOpen] = useState(false)
  const [selectedPaiementForEncaissement, setSelectedPaiementForEncaissement] = useState<Paiement | null>(null)
  
  const [isRecuOpen, setIsRecuOpen] = useState(false)
  const [selectedPaiementForRecu, setSelectedPaiementForRecu] = useState<Paiement | null>(null)

  // États pour la Gestion des Scolarités (Tarifs par classe)
  const [isScolariteDialogOpen, setIsScolariteDialogOpen] = useState(false)
  const [selectedClasseForScolarite, setSelectedClasseForScolarite] = useState<Classe | null>(null)
  const [nouveauMontantScolarite, setNouveauMontantScolarite] = useState('')
  const [nouveauMontantInscription, setNouveauMontantInscription] = useState('')
  const [isUpdatingTarif, setIsUpdatingTarif] = useState(false)

  if (!currentUser) return null

  // Restreindre l'accès aux directeurs et parents
  if (currentUser.role !== 'directeur' && currentUser.role !== 'parent') {
    return (
      <div className="p-8 text-center text-danger font-bold">
        Accès non autorisé pour ce profil.
      </div>
    )
  }

  // Rendu unifié des badges avec un excellent contraste
  const renderStatutBadge = (statut: string) => {
    switch (statut) {
      case 'paye':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 font-bold px-2.5 py-0.5 rounded-full border shadow-none">
            Payé
          </Badge>
        )
      case 'retard':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30 font-bold px-2.5 py-0.5 rounded-full border shadow-none animate-pulse">
            En retard
          </Badge>
        )
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30 font-bold px-2.5 py-0.5 rounded-full border shadow-none">
            En attente
          </Badge>
        )
    }
  }

  // Mise à jour du tarif de scolarité
  const handleSaveScolarite = () => {
    if (!selectedClasseForScolarite) return

    const amtScol = parseInt(nouveauMontantScolarite, 10)
    const amtInsc = parseInt(nouveauMontantInscription, 10)
    if (isNaN(amtScol) || amtScol < 0 || isNaN(amtInsc) || amtInsc < 0) {
      toast({
        title: 'Montants invalides',
        description: 'Veuillez saisir des tarifs valides (nombres positifs).',
        variant: 'destructive',
      })
      return
    }

    setIsUpdatingTarif(true)
    
    // Simulation pour un effet premium et réaliste
    setTimeout(() => {
      try {
        updateClasseTarifs(selectedClasseForScolarite.id, amtScol, amtInsc)
        toast({
          title: 'Tarifs mis à jour avec succès',
          description: `Les tarifs de la classe ${selectedClasseForScolarite.nom} ont été mis à jour.`,
          variant: 'default',
        })
        setIsScolariteDialogOpen(false)
        setSelectedClasseForScolarite(null)
      } catch (err) {
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la mise à jour du tarif.',
          variant: 'destructive',
        })
      } finally {
        setIsUpdatingTarif(false)
      }
    }, 600)
  }

  const getPaiementTypeLabel = (type: string) => {
    switch (type) {
      case 'inscription':
        return "Frais d'inscription"
      case 'scolarite':
        return 'Scolarité Globale'
      case 'cantine':
        return 'Cantine'
      case 'transport':
        return 'Transport'
      default:
        return type
    }
  }

  // ==========================================
  // LOGIQUE VUE PARENT
  // ==========================================
  const renderParentView = () => {
    const parentFullName = `${currentUser.nom} ${currentUser.prenom}`
    const mesEnfants = eleves.filter(
      e => e.parentNom === parentFullName || e.parentNom?.includes(currentUser.nom) || e.parentUserId === currentUser.id
    )

    const mesPaiements = paiements.filter(p => mesEnfants.some(e => e.id === p.eleveId))

    // Calculs financiers pour le parent prenant en compte les paiements partiels
    const totalPaye = mesPaiements.reduce((acc, curr) => 
      acc + (curr.statut === 'paye' ? Math.max(curr.montant, curr.montantPaye || 0) : (curr.montantPaye || 0)), 
    0)
      
    const resteAPayer = mesPaiements.reduce((acc, curr) => 
      acc + Math.max(0, curr.montant - (curr.montantPaye || 0)), 
    0)
      
    const nbRetards = mesPaiements.filter(p => p.statut === 'retard').length

    const handleOpenRecu = (p: Paiement) => {
      setSelectedPaiementForRecu(p)
      setIsRecuOpen(true)
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-text">Mes Règlements</h2>
          <p className="text-sm text-muted-foreground">
            Suivi des frais d&apos;inscription et de scolarité pour vos enfants.
          </p>
        </div>

        {/* KPIs Parent */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <KpiCard
            title="Total Réglé"
            value={formatCFA(totalPaye)}
            icon={Coins}
            subtitle="Frais payés à ce jour"
          />
          <KpiCard
            title="Reste à Payer"
            value={formatCFA(resteAPayer)}
            icon={CreditCard}
            subtitle="Solde en attente de règlement"
          />
          <KpiCard
            title="Factures en Retard"
            value={nbRetards}
            icon={AlertTriangle}
            subtitle="Paiements hors délai"
            trend={nbRetards > 0 ? { value: 'À régulariser', isPositive: false } : undefined}
          />
        </div>

        {/* Liste des Règlements des enfants */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-text">Détail des frais par enfant</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {mesPaiements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun paiement répertorié.</p>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block sm:hidden divide-y divide-border/50">
                  {mesPaiements.map(p => {
                    const enfant = mesEnfants.find(e => e.id === p.eleveId)
                    const classe = getEleveClasse(p.eleveId, p.anneeScolaire)
                    return (
                      <div key={p.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-text text-sm">{enfant?.prenom} {enfant?.nom}</p>
                            <p className="text-xs text-muted-foreground">Classe: {classe?.nom}</p>
                          </div>
                          {renderStatutBadge(p.statut)}
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <p className="text-muted-foreground font-medium">{getPaiementTypeLabel(p.type)}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {p.statut === 'paye' 
                                ? `Payé le ${p.datePaiement ? formatDate(p.datePaiement) : ''}`
                                : `Échéance: ${formatDate(p.dateLimite)}`
                              }
                            </p>
                          </div>
                          <div className="text-right space-y-2">
                            <div>
                              <p className="font-extrabold text-text text-sm">{formatCFA(p.montant)}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Déjà payé: {formatCFA(p.montantPaye || 0)}</p>
                            </div>
                            {(p.montantPaye || 0) > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenRecu(p)}
                                className="h-7 text-primary hover:text-primary-dark p-0 mt-1 font-bold text-xs flex items-center"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-1" />
                                Voir Reçu
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-xs uppercase font-bold text-muted-foreground">
                        <th className="p-4">Enfant</th>
                        <th className="p-4">Frais</th>
                        <th className="p-4">Montant</th>
                        <th className="p-4">Statut</th>
                        <th className="p-4">Échéance / Paiement</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {mesPaiements.map(p => {
                        const enfant = mesEnfants.find(e => e.id === p.eleveId)
                        const classe = getEleveClasse(p.eleveId, p.anneeScolaire)
                        return (
                          <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-text">{enfant?.prenom} {enfant?.nom}</p>
                              <p className="text-xs text-muted-foreground">Classe: {classe?.nom}</p>
                            </td>
                            <td className="p-4 font-medium text-text">
                              {getPaiementTypeLabel(p.type)}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-text">{formatCFA(p.montant)}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">Déjà payé: {formatCFA(p.montantPaye || 0)}</div>
                            </td>
                            <td className="p-4">
                              {renderStatutBadge(p.statut)}
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {p.statut === 'paye' 
                                ? `Réglé le ${p.datePaiement ? formatDate(p.datePaiement) : ''}`
                                : `Échéance le ${formatDate(p.dateLimite)}`
                              }
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex flex-col items-end gap-2">
                                {(p.montantPaye || 0) > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenRecu(p)}
                                    className="border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 font-semibold text-xs w-full justify-center px-2 sm:px-3"
                                    title="Télécharger le reçu"
                                  >
                                    <Receipt className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Reçu</span>
                                  </Button>
                                )}
                                {p.statut !== 'paye' && (
                                  <span className="text-xs text-muted-foreground font-medium">À payer en caisse</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==========================================
  // LOGIQUE VUE DIRECTEUR
  // ==========================================
  const renderDirecteurView = () => {
    // 1. Récupérer les inscriptions validées
    const { inscriptions } = useSchoolStore()
    const inscriptionsAnnee = inscriptions.filter(i => 
      i.statut === 'validee' && 
      (selectedAnneeId === 'all' || i.anneeScolaire === selectedAnneeId)
    )
    const validEleveIds = inscriptionsAnnee.map(i => i.eleveId)

    // Filtre par année scolaire d'abord pour les KPIs
    const paiementsAnneeCourante = paiements.filter(p => {
      if (selectedAnneeId !== 'all' && p.anneeScolaire !== selectedAnneeId) return false
      return validEleveIds.includes(p.eleveId)
    })

    // Déduplication de sécurité : un seul paiement par type et par élève
    // On ignore l'année scolaire dans la clé de déduplication pour éviter les doublons dus à des valeurs nulles/anciennes dans la base
    const paiementsUniques = Array.from(new Map(paiementsAnneeCourante.map(p => 
      [`${p.eleveId}-${p.type}`, p]
    )).values())

    // Calculs KPIs globaux prenant en compte les montants partiellement payés
    const totalCollecte = paiementsUniques.reduce((acc, p) => acc + (p.statut === 'paye' ? Math.max(p.montant, p.montantPaye || 0) : (p.montantPaye || 0)), 0)

    const totalRetards = paiementsUniques
      .filter(p => p.statut === 'retard')
      .reduce((acc, p) => acc + Math.max(0, p.montant - (p.montantPaye || 0)), 0)

    const totalEnAttente = paiementsUniques
      .filter(p => p.statut === 'en_attente')
      .reduce((acc, p) => acc + Math.max(0, p.montant - (p.montantPaye || 0)), 0)

    const totalDu = paiementsUniques.reduce((acc, p) => acc + p.montant, 0)
    const tauxRecouvrement = totalDu > 0 ? Math.round((totalCollecte / totalDu) * 100) : 0

    // Filtres
    const paiementsFiltrés = paiementsUniques.filter(p => {
      const eleve = eleves.find(e => e.id === p.eleveId)
      if (!eleve) return false

      const matchesSearch = 
        `${eleve.prenom} ${eleve.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eleve.matricule.toLowerCase().includes(searchQuery.toLowerCase())

      const classeEleve = getEleveClasse(p.eleveId, p.anneeScolaire)
      const matchesClasse = selectedClasseId === 'all' || classeEleve?.id === selectedClasseId
      const matchesStatut = selectedStatut === 'all' || p.statut === selectedStatut
      const matchesType = selectedType === 'all' || p.type === selectedType

      return matchesSearch && matchesClasse && matchesStatut && matchesType
    })

    const handleOpenEncaissement = (p: Paiement) => {
      setSelectedPaiementForEncaissement(p)
      setIsPaiementOpen(true)
    }

    const handleOpenRecu = (p: Paiement) => {
      setSelectedPaiementForRecu(p)
      setIsRecuOpen(true)
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-text">Suivi de la Scolarité</h2>
            <p className="text-sm text-muted-foreground">
              Encaissement des frais d&apos;inscription et recouvrement de la scolarité en temps réel.
            </p>
          </div>
        </div>

        {/* KPIs Directeur */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
          <KpiCard
            title="Total Collecté"
            value={formatCFA(totalCollecte)}
            icon={Coins}
            subtitle="Somme encaissée"
          />
          <KpiCard
            title="Frais en Retard"
            value={formatCFA(totalRetards)}
            icon={AlertTriangle}
            subtitle="Créances à recouvrer"
            trend={{ value: 'Retards cumulés', isPositive: false }}
          />
          <KpiCard
            title="Frais en Attente"
            value={formatCFA(totalEnAttente)}
            icon={CreditCard}
            subtitle="Échéances futures"
          />
          <KpiCard
            title="Taux de Recouvrement"
            value={`${tauxRecouvrement}%`}
            icon={TrendingUp}
            subtitle="Ratio encaissé / total"
            trend={tauxRecouvrement >= 70 ? { value: 'Très satisfaisant', isPositive: true } : { value: 'À améliorer', isPositive: false }}
          />
        </div>

        {/* Navigation par Onglets */}
        <Tabs defaultValue="reglements" className="space-y-6">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="bg-muted/50 p-1 border border-border/40 rounded-xl inline-flex min-w-max">
              <TabsTrigger value="reglements" className="rounded-lg font-semibold px-4 py-2 text-xs sm:text-sm">
                <Coins className="h-4 w-4 mr-2" />
                Suivi des Règlements
              </TabsTrigger>
              <TabsTrigger value="scolarites" className="rounded-lg font-semibold px-4 py-2 text-xs sm:text-sm">
                <GraduationCap className="h-4 w-4 mr-2" />
                Gestion des Scolarités
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="reglements" className="space-y-6 mt-0">
            {/* Barre de Filtres */}
            <Card className="shadow-sm border-border/50 bg-card">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center space-x-2 text-primary font-semibold text-sm">
                  <Filter className="h-4 w-4" />
                  <span>Filtres de recherche</span>
                </div>
                
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                  {/* Sélecteur Année Scolaire */}
                  <Select value={selectedAnneeId} onValueChange={setSelectedAnneeId}>
                    <SelectTrigger className="w-full bg-background border-border text-sm">
                      <SelectValue placeholder="Toutes les années" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les années</SelectItem>
                      {anneesScolaires.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Barre de recherche */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Élève ou Matricule..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background border-border text-text placeholder-muted-foreground text-sm"
                    />
                  </div>

                  {/* Sélecteur Classe */}
                  <Popover open={isClasseComboboxOpen} onOpenChange={setIsClasseComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isClasseComboboxOpen}
                        className="w-full justify-between font-normal text-sm bg-background border-border"
                      >
                        {selectedClasseId === 'all'
                          ? "Toutes les classes"
                          : classes.find((c) => c.id === selectedClasseId)?.nom || "Toutes les classes"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <div className="flex flex-col">
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <Input
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 shadow-none"
                            placeholder="Rechercher une classe..."
                            value={classeSearchQuery}
                            onChange={(e) => setClasseSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-1">
                          <div
                            className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${selectedClasseId === 'all' ? 'bg-accent/50' : ''}`}
                            onClick={() => { setSelectedClasseId('all'); setIsClasseComboboxOpen(false); }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${selectedClasseId === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                            Toutes les classes
                          </div>
                          {classes
                            .filter(c => c.nom.toLowerCase().includes(classeSearchQuery.toLowerCase()))
                            .map((c) => (
                              <div
                                key={c.id}
                                className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${selectedClasseId === c.id ? 'bg-accent/50' : ''}`}
                                onClick={() => { setSelectedClasseId(c.id); setIsClasseComboboxOpen(false); }}
                              >
                                <Check className={`mr-2 h-4 w-4 ${selectedClasseId === c.id ? 'opacity-100' : 'opacity-0'}`} />
                                {c.nom}
                              </div>
                            ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {/* Sélecteur Statut */}
                  <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                    <SelectTrigger className="w-full bg-background border-border text-sm">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="paye">Payé</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="retard">En retard</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Sélecteur Type */}
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full bg-background border-border text-sm">
                      <SelectValue placeholder="Tous les types de frais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types de frais</SelectItem>
                      <SelectItem value="inscription">Frais d'inscription</SelectItem>
                      <SelectItem value="scolarite">Scolarité</SelectItem>
                      <SelectItem value="cantine">Cantine</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tableau de gestion */}
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-0">
                {paiementsFiltrés.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                    <CreditCard className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="font-medium">Aucun règlement ne correspond à vos filtres.</p>
                    <p className="text-xs text-muted-foreground mt-1">Ajustez la recherche ou le filtre de classe.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile view as responsive cards */}
                    <div className="block md:hidden divide-y divide-border/50">
                      {paiementsFiltrés.map(p => {
                        const eleve = eleves.find(e => e.id === p.eleveId)
                        const classe = getEleveClasse(p.eleveId, p.anneeScolaire)
                        return (
                          <div key={p.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-9 w-9 border border-primary/20">
                                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                    {eleve ? getInitiales(eleve.nom, eleve.prenom) : '-'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-text text-sm">{eleve?.prenom} {eleve?.nom}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{eleve?.matricule}</p>
                                </div>
                              </div>
                              {renderStatutBadge(p.statut)}
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <p className="text-muted-foreground font-medium">Classe: <span className="font-semibold text-text">{classe?.nom}</span></p>
                                <p className="text-muted-foreground mt-0.5">
                                  {getPaiementTypeLabel(p.type)} • {p.statut === 'paye' 
                                    ? `Le ${p.datePaiement ? formatDate(p.datePaiement) : ''}`
                                    : `Éch: ${formatDate(p.dateLimite)}`
                                  }
                                </p>
                              </div>
                              <div className="text-right space-y-2">
                                <div>
                                  <p className="font-extrabold text-text text-sm">{formatCFA(p.montant)}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">Déjà payé: {formatCFA(p.montantPaye || 0)}</p>
                                </div>
                                {(p.montantPaye || 0) > 0 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenRecu(p)}
                                    className="h-7 text-primary hover:text-primary-dark font-bold text-xs p-0 flex items-center justify-end w-full"
                                  >
                                    <Receipt className="h-3.5 w-3.5 mr-1" />
                                    Reçu
                                  </Button>
                                )}
                                {p.statut !== 'paye' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenEncaissement(p)}
                                    className="h-7 bg-primary hover:bg-primary-dark text-white font-bold text-xs px-2.5 rounded w-full"
                                  >
                                    Encaisser
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop view as full table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-muted/20 text-xs uppercase font-bold text-muted-foreground">
                            <th className="p-4">Élève</th>
                            <th className="p-4">Classe</th>
                            <th className="p-4">Type de frais</th>
                            <th className="p-4">Montant</th>
                            <th className="p-4">Statut</th>
                            <th className="p-4">Date de Paiement / Échéance</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {paiementsFiltrés.map(p => {
                            const eleve = eleves.find(e => e.id === p.eleveId)
                            const classe = getEleveClasse(p.eleveId, p.anneeScolaire)
                            if (!eleve || !classe) return null
                            return (
                              <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10 border border-primary/20">
                                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                        {getInitiales(eleve.nom, eleve.prenom)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-bold text-text">{eleve.prenom} {eleve.nom}</p>
                                      <p className="text-xs text-muted-foreground font-mono">Matricule: {eleve.matricule}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 font-semibold text-text">
                                  {classe.nom}
                                </td>
                                <td className="p-4 font-medium text-text">
                                  {getPaiementTypeLabel(p.type)}
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-text">{formatCFA(p.montant)}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">Déjà payé: {formatCFA(p.montantPaye || 0)}</div>
                                </td>
                                <td className="p-4">
                                  {renderStatutBadge(p.statut)}
                                </td>
                                <td className="p-4 text-xs text-muted-foreground font-medium">
                                  {p.statut === 'paye' ? (
                                    <span className="text-success flex items-center">
                                      Le {p.datePaiement ? formatDate(p.datePaiement) : ''}
                                      {p.modePaiement && <span className="ml-1 opacity-70">({p.modePaiement.toUpperCase()})</span>}
                                    </span>
                                  ) : (
                                    <span>Échéance: {formatDate(p.dateLimite)}</span>
                                  )}
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex flex-col items-end gap-2">
                                    {(p.montantPaye || 0) > 0 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenRecu(p)}
                                        className="border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 font-semibold text-xs w-full justify-center px-2 sm:px-3"
                                        title="Télécharger le reçu"
                                      >
                                        <Receipt className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Reçu</span>
                                      </Button>
                                    )}
                                    {p.statut !== 'paye' && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleOpenEncaissement(p)}
                                        className="bg-primary hover:bg-primary-dark text-white font-bold text-xs w-full justify-center"
                                      >
                                        Encaisser
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scolarites" className="space-y-6 mt-0">
            {/* Tableau de Gestion des Scolarités */}
            <Card className="shadow-sm border-border/50 bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-display font-bold text-text">Tarifs & Recouvrement par Classe</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Situation financière globale et taux de recouvrement par classe.</p>
                </div>
                <div className="flex items-center space-x-1.5 bg-primary/5 text-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-primary/10">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Configuration des Tarifs</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-xs uppercase font-bold text-muted-foreground">
                        <th className="p-4">Classe</th>
                        <th className="p-4">Effectif</th>
                        <th className="p-4">Tarif Annuel</th>
                        <th className="p-4">Total Dû</th>
                        <th className="p-4">Total Encaissé</th>
                        <th className="p-4">Reste à Recouvrer</th>
                        <th className="p-4">Taux de Recouvrement</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {classes.map(c => {
                        const anneeObj = anneesScolaires.find(a => a.id === selectedAnneeId)
                        const anneeNom = anneeObj ? anneeObj.nom : selectedAnneeId

                        // On prend uniquement les inscriptions validées pour la classe et l'année sélectionnée
                        const inscriptionsClasseAnnee = inscriptions.filter(i => 
                          (selectedAnneeId === 'all' ? true : i.anneeScolaire === selectedAnneeId) && 
                          i.statut === 'validee' && 
                          i.classeId === c.id
                        )
                        
                        const effectifClasseAnnee = inscriptionsClasseAnnee.length
                        const validElevesIds = inscriptionsClasseAnnee.map(i => i.eleveId)
                        
                        const elevesClasse = eleves.filter(e => validElevesIds.includes(e.id))
                        
                        const paiementsClasse = paiementsUniques.filter(p => 
                          (selectedAnneeId === 'all' ? true : p.anneeScolaire === selectedAnneeId) &&
                          validElevesIds.includes(p.eleveId)
                        )
                        
                        // Tarif annuel = Scolarité + Inscription (c.montantScolarite + c.montantInscription)
                        const tarifAnnuel = c.montantScolarite + c.montantInscription
                        
                        const totalDuClasse = tarifAnnuel * effectifClasseAnnee
                        const totalCollecteClasse = paiementsClasse.reduce((acc, p) => acc + (p.montantPaye || 0), 0)
                        const resteARecouvrerClasse = totalDuClasse - totalCollecteClasse
                        const tauxRecouvrementClasse = totalDuClasse > 0 ? Math.round((totalCollecteClasse / totalDuClasse) * 100) : 0
                        
                        return (
                          <tr key={c.id} className="hover:bg-muted/5 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-text">{c.nom}</p>
                              <p className="text-xs text-muted-foreground">{c.niveau}</p>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">
                                {effectifClasseAnnee} élève{effectifClasseAnnee > 1 ? 's' : ''}
                              </Badge>
                            </td>
                            <td className="p-4 font-bold text-text">
                              {formatCFA(tarifAnnuel)}
                            </td>
                            <td className="p-4 font-bold text-text">
                              {formatCFA(totalDuClasse)}
                            </td>
                            <td className="p-4 font-bold text-success">
                              {formatCFA(totalCollecteClasse)}
                            </td>
                            <td className="p-4 font-bold text-danger">
                              {formatCFA(resteARecouvrerClasse)}
                            </td>
                            <td className="p-4">
                              <div className="space-y-1.5 max-w-[140px]">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                  <span className="text-muted-foreground">{tauxRecouvrementClasse}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      tauxRecouvrementClasse >= 90 ? 'bg-emerald-500' :
                                      tauxRecouvrementClasse >= 70 ? 'bg-primary' :
                                      tauxRecouvrementClasse >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${tauxRecouvrementClasse}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedClasseForScolarite(c)
                                  setNouveauMontantScolarite(c.montantScolarite.toString())
                                  setNouveauMontantInscription(c.montantInscription.toString())
                                  setIsScolariteDialogOpen(true)
                                }}
                                className="border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 font-semibold text-xs"
                              >
                                <Settings className="h-3.5 w-3.5 mr-1.5" />
                                Ajuster
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Récupérer les entités pour les modales
  const getModalEntities = () => {
    if (selectedPaiementForEncaissement) {
      const eleve = eleves.find(e => e.id === selectedPaiementForEncaissement.eleveId)
      const classe = classes.find(c => c.id === eleve?.classeId)
      return {
        eleveName: eleve ? `${eleve.prenom} ${eleve.nom}` : '',
        classeNom: classe?.nom || '',
      }
    }
    if (selectedPaiementForRecu) {
      const eleve = eleves.find(e => e.id === selectedPaiementForRecu.eleveId)
      const classe = classes.find(c => c.id === eleve?.classeId)
      return { eleve, classe }
    }
    return {}
  }

  const { eleveName, classeNom } = getModalEntities()
  const { eleve: recuEleve, classe: recuClasse } = getModalEntities()

  return (
    <>
      {currentUser.role === 'directeur' ? renderDirecteurView() : renderParentView()}

      {/* Modale d'Encaissement */}
      {selectedPaiementForEncaissement && (
        <PaiementModal
          isOpen={isPaiementOpen}
          onClose={() => {
            setIsPaiementOpen(false)
            setSelectedPaiementForEncaissement(null)
          }}
          paiement={selectedPaiementForEncaissement}
          eleveName={eleveName || ''}
          classeNom={classeNom || ''}
        />
      )}

      {/* Modale de Reçu */}
      {selectedPaiementForRecu && recuEleve && recuClasse && (
        <RecuModal
          isOpen={isRecuOpen}
          onClose={() => {
            setIsRecuOpen(false)
            setSelectedPaiementForRecu(null)
          }}
          paiement={selectedPaiementForRecu}
          eleve={recuEleve}
          classe={recuClasse}
        />
      )}

      {/* Dialogue d'Ajustement du Tarif */}
      {isScolariteDialogOpen && selectedClasseForScolarite && (
        <Dialog open={isScolariteDialogOpen} onOpenChange={setIsScolariteDialogOpen}>
          <DialogContent className="sm:max-w-[420px] bg-card border-border/50 text-text">
            <DialogHeader>
              <DialogTitle className="text-xl font-display font-bold">Ajuster les tarifs</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Modifiez les tarifs par défaut appliqués aux élèves de la classe <span className="font-semibold text-text">{selectedClasseForScolarite.nom}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="nouveauTarifScol" className="text-sm font-semibold text-text">
                  Tarif scolarité (trimestriel) <span className="text-danger">*</span>
                </Label>
                <Input
                  id="nouveauTarifScol"
                  type="number"
                  min="0"
                  value={nouveauMontantScolarite}
                  onChange={(e) => setNouveauMontantScolarite(e.target.value)}
                  className="bg-background border-border text-text font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nouveauTarifInsc" className="text-sm font-semibold text-text">
                  Frais d'inscription (annuel) <span className="text-danger">*</span>
                </Label>
                <Input
                  id="nouveauTarifInsc"
                  type="number"
                  min="0"
                  value={nouveauMontantInscription}
                  onChange={(e) => setNouveauMontantInscription(e.target.value)}
                  className="bg-background border-border text-text font-bold"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ces tarifs seront appliqués par défaut pour les règlements à venir.
              </p>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsScolariteDialogOpen(false)
                  setSelectedClasseForScolarite(null)
                }}
                className="border-border text-text hover:bg-muted hover:text-text w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveScolarite}
                disabled={isUpdatingTarif}
                className="bg-primary hover:bg-primary-dark text-white font-bold w-full sm:w-auto"
              >
                {isUpdatingTarif ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
