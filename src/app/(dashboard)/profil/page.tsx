'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getInitiales, formatTelephone } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'
import {
  User,
  Mail,
  Phone,
  MapPin,
  KeyRound,
  ShieldAlert,
  Save,
  Camera,
  School,
  Lock,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { uploadProfilePhoto } from '@/app/actions/upload'

export default function ProfilPage() {
  const router = useRouter()
  const { currentUser, setCurrentUser, ecoleId } = useSchoolStore()
  const { toast } = useToast()
  const { t, dir } = useTranslation()

  const [fromEcoles, setFromEcoles] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFromEcoles(window.location.search.includes('from=ecoles'))
    }
  }, [])

  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState(currentUser?.telephone || '')
  const [email, setEmail] = useState(currentUser?.email || '')

  // Sécurité mot de passe
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!currentUser) {
    return (
      <div className="flex h-[60vh] items-center justify-center" dir={dir}>
        <div className="text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-danger mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-text">{t('profil.session_expired', 'Session expirée')}</h3>
          <p className="text-sm text-muted-foreground">{t('profil.reconnect_desc', 'Veuillez vous reconnecter pour accéder à votre profil.')}</p>
        </div>
      </div>
    )
  }

  const roleLabel = currentUser.role === 'directeur'
    ? t('profil.role_director', "Directeur de l'Établissement")
    : currentUser.role === 'enseignant'
      ? t('profil.role_teacher', 'Enseignant Principal')
      : t('profil.role_parent', "Parent d'Élève")

  const handleSaveCoordonnees = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation numéro ivoirien (10 chiffres)
    const phoneDigits = phone.replace(/[^0-9]/g, '')
    if (phone.includes('+225') && phoneDigits.replace('225', '').length !== 10) {
      toast({
        title: t('profil.toast.invalid_phone_title', "Numéro de téléphone invalide"),
        description: t('profil.toast.invalid_phone_desc', "Le numéro ivoirien doit contenir exactement 10 chiffres après l'indicatif +225 (Ex: +225 07 08 09 10 11)."),
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
          title: t('profil.toast.email_verification_title', "Vérification d'email requise"),
          description: t('profil.toast.email_verification_desc', "Un lien de confirmation a été envoyé à votre nouvelle adresse. Veuillez le valider."),
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
        title: t('profil.toast.update_success_title', "Profil mis à jour"),
        description: t('profil.toast.update_success_desc', "Vos coordonnées ont été enregistrées avec succès sur GestScol."),
        variant: "default"
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: t('profil.toast.update_error_title', "Erreur de mise à jour"),
        description: err.message || t('common.save_error_desc', "Une erreur est survenue lors de la sauvegarde."),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({
          title: t('profil.toast.file_too_large_title', "Fichier trop volumineux"),
          description: t('profil.toast.file_too_large_desc', "La taille de l'image ne doit pas dépasser 1 Mo."),
          variant: "destructive"
        })
        return
      }
      const reader = new FileReader()
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const base64Photo = reader.result

          setLoading(true)
          try {
            // Appeler la Server Action sécurisée pour la validation des magic bytes et de la session
            const res = await uploadProfilePhoto(base64Photo)
            if (!res.success) {
              throw new Error(res.error)
            }

            // Mettre à jour le state global
            setCurrentUser({
              ...currentUser,
              photoUrl: base64Photo
            })

            toast({
              title: t('profil.toast.photo_success_title', "Photo de profil mise à jour"),
              description: t('profil.toast.photo_success_desc', "Votre nouvelle photo a été enregistrée avec succès."),
              variant: "default"
            })
          } catch (err: any) {
            console.error(err)
            toast({
              title: t('profil.toast.error_title', "Erreur"),
              description: err.message || t('profil.toast.photo_error_desc', "Impossible de sauvegarder la photo."),
              variant: "destructive"
            })
          } finally {
            setLoading(false)
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Changement de mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!oldPassword) {
      toast({
        title: t('profil.toast.error_title', "Erreur"),
        description: t('profil.toast.password_current_required', "Veuillez renseigner votre mot de passe actuel."),
        variant: "destructive"
      })
      return
    }

    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasLowercase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword)

    if (newPassword.length < 12 || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      toast({
        title: t('profil.toast.password_security_title', "Sécurité insuffisante"),
        description: t('profil.toast.password_security_desc', "Le nouveau mot de passe doit contenir au moins 12 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial."),
        variant: "destructive"
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('profil.toast.password_mismatch_title', "Mots de passe différents"),
        description: t('profil.toast.password_mismatch_desc', "La confirmation ne correspond pas au nouveau mot de passe."),
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
        title: t('profil.toast.password_success_title', "Mot de passe modifié"),
        description: t('profil.toast.password_success_desc', "Votre mot de passe a été sécurisé et renouvelé avec succès."),
        variant: "default"
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: t('profil.toast.error_title', "Erreur"),
        description: err.message || t('profil.toast.password_error_desc', "Impossible de modifier le mot de passe."),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Déterminer l'URL de retour
  let backUrl = '/ecoles'
  if (ecoleId) {
    if (currentUser.role === 'parent') {
      backUrl = '/parent/dashboard'
    } else if (currentUser.role === 'enseignant') {
      backUrl = '/enseignant/dashboard'
    } else if (currentUser.role === 'directeur') {
      backUrl = '/dashboard'
    }
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fromEcoles ? '/ecoles' : backUrl)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={dir}>
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-2 text-slate-500 hover:text-slate-850 flex items-center gap-2 self-start rounded-xl px-4 py-2 border border-slate-200 dark:border-border/60 bg-white dark:bg-card"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t('action.back', 'Retour')}</span>
      </Button>

      {/* HEADER */}
      <div className="border-b border-border/40 pb-5">
        <h1 className="text-3xl font-display font-bold text-text flex items-center gap-3">
          <span className="p-2 rounded-2xl bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </span>
          {t('title.profil', 'Mon Profil')}
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          {t('profil.desc', 'Gérez vos informations de compte, vos coordonnées ivoiriennes et la sécurité de votre accès.')}
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* CARTE D'IDENTITÉ ACADÉMIQUE DE PRESTIGE */}
        <Card className="shadow-lg border-border/50 bg-card overflow-hidden h-fit lg:col-span-1 border-t-4 border-t-primary">
          <CardContent className="p-6 flex flex-col items-center text-center">
            {/* Avatar premium avec uploader */}
            <div className="relative group cursor-pointer mb-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
                {currentUser.photoUrl ? (
                  <AvatarImage src={currentUser.photoUrl} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-extrabold">
                  {getInitiales(currentUser.nom, currentUser.prenom)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                <Camera className="h-5 w-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
              </label>
            </div>

            <h3 className="text-lg font-bold text-text leading-tight">
              {currentUser.prenom} {currentUser.nom}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-1 flex items-center gap-1.5 justify-center">
              <School className="h-3.5 w-3.5 text-primary" />
              <span>{roleLabel}</span>
            </p>
            <Badge variant="secondary" className="mt-3.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-extrabold text-[10px] rounded-full px-2.5 py-0.5 border border-emerald-200">
              {t('profil.active_account', 'Compte Actif')}
            </Badge>

            <div className="w-full border-t border-border/50 my-5 pt-4 space-y-3.5 text-start text-xs text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {currentUser.telephone ? (
                    <span dir="ltr">{formatTelephone(currentUser.telephone)}</span>
                  ) : (
                    t('profil.not_specified', 'Non renseigné')
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{t('profil.location_ivory_coast', "Abidjan, Côte d'Ivoire")}</span>
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
                {t('profil.contact_info', 'Informations de contact')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('profil.contact_desc', 'Mettez à jour vos informations de liaison administrative.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveCoordonnees} className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="firstname" className="text-xs font-bold text-muted-foreground uppercase">{t('profil.firstname', 'Prénom')}</Label>
                    <Input id="firstname" value={currentUser.prenom} disabled className="bg-muted text-muted-foreground text-xs h-9 font-semibold" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastname" className="text-xs font-bold text-muted-foreground uppercase">{t('profil.lastname', 'Nom de famille')}</Label>
                    <Input id="lastname" value={currentUser.nom} disabled className="bg-muted text-muted-foreground text-xs h-9 font-semibold" />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase">{t('profil.email', 'Adresse Email')}</Label>
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
                    <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase">{t('profil.phone', 'Téléphone portable (+225)')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="text-xs h-9 border-border font-semibold bg-background"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shrink-0 ms-auto"
                >
                  <Save className="h-4 w-4" />
                  {loading ? t('profil.saving', 'Sauvegarde...') : t('profil.save_changes', 'Enregistrer les modifications')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FORMULAIRE MOT DE PASSE (Pour tout le monde) */}
          <Card className="shadow-sm border-border/50 bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold text-text flex items-center gap-2 uppercase tracking-wide">
                <Lock className="h-4.5 w-4.5 text-primary" />
                {t('profil.security_title', 'Sécurité du compte')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('profil.security_desc', "Modifiez régulièrement votre mot de passe pour assurer l'inviolabilité de vos accès.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="old-password" className="text-xs font-bold text-muted-foreground uppercase">{t('profil.password_current', 'Mot de passe actuel')}</Label>
                  <Input
                    id="old-password"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={t('profil.password_current_placeholder', 'Saisissez votre mot de passe actuel')}
                    className="text-xs h-9 border-border bg-background"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="new-password" className="text-xs font-bold text-muted-foreground uppercase">{t('profil.password_new', 'Nouveau mot de passe')}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('profil.password_new_placeholder', 'Min. 12 caractères')}
                      className="text-xs h-9 border-border bg-background"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm-password" className="text-xs font-bold text-muted-foreground uppercase">{t('profil.password_confirm', 'Confirmer le nouveau mot de passe')}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('profil.password_confirm_placeholder', "Confirmez à l'identique")}
                      className="text-xs h-9 border-border bg-background"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shrink-0 ms-auto"
                >
                  <KeyRound className="h-4 w-4" />
                  {loading ? t('profil.updating', 'Mise à jour...') : t('profil.password_renew', 'Renouveler le mot de passe')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
