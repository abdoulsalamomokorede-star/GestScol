'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { useToast } from '@/hooks/use-toast'
import { PremiumGuard } from '@/components/ui/PremiumGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getInitiales, translateDbError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { 
  Settings, 
  UserPlus, 
  Building, 
  Save, 
  Users, 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert,
  ArrowLeft,
  Search,
  Phone, 
  Mail, 
  UserCheck, 
  HelpCircle,
  Copy,
  Check,
  Smartphone,
  Eye,
  EyeOff,
  Edit2,
  Trash2
} from 'lucide-react'
import { UserCompteSimule } from '@/types'
import { createUtilisateurAuth, adminUpdatePassword } from '@/app/actions/admin'

export default function ParametresPage() {
  const router = useRouter()
  const { currentUser, eleves, updateEleve, addEnseignant, enseignants, ecole, updateEcole, deleteEnseignant, comptesSimules, addCompteConnexion, updateCompteConnexion, deleteCompteConnexion, inscriptions, absences, paiements, notes, bulletins, isAbonnementExpired } = useSchoolStore()
  const { toast } = useToast()

  // Verrou d'accès pour les non-directeurs
  if (!currentUser || currentUser.role !== 'directeur') {
    return <AccèsRestreint role={currentUser?.role} />
  }

  const [activeTab, setActiveTab] = useState<'generaux' | 'comptes' | 'annees'>('generaux')
  const [loading, setLoading] = useState(false)

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
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (deleteAnneeId) {
      await deleteAnneeScolaire(deleteAnneeId)
      toast({ title: "Succès", description: "L'année scolaire a été supprimée." })
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
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (editingAnneeId && editingAnneeNom.trim()) {
      const exists = anneesScolaires.some(a => a.nom === editingAnneeNom.trim() && a.id !== editingAnneeId)
      if (exists) {
        toast({ title: "Erreur", description: "Cette année scolaire existe déjà.", variant: "destructive" })
        return
      }

      await updateAnneeScolaire(editingAnneeId, { nom: editingAnneeNom.trim() })
      toast({ title: "Succès", description: "L'année scolaire a été modifiée." })
      setEditingAnneeId(null)
      setEditingAnneeNom('')
    }
  }
  const [devise, setDevise] = useState('FCFA')
  const [telephoneEcole, setTelephoneEcole] = useState(ecole?.telephone || '')

  // --- CRÉATION DE COMPTE ---
  const [role, setRole] = useState<'enseignant' | 'parent'>('parent')
  const [civilite, setCivilite] = useState<'M.' | 'Mme'>('M.')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('+225 ')
  const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedEnseignantId, setSelectedEnseignantId] = useState('')
  const [editingCompteId, setEditingCompteId] = useState<string | null>(null)
  
  // États Modales
  const [deleteCompteId, setDeleteCompteId] = useState<string | null>(null)
  const [deleteCompteRole, setDeleteCompteRole] = useState<string | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordCompteId, setPasswordCompteId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (ecole) {
      setNomEcole(ecole.nom || '')
      setAdresse(ecole.adresse || '')
      setTelephoneEcole(ecole.telephone || '')
    }
  }, [ecole])

  useEffect(() => {
    if (role === 'enseignant' && selectedEnseignantId) {
      const ens = enseignants.find(e => e.id === selectedEnseignantId)
      if (ens) {
        setNom(ens.nom || '')
        setPrenom(ens.prenom || '')
        setEmail(ens.email || '')
        setTelephone(ens.telephone || '+225 ')
        if (ens.civilite) setCivilite(ens.civilite as any)
      }
    } else if (role === 'enseignant' && !selectedEnseignantId) {
      setNom('')
      setPrenom('')
      setEmail('')
      setTelephone('+225 ')
    }
  }, [selectedEnseignantId, role, enseignants])



  // Génération d'identifiants et de mot de passe de démo
  const [compteCreeApercu, setCompteCreeApercu] = useState<{
    identifiant: string
    mdpTemporaire: string
    nomComplet: string
    role: string
  } | null>(null)

  const handleSaveGeneraux = (e: React.FormEvent) => {
    e.preventDefault()

    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
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
        telephone: telephoneEcole
      })
      
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres globaux de l'école ont été mis à jour avec succès.",
        variant: "default"
      })
    }, 800)
  }

  const handleCreateCompte = (e: React.FormEvent) => {
    e.preventDefault()

    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }

    if (role === 'enseignant') {
      if (!selectedEnseignantId) {
        toast({
          title: "Enseignant non sélectionné",
          description: "Veuillez sélectionner un enseignant dans la liste.",
          variant: "destructive"
        })
        return
      }
      
      const ens = enseignants.find(e => e.id === selectedEnseignantId)
      if (!ens?.email || ens.email.trim() === '' || ens.email.includes('@gestscol.local') || ens.email.includes('@ecole.ci')) {
        toast({
          title: "Adresse e-mail manquante ou invalide",
          description: "L'enseignant sélectionné n'a pas de véritable adresse e-mail dans son profil (adresse temporaire détectée). Veuillez d'abord mettre à jour ses informations dans la gestion des enseignants avec un vrai e-mail.",
          variant: "destructive"
        })
        return
      }
    } else {
      if (!prenom.trim() || !nom.trim()) {
        toast({
          title: "Champs incomplets",
          description: "Veuillez renseigner le nom et le prénom de l'utilisateur.",
          variant: "destructive"
        })
        return
      }

      if (email.trim() && !email.includes('@')) {
        toast({
          title: "Email invalide",
          description: "L'adresse e-mail saisie n'est pas valide.",
          variant: "destructive"
        })
        return
      }

      // Validation téléphone ivoirien (10 chiffres)
      const phoneDigits = telephone.replace(/[^0-9]/g, '')
      const checkDigits = phoneDigits.startsWith('225') ? phoneDigits.slice(3) : phoneDigits
      if (checkDigits.length !== 10) {
        toast({
          title: "Téléphone incorrect",
          description: "Le numéro ivoirien doit contenir exactement 10 chiffres (Ex: +225 07 08 09 10 11).",
          variant: "destructive"
        })
        return
      }

      if (role === 'parent' && selectedEleveIds.length === 0) {
        toast({
          title: "Élèves non rattachés",
          description: "Veuillez sélectionner au moins un élève à rattacher à ce parent.",
          variant: "destructive"
        })
        return
      }
    }

    setLoading(true)
    setTimeout(async () => {
      // Vérification des doublons (Même email) en ignorant le compte en cours d'édition
      const emailExists = comptesSimules.some(c => c.email && c.email.toLowerCase() === email.trim().toLowerCase() && c.id !== editingCompteId)
      if (emailExists) {
        setLoading(false)
        toast({
          title: "Doublon détecté",
          description: "Un compte avec cette adresse e-mail existe déjà.",
          variant: "destructive"
        })
        return
      }

      // L'identifiant devient l'e-mail pour des raisons de sécurité et de professionnalisme
      const identifiantGenere = email.toLowerCase().trim()
      const mdpGenere = `${nom.toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}!`

      const associatedStudents = eleves.filter(el => selectedEleveIds.includes(el.id))
      const elevesNoms = associatedStudents.map(el => `${el.prenom} ${el.nom}`)
      
        try {
          if (editingCompteId) {
            // Mode Édition
            await updateCompteConnexion(editingCompteId, {
              nom: nom.toUpperCase(),
              prenom,
              email,
              telephone,
              role,
              elevesAssocies: role === 'parent' ? elevesNoms : undefined
            })
            
            if (role === 'parent') {
              // Unlink students who were deselected
              eleves.filter(el => el.parentUserId === editingCompteId).forEach(el => {
                if (!selectedEleveIds.includes(el.id)) {
                  updateEleve(el.id, { parentUserId: '' })
                }
              })
              // Link newly selected students
              selectedEleveIds.forEach(id => {
                updateEleve(id, { parentUserId: editingCompteId })
              })
            }
          } else {
            // Mode Création
            const result = await createUtilisateurAuth({
              email: email.trim(),
              password: mdpGenere,
              nom: nom.toUpperCase(),
              prenom,
              telephone: telephone.trim(),
              role: role as 'enseignant' | 'parent',
              ecoleId: currentUser.ecoleId,
              civilite: civilite as 'M.' | 'Mme' | 'Mlle',
              oldId: role === 'enseignant' ? enseignants.find(e => e.id === selectedEnseignantId)?.id : undefined
            })

            if (!result.success) {
              throw new Error(result.error)
            }

            const newId = crypto.randomUUID()
            const finalId = result.userId || newId

            // Mettre à jour les élèves rattachés dans le store
            if (role === 'parent') {
              selectedEleveIds.forEach(id => {
                updateEleve(id, { parentUserId: finalId })
              })
            } else if (role === 'enseignant' && !selectedEnseignantId) {
              addEnseignant({
                id: finalId,
                nom: nom.toUpperCase(),
                prenom,
                email,
                role: 'enseignant',
                ecoleId: currentUser.ecoleId
              })
            }

            // Simulation locale pour mise à jour de la vue sans recharger
            const newCompte: UserCompteSimule = {
              id: finalId,
              nom: nom.toUpperCase(),
              prenom,
              email: email.trim(),
              telephone: telephone.trim(),
              role,
              elevesAssocies: role === 'parent' ? elevesNoms : undefined,
              enseignantId: role === 'enseignant' ? finalId : undefined,
              dateCreation: new Date().toISOString().split('T')[0],
              identifiant: email.trim(),
              mdpTemporaire: mdpGenere
            }

            // Add to comptes_connexion database table so we know this account was officially created
            await addCompteConnexion(newCompte)
            
            setCompteCreeApercu({
              identifiant: identifiantGenere,
              mdpTemporaire: mdpGenere,
              nomComplet: `${civilite} ${prenom} ${nom.toUpperCase()}`,
              role: role === 'enseignant' ? 'Enseignant' : 'Parent'
            })
          }

          // Réinitialiser le formulaire
          setEditingCompteId(null)
          setPrenom('')
          setNom('')
          setEmail('')
          setTelephone('+225 ')
          setSelectedEleveIds([])
          setSearchTerm('')
          setLoading(false)

          toast({
            title: "Compte créé avec succès !",
            description: `Le compte ${role === 'enseignant' ? 'Enseignant' : 'Parent'} a été configuré sur le serveur GestScol.`,
            variant: "default"
          })
        } catch (error: any) {
          setLoading(false)
          toast({
            title: "Erreur d'enregistrement",
            description: translateDbError(error?.message || ""),
            variant: "destructive"
          })
        }
    }, 1000)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: "Copié !",
      description: "L'identifiant a été copié dans votre presse-papiers.",
      duration: 1500
    })
  }

  const confirmDeleteCompte = () => {
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
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
        title: "Compte supprimé",
        description: "Le compte a été supprimé avec succès.",
      })
      setDeleteCompteId(null)
      setDeleteCompteRole(null)
    }
  }

  const handleDeleteCompte = (id: string, role: string) => {
    setDeleteCompteId(id)
    setDeleteCompteRole(role)
  }

  const confirmChangePassword = async () => {
    if (isAbonnementExpired()) {
      toast({
        title: "Action impossible",
        description: "Abonnement expiré. Veuillez le renouveler pour effectuer cette action.",
        variant: "destructive"
      })
      return
    }
    if (passwordCompteId && newPassword) {
      // Met à jour la table de log
      updateCompteConnexion(passwordCompteId, { mdpTemporaire: newPassword })
      
      // Met à jour le vrai mot de passe dans Supabase Auth
      const result = await adminUpdatePassword(passwordCompteId, newPassword)
      
      if (result.success) {
        toast({ title: "Mot de passe modifié", description: "Le mot de passe de ce compte a été mis à jour avec succès." })
      } else {
        toast({ title: "Erreur serveur", description: "L'enregistrement de l'historique a réussi, mais la mise à jour de l'accès a échoué.", variant: "destructive" })
      }
      
      setPasswordModalOpen(false)
      setPasswordCompteId(null)
      setNewPassword('')
    }
  }

  const handleEditCompte = (compte: UserCompteSimule) => {
    setEditingCompteId(compte.id)
    setRole(compte.role)
    if (compte.role === 'enseignant') {
      setSelectedEnseignantId(compte.enseignantId || compte.id)
      setSelectedEleveIds([])
    } else {
      setSelectedEnseignantId('')
      const linkedEleves = eleves.filter(el => el.parentUserId === compte.id)
      setSelectedEleveIds(linkedEleves.map(el => el.id))
    }
    setPrenom(compte.prenom)
    setNom(compte.nom)
    setEmail(compte.email || '')
    setTelephone(compte.telephone || '+225 ')
    toast({
      title: "Mode édition",
      description: "Les informations du compte ont été chargées dans le formulaire.",
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-primary/10 text-primary">
              <Settings className="h-8 w-8" />
            </span>
            Paramètres Généraux
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Configurez les détails administratifs de l&apos;école ou créez de nouveaux comptes d&apos;utilisateurs sécurisés.
          </p>
        </div>
      </div>

      {/* Menu Onglets Premium */}
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-border/50">
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
            L&apos;Établissement
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
            Création de Comptes
            <Badge variant="secondary" className="ml-1 bg-primary/5 text-primary hover:bg-primary/10 font-bold text-[10px]">
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
            Années Scolaires
          </span>
          {activeTab === 'annees' && (
            <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* CONTENU : PARAMÈTRES GÉNÉRAUX */}
      {activeTab === 'generaux' && (
        <div className="max-w-4xl mx-auto animate-in fade-in-50 duration-200">
          <Card className="shadow-sm border-border/50 bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold text-text flex items-center gap-2 uppercase tracking-wide">
                <Building className="h-4.5 w-4.5 text-primary" />
                Fiche administrative de l&apos;école
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Ces informations seront reportées sur la landing page publique et en en-tête des reçus et bulletins officiels.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveGeneraux} className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="school-name" className="text-xs font-bold text-muted-foreground uppercase">Nom de l&apos;établissement</Label>
                    <Input 
                      id="school-name" 
                      value={nomEcole} 
                      onChange={(e) => setNomEcole(e.target.value)} 
                      className="text-xs h-9 border-border font-semibold bg-background" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="school-year" className="text-xs font-bold text-muted-foreground uppercase">Année Scolaire active</Label>
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
                    <Label htmlFor="school-address" className="text-xs font-bold text-muted-foreground uppercase">Adresse Physique / Siège</Label>
                    <Input 
                      id="school-address" 
                      value={adresse} 
                      onChange={(e) => setAdresse(e.target.value)} 
                      className="text-xs h-9 border-border font-semibold bg-background" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="school-currency" className="text-xs font-bold text-muted-foreground uppercase">Devise Monétaire</Label>
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
                  <Label htmlFor="school-phone" className="text-xs font-bold text-muted-foreground uppercase">Téléphone Secrétariat</Label>
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
                  className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shrink-0 ml-auto"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Enregistrement...' : 'Enregistrer la configuration'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTENU : CRÉATION DE COMPTES */}
      {activeTab === 'comptes' && (
        ecole?.abonnement?.plan === 'gratuit' ? (
          <PremiumGuard 
            title="Création de Comptes Enseignants & Parents" 
            description="Activez l'accès en ligne pour vos enseignants et vos parents d'élèves. Permettez-leur de collaborer en temps réel (saisie des notes, appel, relevés financiers, messagerie)."
          />
        ) : (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
          
          {/* APERÇU DE LA CARTE DE SÉCURITÉ DU COMPTE CRÉÉ */}
          {compteCreeApercu && (
            <Card className="shadow-lg border-primary/30 bg-emerald-50/50 border-l-4 border-l-primary animate-in zoom-in-95 duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Compte académique configuré avec succès !
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Transmettez ces accès temporaires de manière confidentielle à l&apos;utilisateur concerné.
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 text-xs">
                  <div className="bg-card border border-border p-3.5 rounded-xl space-y-1.5 shadow-sm">
                    <p className="text-muted-foreground font-semibold">Bénéficiaire</p>
                    <p className="text-sm font-extrabold text-text">{compteCreeApercu.nomComplet}</p>
                    <p className="text-[10px] text-primary font-bold uppercase">{compteCreeApercu.role}</p>
                  </div>
                  
                  <div className="bg-card border border-border p-3.5 rounded-xl space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-muted-foreground font-semibold">Identifiant de connexion</p>
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
                        <p className="text-muted-foreground font-semibold">Mot de passe</p>
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
                    Masquer la fiche de sécurité
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* FORMULAIRE DE CRÉATION */}
            <Card className="shadow-sm border-border/50 bg-card lg:col-span-2">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold text-text flex items-center gap-2 uppercase tracking-wide">
                  <UserPlus className="h-4.5 w-4.5 text-primary" />
                  Créer un compte académique
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Générez un profil d&apos;accès sécurisé (Enseignant ou Parent) pour votre établissement scolaire.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleCreateCompte} className="space-y-4">
                  {/* Choix Rôle et Civilité */}
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="role-select" className="text-xs font-bold text-muted-foreground uppercase">Rôle académique</Label>
                      <Select
                        value={role}
                        onValueChange={(value) => {
                          setRole(value as any)
                          setSelectedEleveIds([])
                          setSelectedEnseignantId('')
                          setPrenom('')
                          setNom('')
                          setEmail('')
                          setTelephone('+225 ')
                        }}
                      >
                        <SelectTrigger id="role-select" className="w-full text-xs h-9 border-border bg-background focus:ring-1 focus:ring-primary">
                          <SelectValue placeholder="Sélectionnez un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent d'Élève</SelectItem>
                          <SelectItem value="enseignant">Enseignant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="civilite-select" className="text-xs font-bold text-muted-foreground uppercase">Civilité</Label>
                      <Select
                        value={civilite}
                        onValueChange={(value) => setCivilite(value as any)}
                      >
                        <SelectTrigger id="civilite-select" className="w-full text-xs h-9 border-border bg-background focus:ring-1 focus:ring-primary">
                          <SelectValue placeholder="Sélectionnez la civilité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M.">Monsieur (M.)</SelectItem>
                          <SelectItem value="Mme">Madame (Mme)</SelectItem>
                          <SelectItem value="Mlle">Mademoiselle (Mlle)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {role === 'enseignant' ? (
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Sélectionner un enseignant existant</Label>
                      <Combobox
                        options={enseignants.map(ens => ({
                          label: `${ens.prenom} ${ens.nom}`,
                          value: ens.id
                        }))}
                        value={selectedEnseignantId}
                        onChange={setSelectedEnseignantId}
                        placeholder="Rechercher un enseignant..."
                      />
                    </div>
                  ) : (
                    <>
                      {/* Prénom et Nom */}
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="user-firstname" className="text-xs font-bold text-muted-foreground uppercase">Prénom</Label>
                          <Input 
                            id="user-firstname" 
                            placeholder="Ex: Kouassi Jean"
                            value={prenom} 
                            onChange={(e) => setPrenom(e.target.value)} 
                            className="text-xs h-9 border-border bg-background" 
                            required 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="user-lastname" className="text-xs font-bold text-muted-foreground uppercase">Nom de famille</Label>
                          <Input 
                            id="user-lastname" 
                            placeholder="Ex: Koffi"
                            value={nom} 
                            onChange={(e) => setNom(e.target.value)} 
                            className="text-xs h-9 border-border bg-background" 
                            required 
                          />
                        </div>
                      </div>

                      {/* E-mail et Téléphone portable */}
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="user-email" className="text-xs font-bold text-muted-foreground uppercase">Adresse e-mail</Label>
                          <Input 
                            id="user-email" 
                            type="email"
                            placeholder="Ex: jkoffi@gmail.com"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="text-xs h-9 border-border bg-background" 
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="user-phone" className="text-xs font-bold text-muted-foreground uppercase">Téléphone portable (+225)</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground/60" />
                            <Input 
                               id="user-phone" 
                               placeholder="+225 07 00 00 00 00"
                               value={telephone} 
                               onChange={(e) => setTelephone(e.target.value)} 
                               className="pl-9 text-xs h-9 border-border bg-background font-semibold" 
                               required 
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Rattachement multiple d'élèves si Parent */}
                  {role === 'parent' && (
                    <div className="space-y-3 border-t border-border/40 pt-4 animate-in fade-in duration-200">
                      <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        Associer les élèves (Rattachement multiple d&apos;enfants)
                      </Label>
                      
                      {/* Barre de recherche rapide */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/75" />
                        <Input
                          placeholder="Rechercher un élève par nom, prénom, classe, matricule..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 text-xs h-9 border-border bg-background"
                        />
                      </div>

                      {/* Cadre scrollable avec les cases à cocher */}
                      <div className="max-h-48 overflow-y-auto border border-border p-3 rounded-xl bg-slate-50 space-y-2">
                        {eleves
                          .filter(el => {
                            const isEnrolled = inscriptions.some(i => i.eleveId === el.id && i.anneeScolaire === activeAnneeScolaire?.id && i.statut === 'validee')
                            if (!isEnrolled) return false
                            
                            const query = searchTerm.toLowerCase().trim()
                            if (!query) return true
                            return (
                              el.nom.toLowerCase().includes(query) ||
                              el.prenom.toLowerCase().includes(query) ||
                              el.matricule.toLowerCase().includes(query) ||
                              el.classeId.toLowerCase().includes(query)
                            )
                          })
                          .map(el => {
                            const isChecked = selectedEleveIds.includes(el.id)
                            return (
                              <label
                                key={el.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${
                                  isChecked
                                    ? 'bg-primary/5 border-primary text-text font-semibold'
                                    : 'bg-card border-border hover:bg-muted/30 text-muted-foreground'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedEleveIds(selectedEleveIds.filter(id => id !== el.id))
                                    } else {
                                      setSelectedEleveIds([...selectedEleveIds, el.id])
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                />
                                <div className="flex-1 flex items-center justify-between">
                                  <span>{el.prenom} {el.nom}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 uppercase bg-slate-100 text-slate-600">
                                      {el.classeId}
                                    </Badge>
                                    <span className="text-[10px] font-mono text-muted-foreground">{el.matricule}</span>
                                  </div>
                                </div>
                              </label>
                            )
                          })}
                        {eleves.filter(el => {
                          const isEnrolled = inscriptions.some(i => i.eleveId === el.id && i.anneeScolaire === activeAnneeScolaire?.id && i.statut === 'validee')
                          if (!isEnrolled) return false
                          
                          const query = searchTerm.toLowerCase().trim()
                          if (!query) return true
                          return (
                            el.nom.toLowerCase().includes(query) ||
                            el.prenom.toLowerCase().includes(query) ||
                            el.matricule.toLowerCase().includes(query) ||
                            el.classeId.toLowerCase().includes(query)
                          )
                        }).length === 0 && (
                          <div className="text-center py-4 text-xs text-muted-foreground">
                            Aucun élève ne correspond à votre recherche.
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{selectedEleveIds.length} enfant(s) sélectionné(s)</span>
                        {selectedEleveIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedEleveIds([])}
                            className="text-primary hover:underline font-bold"
                          >
                            Réinitialiser la sélection
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={loading}
                    size="sm"
                    className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shrink-0 ml-auto"
                  >
                    <UserPlus className="h-4 w-4" />
                    {loading ? 'Création en cours...' : 'Générer le compte sécurisé'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* LISTE DES COMPTES EXISTANTS */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden">
                <div className="p-4 bg-muted/20 border-b border-border/40">
                  <h3 className="font-display font-bold text-xs text-text uppercase flex items-center gap-2 tracking-wide">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Comptes Existants
                  </h3>
                </div>
                <CardContent className="p-0 divide-y divide-border/40 text-xs">
                  {comptesSimules.map((c) => (
                    <div key={c.id} className="p-4 space-y-2.5 hover:bg-muted/5 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-text leading-tight">{c.prenom} {c.nom}</span>
                        <Badge 
                          className={`rounded-full font-bold px-2 py-0.5 text-[8px] uppercase tracking-wider ${
                            c.role === 'enseignant' 
                              ? 'bg-amber-50 border-amber-200 text-amber-700' 
                              : 'bg-primary/5 border-primary/20 text-primary'
                          }`}
                          variant="outline"
                        >
                          {c.role === 'enseignant' ? 'Enseignant' : 'Parent'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-slate-500 font-medium leading-none">
                        <p className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{c.telephone}</span>
                        </p>
                        {c.elevesAssocies && c.elevesAssocies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-border/40">
                            {c.elevesAssocies.map((nomEleve, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-primary/5 text-primary border border-primary/10 font-bold text-[9px] px-1.5 py-0 rounded-full">
                                {nomEleve}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1 pt-2 border-t border-border/40 mt-2">
                        {c.identifiant && c.mdpTemporaire && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCompteCreeApercu({
                              identifiant: c.identifiant || '',
                              mdpTemporaire: c.mdpTemporaire || '',
                              nomComplet: `${c.prenom} ${c.nom}`,
                              role: c.role === 'enseignant' ? 'Enseignant' : 'Parent'
                            })}
                            className="h-7 px-2 text-xs text-primary hover:text-primary-dark hover:bg-primary/10"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden sm:inline">Accès</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPasswordCompteId(c.id)
                            setNewPassword('')
                            setPasswordModalOpen(true)
                          }}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-text hover:bg-muted"
                          title="Changer le mot de passe"
                        >
                          <KeyRound className="h-3.5 w-3.5 mr-1" />
                          <span className="hidden sm:inline">Mot de passe</span>
                        </Button>
                        {c.role !== 'enseignant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCompte(c)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden sm:inline">Modifier</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCompte(c.id, c.role)}
                          className="h-7 px-2 text-xs text-danger hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        )
      )}

      {/* CONTENU : ANNÉES SCOLAIRES */}
      {activeTab === 'annees' && (
        <div className="max-w-4xl mx-auto animate-in fade-in-50 duration-200 space-y-6">
          <Card className="shadow-sm border-border/50 bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold text-text flex items-center gap-2 uppercase tracking-wide">
                <Building className="h-4.5 w-4.5 text-primary" />
                Gestion des Années Scolaires
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Ajoutez ou activez une année scolaire. L'année active est utilisée par défaut dans toute l'application.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="new-school-year" className="text-xs font-bold text-muted-foreground uppercase">Nouvelle Année Scolaire</Label>
                  <Input 
                    id="new-school-year" 
                    value={nouvelleAnneeNom}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9-]/g, '')
                      // Remove all hyphens first
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
                      toast({ title: "Erreur", description: "Cette année scolaire existe déjà.", variant: "destructive" })
                      return
                    }

                    // On extrait l'année de début pour les dates
                    const match = nouvelleAnneeNom.match(/^(\d{4})/)
                    const startYear = match ? parseInt(match[1]) : new Date().getFullYear()

                    addAnneeScolaire({
                      id: `as-${nouvelleAnneeNom}`,
                      nom: nouvelleAnneeNom,
                      dateDebut: `${startYear}-09-01`,
                      dateFin: `${startYear + 1}-07-31`,
                      statut: 'archivee'
                    })
                    setNouvelleAnneeNom('')
                    toast({ title: "Succès", description: "Année scolaire ajoutée." })
                  }}
                  className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md h-9"
                >
                  Ajouter
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase">Liste des années scolaires</h3>
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
                          <Button size="sm" onClick={saveEditAnnee} className="bg-success text-white hover:bg-success/90 h-9">Enregistrer</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingAnneeId(null)} className="h-9">Annuler</Button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="font-bold text-text flex items-center gap-2">
                            {annee.nom}
                            {annee.statut === 'active' && <Badge className="bg-success/10 text-success border-success/20 shadow-none text-[9px] py-0">Active</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">Du {annee.dateDebut} au {annee.dateFin}</p>
                        </div>
                      )}
                      
                      {editingAnneeId !== annee.id && (
                        <div className="flex flex-wrap items-center gap-2">
                          {annee.statut !== 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs h-8 text-primary border-primary/20 hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setActiveAnneeScolaire(annee.id)
                                toast({ title: "Succès", description: `L'année ${annee.nom} est maintenant active.` })
                              }}
                            >
                              Rendre Active
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs h-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => handleEditAnnee(annee)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs h-8 text-danger hover:text-danger hover:bg-danger/10"
                            onClick={() => handleDeleteAnnee(annee.id)}
                            disabled={annee.statut === 'active' && anneesScolaires.length <= 1} // Ne pas supprimer si c'est la seule et active
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

      {/* Modales pour Comptes */}
      <ConfirmDeleteModal
        isOpen={!!deleteCompteId}
        onClose={() => {
          setDeleteCompteId(null)
          setDeleteCompteRole(null)
        }}
        onConfirm={confirmDeleteCompte}
        title="Supprimer ce compte ?"
        description="Voulez-vous vraiment supprimer ce compte utilisateur ? Cette action est irréversible et annulera ses accès."
      />

      <ConfirmDeleteModal
        isOpen={!!deleteAnneeId}
        onClose={() => {
          setDeleteAnneeId(null)
          setDeleteAnneeWarning(false)
        }}
        onConfirm={confirmDeleteAnnee}
        title="Supprimer cette année scolaire ?"
        description={deleteAnneeWarning ? "ATTENTION : Des données (inscriptions, paiements, absences, notes, bulletins) sont liées à cette année scolaire. Si vous la supprimez, TOUTES ces données seront définitivement effacées ! Voulez-vous continuer ?" : "Voulez-vous vraiment supprimer cette année scolaire ?"}
      />

      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le mot de passe</DialogTitle>
            <DialogDescription>
              Définissez un nouveau mot de passe temporaire pour ce compte. L'utilisateur devra l'utiliser lors de sa prochaine connexion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input 
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ex: NOUVEAU123!"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>Annuler</Button>
            <Button onClick={confirmChangePassword} className="bg-primary text-white" disabled={!newPassword.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface AccèsRestreintProps {
  role?: 'directeur' | 'enseignant' | 'parent'
}

function AccèsRestreint({ role }: AccèsRestreintProps) {
  const router = useRouter()

  const handleReturn = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8 border-rose-100 shadow-xl bg-white/80 backdrop-blur-md relative overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />
        
        <CardContent className="pt-6 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center animate-pulse border border-rose-100">
            <ShieldAlert className="h-9 w-9 text-rose-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-extrabold text-text">
              Accès Privilégié Restreint
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Cet espace de configuration système et de création de comptes est strictement réservé à la Direction générale de l&apos;établissement.
            </p>
          </div>

          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50 text-xs text-rose-800 leading-relaxed">
            Votre profil actuel <span className="font-extrabold uppercase">{role || 'visiteur'}</span> ne dispose pas des privilèges d&apos;habilitation requis pour modifier ces paramètres.
          </div>

          <Button
            onClick={handleReturn}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs py-5 flex items-center justify-center gap-2 shadow-md transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Retourner à mon espace sécurisé
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

