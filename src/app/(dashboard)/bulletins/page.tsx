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
  Search,
  Eye,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getInitiales, getSafeFilename } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import BulletinPDF from '@/components/bulletins/BulletinPDF'

import { Combobox } from '@/components/ui/combobox'
import { PremiumGuard } from '@/components/ui/PremiumGuard'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Chargement dynamique de PDFDownloadLink pour éviter les erreurs de SSR Next.js
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <Button variant="outline" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin mr-2" /> Préparation...</Button> }
)

// Chargement dynamique de PDFViewer
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /> Chargement du lecteur PDF...</div> }
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
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null)
  const [isGeneratingGlobal, setIsGeneratingGlobal] = useState(false)
  const [selectedBulletinForPreview, setSelectedBulletinForPreview] = useState<any | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  // S'assurer du montage client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (activeAnneeScolaire) {
      setSelectedAnneeId(activeAnneeScolaire.id)
    } else if (anneesScolaires.length > 0 && !selectedAnneeId) {
      setSelectedAnneeId(anneesScolaires[0].id)
    }
  }, [activeAnneeScolaire, anneesScolaires])

  useEffect(() => {
    if (classes.length > 0 && !selectedClasseId) {
      setSelectedClasseId(classes[0].id)
    }
  }, [classes, selectedClasseId])

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
      inputs[b.eleveId] = b.appreciationDirecteur || ''
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
      const appreciationText = appreciationInputs[bData.eleveId] || ''
      const bulletinExistant = bulletins.find(b => b.id === bId)

      if (bulletinExistant) {
        // Mettre à jour le bulletin existant
        await updateBulletin(bId, { 
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
        await addBulletin(completBulletin)
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

  // Valider ou annuler la validation d'un bulletin
  const handleToggleValidation = async (bId: string, bData: any, isCurrentlyValide: boolean) => {
    setLoadingMap(prev => ({ ...prev, [bId]: true }))
    
    try {
      const eleveObj = eleves.find(e => e.id === bData.eleveId)
      const eleveName = eleveObj ? `${eleveObj.prenom} ${eleveObj.nom}` : "l'élève"
      const appreciationText = appreciationInputs[bData.eleveId] || ''
      const bulletinExistant = bulletins.find(b => b.id === bId)

      if (bulletinExistant) {
        await updateBulletin(bId, { 
          estValide: !isCurrentlyValide,
          appreciationDirecteur: appreciationText,
          dateGeneration: new Date().toISOString().split('T')[0]
        })
      } else {
        const completBulletin = {
          ...bData,
          appreciationDirecteur: appreciationText,
          estValide: !isCurrentlyValide,
          dateGeneration: new Date().toISOString().split('T')[0]
        }
        await addBulletin(completBulletin)
      }

      const storeState = useSchoolStore.getState()

      if (isCurrentlyValide) {
        // Supprimer la notification correspondante
        const trimestreLabel = bData.trimestre === 1 ? '1er' : bData.trimestre === 2 ? '2ème' : '3ème';
        const targetNotif = storeState.notifications.find(
          n => n.type === 'bulletin' && 
               n.eleveId === bData.eleveId && 
               (n.description.includes(`trimestre ${bData.trimestre}`) || n.description.includes(`${trimestreLabel} Trimestre`))
        )
        if (targetNotif) {
          await storeState.deleteNotification(targetNotif.id);
        }
      }

      toast({
        title: !isCurrentlyValide ? "Bulletin validé" : "Validation annulée",
        description: !isCurrentlyValide 
          ? "Le bulletin est validé et accessible aux parents." 
          : "Le bulletin n'est plus visible pour les parents.",
        className: "bg-success text-white border-none shadow-lg"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive",
      })
    } finally {
      setLoadingMap(prev => ({ ...prev, [bId]: false }))
    }
  }

  // Valider tous les bulletins de la classe en un clic (uniquement ceux qui ont des notes)
  const handleValidateAll = async () => {
    setIsGeneratingGlobal(true)
    let validatedCount = 0
    
    try {
      const storeState = useSchoolStore.getState()
      for (const b of bulletinsAvecNotes) {
        const bulletinExistant = bulletins.find(x => x.eleveId === b.eleveId && x.trimestre === b.trimestre && x.anneeScolaire === b.anneeScolaire)
        const appreciationText = appreciationInputs[b.eleveId] || ''
        const eleveObj = eleves.find(e => e.id === b.eleveId)
        const eleveName = eleveObj ? `${eleveObj.prenom} ${eleveObj.nom}` : "l'élève"
        
        if (bulletinExistant) {
          if (!bulletinExistant.estValide) {
            await updateBulletin(bulletinExistant.id, { estValide: true })
            validatedCount++
          }
        } else {
          const completBulletin = {
            ...b,
            appreciationDirecteur: appreciationText,
            estValide: true,
            dateGeneration: new Date().toISOString().split('T')[0]
          }
          await addBulletin(completBulletin)
          validatedCount++
        }
      }
      
      if (validatedCount > 0) {
        await storeState.addNotification({
          titre: "Bulletins validés en lot",
          description: `La validation en lot de ${validatedCount} bulletin(s) a été effectuée avec succès pour la classe ${currentClasse?.nom || ''} (Trimestre ${selectedTrimestre}).`,
          type: 'systeme',
          destinataireRole: 'directeur'
        })
      }

      toast({
        title: "Validation en lot terminée",
        description: `${validatedCount} bulletin(s) ont été validés avec succès pour la classe.`,
        className: "bg-success text-white border-none shadow-lg"
      })
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la validation globale.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingGlobal(false)
    }
  }

  // Annuler la validation de tous les bulletins de la classe en un clic
  const handleUnvalidateAll = async () => {
    setIsGeneratingGlobal(true)
    let unvalidatedCount = 0
    
    try {
      const storeState = useSchoolStore.getState()
      for (const b of bulletinsAvecNotes) {
        const bulletinExistant = bulletins.find(x => x.eleveId === b.eleveId && x.trimestre === b.trimestre && x.anneeScolaire === b.anneeScolaire)
        
        if (bulletinExistant) {
          if (bulletinExistant.estValide) {
            await updateBulletin(bulletinExistant.id, { estValide: false })
            unvalidatedCount++

            // Supprimer la notification correspondante
            const trimestreLabel = selectedTrimestre === '1' ? '1er' : selectedTrimestre === '2' ? '2ème' : '3ème';
            const targetNotif = storeState.notifications.find(
              n => n.type === 'bulletin' && 
                   n.eleveId === b.eleveId && 
                   (n.description.includes(`trimestre ${selectedTrimestre}`) || n.description.includes(`${trimestreLabel} Trimestre`))
            )
            if (targetNotif) {
              await storeState.deleteNotification(targetNotif.id);
            }
          }
        }
      }
      
      toast({
        title: "Validation annulée",
        description: `La validation de ${unvalidatedCount} bulletin(s) a été annulée avec succès pour la classe.`,
        className: "bg-success text-white border-none shadow-lg"
      })
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'annulation globale.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingGlobal(false)
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

            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2 shrink-0">
              {/* Bouton de téléchargement global */}
              {bulletinsCalcules.length > 0 && (
                bulletinsAvecNotes.length > 0 ? (
                  isGeneratingGlobal ? (
                    <PDFDownloadLink
                      document={
                        <BulletinPDF
                          bulletins={bulletinsAvecNotes}
                          ecole={ecole}
                          eleves={eleves}
                          matieres={matieres}
                          classes={classes}
                          enseignants={enseignants}
                          absences={absences}
                          anneesScolaires={anneesScolaires}
                        />
                      }
                      fileName={`${getSafeFilename(`Bulletins_${currentClasse?.nom || ''}_T${selectedTrimestre}_${activeAnneeScolaire?.nom || ecole?.anneeScolaire || '2024-2025'}`)}.pdf`}
                    >
                      {/* @ts-ignore */}
                      {({ loading, error }) => {
                        if (error) {
                          return <Button className="w-full h-11 bg-rose-600 text-white font-semibold rounded-xl">Erreur de génération</Button>
                        }
                        return (
                          <Button 
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center font-semibold rounded-xl"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Préparation ({bulletinsAvecNotes.length})...
                              </>
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger le fichier ({bulletinsAvecNotes.length})
                              </>
                            )}
                          </Button>
                        )
                      }}
                    </PDFDownloadLink>
                  ) : (
                    <Button 
                      className="w-full h-11 bg-primary hover:bg-primary-dark text-white shadow-sm flex items-center justify-center font-semibold rounded-xl"
                      onClick={() => {
                        setIsGeneratingGlobal(true)
                        // Réinitialisation après 12 secondes
                        setTimeout(() => setIsGeneratingGlobal(false), 12000)
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4 animate-pulse" />
                      Générer les Bulletins ({bulletinsAvecNotes.length})
                    </Button>
                  )
                ) : (
                  <Button 
                    className="w-full h-11 bg-slate-200 text-slate-500 shadow-sm flex items-center justify-center font-semibold cursor-not-allowed hover:bg-slate-200 rounded-xl"
                    onClick={() => toast({ title: "Bulletins vides", description: "Aucune note n'a été trouvée pour générer les bulletins.", variant: "destructive" })}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Bulletins vides
                  </Button>
                )
              )}

              {/* Bouton global : Tout valider (validation en lot) */}
              {bulletinsCalcules.length > 0 && bulletinsAvecNotes.length > 0 && (
                <Button
                  onClick={handleValidateAll}
                  disabled={isGeneratingGlobal}
                  className="w-full sm:w-auto h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center font-bold px-5 rounded-xl transition-colors shrink-0"
                >
                  {isGeneratingGlobal ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Tout valider ({bulletinsAvecNotes.length})
                </Button>
              )}

              {/* Bouton global : Tout annuler (annulation en lot) */}
              {bulletinsCalcules.length > 0 && bulletinsAvecNotes.length > 0 && (
                <Button
                  onClick={handleUnvalidateAll}
                  disabled={isGeneratingGlobal}
                  className="w-full sm:w-auto h-11 bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center justify-center font-bold px-5 rounded-xl transition-colors shrink-0"
                >
                  {isGeneratingGlobal ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  Tout annuler
                </Button>
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
                      <TableHead className="w-[110px] text-center font-bold text-muted-foreground">Statut</TableHead>
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
                        <TableRow key={b.eleveId} className="border-b border-border hover:bg-slate-50/50 transition-colors">
                          {/* Rang */}
                          <TableCell className="text-center font-medium">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs rounded-full ${rangBadge}`}>
                              {b.rangClasse}e
                            </span>
                          </TableCell>

                          {/* Élève */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-primary/20">
                                {eleve.photoUrl ? (
                                  <AvatarImage src={eleve.photoUrl} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                  {getInitiales(eleve.nom, eleve.prenom)}
                                </AvatarFallback>
                              </Avatar>
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
                                value={appreciationInputs[b.eleveId] || ''}
                                onChange={(e) => setAppreciationInputs(prev => ({ ...prev, [b.eleveId]: e.target.value }))}
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

                          {/* Statut de Validation */}
                          <TableCell className="text-center">
                            {hasMoyenne ? (
                              (() => {
                                const bulletinExistant = bulletins.find(x => x.eleveId === b.eleveId && x.trimestre === b.trimestre && x.anneeScolaire === b.anneeScolaire)
                                const isValide = bulletinExistant?.estValide === true
                                
                                return (
                                  <div className="flex flex-col items-center gap-1.5 justify-center">
                                    {isValide ? (
                                      <>
                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider shrink-0 flex items-center gap-1">
                                          ✓ Validé
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={loadingMap[b.id]}
                                          className="text-[10px] text-muted-foreground hover:!text-danger hover:!bg-red-50 font-bold px-1.5 h-6 rounded-md transition-colors"
                                          onClick={() => handleToggleValidation(b.id, b, true)}
                                        >
                                          {loadingMap[b.id] ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : "Annuler"}
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={loadingMap[b.id]}
                                        className="text-[10px] text-primary border-primary/20 hover:!text-primary hover:!border-primary hover:!bg-primary/5 font-extrabold px-2 h-7 rounded-md transition-all flex items-center gap-1 shrink-0"
                                        onClick={() => handleToggleValidation(b.id, b, false)}
                                      >
                                        {loadingMap[b.id] ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <>
                                            <CheckCircle className="h-3 w-3" />
                                            Valider
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                )
                              })()
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              {/* Visualiser le bulletin */}
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary border-border shrink-0 animate-in fade-in"
                                onClick={() => {
                                  setSelectedBulletinForPreview(b)
                                  setPreviewDialogOpen(true)
                                }}
                                disabled={!hasMoyenne}
                                title="Visualiser le bulletin"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {hasMoyenne ? (
                                activeDownloadId === b.id ? (
                                  <PDFDownloadLink
                                    document={
                                      <BulletinPDF
                                        bulletins={[b]}
                                        ecole={ecole}
                                        eleves={eleves}
                                        matieres={matieres}
                                        classes={classes}
                                        enseignants={enseignants}
                                        absences={absences}
                                        anneesScolaires={anneesScolaires}
                                      />
                                    }
                                    fileName={`${getSafeFilename(`Bulletin_${eleve.nom}_${eleve.prenom}_T${selectedTrimestre}`)}.pdf`}
                                  >
                                    {/* @ts-ignore */}
                                    {({ loading, error }) => {
                                      if (error) {
                                        return <span className="text-xs text-rose-500 font-bold">Erreur</span>
                                      }
                                      return (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shrink-0"
                                          disabled={loading}
                                        >
                                          {loading ? (
                                            <>
                                              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                              Calcul...
                                            </>
                                          ) : (
                                            <>
                                              <Download className="mr-1.5 h-3.5 w-3.5" />
                                              Télécharger
                                            </>
                                          )}
                                        </Button>
                                      )
                                    }}
                                  </PDFDownloadLink>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border hover:bg-primary hover:text-white transition-colors text-xs shrink-0"
                                    onClick={() => {
                                      setActiveDownloadId(b.id)
                                      // Réinitialiser après 8 secondes pour permettre d'autres clics
                                      setTimeout(() => setActiveDownloadId(null), 8000)
                                    }}
                                  >
                                    <Download className="mr-1.5 h-3.5 w-3.5" />
                                    Obtenir PDF
                                  </Button>
                                )
                              ) : (
                                <Button variant="outline" size="sm" disabled className="text-xs shrink-0">
                                  Incomplet
                                </Button>
                              )}
                            </div>
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
      {/* DIALOG : VISUALISATION PREVIEW DU BULLETIN */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] bg-card border border-border shadow-2xl rounded-2xl p-6 flex flex-col gap-4">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-lg font-bold text-text flex items-center gap-2">
              <Eye className="h-5.5 w-5.5 text-primary" />
              Aperçu du Bulletin de Notes — {selectedBulletinForPreview ? eleves.find(e => e.id === selectedBulletinForPreview.eleveId)?.prenom + ' ' + eleves.find(e => e.id === selectedBulletinForPreview.eleveId)?.nom.toUpperCase() : ''}
            </DialogTitle>
          </DialogHeader>

          {selectedBulletinForPreview && (
            <div className="flex-1 w-full rounded-xl overflow-hidden border border-border bg-slate-900/10">
              <PDFViewer className="w-full h-full border-0" showToolbar={true}>
                <BulletinPDF
                  bulletins={[selectedBulletinForPreview]}
                  ecole={ecole}
                  eleves={eleves}
                  matieres={matieres}
                  classes={classes}
                  enseignants={enseignants}
                  absences={absences}
                  anneesScolaires={anneesScolaires}
                />
              </PDFViewer>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
