'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useSchoolStore } from '@/store/useSchoolStore'
import { getInitiales, formatDate, formatCFA, getSafeFilename } from '@/lib/utils'
import { ArrowLeft, User, BookOpen, CreditCard, CalendarOff, Phone, Mail, Loader2, Download, Lock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ecoleMock } from '@/data/mockData'
import BulletinPDF from '@/components/bulletins/BulletinPDF'
import EleveModal from '@/components/eleves/EleveModal'

// Chargement dynamique de PDFDownloadLink pour éviter les erreurs de SSR Next.js
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <Button variant="outline" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin mr-2" /> Préparation...</Button> }
)

export default function EleveDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // React 19 / Next 15 "params" must be unwrapped using `use()`
  const resolvedParams = use(params)
  const { id } = resolvedParams
  
  const { 
    getEleveById, 
    getClasseById, 
    getNotesByEleve, 
    getPaiementsByEleve, 
    getAbsencesByEleve,
    getMoyenneEleve,
    matieres,
    currentUser,
    calculerBulletinsClasse,
    classes,
    enseignants,
    ecole,
    activeAnneeScolaire,
    anneesScolaires
  } = useSchoolStore()

  const eleve = getEleveById(id)

  const [selectedTrimestre, setSelectedTrimestre] = useState<'1' | '2' | '3'>('1')
  const [isMounted, setIsMounted] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const trimestreNum = Number(selectedTrimestre) as 1 | 2 | 3
  
  // Calculer les bulletins de la classe pour ce trimestre
  const currentAnneeScolaireId = activeAnneeScolaire?.id || ecole?.anneeScolaire || ecoleMock.anneeScolaire
  const bulletinsClasse = eleve?.classeId
    ? calculerBulletinsClasse(eleve.classeId, trimestreNum, currentAnneeScolaireId)
    : []
  
  // Trouver le bulletin spécifique de cet élève
  const bulletinEleve = bulletinsClasse.find(b => b.eleveId === eleve?.id)

  if (!eleve) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <p className="text-muted-foreground text-lg">Élève introuvable.</p>
        <Button onClick={() => router.back()} variant="outline">
          Retour
        </Button>
      </div>
    )
  }

  const classe = getClasseById(eleve.classeId)
  const notes = getNotesByEleve(eleve.id)
  const paiements = getPaiementsByEleve(eleve.id)
  const absences = getAbsencesByEleve(eleve.id)

  // Statistiques pour les badges
  const moyenneT1 = getMoyenneEleve(eleve.id, 1)
  const paiementsEnRetard = paiements.filter(p => p.statut === 'retard').length
  const totalAbsencesNJ = absences.filter(a => !a.justifiee).length

  const isParent = currentUser?.role === 'parent'

  return (
    <div className="space-y-6">
      {/* En-tête de retour et actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          onClick={() => isParent ? router.push('/parent/dashboard') : router.back()} 
          className="text-muted-foreground hover:text-text"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isParent ? "Retour au tableau de bord" : "Retour"}
        </Button>
        {!isParent && (
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
            <Button 
              variant="outline" 
              className="text-primary border-primary hover:bg-primary hover:text-white transition-colors"
              onClick={() => setIsEditModalOpen(true)}
            >
              Modifier le dossier
            </Button>
            {ecole?.abonnement?.plan === 'gratuit' ? (
              <div
                className="h-10 px-4 bg-primary/10 text-primary/60 border border-primary/20 cursor-not-allowed font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm select-none"
                title="Abonnement Standard requis pour générer les bulletins PDF"
              >
                <Lock className="h-4 w-4 shrink-0" />
                <span>Générer Bulletin</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                  👑 Premium
                </span>
              </div>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white hover:bg-primary-dark font-semibold">
                    Générer Bulletin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold font-display text-text">Générer le Bulletin PDF</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trimestre</label>
                      <Select value={selectedTrimestre} onValueChange={(val) => setSelectedTrimestre(val as '1' | '2' | '3')}>
                        <SelectTrigger className="w-full border-border">
                          <SelectValue placeholder="Choisir un trimestre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1er Trimestre</SelectItem>
                          <SelectItem value="2">2ème Trimestre</SelectItem>
                          <SelectItem value="3">3ème Trimestre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {bulletinEleve && bulletinEleve.notes.length > 0 ? (
                      <div className="bg-slate-50 border border-border p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center border-b border-border/55 pb-2">
                          <span className="text-xs text-muted-foreground font-medium">Moyenne Générale</span>
                          <span className={`text-sm font-bold font-display px-2 py-0.5 rounded ${
                            bulletinEleve.moyenneGenerale >= 10 ? 'text-emerald-600 bg-emerald-50' : 'text-danger bg-red-50'
                          }`}>
                            {bulletinEleve.moyenneGenerale.toFixed(2)} / 20
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border/55 pb-2">
                          <span className="text-xs text-muted-foreground font-medium">Rang</span>
                          <span className="text-xs font-bold text-text bg-slate-200/60 px-2 py-0.5 rounded">
                            {bulletinEleve.rangClasse}e sur {bulletinEleve.effectifClasse}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground font-medium">Mention</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            bulletinEleve.moyenneGenerale >= 10 ? 'bg-primary-light text-primary' : 'bg-red-50 text-danger'
                          }`}>
                            {bulletinEleve.appreciation}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-lg text-center text-xs text-amber-800">
                        Aucune note disponible pour ce trimestre ou relevé incomplet.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3 border-t border-border pt-4 mt-2">
                    <DialogClose asChild>
                      <Button variant="outline" size="sm">Fermer</Button>
                    </DialogClose>
                    
                    {isMounted && bulletinEleve && bulletinEleve.notes.length > 0 ? (
                      <PDFDownloadLink
                        document={
                          <BulletinPDF
                            bulletins={[bulletinEleve]}
                            ecole={ecole}
                            eleves={[eleve]}
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
                        {({ loading }) => (
                          <Button
                            className="bg-primary hover:bg-primary-dark text-white font-semibold flex items-center gap-2"
                            disabled={loading}
                            size="sm"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Calcul...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Télécharger le PDF
                              </>
                            )}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    ) : (
                      <Button size="sm" disabled className="bg-slate-100 text-slate-400 font-semibold flex items-center gap-2 border border-border shadow-none">
                        <Download className="h-4 w-4" />
                        Incomplet
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Profil Header */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="h-24 bg-primary/20 w-full" />
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 -mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
              <Avatar className="h-24 w-24 border-4 border-card rounded-xl shrink-0">
                {eleve.photoUrl ? (
                  <AvatarImage src={eleve.photoUrl} className="object-cover rounded-xl" />
                ) : null}
                <AvatarFallback className="bg-primary text-white text-3xl font-display rounded-xl">
                  {getInitiales(eleve.nom, eleve.prenom)}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-text break-words">{eleve.prenom} {eleve.nom}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{eleve.matricule}</span>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {classe?.nom || 'Sans classe'}
                  </Badge>
                  <Badge variant="outline" className={
                    eleve.statut === 'actif' ? 'bg-success/10 text-success border-success/20' : 
                    eleve.statut === 'suspendu' ? 'bg-warning/10 text-warning border-warning/20' : 
                    'bg-danger/10 text-danger border-danger/20'
                  }>
                    {eleve.statut.charAt(0).toUpperCase() + eleve.statut.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pb-1">
              {moyenneT1 > 0 && (
                <Badge variant="outline" className="px-3 py-1 bg-background">
                  Moy. T1: <strong className="ml-1 text-text">{moyenneT1}/20</strong>
                </Badge>
              )}
              {paiementsEnRetard > 0 && (
                <Badge variant="outline" className="px-3 py-1 bg-danger/10 text-danger border-danger/20">
                  {paiementsEnRetard} impayé(s)
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Onglets d'informations */}
      <Tabs defaultValue="infos" className="w-full">
        <TabsList className="bg-card border border-border/50 w-full justify-start h-auto p-1 overflow-x-auto flex-nowrap sm:flex-wrap">
          <TabsTrigger value="infos" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <User className="w-4 h-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="notes" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <BookOpen className="w-4 h-4 mr-2 shrink-0" />
            <span>Notes</span>
            {ecole?.abonnement?.plan === 'gratuit' && (
              <span className="ml-1.5 text-[8px] bg-amber-500/20 text-amber-700 font-extrabold px-1 rounded uppercase tracking-wider shrink-0">
                Premium
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="paiements" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <CreditCard className="w-4 h-4 mr-2 shrink-0" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="absences" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <CalendarOff className="w-4 h-4 mr-2 shrink-0" />
            <span>Absences</span>
            {ecole?.abonnement?.plan === 'gratuit' && (
              <span className="ml-1.5 text-[8px] bg-amber-500/20 text-amber-700 font-extrabold px-1 rounded uppercase tracking-wider shrink-0">
                Premium
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="bulletins" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <FileText className="w-4 h-4 mr-2 shrink-0" />
            <span>Bulletins</span>
            {ecole?.abonnement?.plan === 'gratuit' && (
              <span className="ml-1.5 text-[8px] bg-amber-500/20 text-amber-700 font-extrabold px-1 rounded uppercase tracking-wider shrink-0">
                Premium
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="infos" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Identité de l'élève</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 border-b border-border/50 pb-4">
                    <div className="col-span-1 text-sm text-muted-foreground">Date de naissance</div>
                    <div className="col-span-2 font-medium text-text">{eleve.dateNaissance ? formatDate(eleve.dateNaissance) : 'Non renseignée'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b border-border/50 pb-4">
                    <div className="col-span-1 text-sm text-muted-foreground">Sexe</div>
                    <div className="col-span-2 font-medium text-text">{eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 text-sm text-muted-foreground">Date d'inscription</div>
                    <div className="col-span-2 font-medium text-text">{formatDate(eleve.dateInscription)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Contact Parent / Tuteur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 border-b border-border/50 pb-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><User className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nom complet</p>
                      <p className="font-medium text-text">{eleve.parentNom || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 border-b border-border/50 pb-4">
                    <div className="p-2 bg-success/10 rounded-lg text-success"><Phone className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone (WhatsApp)</p>
                      <p className="font-medium text-text">{eleve.parentTelephone || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-warning/10 rounded-lg text-warning"><Mail className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-text">{eleve.parentEmail || 'Non renseigné'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-display">Relevé de Notes (Trimestre 1)</CardTitle>
                {ecole?.abonnement?.plan === 'gratuit' && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                    👑 Premium
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {ecole?.abonnement?.plan === 'gratuit' ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-text">Relevé de Notes Verrouillé</h4>
                    <p className="text-xs text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                      La consultation des devoirs, des compositions et le calcul automatique de la moyenne trimestrielle nécessitent un abonnement payant.
                    </p>
                  </div>
                ) : (
                  notes.filter(n => n.trimestre === 1).length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune note enregistrée pour ce trimestre.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border border-border/50 rounded-lg overflow-hidden">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                          <tr>
                            <th className="px-4 py-3">Matière</th>
                            <th className="px-4 py-3 text-center">Note /20</th>
                            <th className="px-4 py-3 text-center">Type</th>
                            <th className="px-4 py-3 text-center">Coefficient</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {notes.filter(n => n.trimestre === 1).map(note => {
                            const matiere = matieres.find(m => m.id === note.matiereId)
                            return (
                              <tr key={note.id} className="hover:bg-muted/20">
                                <td className="px-4 py-3 font-medium">{matiere?.nom || 'Inconnue'}</td>
                                <td className="px-4 py-3 text-center font-bold text-text">
                                  <span className={note.valeur < 10 ? 'text-danger' : 'text-success'}>
                                    {note.valeur}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-muted-foreground">
                                  {note.type === 'composition' ? 'Composition' : note.type === 'devoir' ? `Devoir ${note.numero || ''}` : 'Oral'}
                                </td>
                                <td className="px-4 py-3 text-center text-muted-foreground">{matiere?.coefficient}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paiements" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-display">Historique des Paiements</CardTitle>
              </CardHeader>
              <CardContent>
                {paiements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Aucun paiement enregistré.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                          <th className="px-4 py-3">Libellé</th>
                          <th className="px-4 py-3">Date Limite</th>
                          <th className="px-4 py-3">Montant</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3">Mode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {paiements.map(paiement => (
                          <tr key={paiement.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium text-text">{paiement.type.replace('_', ' ').toUpperCase()}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(paiement.dateLimite)}</td>
                            <td className="px-4 py-3 font-bold">
                              {formatCFA(paiement.montant)}
                              {paiement.montantPaye !== undefined && paiement.montantPaye > 0 && (
                                <div className="text-xs text-muted-foreground font-normal mt-0.5">
                                  Déjà payé: {formatCFA(paiement.montantPaye)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={
                                paiement.statut === 'paye' ? 'bg-success/10 text-success border-success/20' : 
                                paiement.statut === 'retard' ? 'bg-danger/10 text-danger border-danger/20' : 
                                'bg-warning/10 text-warning border-warning/20'
                              }>
                                {paiement.statut === 'paye' ? 'Payé' : paiement.statut === 'retard' ? 'En retard' : 'En attente'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground uppercase text-xs">
                              {paiement.modePaiement ? paiement.modePaiement.replace('_', ' ') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="absences" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-display">Relevé des Absences</CardTitle>
                {ecole?.abonnement?.plan === 'gratuit' ? (
                  <span className="text-[9px] bg-amber-500/20 text-amber-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                    👑 Premium
                  </span>
                ) : (
                  <div className="text-sm font-medium">
                    Total : <span className="text-danger">{absences.length}</span> absence(s)
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {ecole?.abonnement?.plan === 'gratuit' ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-text">Relevé d'Assiduité Verrouillé</h4>
                    <p className="text-xs text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                      L'historique détaillé des absences et retards de l'élève est réservé aux formules payantes.
                    </p>
                  </div>
                ) : (
                  absences.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune absence enregistrée.</p>
                  ) : (
                    <div className="space-y-4">
                      {absences.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(absence => (
                        <div key={absence.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-full ${absence.justifiee ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                              <CalendarOff className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-text">{formatDate(absence.date)}</p>
                              <p className="text-sm text-muted-foreground">Séance : {absence.seance}</p>
                              {absence.motif && <p className="text-sm text-muted-foreground mt-1">Motif : {absence.motif}</p>}
                            </div>
                          </div>
                          <Badge variant="outline" className={absence.justifiee ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}>
                            {absence.justifiee ? 'Justifiée' : 'Non justifiée'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulletins" className="mt-0">
            <Card className="border-border/50 shadow-sm bg-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
                <div>
                  <CardTitle className="text-lg font-bold font-display text-text">Bulletins Scolaires</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Visualisez et téléchargez les relevés de notes officiels de l&apos;année scolaire active.
                  </CardDescription>
                </div>
                {ecole?.abonnement?.plan === 'gratuit' && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-1">
                    👑 Premium
                  </span>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                {ecole?.abonnement?.plan === 'gratuit' ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-text">Bulletins Trimestriels Verrouillés</h4>
                    <p className="text-xs text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                      La génération de bulletins officiels et leur accès en téléchargement nécessitent un abonnement payant.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((t) => {
                      // Calculer le bulletin de ce trimestre pour l'élève
                      const currentAnneeId = activeAnneeScolaire?.id || ecole?.anneeScolaire || ecoleMock.anneeScolaire
                      const bulletinsCalculesT = eleve.classeId
                        ? calculerBulletinsClasse(eleve.classeId, t as 1|2|3, currentAnneeId)
                        : []
                      const bEleve = bulletinsCalculesT.find(b => b.eleveId === eleve.id)

                      // Vérifier s'il est enregistré et validé dans la base
                      const bulletinExistant = useSchoolStore.getState().bulletins.find(
                        x => x.eleveId === eleve.id && x.trimestre === t && x.anneeScolaire === currentAnneeId
                      )
                      const isValide = bulletinExistant?.estValide === true
                      const hasNotes = bEleve && bEleve.notes.length > 0

                      return (
                        <div key={`trim-${t}`} className="border border-border/50 p-5 rounded-xl bg-card space-y-4 flex flex-col justify-between shadow-sm hover:border-primary/20 transition-all">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-border/40">
                              <h4 className="font-bold text-text">{t}er Trimestre</h4>
                              {isValide ? (
                                <Badge className="bg-emerald-500 text-white border-none font-bold text-[9px] px-1.5 py-0 rounded">
                                  ✓ Validé
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 font-bold text-[9px] px-1.5 py-0 rounded">
                                  En attente
                                </Badge>
                              )}
                            </div>

                            {isValide || !isParent ? (
                              hasNotes && bEleve ? (
                                <div className="space-y-2.5 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Moyenne Générale</span>
                                    <span className={`font-bold font-display px-2 py-0.5 rounded ${
                                      bEleve.moyenneGenerale >= 10 ? 'text-emerald-600 bg-emerald-50' : 'text-danger bg-red-50'
                                    }`}>
                                      {bEleve.moyenneGenerale.toFixed(2)} / 20
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Rang</span>
                                    <span className="font-bold text-text bg-slate-100 px-2 py-0.5 rounded">
                                      {bEleve.rangClasse}e sur {bEleve.effectifClasse}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Appréciation</span>
                                    <span className={`font-bold px-2 py-0.5 rounded ${
                                      bEleve.moyenneGenerale >= 10 ? 'bg-primary-light text-primary' : 'bg-red-50 text-danger'
                                    }`}>
                                      {bEleve.appreciation}
                                    </span>
                                  </div>
                                  {bulletinExistant?.appreciationDirecteur && (
                                    <div className="mt-2 pt-2 border-t border-border/30">
                                      <span className="text-muted-foreground font-semibold block text-[10px] uppercase">Remarques de la Direction</span>
                                      <p className="italic text-slate-600 text-[11px] leading-relaxed mt-1">
                                        &ldquo;{bulletinExistant.appreciationDirecteur}&rdquo;
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-6 italic">Relevé incomplet ou aucune note disponible.</p>
                              )
                            ) : (
                              <div className="bg-slate-50 border border-border/40 p-4 rounded-lg text-center text-xs text-slate-500 py-8 leading-relaxed">
                                Le bulletin de ce trimestre n&apos;a pas encore été validé par la direction.
                              </div>
                            )}
                          </div>

                          {(isValide || !isParent) && hasNotes && bEleve ? (
                            isMounted ? (
                              <PDFDownloadLink
                                document={
                                  <BulletinPDF
                                    bulletins={[bEleve]}
                                    ecole={ecole}
                                    eleves={[eleve]}
                                    matieres={matieres}
                                    classes={classes}
                                    enseignants={enseignants}
                                    absences={absences}
                                    anneesScolaires={anneesScolaires}
                                  />
                                }
                                fileName={`${getSafeFilename(`Bulletin_${eleve.nom}_${eleve.prenom}_T${t}`)}.pdf`}
                              >
                                {/* @ts-ignore */}
                                {({ loading }) => (
                                  <Button
                                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 h-9 rounded-lg"
                                    disabled={loading}
                                  >
                                    {loading ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Génération...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="h-3.5 w-3.5" />
                                        Télécharger le PDF
                                      </>
                                    )}
                                  </Button>
                                )}
                              </PDFDownloadLink>
                            ) : (
                              <Button size="sm" disabled className="w-full text-xs">
                                Chargement...
                              </Button>
                            )
                          ) : (
                            <Button size="sm" disabled className="w-full text-xs bg-slate-100 border border-border text-slate-400 font-semibold shadow-none">
                              Non disponible
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>

      {eleve && (
        <EleveModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          eleveToEdit={eleve}
        />
      )}
    </div>
  )
}
