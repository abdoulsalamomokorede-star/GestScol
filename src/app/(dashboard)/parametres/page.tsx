'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { PremiumGuard } from '@/components/ui/PremiumGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getInitiales } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Settings, 
  UserPlus, 
  Building, 
  Save, 
  Users, 
  ShieldCheck, 
  ShieldAlert,
  ArrowLeft,
  Smartphone,
  Copy,
  Check,
  Trash2,
  Camera,
  Edit2,
  HelpCircle
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

export default function ParametresPage() {
  const router = useRouter()
  const { 
    currentUser, 
    ecole, 
    updateEcole, 
    deleteEnseignant, 
    comptesSimules, 
    updateCompteConnexion, 
    deleteCompteConnexion, 
    inscriptions, 
    absences, 
    paiements, 
    notes, 
    bulletins, 
    isAbonnementExpired 
  } = useSchoolStore()
  const { toast } = useToast()
  const { t, dir, isAr } = useTranslation()

  // --- PARAMÈTRES GÉNÉRAUX ---
  const [nomEcole, setNomEcole] = useState(ecole?.nom || '')
  const [adresse, setAdresse] = useState(ecole?.adresse || '')
  const { anneesScolaires, activeAnneeScolaire, addAnneeScolaire, updateAnneeScolaire, deleteAnneeScolaire, setActiveAnneeScolaire } = useSchoolStore()
  const [nouvelleAnneeNom, setNouvelleAnneeNom] = useState('')

  const [editingAnneeId, setEditingAnneeId] = useState<string | null>(null)
  const [editingAnneeNom, setEditingAnneeNom] = useState('')
  const [deleteAnneeId, setDeleteAnneeId] = useState<string | null>(null)
  const [deleteAnneeWarning, setDeleteAnneeWarning] = useState(false)

  const checkAnneeData = (id: string) => {
    return inscriptions.some(i => i.anneeScolaire === id) ||
           absences.some(a => a.anneeScolaire === id) ||
           paiements.some(p => p.anneeScolaire === id) ||
           notes.some(n => n.anneeScolaire === id) ||
           bulletins.some(b => b.anneeScolaire === id)
  }

  const handleDeleteAnnee = (id: string) => {
    const hasData = checkAnneeData(id)
    if (hasData) {
      setDeleteAnneeWarning(true)
    } else {
      setDeleteAnneeWarning(false)
    }
    setDeleteAnneeId(id)
  }

  const confirmDeleteAnnee = async () => {
    if (isAbonnementExpired()) {
      toast({
        title: t('toast.impossible_action', "Action impossible"),
        description: t('toast.expired_desc', "Abonnement expiré. Veuillez le renouveler pour effectuer cette action."),
        variant: "destructive"
      })
      return
    }
    if (deleteAnneeId) {
      await deleteAnneeScolaire(deleteAnneeId)
      toast({ title: t('toast.success', "Succès"), description: t('toast.school_year_deleted', "L'année scolaire a été supprimée.") })
      setDeleteAnneeId(null)
      setDeleteAnneeWarning(false)
    }
  }

  const handleEditAnnee = (annee: any) => {
    setEditingAnneeId(annee.id)
    setEditingAnneeNom(annee.nom)
  }

  const saveEditAnnee = async () => {
    if (isAbonnementExpired()) {
      toast({
        title: t('toast.impossible_action', "Action impossible"),
        description: t('toast.expired_desc', "Abonnement expiré. Veuillez le renouveler pour effectuer cette action."),
        variant: "destructive"
      })
      return
    }
    if (editingAnneeId && editingAnneeNom.trim()) {
      const exists = anneesScolaires.some(a => a.nom === editingAnneeNom.trim() && a.id !== editingAnneeId)
      if (exists) {
        toast({ title: t('toast.error', "Erreur"), description: t('toast.school_year_exists', "Cette année scolaire existe déjà."), variant: "destructive" })
        return
      }

      await updateAnneeScolaire(editingAnneeId, { nom: editingAnneeNom.trim() })
      toast({ title: t('toast.success', "Succès"), description: t('toast.school_year_updated', "L'année scolaire a été modifiée.") })
      setEditingAnneeId(null)
      setEditingAnneeNom('')
    }
  }
  const [devise, setDevise] = useState('FCFA')
  const [telephoneEcole, setTelephoneEcole] = useState(ecole?.telephone || '')
  const [logoEcole, setLogoEcole] = useState(ecole?.logo || '')

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({
          title: t('toast.file_too_large', "Fichier trop volumineux"),
          description: t('toast.file_too_large_desc', "La taille de l'image ne doit pas dépasser 1 Mo."),
          variant: "destructive"
        })
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLogoEcole(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // États Modales
  const [deleteCompteId, setDeleteCompteId] = useState<string | null>(null)
  const [deleteCompteRole, setDeleteCompteRole] = useState<string | null>(null)

  useEffect(() => {
    if (ecole) {
      setNomEcole(ecole.nom || '')
      setAdresse(ecole.adresse || '')
      setTelephoneEcole(ecole.telephone || '')
      setLogoEcole(ecole.logo || '')
    }
  }, [ecole])

  const [compteCreeApercu, setCompteCreeApercu] = useState<{
    identifiant: string
    mdpTemporaire: string
    nomComplet: string
    role: string
  } | null>(null)

  // Verrou d'accès pour les non-directeurs (après déclaration des hooks requis)
  if (!currentUser || currentUser.role !== 'directeur') {
    return (
      <div dir={dir}>
        <AccèsRestreint role={currentUser?.role} t={t} dir={dir} />
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState<'generaux' | 'comptes' | 'annees'>('generaux')
  const [loading, setLoading] = useState(false)

  const handleSaveGeneraux = (e: React.FormEvent) => {
    e.preventDefault()

    if (isAbonnementExpired()) {
      toast({
        title: t('toast.impossible_action', "Action impossible"),
        description: t('toast.expired_desc', "Abonnement expiré. Veuillez le renouveler pour effectuer cette action."),
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      updateEcole({
        nom: nomEcole,
        identifiant: ecole?.identifiant || 'ecole', 
        adresse: adresse,
        telephone: telephoneEcole,
        logo: logoEcole
      })
      
      toast({
        title: t('toast.config_saved', "Configuration sauvegardée"),
        description: t('toast.config_saved_desc', "Les paramètres globaux de l'école ont été mis à jour avec succès."),
        variant: "default"
      })
    }, 800)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: t('toast.copied', "Copié !"),
      description: t('toast.copied_desc', "L'identifiant a été copié dans votre presse-papiers."),
      duration: 1500
    })
  }

  const confirmDeleteCompte = () => {
    if (isAbonnementExpired()) {
      toast({
        title: t('toast.impossible_action', "Action impossible"),
        description: t('toast.expired_desc', "Abonnement expiré. Veuillez le renouveler pour effectuer cette action."),
        variant: "destructive"
      })
      return
    }
    if (deleteCompteId) {
      deleteCompteConnexion(deleteCompteId)
      if (deleteCompteRole === 'enseignant') {
        deleteEnseignant(deleteCompteId)
      }
      toast({
        title: t('toast.account_deleted', "Compte supprimé"),
        description: t('toast.account_deleted_desc', "Le compte a été supprimé avec succès."),
      })
      setDeleteCompteId(null)
      setDeleteCompteRole(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={dir}>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text flex items-center gap-2 sm:gap-3 text-start">
            <span className="p-2 rounded-2xl bg-primary/10 text-primary">
              <Settings className="h-8 w-8" />
            </span>
            {t('parametres.title', "Paramètres Généraux")}
          </h1>
          <p className="text-muted-foreground text-sm mt-2 text-start">
            {t('parametres.subtitle', "Configurez les détails administratifs de l'école ou créez de nouveaux comptes d'utilisateurs sécurisés.")}
          </p>
        </div>
      </div>

      {/* Menu Onglets */}
      <div className="flex overflow-x-auto whitespace-nowrap border-b border-border/50">
        <button
          onClick={() => {
            setActiveTab('generaux')
            setCompteCreeApercu(null)
          }}
          className={`pb-4 px-6 font-display font-bold text-sm transition-all duration-200 relative ${
            activeTab === 'generaux'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-text'
          }`}
        >
          <span className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {t('parametres.tab.general', "L'Établissement")}
          </span>
          {activeTab === 'generaux' && (
            <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('comptes')}
          className={`pb-4 px-6 font-display font-bold text-sm transition-all duration-200 relative ${
            activeTab === 'comptes'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-text'
          }`}
        >
          <span className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('parametres.tab.users', "Création de Comptes")}
            <Badge variant="secondary" className="ms-1 bg-primary/5 text-primary hover:bg-primary/10 font-bold text-[10px]">
              + Rôles
            </Badge>
          </span>
          {activeTab === 'comptes' && (
            <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('annees')
            setCompteCreeApercu(null)
          }}
          className={`pb-4 px-6 font-display font-bold text-sm transition-all duration-200 relative ${
            activeTab === 'annees'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-text'
          }`}
        >
          <span className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {t('parametres.tab.years', "Années Scolaires")}
          </span>
          {activeTab === 'annees' && (
            <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* CONTENU : PARAMÈTRES GÉNÉRAUX */}
      {activeTab === 'generaux' && (
        <div className="max-w-4xl mx-auto animate-in fade-in-50 duration-200">
          <Card className="shadow-sm border-border/50 bg-card text-start">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold text-text flex items-center gap-2 uppercase tracking-wide">
                <Building className="h-4.5 w-4.5 text-primary shrink-0" />
                {t('parametres.school.title', "Fiche administrative de l'école")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('parametres.school.desc', "Ces informations seront reportées sur la landing page publique et en en-tête des reçus et bulletins officiels.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveGeneraux} className="space-y-4">
                {/* Logo de l'établissement */}
                <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-border/40 pb-4 mb-4">
                  <div className="relative group cursor-pointer shrink-0">
                    <Avatar className="h-16 w-16 border border-primary/20 shadow-sm rounded-xl">
                      {logoEcole ? (
                        <AvatarImage src={logoEcole} className="object-cover rounded-xl" />
                      ) : null}
                      <AvatarFallback className="bg-primary/5 text-primary text-xl font-extrabold rounded-xl">
                        {getInitiales(nomEcole, '')}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 bg-black/45 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                      <Camera className="h-4 w-4 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  </div>
                  <div className="text-start">
                    <h4 className="text-xs font-bold text-text uppercase">{t('parametres.school.logo', "Logo de l'établissement")}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t('parametres.school.logo_desc', "Cliquez sur l'image pour charger votre logo officiel. Format recommandé : PNG carré avec fond transparent, max 1 Mo.")}</p>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="school-name" className="text-xs font-bold text-muted-foreground uppercase">{t('parametres.school.name', "Nom de l'établissement")}</Label>
                    <Input 
                      id="school-name" 
                      value={nomEcole} 
                      onChange={(e) => setNomEcole(e.target.value)} 
                      className="text-xs h-9 border-border font-semibold bg-background" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="school-year" className="text-xs font-bold text-muted-foreground uppercase">{t('parametres.school.active_year', "Année Scolaire active")}</Label>
                    <Input 
                      id="school-year" 
                      value={activeAnneeScolaire?.nom || ''} 
                      disabled 
                      className="text-xs h-9 border-border font-semibold bg-muted/50 cursor-not-allowed text-muted-foreground" 
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label htmlFor="school-address" className="text-xs font-bold text-muted-foreground uppercase">{t('parametres.school.address', "Adresse Physique / Siège")}</Label>
                    <Input 
                      id="school-address" 
                      value={adresse} 
                      onChange={(e) => setAdresse(e.target.value)} 
                      className="text-xs h-9 border-border font-semibold bg-background" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="school-currency" className="text-xs font-bold text-muted-foreground uppercase">{t('parametres.school.currency', "Devise Monétaire")}</Label>
                    <select
                      id="school-currency"
                      value={devise}
                      onChange={(e) => setDevise(e.target.value)}
                      className="w-full bg-background border border-border text-text rounded-xl px-3 h-9 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="FCFA">Franc CFA (FCFA)</option>
                      <option value="USD">Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="school-phone" className="text-xs font-bold text-muted-foreground uppercase">{t('parametres.school.phone', "Téléphone Secrétariat")}</Label>
                  <Input 
                    id="school-phone" 
                    value={telephoneEcole} 
                    onChange={(e) => setTelephoneEcole(e.target.value)} 
                    className="text-xs h-9 border-border font-semibold bg-background" 
                    required 
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shrink-0 ms-auto"
                >
                  <Save className="h-4 w-4" />
                  {loading ? t('action.saving', "Enregistrement...") : t('parametres.school.save', "Enregistrer la configuration")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTENU : CRÉATION DE COMPTES */}
      {activeTab === 'comptes' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
          
          {/* APERÇU DE LA CARTE DE SÉCURITÉ */}
          {compteCreeApercu && (
            <Card className="shadow-lg border-primary/30 dark:border-primary/20 bg-emerald-50/50 dark:bg-emerald-950/20 border-l-4 border-l-primary animate-in zoom-in-95 duration-200 text-start">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  {t('parametres.users.success_title', "Compte académique configuré avec succès !")}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t('parametres.users.success_desc', "Transmettez ces accès temporaires de manière confidentielle à l'utilisateur concerné.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 text-xs">
                  <div className="bg-card border border-border p-3.5 rounded-xl space-y-1.5 shadow-sm">
                    <p className="text-muted-foreground font-semibold">{t('parametres.users.beneficiary', "Bénéficiaire")}</p>
                    <p className="text-sm font-extrabold text-text">{compteCreeApercu.nomComplet}</p>
                    <p className="text-[10px] text-primary font-bold uppercase">{compteCreeApercu.role}</p>
                  </div>
                  
                  <div className="bg-card border border-border p-3.5 rounded-xl space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-muted-foreground font-semibold">{t('parametres.users.login_id', "Identifiant de connexion")}</p>
                        <p className="text-sm font-mono font-bold text-text mt-0.5">{compteCreeApercu.identifiant}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(compteCreeApercu.identifiant, 'id-copy')}
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        {copiedId === 'id-copy' ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-2">
                      <div>
                        <p className="text-muted-foreground font-semibold">{t('parametres.users.password', "Mot de passe")}</p>
                        <p className="text-sm font-mono font-bold text-text mt-0.5">{compteCreeApercu.mdpTemporaire}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(compteCreeApercu.mdpTemporaire, 'pwd-copy')}
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        {copiedId === 'pwd-copy' ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setCompteCreeApercu(null)}
                    className="font-bold text-xs text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    {t('parametres.users.hide_sheet', "Masquer la fiche de sécurité")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {/* INVITATION & LIENS */}
            <Card className="shadow-sm border-border/50 bg-card w-full text-start">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold text-text flex items-center gap-2 uppercase tracking-wide">
                  <UserPlus className="h-4.5 w-4.5 text-primary" />
                  {t('parametres.users.invite_title', "Inviter des collaborateurs & parents")}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t('parametres.users.invite_desc', "Partagez ces liens uniques d'inscription. Les enseignants et parents d'élèves pourront créer eux-mêmes leur compte sécurisé en quelques secondes.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-border/60 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t('parametres.help.title', "Comment ça marche ?")}</span>
                    <ul className="list-disc ps-4 mt-1 space-y-1">
                      <li>{t('parametres.help.item1', "Copiez le lien correspondant au rôle souhaité (Enseignant ou Parent).")}</li>
                      <li>{t('parametres.help.item2', "Envoyez-le par SMS, WhatsApp ou E-mail aux personnes concernées.")}</li>
                      <li>{t('parametres.help.item3', "Ils s'inscrivent en ligne de manière autonome.")}</li>
                      <li>{t('parametres.help.item4', "Une fois leur compte créé, ils s'afficheront instantanément dans votre liste ci-contre.")}</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* LIEN ENSEIGNANT */}
                  <div className="border border-border/60 rounded-2xl p-4 bg-background space-y-3 hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-text uppercase flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-amber-500" />
                          {t('parametres.links.teacher', "Lien d'inscription Enseignant")}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t('parametres.links.teacher_desc', "Permet aux enseignants de s'inscrire et de s'associer à votre établissement pour saisir les notes et faire l'appel.")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-border px-3 py-2 rounded-xl text-[11px] font-mono text-muted-foreground select-all truncate">
                        {typeof window !== 'undefined' ? `${window.location.origin}/register/enseignant` : '...'}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = `${window.location.origin}/register/enseignant`
                          navigator.clipboard.writeText(url)
                          setCopiedId('url-enseignant')
                          setTimeout(() => setCopiedId(null), 2000)
                          toast({
                            title: t('toast.copied', "Lien copié !"),
                            description: t('toast.teacher_link_copied', "Le lien d'inscription Enseignant a été copié."),
                          })
                        }}
                        className="h-9 shrink-0 flex items-center gap-1.5 px-3 rounded-xl border-border bg-white dark:bg-slate-900 text-text hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs"
                      >
                        {copiedId === 'url-enseignant' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-primary" />
                            <span>{t('action.copied', "Copié")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{t('action.copy', "Copier")}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* LIEN PARENT */}
                  <div className="border border-border/60 rounded-2xl p-4 bg-background space-y-3 hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-text uppercase flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5 text-primary" />
                          {t('parametres.links.parent', "Lien d'inscription Parent")}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t('parametres.links.parent_desc', "Permet aux parents de s'inscrire pour suivre en temps réel la scolarité, les notes et les absences de leurs enfants.")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-border px-3 py-2 rounded-xl text-[11px] font-mono text-muted-foreground select-all truncate">
                        {typeof window !== 'undefined' ? `${window.location.origin}/register/parent` : '...'}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = `${window.location.origin}/register/parent`
                          navigator.clipboard.writeText(url)
                          setCopiedId('url-parent')
                          setTimeout(() => setCopiedId(null), 2000)
                          toast({
                            title: t('toast.copied', "Lien copié !"),
                            description: t('toast.parent_link_copied', "Le lien d'inscription Parent a été copié."),
                          })
                        }}
                        className="h-9 shrink-0 flex items-center gap-1.5 px-3 rounded-xl border-border bg-white dark:bg-slate-900 text-text hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs"
                      >
                        {copiedId === 'url-parent' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-primary" />
                            <span>{t('action.copied', "Copié")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{t('action.copy', "Copier")}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CONTENU : ANNÉES SCOLAIRES */}
      {activeTab === 'annees' && (
        <div className="max-w-4xl mx-auto animate-in fade-in-50 duration-200 space-y-6">
          <Card className="shadow-sm border-border/50 bg-card text-start">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold text-text flex items-center gap-2 uppercase tracking-wide">
                <Building className="h-4.5 w-4.5 text-primary shrink-0" />
                {t('parametres.years.title', "Gestion des Années Scolaires")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('parametres.years.desc', "Ajoutez ou activez une année scolaire. L'année active est utilisée par défaut dans toute l'application.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="space-y-1 flex-1 w-full">
                  <Label htmlFor="new-school-year" className="text-xs font-bold text-muted-foreground uppercase">{t('parametres.years.new', "Nouvelle Année Scolaire")}</Label>
                  <Input 
                    id="new-school-year" 
                    value={nouvelleAnneeNom}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9-]/g, '')
                      const rawNumbers = val.replace(/-/g, '')
                      if (rawNumbers.length > 4) {
                        val = rawNumbers.substring(0, 4) + '-' + rawNumbers.substring(4, 8)
                      } else {
                        val = rawNumbers
                      }
                      setNouvelleAnneeNom(val)
                    }} 
                    maxLength={9}
                    placeholder="Ex: 2025-2026" 
                    className="text-xs h-9 border-border font-semibold bg-background" 
                  />
                </div>
                <Button 
                  onClick={() => {
                    if (!nouvelleAnneeNom.trim()) return
                    
                    const exists = anneesScolaires.some(a => a.nom === nouvelleAnneeNom)
                    if (exists) {
                      toast({ title: t('toast.error', "Erreur"), description: t('toast.school_year_exists', "Cette année scolaire existe déjà."), variant: "destructive" })
                      return
                    }

                    const match = nouvelleAnneeNom.match(/^(\d{4})/)
                    const startYear = match ? parseInt(match[1]) : new Date().getFullYear()

                    addAnneeScolaire({
                      id: `as-${nouvelleAnneeNom}`,
                      nom: nouvelleAnneeNom,
                      dateDebut: `${startYear}-09-01`,
                      dateFin: `${startYear + 1}-07-31`,
                      statut: 'archivee'
                    }).then((res: any) => {
                      if (res?.success) {
                        setNouvelleAnneeNom('')
                        toast({ title: t('toast.success', "Succès"), description: t('toast.school_year_added', "Année scolaire ajoutée.") })
                      } else {
                        toast({ title: t('toast.error', "Erreur"), description: res?.error || "Impossible d'ajouter l'année scolaire.", variant: "destructive" })
                      }
                    })
                  }}
                  className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md h-9 shrink-0 w-full sm:w-auto"
                >
                  {t('action.add', "Ajouter")}
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase">{t('parametres.years.list_title', "Liste des années scolaires")}</h3>
                <div className="grid gap-3">
                  {anneesScolaires.map(annee => (
                    <div key={annee.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-border/50 rounded-xl bg-muted/10">
                      {editingAnneeId === annee.id ? (
                        <div className="flex-1 w-full sm:w-auto flex items-center gap-2">
                          <Input 
                            value={editingAnneeNom}
                            onChange={(e) => setEditingAnneeNom(e.target.value)}
                            className="text-xs h-9 w-full sm:w-48"
                          />
                          <Button size="sm" onClick={saveEditAnnee} className="bg-success text-white hover:bg-success/90 h-9 shrink-0">{t('action.save', "Enregistrer")}</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingAnneeId(null)} className="h-9 shrink-0">{t('action.cancel', "Annuler")}</Button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="font-bold text-text flex items-center gap-2">
                            {annee.nom}
                            {annee.statut === 'active' && <Badge className="bg-success/10 text-success border-success/20 shadow-none text-[9px] py-0">{t('parametres.years.table.status.active', "Active")}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t('parametres.years.range_format', "Du {dateDebut} au {dateFin}").replace('{dateDebut}', annee.dateDebut).replace('{dateFin}', annee.dateFin)}
                          </p>
                        </div>
                      )}
                      
                      {editingAnneeId !== annee.id && (
                        <div className="flex items-center gap-2">
                          {annee.statut !== 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs h-8 text-primary border-primary/20 hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setActiveAnneeScolaire(annee.id)
                                toast({ title: t('toast.success', "Succès"), description: `L'année ${annee.nom} est maintenant active.` })
                              }}
                            >
                              {t('parametres.years.action.activate', "Rendre Active")}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs h-8 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                            onClick={() => handleEditAnnee(annee)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs h-8 text-danger hover:text-danger hover:bg-danger/10 shrink-0"
                            onClick={() => handleDeleteAnnee(annee.id)}
                            disabled={annee.statut === 'active' && anneesScolaires.length <= 1}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modales */}
      <ConfirmDeleteModal
        isOpen={!!deleteCompteId}
        onClose={() => {
          setDeleteCompteId(null)
          setDeleteCompteRole(null)
        }}
        onConfirm={confirmDeleteCompte}
        title={t('parametres.delete_compte.title', "Supprimer ce compte ?")}
        description={t('parametres.delete_compte.desc', "Voulez-vous vraiment supprimer ce compte utilisateur ? Cette action est irréversible et annulera ses accès.")}
        confirmText={t('action.confirm', "Confirmer")}
        cancelText={t('action.cancel', "Annuler")}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteAnneeId}
        onClose={() => {
          setDeleteAnneeId(null)
          setDeleteAnneeWarning(false)
        }}
        onConfirm={confirmDeleteAnnee}
        title={t('parametres.delete_year.title', "Supprimer cette année scolaire ?")}
        description={deleteAnneeWarning ? t('parametres.delete_year.warning_desc', "ATTENTION : Des données (inscriptions, paiements, absences, notes, bulletins) sont liées à cette année scolaire. Si vous la supprimez, TOUTES ces données seront définitivement effacées ! Voulez-vous continuer ?") : t('parametres.delete_year.simple_desc', "Voulez-vous vraiment supprimer cette année scolaire ?")}
        confirmText={t('action.confirm', "Confirmer")}
        cancelText={t('action.cancel', "Annuler")}
      />
    </div>
  )
}

interface AccèsRestreintProps {
  role?: 'directeur' | 'enseignant' | 'parent'
  t: (key: string, fallback: string) => string
  dir: 'ltr' | 'rtl'
}

function AccèsRestreint({ role, t, dir }: AccèsRestreintProps) {
  const router = useRouter()

  const handleReturn = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4" dir={dir}>
      <Card className="max-w-md w-full text-center p-8 border-rose-100 dark:border-border/60 shadow-xl bg-white/80 dark:bg-card/80 backdrop-blur-md relative overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />
        
        <CardContent className="pt-6 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center animate-pulse border border-rose-100 dark:border-rose-900/30">
            <ShieldAlert className="h-9 w-9 text-rose-500 animate-pulse shrink-0" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-extrabold text-text">
              {t('parametres.restricted.title', "Accès Privilégié Restreint")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t('parametres.restricted.desc', "Cet espace de configuration système et de création de comptes est strictement réservé à la Direction générale de l'établissement.")}
            </p>
          </div>

          <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-4 border border-rose-100/50 dark:border-rose-900/30 text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
            {t('parametres.restricted.role_desc', "Votre profil actuel {role} ne dispose pas des privilèges d'habilitation requis pour modifier ces paramètres.").replace('{role}', (role || 'visiteur').toUpperCase())}
          </div>

          <Button
            onClick={handleReturn}
            className="w-full bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary-dark text-white font-bold rounded-2xl text-xs py-5 flex items-center justify-center gap-2 shadow-md transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180 shrink-0" />
            {t('parametres.restricted.btn_back', "Retourner à mon espace sécurisé")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
