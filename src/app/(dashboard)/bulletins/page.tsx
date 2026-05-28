'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSchoolStore } from '@/store/useSchoolStore'
import { ecoleMock } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'
import { formatCFA } from '@/lib/utils'
import { 
  FileText, 
  Download, 
  Save, 
  Award, 
  Users, 
  TrendingUp, 
  CheckCircle,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { getInitiales } from '@/lib/utils'
import BulletinPDF from '@/components/bulletins/BulletinPDF'

import { Combobox } from '@/components/ui/combobox'
import { PremiumGuard } from '@/components/ui/PremiumGuard'

// Chargement dynamique de PDFDownloadLink pour éviter les erreurs de SSR Next.js
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <Button variant="outline" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin mr-2" /> Préparation...</Button> }
)

export default function BulletinsPage() {
  const { toast } = useToast()
  
  // Accès au store Zustand
  const { 
    classes, 
    eleves, 
    matieres, 
    enseignants, 
    notes,
    absences,
    bulletins,
    anneesScolaires,
    activeAnneeScolaire,
    addBulletin, 
    updateBulletin,
    calculerBulletinsClasse,
    ecole
  } = useSchoolStore()

  // États locaux
  const [selectedClasseId, setSelectedClasseId] = useState<string>('')
  const [selectedTrimestre, setSelectedTrimestre] = useState<string>('1')
  const [selectedAnneeId, setSelectedAnneeId] = useState<string>('')
  const [appreciationInputs, setAppreciationInputs] = useState<Record<string, string>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  // S'assurer du montage client
  useEffect(() => {
    setIsMounted(true)
    if (activeAnneeScolaire) {
      setSelectedAnneeId(activeAnneeScolaire.id)
    } else if (anneesScolaires.length > 0) {
      setSelectedAnneeId(anneesScolaires[0].id)
    }
    if (classes.length > 0) {
      setSelectedClasseId(classes[0].id)
    }
  }, [classes, activeAnneeScolaire, anneesScolaires])

  // Charger les appréciations initiales des bulletins du store lorsque la classe/trimestre change
  const currentClasse = classes.find(c => c.id === selectedClasseId)
  const trimestreNum = Number(selectedTrimestre) as 1 | 2 | 3
  
  // Calculer les bulletins à la volée
  const bulletinsCalcules = selectedClasseId && selectedAnneeId
    ? calculerBulletinsClasse(selectedClasseId, trimestreNum, selectedAnneeId)
    : []

  // Mettre à jour les appréciations dans le state local
  useEffect(() => {
    const inputs: Record<string, string> = {}
    bulletinsCalcules.forEach(b => {
      inputs[b.id] = b.appreciationDirecteur || ''
    })
    setAppreciationInputs(inputs)
  }, [selectedClasseId, selectedTrimestre, selectedAnneeId])

  if (!isMounted) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Bloquer l'accès si l'établissement utilise la formule gratuite
  if (ecole?.abonnement?.plan === 'gratuit') {
    return (
      <PremiumGuard 
        title="Générateur de Bulletins" 
        description="Générez les bulletins officiels de l'établissement sous format PDF A4 en un clic. Saisissez l'appréciation globale de la direction, calculez les moyennes générales et les moyennes de classe, et déterminez le rang de chaque élève automatiquement."
      />
    )
  }

  // Filtrer par recherche
  const bulletinsFiltrés = bulletinsCalcules.filter(b => {
    const eleve = eleves.find(e => e.id === b.eleveId)
    if (!eleve) return false
    const nomComplet = `${eleve.nom} ${eleve.prenom}`.toLowerCase()
    return nomComplet.includes(searchQuery.toLowerCase()) || eleve.matricule.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Vérifier s'il y a des bulletins avec des notes pour le téléchargement global
  const bulletinsAvecNotes = bulletinsCalcules.filter(b => b.notes.length > 0)

  // Sauvegarder l'appréciation du directeur
  const handleSaveAppreciation = async (bId: string, bData: any) => {
    setLoadingMap(prev => ({ ...prev, [bId]: true }))
    
    try {
      const appreciationText = appreciationInputs[bId] || ''
      const bulletinExistant = bulletins.find(b => b.id === bId)

      if (bulletinExistant) {
        // Mettre à jour le bulletin existant
        updateBulletin(bId, { 
          appreciationDirecteur: appreciationText,
          dateGeneration: new Date().toISOString().split('T')[0]
        })
      } else {
        // Créer un nouveau bulletin snapshot dans le store
        const completBulletin = {
          ...bData,
          appreciationDirecteur: appreciationText,
          dateGeneration: new Date().toISOString().split('T')[0]
        }
        addBulletin(completBulletin)
      }

      toast({
        title: "Appréciation enregistrée",
        description: "L'appréciation du Directeur a été sauvegardée avec succès.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Une erreur est survenue lors de l'enregistrement.",
        variant: "destructive",
      })
    } finally {
      setLoadingMap(prev => ({ ...prev, [bId]: false }))
    }
  }

  // KPIs de la classe
  const effectifTotal = bulletinsCalcules.length
  const moyenneClasse = effectifTotal > 0 
    ? Number((bulletinsCalcules.reduce((acc, curr) => acc + curr.moyenneGenerale, 0) / effectifTotal).toFixed(2)) 
    : 0
  const tauxReussite = effectifTotal > 0
    ? Number(((bulletinsCalcules.filter(b => b.moyenneGenerale >= 10).length / effectifTotal) * 100).toFixed(0))
    : 0
  const meilleureMoyenne = effectifTotal > 0
    ? Math.max(...bulletinsCalcules.map(b => b.moyenneGenerale))
    : 0

  return (
    <div className="space-y-6">
      {/* SECTION FILTRES */}
      <Card className="shadow-sm border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="w-full lg:w-48 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Année Scolaire</label>
              <Select value={selectedAnneeId} onValueChange={setSelectedAnneeId}>
                <SelectTrigger className="w-full h-11 border-border">
                  <SelectValue placeholder="Choisir une année" />
                </SelectTrigger>
                <SelectContent>
                  {anneesScolaires.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sélectionner une classe</label>
              <Combobox
                options={classes.map(c => ({ value: c.id, label: `${c.nom} (${c.niveau})` }))}
                value={selectedClasseId}
                onChange={setSelectedClasseId}
                placeholder="Choisir une classe"
                emptyText="Aucune classe trouvée."
              />
            </div>

            <div className="w-full lg:w-48 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trimestre</label>
              <Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}>
                <SelectTrigger className="w-full h-11 border-border">
                  <SelectValue placeholder="Choisir un trimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1er Trimestre</SelectItem>
                  <SelectItem value="2">2ème Trimestre</SelectItem>
                  <SelectItem value="3">3ème Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full lg:w-auto">
              {/* Bouton de téléchargement global */}
              {bulletinsCalcules.length > 0 && (
                bulletinsAvecNotes.length > 0 ? (
                  <PDFDownloadLink
                    document={
                      <BulletinPDF
                        bulletins={bulletinsAvecNotes}
                        ecole={ecoleMock}
                        eleves={eleves}
                        matieres={matieres}
                        classes={classes}
                        enseignants={enseignants}
                        absences={absences}
                      />
                    }
                    fileName={`Bulletins_${currentClasse?.nom || ''}_T${selectedTrimestre}_${ecoleMock.anneeScolaire}.pdf`}
                  >
                    {/* @ts-ignore */}
                    {({ loading }) => (
                      <Button 
                        className="w-full h-11 bg-primary hover:bg-primary-dark text-white shadow-sm flex items-center justify-center font-semibold"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Imprimer ({bulletinsAvecNotes.length})
                          </>
                        )}
                      </Button>
                    )}
                  </PDFDownloadLink>
                ) : (
                  <Button 
                    className="w-full h-11 bg-slate-200 text-slate-500 shadow-sm flex items-center justify-center font-semibold cursor-not-allowed hover:bg-slate-200"
                    onClick={() => toast({ title: "Bulletins vides", description: "Aucune note n'a été trouvée pour générer les bulletins.", variant: "destructive" })}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Bulletins vides
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {bulletinsCalcules.length === 0 ? (
        <Card className="py-12 border-dashed border-2 flex flex-col items-center justify-center text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 stroke-1" />
          <h3 className="text-lg font-bold text-text">Aucun élève trouvé</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Aucun élève n'est actif ou inscrit dans cette classe pour l'instant.
          </p>
        </Card>
      ) : (
        <>
          {/* SECTION KPIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-border bg-card">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary-light text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Effectif Classé</p>
                  <h3 className="text-2xl font-bold font-display text-text">{effectifTotal} élèves</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Moyenne Classe</p>
                  <h3 className="text-2xl font-bold font-display text-text">{moyenneClasse.toFixed(2)} /20</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taux de Réussite</p>
                  <h3 className="text-2xl font-bold font-display text-text">{tauxReussite}% (≥ 10)</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-50 text-amber-600">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Major de Classe</p>
                  <h3 className="text-2xl font-bold font-display text-text">{meilleureMoyenne.toFixed(2)} /20</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LISTE DES BULLETINS */}
          <Card className="shadow-sm border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border pb-4 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg font-bold font-display text-text">Bulletins Trimestriels</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Générez les documents officiels et saisissez les appréciations de la classe {currentClasse?.nom}
                  </CardDescription>
                </div>
                {/* Barre de recherche */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher un élève..."
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="w-[80px] text-center font-bold text-muted-foreground">Rang</TableHead>
                      <TableHead className="font-bold text-muted-foreground">Élève</TableHead>
                      <TableHead className="w-[120px] text-center font-bold text-muted-foreground">Moyenne</TableHead>
                      <TableHead className="w-[120px] text-center font-bold text-muted-foreground">Mention</TableHead>
                      <TableHead className="font-bold text-muted-foreground">Appréciation du Directeur</TableHead>
                      <TableHead className="w-[180px] text-right pr-6 font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulletinsFiltrés.map((b) => {
                      const eleve = eleves.find((e) => e.id === b.eleveId)
                      if (!eleve) return null

                      const hasMoyenne = b.notes.length > 0
                      const isPassing = b.moyenneGenerale >= 10
                      
                      // Style de rang
                      let rangBadge = "bg-slate-100 text-slate-700"
                      if (b.rangClasse === 1) rangBadge = "bg-amber-100 text-amber-800 font-bold border border-amber-200"
                      else if (b.rangClasse === 2) rangBadge = "bg-slate-200 text-slate-800 font-bold"
                      else if (b.rangClasse === 3) rangBadge = "bg-amber-50 text-amber-700 font-bold"

                      return (
                        <TableRow key={b.id} className="border-b border-border hover:bg-slate-50/50 transition-colors">
                          {/* Rang */}
                          <TableCell className="text-center font-medium">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs rounded-full ${rangBadge}`}>
                              {b.rangClasse}e
                            </span>
                          </TableCell>

                          {/* Élève */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-sm shrink-0">
                                {getInitiales(eleve.nom, eleve.prenom)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-text">{eleve.nom.toUpperCase()} {eleve.prenom}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{eleve.matricule}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Moyenne */}
                          <TableCell className="text-center">
                            {hasMoyenne ? (
                              <span className={`text-sm font-bold font-display px-2 py-0.5 rounded ${
                                isPassing ? 'text-emerald-600 bg-emerald-50' : 'text-danger bg-red-50'
                              }`}>
                                {b.moyenneGenerale.toFixed(2)} /20
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Aucune note</span>
                            )}
                          </TableCell>

                          {/* Mention */}
                          <TableCell className="text-center">
                            {hasMoyenne ? (
                              <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded ${
                                isPassing ? 'bg-primary-light text-primary' : 'bg-red-50 text-danger'
                              }`}>
                                {b.appreciation}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Appréciation */}
                          <TableCell>
                            <div className="flex gap-2 items-center py-2 max-w-lg">
                              <textarea
                                className="w-full min-h-[50px] p-2 text-xs border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:italic disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                placeholder={hasMoyenne ? "Saisir les remarques et conseils du Directeur..." : "Aucune note saisie..."}
                                value={appreciationInputs[b.id] || ''}
                                onChange={(e) => setAppreciationInputs(prev => ({ ...prev, [b.id]: e.target.value }))}
                                disabled={!hasMoyenne}
                              />
                              <Button
                                size="icon"
                                className="bg-white hover:bg-slate-100 text-slate-600 hover:text-primary border border-border shadow-sm shrink-0 h-9 w-9 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleSaveAppreciation(b.id, b)}
                                disabled={!hasMoyenne || loadingMap[b.id]}
                              >
                                {loadingMap[b.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right pr-6">
                            {hasMoyenne ? (
                              <PDFDownloadLink
                                document={
                                  <BulletinPDF
                                    bulletins={[b]}
                                    ecole={ecoleMock}
                                    eleves={eleves}
                                    matieres={matieres}
                                    classes={classes}
                                    enseignants={enseignants}
                                    absences={absences}
                                  />
                                }
                                fileName={`Bulletin_${eleve.nom}_${eleve.prenom}_T${selectedTrimestre}.pdf`}
                              >
                                {/* @ts-ignore */}
                                {({ loading }) => (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="border-border hover:bg-primary hover:text-white transition-colors"
                                    disabled={loading}
                                  >
                                    {loading ? (
                                      <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Calcul...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="mr-2 h-3.5 w-3.5" />
                                        Télécharger PDF
                                      </>
                                    )}
                                  </Button>
                                )}
                              </PDFDownloadLink>
                            ) : (
                              <Button variant="outline" size="sm" disabled className="text-xs">
                                Incomplet
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
