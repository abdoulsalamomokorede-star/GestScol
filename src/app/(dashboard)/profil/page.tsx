'use client'

import { useState } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getInitiales } from '@/lib/utils'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck, 
  Save, 
  Camera,
  School,
  Lock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilPage() {
  const { currentUser, setCurrentUser } = useSchoolStore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState(currentUser?.telephone || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  
  // Sécurité mot de passe
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!currentUser) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-danger mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-text">Session expirée</h3>
          <p className="text-sm text-muted-foreground">Veuillez vous reconnecter pour accéder à votre profil.</p>
        </div>
      </div>
    )
  }

  const roleLabel = currentUser.role === 'directeur' 
    ? 'Directeur de l\'Établissement' 
    : currentUser.role === 'enseignant' 
      ? 'Enseignant Principal' 
      : 'Parent d\'Élève'

  const handleSaveCoordonnees = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation numéro ivoirien (10 chiffres)
    const phoneDigits = phone.replace(/[^0-9]/g, '')
    if (phone.includes('+225') && phoneDigits.replace('225', '').length !== 10) {
      toast({
        title: "Numéro de téléphone invalide",
        description: "Le numéro ivoirien doit contenir exactement 10 chiffres après l'indicatif +225 (Ex: +225 07 08 09 10 11).",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const supabase = createClient()
      const trimmedEmail = email.trim()
      
      // 1. Mettre à jour l'email dans l'Auth Supabase (si modifié)
      let emailChanged = false
      if (currentUser.email !== trimmedEmail && trimmedEmail !== '') {
        const { error: authError } = await supabase.auth.updateUser({ email: trimmedEmail })
        if (authError) throw authError
        emailChanged = true
      }
      
      // 2. Mettre à jour dans la table utilisateurs (pour tout le monde)
      const { error: dbError } = await supabase
        .from('utilisateurs')
        .update({ email: trimmedEmail, telephone: phone })
        .eq('id', currentUser.id)
        
      if (dbError) throw dbError

      // 3. Pour parent ou enseignant, mettre également à jour la table comptes_connexion
      if (currentUser.role !== 'directeur') {
        const { error: cxError } = await supabase
          .from('comptes_connexion')
          .update({ email: trimmedEmail, identifiant: trimmedEmail, telephone: phone })
          .eq('id', currentUser.id)
          
        if (cxError) throw cxError
      }

      if (emailChanged) {
        toast({
          title: "Vérification d'email requise",
          description: "Un lien de confirmation a été envoyé à votre nouvelle adresse. Veuillez le valider.",
          variant: "default"
        })
      }

      // Mettre à jour le state global (Zustand + Cookie indirectement)
      const updatedUser = {
        ...currentUser,
        telephone: phone,
        email: trimmedEmail
      }
      setCurrentUser(updatedUser)

      toast({
        title: "Profil mis à jour",
        description: "Vos coordonnées ont été enregistrées avec succès sur GestScol.",
        variant: "default"
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Erreur de mise à jour",
        description: err.message || "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Changement de mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!oldPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez renseigner votre mot de passe actuel.",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Mot de passe trop court",
        description: "Votre nouveau mot de passe doit comporter au moins 6 caractères.",
        variant: "destructive"
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Mots de passe différents",
        description: "La confirmation ne correspond pas au nouveau mot de passe.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // 1. Tenter une connexion silencieuse pour vérifier l'ancien mot de passe (pour tout le monde)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email || '',
        password: oldPassword
      })
      
      if (signInError) throw new Error("Votre mot de passe actuel est incorrect.")
      
      // 2. Mettre à jour le mot de passe dans Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      
      // 3. Pour parent ou enseignant, mettre également à jour la table comptes_connexion
      if (currentUser.role !== 'directeur') {
        const { error: cxError } = await supabase
          .from('comptes_connexion')
          .update({ mdp_temporaire: newPassword })
          .eq('id', currentUser.id)
          
        if (cxError) throw cxError
      }

      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été sécurisé et renouvelé avec succès.",
        variant: "default"
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Erreur",
        description: err.message || "Impossible de modifier le mot de passe.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="border-b border-border/40 pb-5">
        <h1 className="text-3xl font-display font-bold text-text flex items-center gap-3">
          <span className="p-2 rounded-2xl bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </span>
          Mon Profil
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Gérez vos informations de compte, vos coordonnées ivoiriennes et la sécurité de votre accès.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* CARTE D'IDENTITÉ ACADÉMIQUE DE PRESTIGE */}
        <Card className="shadow-lg border-border/50 bg-card overflow-hidden h-fit lg:col-span-1 border-t-4 border-t-primary">
          <CardContent className="p-6 flex flex-col items-center text-center">
            {/* Avatar premium */}
            <div className="relative group cursor-pointer mb-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-extrabold">
                  {getInitiales(currentUser.nom, currentUser.prenom)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-text leading-tight">
              {currentUser.prenom} {currentUser.nom}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-1 flex items-center gap-1.5 justify-center">
              <School className="h-3..5 w-3.5 text-primary" />
              <span>{roleLabel}</span>
            </p>
            <Badge variant="secondary" className="mt-3.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-extrabold text-[10px] rounded-full px-2.5 py-0.5 border border-emerald-200">
              Compte Actif
            </Badge>

            <div className="w-full border-t border-border/50 my-5 pt-4 space-y-3.5 text-left text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{currentUser.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Abidjan, Côte d&apos;Ivoire</span>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* COLONNE LOGIQUE MODIFICATION */}
        <div className="lg:col-span-2 space-y-6">
          {/* FORMULAIRE COORDONNÉES */}
          <Card className="shadow-sm border-border/50 bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold text-text flex items-center gap-2 uppercase tracking-wide">
                <User className="h-4.5 w-4.5 text-primary" />
                Informations de contact
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Mettez à jour vos informations de liaison administrative.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveCoordonnees} className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="firstname" className="text-xs font-bold text-muted-foreground uppercase">Prénom</Label>
                    <Input id="firstname" value={currentUser.prenom} disabled className="bg-muted text-muted-foreground text-xs h-9 font-semibold" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastname" className="text-xs font-bold text-muted-foreground uppercase">Nom de famille</Label>
                    <Input id="lastname" value={currentUser.nom} disabled className="bg-muted text-muted-foreground text-xs h-9 font-semibold" />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase">Adresse Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="text-xs h-9 border-border font-semibold bg-background" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase">Téléphone portable (+225)</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+225 07 00 00 00 00" 
                      className="text-xs h-9 border-border font-semibold bg-background" 
                      required 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shrink-0 ml-auto"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FORMULAIRE MOT DE PASSE (Pour tout le monde) */}
          <Card className="shadow-sm border-border/50 bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold text-text flex items-center gap-2 uppercase tracking-wide">
                <Lock className="h-4.5 w-4.5 text-primary" />
                Sécurité du compte
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Modifiez régulièrement votre mot de passe pour assurer l&apos;inviolabilité de vos accès.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="old-password" className="text-xs font-bold text-muted-foreground uppercase">Mot de passe actuel</Label>
                  <Input 
                    id="old-password" 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe actuel"
                    className="text-xs h-9 border-border bg-background" 
                    required
                  />
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="new-password" className="text-xs font-bold text-muted-foreground uppercase">Nouveau mot de passe</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 caractères"
                      className="text-xs h-9 border-border bg-background" 
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm-password" className="text-xs font-bold text-muted-foreground uppercase">Confirmer le nouveau mot de passe</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmez à l'identique"
                      className="text-xs h-9 border-border bg-background" 
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shrink-0 ml-auto"
                >
                  <KeyRound className="h-4 w-4" />
                  {loading ? 'Mise à jour...' : 'Renouveler le mot de passe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
