'use client'

import { use, useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useSchoolStore } from '@/store/useSchoolStore'
import { getInitiales, formatDate, formatCFA, getSafeFilename, formatTelephone } from '@/lib/utils'
import { ArrowLeft, User, BookOpen, CreditCard, CalendarOff, Phone, Mail, Loader2, Download, Lock, FileText } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
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
import ParentPremiumPaywallModal from '@/components/parent/ParentPremiumPaywallModal'

// Chargement dynamique de PDFDownloadLink pour éviter les erreurs de SSR Next.js
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <Button variant="outline" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin mr-2" /> Préparation...</Button> }
)

function EleveDetailsPageContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, dir } = useTranslation()
  const urlAnneeId = searchParams.get('anneeId')
  
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
    anneesScolaires,
    inscriptions,
    bulletins
  } = useSchoolStore()

  const eleve = getEleveById(id)
  const isParent = currentUser?.role === 'parent'

  const [selectedTrimestre, setSelectedTrimestre] = useState<'1' | '2' | '3'>('1')
  const [activeTab, setActiveTab] = useState('infos')
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)
  const [paywallTargetTrimestre, setPaywallTargetTrimestre] = useState<'1' | '2' | '3'>('1')
  const [isMounted, setIsMounted] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const [selectedAnneeId, setSelectedAnneeId] = useState<string>(() => {
    return urlAnneeId || activeAnneeScolaire?.id || (anneesScolaires.find(as => as.statut === 'active')?.id) || (anneesScolaires[0]?.id) || ''
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Mettre à jour l'année sélectionnée si le paramètre ou l'année active change
  useEffect(() => {
    if (urlAnneeId) {
      setSelectedAnneeId(urlAnneeId)
    } else if (activeAnneeScolaire) {
      setSelectedAnneeId(activeAnneeScolaire.id)
    }
  }, [urlAnneeId, activeAnneeScolaire])

  const trimestreNum = Number(selectedTrimestre) as 1 | 2 | 3
  
  // Calculer les bulletins de la classe pour ce trimestre
  const currentAnneeScolaireId = activeAnneeScolaire?.id || ecole?.anneeScolaire || ecoleMock.anneeScolaire
  const bulletinExistantTrim = bulletins.find(
    x => x.eleveId === eleve?.id && x.trimestre === trimestreNum && x.anneeScolaire === currentAnneeScolaireId
  )
  const bulletinsClasse = eleve?.classeId
    ? (isParent && bulletinExistantTrim && bulletinExistantTrim.estValide)
      ? [bulletinExistantTrim]
      : calculerBulletinsClasse(eleve.classeId, trimestreNum, currentAnneeScolaireId)
    : []
  
  // Trouver le bulletin spécifique de cet élève
  const bulletinEleve = isParent && bulletinExistantTrim && bulletinExistantTrim.estValide
    ? bulletinExistantTrim
    : bulletinsClasse.find(b => b.eleveId === eleve?.id)

  if (!eleve) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <p className="text-muted-foreground text-lg">{t('eleves.not_found', 'Élève introuvable.')}</p>
        <Button onClick={() => router.back()} variant="outline">
          {t('action.back', 'Retour')}
        </Button>
      </div>
    )
  }

  // Résoudre la classe pour l'année scolaire sélectionnée
  const studentInscription = inscriptions.find(
    ins => ins.eleveId === eleve.id && ins.anneeScolaire === selectedAnneeId && ins.statut === 'validee'
  )
  const classeId = studentInscription?.classeId || eleve.classeId
  const classe = getClasseById(classeId)

  // Filtrer les données en fonction de l'année scolaire sélectionnée
  const rawNotes = getNotesByEleve(eleve.id)
  const notes = rawNotes.filter(n => n.anneeScolaire === selectedAnneeId)
  const paiements = getPaiementsByEleve(eleve.id).filter(p => p.anneeScolaire === selectedAnneeId)
  const absences = getAbsencesByEleve(eleve.id).filter(a => a.anneeScolaire === selectedAnneeId)

  // Calculer la moyenne du T1 pour l'année scolaire sélectionnée
  const getMoyenneElevePourAnnee = (trimestre: 1 | 2 | 3) => {
    const notesTrimestre = notes.filter(n => n.trimestre === trimestre)
    let totalCoeff = 0
    let totalNotes = 0
    notesTrimestre.forEach(note => {
      const matiere = matieres.find(m => m.id === note.matiereId)
      if (matiere) {
        totalNotes += note.valeur * matiere.coefficient
        totalCoeff += matiere.coefficient
      }
    })
    return totalCoeff > 0 ? Number((totalNotes / totalCoeff).toFixed(2)) : 0
  }

  // Statistiques pour les badges
  const moyenneT1 = getMoyenneElevePourAnnee(1)
  const paiementsEnRetard = paiements.filter(p => p.statut === 'retard').length
  const totalAbsencesNJ = absences.filter(a => !a.justifiee).length

  const getDernierTrimestreValide = () => {
    const bulletinsEleve = bulletins.filter(
      b => b.eleveId === eleve.id && 
           b.anneeScolaire === selectedAnneeId && 
           b.estValide === true
    )
    if (bulletinsEleve.length === 0) return null
    return [...bulletinsEleve].sort((a, b) => b.trimestre - a.trimestre)[0]
  }

  const dernierBulletinValide = getDernierTrimestreValide()



  // Synchronisation automatique des bulletins validés en base de données si les notes/effectifs de la classe ont changé
  useEffect(() => {
    if (isParent || !eleve) return

    const checkAndSyncBulletins = async () => {
      const currentAnneeId = selectedAnneeId || activeAnneeScolaire?.id || ecole?.anneeScolaire || ecoleMock.anneeScolaire
      const targetClasseId = studentInscription?.classeId || eleve.classeId
      if (!targetClasseId) return

      for (const tVal of [1, 2, 3]) {
        const bulletinExistant = bulletins.find(
          x => x.eleveId === eleve.id && x.trimestre === tVal && x.anneeScolaire === currentAnneeId
        )
        if (bulletinExistant && bulletinExistant.estValide) {
          const bulletinsCalculesT = calculerBulletinsClasse(targetClasseId, tVal as 1|2|3, currentAnneeId)
          const bEleveCalculé = bulletinsCalculesT.find(b => b.eleveId === eleve.id)
          if (bEleveCalculé) {
            const needsUpdate = 
              bulletinExistant.moyenneGenerale !== bEleveCalculé.moyenneGenerale ||
              bulletinExistant.rangClasse !== bEleveCalculé.rangClasse ||
              bulletinExistant.effectifClasse !== bEleveCalculé.effectifClasse ||
              bulletinExistant.moyenneClasse !== bEleveCalculé.moyenneClasse ||
              JSON.stringify(bulletinExistant.notes) !== JSON.stringify(bEleveCalculé.notes)

            if (needsUpdate) {
              console.log(`Auto-syncing validated bulletin T${tVal} for student ${eleve.nom}`)
              await useSchoolStore.getState().updateBulletin(bulletinExistant.id, {
                moyenneGenerale: bEleveCalculé.moyenneGenerale,
                rangClasse: bEleveCalculé.rangClasse,
                effectifClasse: bEleveCalculé.effectifClasse,
                moyenneClasse: bEleveCalculé.moyenneClasse,
                notes: bEleveCalculé.notes,
                appreciation: bEleveCalculé.appreciation
              })
            }
          }
        }
      }
    }

    checkAndSyncBulletins()
  }, [isParent, eleve, selectedAnneeId, activeAnneeScolaire, ecole, studentInscription, bulletins, calculerBulletinsClasse])

  const aAccesPremium = (trimestre: number) => {
    if (!isParent) return true
    const status = currentUser?.parentSubscriptionStatus
    if (!status || status === 'gratuit') return false
    
    // Rétrocompatibilité si pas de séparateur ":" (ancien format sans année)
    if (status === 'premium') return true
    if (!status.includes(':')) {
      return status.split(',').includes(`t${trimestre}`)
    }
    
    // Nouveau format "anneeId:statut;anneeId2:statut2"
    const abonnements = status.split(';').filter(Boolean)
    const abonnementAnnee = abonnements.find(a => a.startsWith(`${selectedAnneeId}:`))
    
    if (!abonnementAnnee) return false
    
    const statutAnnee = abonnementAnnee.split(':')[1]
    if (statutAnnee === 'premium') return true
    return statutAnnee.split(',').includes(`t${trimestre}`)
  }

  return (
    <div className="space-y-6" dir={dir}>
      {/* En-tête de retour et actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          onClick={() => isParent ? router.push('/parent/dashboard') : router.back()} 
          className="text-muted-foreground hover:text-text"
        >
          <ArrowLeft className="me-2 h-4 w-4" />
          {isParent ? t('eleves.back_to_dashboard', 'Retour au tableau de bord') : t('action.back', 'Retour')}
        </Button>

        {/* Sélecteur d'Année Scolaire */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.school_year', 'Année')} :</span>
          <Select value={selectedAnneeId} onValueChange={setSelectedAnneeId}>
            <SelectTrigger className="w-[150px] bg-card border-border">
              <SelectValue placeholder={t('dashboard.school_year', 'Année Scolaire')} />
            </SelectTrigger>
            <SelectContent>
              {anneesScolaires.map(annee => (
                <SelectItem key={annee.id} value={annee.id}>
                  {annee.nom} {annee.statut === 'active' ? `(${t('parametres.years.table.status.active', 'Courante')})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!isParent && (
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
            <Button 
              variant="outline" 
              className="text-primary border-primary hover:bg-primary hover:text-white transition-colors"
              onClick={() => setIsEditModalOpen(true)}
            >
              {t('eleves.action.edit', 'Modifier le dossier')}
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white hover:bg-primary-dark font-semibold">
                    {t('bulletins.generate', 'Générer Bulletin')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold font-display text-text">{t('bulletins.generate', 'Générer le Bulletin PDF')}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.trimestre', 'Trimestre')}</label>
                      <Select value={selectedTrimestre} onValueChange={(val) => setSelectedTrimestre(val as '1' | '2' | '3')}>
                        <SelectTrigger className="w-full border-border">
                          <SelectValue placeholder={t('bulletins.select_trimestre', 'Choisir un trimestre')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">{t('dashboard.t1', '1er Trimestre')}</SelectItem>
                          <SelectItem value="2">{t('dashboard.t2', '2ème Trimestre')}</SelectItem>
                          <SelectItem value="3">{t('dashboard.t3', '3ème Trimestre')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {bulletinEleve && bulletinEleve.notes.length > 0 ? (
                      <div className="bg-slate-50 border border-border p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center border-b border-border/55 pb-2">
                          <span className="text-xs text-muted-foreground font-medium">{t('kpi.moyenne', 'Moyenne Générale')}</span>
                          <span className={`text-sm font-bold font-display px-2 py-0.5 rounded ${
                            bulletinEleve.moyenneGenerale >= 10 ? 'text-emerald-600 bg-emerald-50' : 'text-danger bg-red-50'
                          }`}>
                            <span dir="ltr">{bulletinEleve.moyenneGenerale.toFixed(2)} / 20</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border/55 pb-2">
                          <span className="text-xs text-muted-foreground font-medium">{t('bulletins.table.rang', 'Rang')}</span>
                          <span className="text-xs font-bold text-text bg-slate-200/60 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                            <span dir="ltr">{bulletinEleve.rangClasse} / {bulletinEleve.effectifClasse}</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground font-medium">{t('bulletins.table.mention', 'Mention')}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            bulletinEleve.moyenneGenerale >= 10 ? 'bg-primary-light text-primary' : 'bg-red-50 text-danger'
                          }`}>
                            {bulletinEleve.appreciation}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-lg text-center text-xs text-amber-800">
                        {t('bulletins.no_notes', 'Aucune note disponible pour ce trimestre ou relevé incomplet.')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3 border-t border-border pt-4 mt-2">
                    <DialogClose asChild>
                      <Button variant="outline" size="sm">{t('action.cancel', 'Fermer')}</Button>
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
                    {classe?.nom || t('eleves.no_class', 'Sans classe')}
                  </Badge>
                  <Badge variant="outline" className={
                    eleve.statut === 'actif' ? 'bg-success/10 text-success border-success/20' : 
                    eleve.statut === 'suspendu' ? 'bg-warning/10 text-warning border-warning/20' : 
                    'bg-danger/10 text-danger border-danger/20'
                  }>
                    {eleve.statut === 'actif' ? t('eleves.status.actif', 'Actif') : eleve.statut === 'suspendu' ? t('eleves.status.suspendu', 'Suspendu') : t('eleves.status.exclu', 'Exclu')}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pb-1">
              {(() => {
                if (isParent) {
                  if (!dernierBulletinValide) return null
                  const hasPaid = aAccesPremium(dernierBulletinValide.trimestre)
                  if (!hasPaid) {
                    return (
                      <Badge 
                        variant="outline" 
                        className="px-3 py-1 bg-amber-50 text-amber-750 border-amber-200/50 cursor-pointer flex items-center gap-1 font-bold text-xs rounded-lg hover:bg-amber-100/60"
                        onClick={() => {
                          setPaywallTargetTrimestre(String(dernierBulletinValide.trimestre) as any)
                          setIsPaywallOpen(true)
                        }}
                      >
                        <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                        {t('eleves.moy_trimestre', 'Moy. T{trimestre} :').replace('{trimestre}', String(dernierBulletinValide.trimestre))} Premium
                      </Badge>
                    )
                  }
                  return (
                    <Badge variant="outline" className="px-3 py-1 bg-background">
                      {t('eleves.moy_trimestre', 'Moy. T{trimestre} :').replace('{trimestre}', String(dernierBulletinValide.trimestre))}
                      <strong className="ms-1 text-text">
                        <span dir="ltr">{dernierBulletinValide.moyenneGenerale.toFixed(2)}/20</span>
                      </strong>
                    </Badge>
                  )
                } else {
                  if (dernierBulletinValide) {
                    return (
                      <Badge variant="outline" className="px-3 py-1 bg-background">
                        {t('eleves.moy_trimestre', 'Moy. T{trimestre} :').replace('{trimestre}', String(dernierBulletinValide.trimestre))}
                        <strong className="ms-1 text-text">
                          <span dir="ltr">{dernierBulletinValide.moyenneGenerale.toFixed(2)}/20</span>
                        </strong>
                      </Badge>
                    )
                  } else if (moyenneT1 > 0) {
                    return (
                      <Badge variant="outline" className="px-3 py-1 bg-background">
                        {t('eleves.moy_t1', 'Moy. T1 :')} <strong className="ms-1 text-text"><span dir="ltr">{moyenneT1}/20</span></strong>
                      </Badge>
                    )
                  }
                  return null
                }
              })()}
              {paiementsEnRetard > 0 && (
                <Badge variant="outline" className="px-3 py-1 bg-danger/10 text-danger border-danger/20">
                  {paiementsEnRetard} {t('eleves.unpaid_count', 'impayé(s)')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Onglets d'informations */}
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => {
          if (isParent && (val === 'notes' || val === 'bulletins') && !aAccesPremium(trimestreNum)) {
            setPaywallTargetTrimestre(selectedTrimestre)
            setIsPaywallOpen(true)
            return
          }
          setActiveTab(val)
        }} 
        className="w-full"
        dir={dir}
      >
        <TabsList className="bg-card border border-border/50 w-full justify-start h-auto p-1 overflow-x-auto flex-nowrap sm:flex-wrap">
          <TabsTrigger value="infos" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <User className="w-4 h-4 me-2" />
            {t('parametres.tab.general', 'Informations')}
          </TabsTrigger>
          <TabsTrigger value="notes" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex items-center gap-1">
            <BookOpen className="w-4 h-4 me-2 shrink-0" />
            <span>{t('notes.title', 'Notes')}</span>
            {isParent && !aAccesPremium(trimestreNum) && <Lock className="w-3 h-3 text-amber-500 shrink-0 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="paiements" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <CreditCard className="w-4 h-4 me-2 shrink-0" />
            {t('paiements.title', 'Paiements')}
          </TabsTrigger>
          <TabsTrigger value="absences" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <CalendarOff className="w-4 h-4 me-2 shrink-0" />
            <span>{t('absences.title', 'Absences')}</span>
          </TabsTrigger>
          <TabsTrigger value="bulletins" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex items-center gap-1">
            <FileText className="w-4 h-4 me-2 shrink-0" />
            <span>{t('bulletins.title', 'Bulletins')}</span>
            {isParent && !aAccesPremium(trimestreNum) && <Lock className="w-3 h-3 text-amber-500 shrink-0 ml-1" />}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="infos" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-display">{t('eleves.identity', "Identité de l'élève")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 border-b border-border/50 pb-4">
                    <div className="col-span-1 text-sm text-muted-foreground">{t('eleves.birthdate', 'Date de naissance')}</div>
                    <div className="col-span-2 font-medium text-text">{eleve.dateNaissance ? formatDate(eleve.dateNaissance) : t('eleves.not_specified', 'Non renseignée')}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b border-border/50 pb-4">
                    <div className="col-span-1 text-sm text-muted-foreground">{t('inscriptions.filter_gender', 'Sexe')}</div>
                    <div className="col-span-2 font-medium text-text">{eleve.sexe === 'M' ? t('inscriptions.gender.M', 'Masculin') : t('inscriptions.gender.F', 'Féminin')}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 text-sm text-muted-foreground">{t('eleves.enrollment_date', "Date d'inscription")}</div>
                    <div className="col-span-2 font-medium text-text">{formatDate(eleve.dateInscription)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-display">{t('eleves.parent_contact', 'Contact Parent / Tuteur')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><User className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('enseignants.modal.name_label', 'Nom complet')}</p>
                      <p className="font-medium text-text">{eleve.parentNom || t('eleves.not_specified', 'Non renseigné')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <div className="p-2 bg-success/10 rounded-lg text-success"><Phone className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('enseignants.modal.phone_label', 'Téléphone (WhatsApp)')}</p>
                      <p className="font-medium text-text">
                        {eleve.parentTelephone ? (
                          <span className="inline-block" dir="ltr">{formatTelephone(eleve.parentTelephone)}</span>
                        ) : t('eleves.not_specified', 'Non renseigné')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/10 rounded-lg text-warning"><Mail className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('enseignants.modal.email_label', 'Email')}</p>
                      <p className="font-medium text-text">{eleve.parentEmail || t('eleves.not_specified', 'Non renseigné')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-lg font-display">
                  {t('notes.report_title', 'Relevé de Notes')} - {selectedTrimestre === '1' ? t('dashboard.t1', '1er Trimestre') : selectedTrimestre === '2' ? t('dashboard.t2', '2ème Trimestre') : t('dashboard.t3', '3ème Trimestre')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">{t('bulletins.period', 'Période')} :</span>
                  <Select
                    value={selectedTrimestre}
                    onValueChange={(val: '1' | '2' | '3') => {
                      const targetTrim = Number(val) as 1 | 2 | 3
                      if (isParent && !aAccesPremium(targetTrim)) {
                        setPaywallTargetTrimestre(val)
                        setIsPaywallOpen(true)
                      } else {
                        setSelectedTrimestre(val)
                      }
                    }}
                  >
                    <SelectTrigger className="w-[150px] h-8.5 font-bold text-xs bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="1" className="text-xs font-semibold">{t('dashboard.t1', '1er Trimestre')}</SelectItem>
                      <SelectItem value="2" className="text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          {t('dashboard.t2', '2ème Trimestre')}
                          {isParent && !aAccesPremium(2) && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                        </span>
                      </SelectItem>
                      <SelectItem value="3" className="text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          {t('dashboard.t3', '3ème Trimestre')}
                          {isParent && !aAccesPremium(3) && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {notes.filter(n => n.trimestre === trimestreNum).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('notes.no_notes', 'Aucune note enregistrée pour ce trimestre.')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-start border border-border/50 rounded-lg overflow-hidden">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                          <tr>
                            <th className="px-4 py-3 text-start">{t('matieres.table.name', 'Matière')}</th>
                            <th className="px-4 py-3 text-center">{t('notes.grade_out_of_20', 'Note /20')}</th>
                            <th className="px-4 py-3 text-center">{t('notes.grade_type', 'Type')}</th>
                            <th className="px-4 py-3 text-center">{t('matieres.table.coef', 'Coefficient')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {notes.filter(n => n.trimestre === trimestreNum).map(note => {
                            const matiere = matieres.find(m => m.id === note.matiereId)
                            return (
                              <tr key={note.id} className="hover:bg-muted/20">
                                <td className="px-4 py-3 text-start font-medium">{matiere?.nom || 'Inconnue'}</td>
                                <td className="px-4 py-3 text-center font-bold text-text">
                                  <span className={note.valeur < 10 ? 'text-danger' : 'text-success'}>
                                    {note.valeur}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-muted-foreground">
                                  {note.type === 'composition' ? t('notes.composition', 'Composition') : note.type === 'devoir' ? `${t('notes.devoir', 'Devoir')} ${note.numero || ''}` : t('notes.oral', 'Oral')}
                                </td>
                                <td className="px-4 py-3 text-center text-muted-foreground">{matiere?.coefficient}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paiements" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-display">{t('paiements.history.title', 'Historique des Paiements')}</CardTitle>
              </CardHeader>
              <CardContent>
                {paiements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('paiements.no_payments', 'Aucun paiement enregistré.')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                      <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                          <th className="px-4 py-3 text-start">{t('paiements.history.method', 'Libellé')}</th>
                          <th className="px-4 py-3 text-start">{t('dashboard.due_date', 'Date Limite')}</th>
                          <th className="px-4 py-3 text-start">{t('paiements.history.amount', 'Montant')}</th>
                          <th className="px-4 py-3 text-start">{t('paiements.table.status', 'Statut')}</th>
                          <th className="px-4 py-3 text-start">{t('paiements.history.method', 'Mode')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {paiements.map(paiement => (
                          <tr key={paiement.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3 text-start font-medium text-text">{paiement.type.replace('_', ' ').toUpperCase()}</td>
                            <td className="px-4 py-3 text-start text-muted-foreground">{formatDate(paiement.dateLimite)}</td>
                            <td className="px-4 py-3 text-start font-bold">
                              {formatCFA(paiement.montant)}
                              {paiement.montantPaye !== undefined && paiement.montantPaye > 0 && (
                                <div className="text-xs text-muted-foreground font-normal mt-0.5">
                                  {t('paiements.already_paid', 'Déjà payé')}: {formatCFA(paiement.montantPaye)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-start">
                              <Badge variant="outline" className={
                                paiement.statut === 'paye' ? 'bg-success/10 text-success border-success/20' : 
                                paiement.statut === 'retard' ? 'bg-danger/10 text-danger border-danger/20' : 
                                'bg-warning/10 text-warning border-warning/20'
                              }>
                                {paiement.statut === 'paye' ? t('paiements.status.solde', 'Payé') : paiement.statut === 'retard' ? t('dashboard.late', 'En retard') : t('dashboard.pending', 'En attente')}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-start text-muted-foreground uppercase text-xs">
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
                <CardTitle className="text-lg font-display">{t('absences.report', 'Relevé des Absences')}</CardTitle>
                <div className="text-sm font-medium">
                  {t('absences.total', 'Total')} : <span className="text-danger">{absences.length}</span> {t('absences.count_suffix', 'absence(s)')}
                </div>
              </CardHeader>
              <CardContent>
                {absences.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('absences.no_absences', 'Aucune absence enregistrée.')}</p>
                  ) : (
                    <div className="space-y-4">
                      {absences.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(absence => (
                        <div key={absence.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${absence.justifiee ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                              <CalendarOff className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-text">{formatDate(absence.date)}</p>
                              <p className="text-sm text-muted-foreground">{t('absences.seance', 'Séance')} : {absence.seance}</p>
                              {absence.motif && <p className="text-sm text-muted-foreground mt-1">{t('absences.modal.motif', 'Motif')} : {absence.motif}</p>}
                            </div>
                          </div>
                          <Badge variant="outline" className={absence.justifiee ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}>
                            {absence.justifiee ? t('dashboard.excused', 'Justifiée') : t('dashboard.unexcused', 'Non justifiée')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulletins" className="mt-0">
            <Card className="border-border/50 shadow-sm bg-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
                <div>
                  <CardTitle className="text-lg font-bold font-display text-text">{t('bulletins.title', 'Bulletins Scolaires')}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    {t('bulletins.subtitle', "Visualisez et téléchargez les relevés de notes officiels de l'année scolaire active.")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((tVal) => {
                      const currentAnneeId = selectedAnneeId || activeAnneeScolaire?.id || ecole?.anneeScolaire || ecoleMock.anneeScolaire
                      
                      const bulletinExistant = bulletins.find(
                        x => x.eleveId === eleve.id && x.trimestre === tVal && x.anneeScolaire === currentAnneeId
                      )

                      const studentInscription = inscriptions.find(
                        ins => ins.eleveId === eleve.id && ins.anneeScolaire === currentAnneeId && ins.statut === 'validee'
                      )
                      const targetClasseId = studentInscription?.classeId || eleve.classeId

                      const bulletinsCalculesT = (isParent && bulletinExistant)
                        ? [bulletinExistant]
                        : (targetClasseId ? calculerBulletinsClasse(targetClasseId, tVal as 1|2|3, currentAnneeId) : [])

                      const bEleveCalculé = bulletinsCalculesT.find(b => b.eleveId === eleve.id)
                      const bEleve = bulletinExistant 
                        ? { 
                            ...bulletinExistant, 
                            rangClasse: bEleveCalculé ? bEleveCalculé.rangClasse : bulletinExistant.rangClasse,
                            effectifClasse: bEleveCalculé ? bEleveCalculé.effectifClasse : bulletinExistant.effectifClasse,
                            moyenneGenerale: bEleveCalculé ? bEleveCalculé.moyenneGenerale : bulletinExistant.moyenneGenerale,
                            moyenneClasse: bEleveCalculé ? bEleveCalculé.moyenneClasse : bulletinExistant.moyenneClasse,
                            notes: bEleveCalculé ? bEleveCalculé.notes : bulletinExistant.notes,
                            appreciation: bEleveCalculé ? bEleveCalculé.appreciation : bulletinExistant.appreciation
                          } 
                        : bEleveCalculé
                      const isValide = bulletinExistant?.estValide === true
                      const hasNotes = bEleve && bEleve.notes.length > 0

                      return (
                        <div key={`trim-${tVal}`} className="border border-border/50 p-5 rounded-xl bg-card space-y-4 flex flex-col justify-between shadow-sm hover:border-primary/20 transition-all">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-border/40">
                              <h4 className="font-bold text-text">{tVal} {t('dashboard.trimestre', 'Trimestre')}</h4>
                              {isValide ? (
                                <Badge className="bg-emerald-500 text-white border-none font-bold text-[9px] px-1.5 py-0 rounded">
                                  ✓ {t('bulletins.status.validated', 'Validé')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-bold text-[9px] px-1.5 py-0 rounded">
                                  {t('bulletins.status.draft', 'En attente')}
                                </Badge>
                              )}
                            </div>

                            {isParent && !aAccesPremium(tVal) ? (
                              <div className="py-4 text-center space-y-3">
                                <div className="mx-auto w-8 h-8 bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
                                  <Lock className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-[11px] text-text">{t('parent.paywall.bulletin_locked_title', "Contenu Premium")}</p>
                                  <p className="text-[10px] text-muted-foreground max-w-[170px] mx-auto leading-relaxed">
                                    {t('parent.paywall.bulletin_locked_desc', "Débloquez les notes, le rang et le bulletin PDF de ce trimestre.")}
                                  </p>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="text-[10px] h-7 px-2.5 bg-transparent border border-amber-600/35 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 rounded-lg font-bold transition-colors shadow-none"
                                  onClick={() => {
                                    setPaywallTargetTrimestre(tVal.toString() as any)
                                    setIsPaywallOpen(true)
                                  }}
                                >
                                  {t('parent.paywall.bulletin_locked_unlock_btn', "Débloquer (1 000 F)")}
                                </Button>
                              </div>
                            ) : isValide || !isParent ? (
                              hasNotes && bEleve ? (
                                <div className="space-y-2.5 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">{t('kpi.moyenne', 'Moyenne Générale')}</span>
                                    <span className={`font-bold font-display px-2 py-0.5 rounded ${
                                      bEleve.moyenneGenerale >= 10 ? 'text-emerald-600 bg-emerald-50' : 'text-danger bg-red-50'
                                    }`}>
                                      <span dir="ltr">{bEleve.moyenneGenerale.toFixed(2)} / 20</span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">{t('bulletins.table.rang', 'Rang')}</span>
                                    <span className="font-bold text-text bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                      <span dir="ltr">{bEleve.rangClasse} / {bEleve.effectifClasse}</span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">{t('bulletins.table.mention', 'Appréciation')}</span>
                                    <span className={`font-bold px-2 py-0.5 rounded ${
                                      bEleve.moyenneGenerale >= 10 ? 'bg-primary-light text-primary' : 'bg-red-50 text-danger'
                                    }`}>
                                      {bEleve.appreciation}
                                    </span>
                                  </div>
                                  {bulletinExistant?.appreciationDirecteur && (
                                    <div className="mt-2 pt-2 border-t border-border/30">
                                      <span className="text-muted-foreground font-semibold block text-[10px] uppercase">{t('bulletins.table.appreciation', 'Remarques de la Direction')}</span>
                                      <p className="italic text-slate-600 text-[11px] leading-relaxed mt-1">
                                        &ldquo;{bulletinExistant.appreciationDirecteur}&rdquo;
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-6 italic">{t('bulletins.no_notes', 'Relevé incomplet ou aucune note disponible.')}</p>
                              )
                            ) : (
                              <div className="bg-slate-50 border border-border/40 p-4 rounded-lg text-center text-xs text-slate-500 py-8 leading-relaxed">
                                {t('bulletins.not_validated_yet', "Le bulletin de ce trimestre n'a pas encore été validé par la direction.")}
                              </div>
                            )}
                          </div>

                          {isParent && !aAccesPremium(tVal) ? (
                            <Button
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 h-9 rounded-lg"
                              onClick={() => {
                                setPaywallTargetTrimestre(tVal.toString() as any)
                                setIsPaywallOpen(true)
                              }}
                            >
                              <Lock className="h-3.5 w-3.5" />
                              {t('parent.paywall.bulletin_locked_unlock_access', "Débloquer l'accès")}
                            </Button>
                          ) : (isValide || !isParent) && hasNotes && bEleve ? (
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
                                fileName={`${getSafeFilename(`Bulletin_${eleve.nom}_${eleve.prenom}_T${tVal}`)}.pdf`}
                              >
                                {({ loading }) => (
                                  <Button
                                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 h-9 rounded-lg"
                                    disabled={loading}
                                  >
                                    {loading ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        {t('action.loading', 'Génération...')}
                                      </>
                                    ) : (
                                      <>
                                        <Download className="h-3.5 w-3.5" />
                                        {t('action.download', 'Télécharger le PDF')}
                                      </>
                                    )}
                                  </Button>
                                )}
                              </PDFDownloadLink>
                            ) : (
                              <Button size="sm" disabled className="w-full text-xs">
                                {t('action.loading', 'Chargement...')}
                              </Button>
                            )
                          ) : (
                            <Button size="sm" disabled className="w-full text-xs bg-slate-100 border border-border text-slate-400 font-semibold shadow-none">
                              {t('bulletins.status.incomplete', 'Non disponible')}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
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

      <ParentPremiumPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        initialTrimestre={paywallTargetTrimestre}
        anneeId={selectedAnneeId}
      />
    </div>
  )
}

export default function EleveDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation()
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />{t('action.loading', 'Chargement...')}</div>}>
      <EleveDetailsPageContent params={params} />
    </Suspense>
  )
}
