'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Briefcase, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Link as LinkIcon, 
  RefreshCw, 
  Send, 
  Check, 
  Copy, 
  Clock, 
  Key, 
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitiales } from '@/lib/utils'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { PremiumGuard } from '@/components/ui/PremiumGuard'

export default function EnseignantsPage() {
  const router = useRouter()
  const { 
    enseignants, 
    addEnseignant, 
    updateEnseignant, 
    deleteEnseignant, 
    gererAjoutEnseignant, 
    annulerInvitationEnseignant,
    chargerEnseignants, 
    currentUser, 
    isAbonnementExpired,
    ecole
  } = useSchoolStore()
  
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'actifs' | 'invitations'>('actifs')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [civiliteFiltre, setCiviliteFiltre] = useState('tous')
  
  // Listes réelles chargées depuis Supabase
  const [teachersActifs, setTeachersActifs] = useState<any[]>([])
  const [invitationsList, setInvitationsList] = useState<any[]>([])
  
  // États d'invitation / d'ajout
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  
  // Copie de code
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // États modification d'enseignant
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    civilite: 'M' | 'Mme' | 'Dr' | 'Pr',
    nom: string,
    prenom: string,
    email: string,
    telephone: string
  }>({ civilite: 'M', nom: '', prenom: '', email: '', telephone: '' })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteInviteId, setDeleteInviteId] = useState<string | null>(null)

  const confirmDeleteInvite = async () => {
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (deleteInviteId) {
      try {
        const res = await annulerInvitationEnseignant(deleteInviteId)
        if (!res.success) {
          toast({
            title: "Erreur",
            description: res.error || "Impossible d'annuler l'invitation.",
            variant: "destructive"
          })
          return
        }
        toast({
          title: "Invitation annulée !",
          description: "L'invitation a été supprimée avec succès.",
          className: "bg-success text-white border-none shadow-lg"
        })
        setDeleteInviteId(null)
        rafraichirEnseignants(true)
      } catch (err: any) {
        toast({ title: "Erreur", description: err.message, variant: "destructive" })
      }
    }
  }

  // Synchroniser et charger les enseignants de l'école
  const rafraichirEnseignants = async (silencieusement = false) => {
    if (!silencieusement) setLoading(true)
    try {
      const res = await chargerEnseignants()
      setTeachersActifs(res.associes || [])
      setInvitationsList(res.invitationsEnAttente || [])
    } catch (err) {
      console.error(err)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de récupérer la liste des enseignants.",
        variant: "destructive"
      })
    } finally {
      if (!silencieusement) setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      rafraichirEnseignants()
    }
  }, [currentUser?.id])

  // Filtrer les enseignants actifs
  const filteredActifs = teachersActifs.filter(e => {
    const matchSearch = `${e.prenom} ${e.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) || e.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCivilite = civiliteFiltre === 'tous' || e.civilite === civiliteFiltre
    return matchSearch && matchCivilite
  })

  // Copier le code d'invitation dans le presse-papier
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast({
      title: "Code copié !",
      description: `Le code d'invitation ${code} a été copié dans le presse-papiers.`,
      variant: "default"
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Ouvrir la modale d'édition
  const handleOpenEdit = (ens: any) => {
    setEditingId(ens.id)
    setFormData({ 
      civilite: (ens.civilite as 'M' | 'Mme' | 'Dr' | 'Pr') || 'M', 
      nom: ens.nom, 
      prenom: ens.prenom, 
      email: ens.email, 
      telephone: ens.telephone || '' 
    })
    setIsEditModalOpen(true)
  }

  // Inviter / Ajouter Enseignant
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }

    if (!inviteEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast({
        title: "Adresse invalide",
        description: "Veuillez entrer une adresse e-mail valide.",
        variant: "destructive"
      })
      return
    }

    setIsInviting(true)
    try {
      const res = await gererAjoutEnseignant(inviteEmail.toLowerCase().trim())
      if (!res.success) {
        toast({
          title: "Échec de l'ajout",
          description: res.error || "Une erreur est survenue.",
          variant: "destructive"
        })
        return
      }

      if (res.cas === 'associe') {
        toast({
          title: "Enseignant associé !",
          description: `L'enseignant ${res.nomEnseignant || inviteEmail} possédait déjà un compte et a été automatiquement lié à votre établissement.`,
          variant: "default"
        })
      } else {
        toast({
          title: "Invitation envoyée !",
          description: `Une invitation a été générée avec succès pour l'adresse ${inviteEmail}. Transmettez-lui son code de liaison.`,
          className: "bg-success text-white border-none shadow-lg"
        })
      }
      setInviteEmail('')
      setIsInviteModalOpen(false)
      rafraichirEnseignants(true)
    } catch (err: any) {
      toast({
        title: "Erreur serveur",
        description: err.message || "Une erreur inattendue est survenue.",
        variant: "destructive"
      })
    } finally {
      setIsInviting(false)
    }
  }

  // Sauvegarder les modifications profil enseignant
  const handleSaveEdit = async () => {
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (!formData.nom || !formData.prenom) {
      toast({ title: "Erreur", description: "Veuillez remplir le nom et prénom.", variant: "destructive" })
      return
    }
    
    try {
      if (editingId) {
        const res = await updateEnseignant(editingId, formData)
        if (!res.success) {
          toast({ title: "Erreur", description: res.error || "Impossible de modifier.", variant: "destructive" })
          return
        }
        toast({ title: "Succès", description: "Profil enseignant mis à jour." })
        setIsEditModalOpen(false)
        rafraichirEnseignants(true)
      }
    } catch (err: any) {
      toast({ 
        title: "Erreur", 
        description: err.message, 
        variant: "destructive" 
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (deleteId) {
      try {
        const res = await deleteEnseignant(deleteId)
        if (!res.success) {
          toast({ title: "Erreur", description: res.error || "Impossible de supprimer.", variant: "destructive" })
          return
        }
        toast({ title: "Succès", description: "Enseignant retiré de l'établissement." })
        setDeleteId(null)
        rafraichirEnseignants(true)
      } catch (err: any) {
        toast({ title: "Erreur", description: err.message, variant: "destructive" })
      }
    }
  }

  if (ecole?.abonnement?.plan === 'gratuit') {
    return (
      <PremiumGuard 
        title="Gestion des Enseignants" 
        description="Gérez les dossiers enseignants, assignez-les aux classes et aux matières, gérez les invitations et les codes de liaison pour vos collaborateurs de manière centralisée."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-6 w-6" />
            </span>
            Gestion des Enseignants & Liaison
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les dossiers enseignants, assignez-les aux classes et invitez de nouveaux collaborateurs.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button 
            variant="outline"
            size="icon"
            onClick={() => rafraichirEnseignants()}
            disabled={loading}
            className="h-10 w-10 border-border shrink-0"
            title="Actualiser la liste"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </Button>

          <Button 
            onClick={() => setIsInviteModalOpen(true)} 
            className="flex-1 sm:flex-none bg-primary text-white hover:bg-primary-dark font-bold rounded-xl h-10 px-5 flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            Inviter un enseignant
          </Button>
        </div>
      </div>

      <Tabs defaultValue="actifs" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border border-border/40 rounded-xl w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto">
          <TabsTrigger value="actifs" className="rounded-lg font-semibold px-5 py-2 text-xs sm:text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Enseignants Actifs
            {teachersActifs.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary font-bold text-[10px]">
                {teachersActifs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations" className="rounded-lg font-semibold px-5 py-2 text-xs sm:text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Invitations envoyées
            {invitationsList.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-500/10 text-amber-500 font-bold text-[10px]">
                {invitationsList.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* CONTENU : ENSEIGNANTS ACTIFS */}
        <TabsContent value="actifs" className="space-y-6 mt-0">
          <div className="bg-card p-4 rounded-xl shadow-sm border border-border/50 flex flex-col sm:flex-row gap-4 items-center">
            <Input 
              placeholder="Rechercher un enseignant par nom, prénom ou e-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border-border text-sm"
            />
            <Select value={civiliteFiltre} onValueChange={setCiviliteFiltre}>
              <SelectTrigger className="w-full sm:w-48 bg-background border-border shrink-0">
                <SelectValue placeholder="Toutes civilités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes civilités</SelectItem>
                <SelectItem value="M">M.</SelectItem>
                <SelectItem value="Mme">Mme</SelectItem>
                <SelectItem value="Dr">Dr</SelectItem>
                <SelectItem value="Pr">Pr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs uppercase tracking-widest font-bold">Synchronisation en cours...</p>
              </div>
            ) : filteredActifs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="font-bold text-text">Aucun enseignant actif</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recherchez avec d'autres filtres ou invitez un nouvel enseignant par e-mail.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-xs uppercase font-bold text-muted-foreground">
                      <th className="p-4 pl-6">Enseignant</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Statut École</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredActifs.map(enseignant => (
                      <tr key={enseignant.id} className="hover:bg-muted/5 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-9 w-9 border border-primary/20">
                              {enseignant.photoUrl ? (
                                <AvatarImage src={enseignant.photoUrl} className="object-cover" />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {getInitiales(enseignant.nom, enseignant.prenom)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-text leading-snug">
                                {enseignant.civilite ? `${enseignant.civilite} ` : ''}{enseignant.prenom} {enseignant.nom}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">Enseignant de l'école</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="text-xs flex items-center text-muted-foreground font-medium">
                              <Mail className="h-3.5 w-3.5 mr-2 shrink-0" />
                              {enseignant.email}
                            </p>
                            {enseignant.telephone && (
                              <p className="text-xs flex items-center text-muted-foreground font-medium">
                                <Phone className="h-3.5 w-3.5 mr-2 shrink-0" />
                                {enseignant.telephone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[9px] font-extrabold tracking-wider">
                            Actif
                          </Badge>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              onClick={() => router.push(`/enseignants/${enseignant.id}/assignations`)} 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-primary hover:text-white hover:bg-primary transition-colors rounded-lg border border-primary/10 shrink-0" 
                              title="Assigner (Classes & Matières)"
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => handleOpenEdit(enseignant)} 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-muted-foreground hover:text-text hover:bg-muted border border-border transition-colors rounded-lg shrink-0" 
                              title="Modifier les coordonnées"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteClick(enseignant.id)} 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-destructive hover:text-white hover:bg-destructive transition-colors border border-destructive/10 rounded-lg shrink-0" 
                              title="Retirer cet enseignant"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* CONTENU : INVITATIONS EN ATTENTE */}
        <TabsContent value="invitations" className="space-y-6 mt-0">
          <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs uppercase tracking-widest font-bold">Chargement des invitations...</p>
              </div>
            ) : invitationsList.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
                <Clock className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="font-bold text-text">Aucune invitation en attente</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Toutes les invitations ont été acceptées ou ont expiré.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-xs uppercase font-bold text-muted-foreground">
                      <th className="p-4 pl-6">E-mail de liaison</th>
                      <th className="p-4">Code d'invitation</th>
                      <th className="p-4">Date d'envoi</th>
                      <th className="p-4">Expiration</th>
                      <th className="p-4">Liaison</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {invitationsList.map(invite => (
                      <tr key={invite.id} className="hover:bg-muted/5 transition-colors">
                        <td className="p-4 pl-6 font-bold text-text flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                          {invite.emailCible}
                        </td>
                        <td className="p-4">
                          <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl py-1 px-3 shadow-inner">
                            <Key className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <code className="text-xs font-mono font-bold text-amber-400 select-all tracking-wider">
                              {invite.code}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-slate-400 hover:text-white shrink-0 hover:bg-slate-800"
                              onClick={() => handleCopyCode(invite.code, invite.id)}
                            >
                              {copiedId === invite.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground font-semibold">
                          {new Date(invite.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                            <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>Exp. {new Date(invite.expireLe).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[9px] font-extrabold tracking-wider">
                            En attente
                          </Badge>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <Button
                            onClick={() => setDeleteInviteId(invite.id)}
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-white hover:bg-destructive transition-colors border border-destructive/10 rounded-lg shrink-0"
                            title="Supprimer l'invitation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODALE : INVITER UN ENSEIGNANT */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-text flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Inviter un enseignant
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Entrez l'adresse e-mail professionnelle de l'enseignant. Un code d'invitation unique sera généré pour sécuriser sa liaison au Groupe Scolaire.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-bold text-muted-foreground uppercase">Adresse E-mail Professionnelle</Label>
              <Input 
                id="invite-email"
                type="email"
                placeholder="enseignant@lesflamboyants.ci"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="bg-background border-border text-sm h-11"
                required
              />
            </div>
            
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>Annuler</Button>
              <Button 
                type="submit" 
                disabled={isInviting}
                className="bg-primary text-white hover:bg-primary-dark font-bold px-6 shadow-md"
              >
                {isInviting ? (
                  <>
                    Génération... <RefreshCw className="ml-1.5 h-4 w-4 animate-spin shrink-0" />
                  </>
                ) : (
                  <>
                    Générer l'invitation <Send className="ml-1.5 h-4 w-4 shrink-0" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODALE : MODIFIER LES COORDONNÉES */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-text flex items-center gap-2">
              <Edit className="h-5.5 w-5.5 text-primary shrink-0" />
              Modifier les coordonnées
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <Label>Civilité</Label>
                <Select
                  value={formData.civilite}
                  onValueChange={(value) => setFormData({...formData, civilite: value as 'M' | 'Mme' | 'Dr' | 'Pr'})}
                >
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue placeholder="Civilité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">M.</SelectItem>
                    <SelectItem value="Mme">Mme</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Pr">Pr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label>Nom</Label>
                <Input 
                  value={formData.nom} 
                  onChange={e => setFormData({...formData, nom: e.target.value})} 
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-4">
                <Label>Prénoms</Label>
                <Input 
                  value={formData.prenom} 
                  onChange={e => setFormData({...formData, prenom: e.target.value})} 
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email professionnel</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="bg-background border-border"
                disabled // L'e-mail sert d'identifiant unique et ne peut pas être modifié arbitrairement
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone mobile</Label>
              <Input 
                value={formData.telephone} 
                onChange={e => setFormData({...formData, telephone: e.target.value})} 
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleSaveEdit} 
              className="bg-primary text-white font-bold"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Confirmer le retrait"
        description="Voulez-vous vraiment retirer cet enseignant de l'établissement ? Cette action annulera toutes ses assignations de classes et de matières."
      />

      <ConfirmDeleteModal
        isOpen={!!deleteInviteId}
        onClose={() => setDeleteInviteId(null)}
        onConfirm={confirmDeleteInvite}
        title="Confirmer la suppression"
        description="Voulez-vous vraiment supprimer cette invitation ? Le code d'invitation généré deviendra instantanément caduc."
      />
    </div>
  )
}
