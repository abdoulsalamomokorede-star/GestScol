'use client'

import { useState, useEffect } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Clock, 
  CreditCard, 
  CalendarOff, 
  FileText, 
  UserPlus, 
  ShieldAlert,
  Info,
  Megaphone,
  Plus,
  Send,
  Users,
  Loader2,
  Lock
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { NotificationItem, NotificationType } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'

export default function NotificationsPage() {
  const { t, dir } = useTranslation()
  const { 
    currentUser, 
    eleves, 
    classes, 
    notifications, 
    fetchNotifications, 
    addNotification, 
    markNotificationAsRead, 
    deleteNotification,
    deleteNotifications,
    suppressedNotificationIds,
    ecole,
    ecoleId
  } = useSchoolStore()
  
  const { toast } = useToast()

  // États pour la modale de création de communiqué
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'parent' | 'enseignant' | 'classe'>('all')
  const [selectedClasseId, setSelectedClasseId] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)

  // Charger les notifications réelles de Supabase au montage
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Logique de filtrage des notifications selon le rôle et masquage individuel cloisonné par utilisateur
  const displayNotifications = notifications
    .filter(n => !suppressedNotificationIds?.includes(`${currentUser?.id}_${n.id}`))
    .filter(notif => {
      if (!currentUser) return false
    
    // Directeur : Accès total à tout
    if (currentUser.role === 'directeur') {
      return true
    }
    
    // Parent : Communiqués généraux, communiqués parents, et dossiers de ses propres enfants
    if (currentUser.role === 'parent') {
      if (notif.creePar === currentUser.id) return true
      // 1. Communiqués globaux et communiqués parents
      if (notif.type === 'communique') {
        return notif.destinataireRole === 'all' || notif.destinataireRole === 'parent'
      }
      
      // 2. Alertes système générales
      if (notif.type === 'systeme' && !notif.eleveId && !notif.classeId) return true

      // 3. Notifications ciblées sur ses enfants
      const parentKidsIds = eleves
        .filter(el => el.parentUserId === currentUser.id && el.ecoleId === ecoleId)
        .map(el => el.id)
      
      if (notif.eleveId) {
        return parentKidsIds.includes(notif.eleveId)
      }

      // 4. Notifications ciblées sur la classe de ses enfants (seulement si non ciblée sur un élève spécifique)
      const parentKidsClasses = eleves
        .filter(el => el.parentUserId === currentUser.id && el.ecoleId === ecoleId)
        .map(el => el.classeId)

      if (notif.classeId && parentKidsClasses.includes(notif.classeId)) return true
      
      return false
    }
    
    // Enseignant : Communiqués généraux, communiqués enseignants, et ce qui concerne ses classes assignées
    if (currentUser.role === 'enseignant') {
      // 1. Communiqués globaux et communiqués enseignants
      if (notif.type === 'communique') {
        return notif.destinataireRole === 'all' || notif.destinataireRole === 'enseignant'
      }

      // 2. Alertes système générales
      if (notif.type === 'systeme' && !notif.eleveId && !notif.classeId) return true
      
      // 3. Trouver les classes où l'enseignant est principal
      const teacherClassesIds = classes
        .filter(c => c.enseignantPrincipalId === currentUser.id)
        .map(c => c.id)
        
      // Si la notification est liée à une classe
      if (notif.classeId && teacherClassesIds.includes(notif.classeId)) {
        return notif.type === 'absence' || notif.type === 'bulletin' || notif.type === 'systeme'
      }
      
      // Si liée à un élève, vérifier la classe de l'élève
      if (notif.eleveId) {
        const el = eleves.find(e => e.id === notif.eleveId)
        if (el && teacherClassesIds.includes(el.classeId)) {
          return notif.type === 'absence' || notif.type === 'bulletin' || notif.type === 'systeme'
        }
      }
      
      return false
    }
    
    return false
  })

  // Marquer toutes les notifications comme lues
  const handleMarkAllRead = async () => {
    setSendingState(true)
    const unreadNotifs = displayNotifications.filter(n => !n.lu)
    for (const notif of unreadNotifs) {
      await markNotificationAsRead(notif.id)
    }
    setSendingState(false)
    toast({
      title: t('notifications.toast.update_success_title', "Actualisation réussie"),
      description: t('notifications.toast.update_success_desc', "Toutes vos notifications ont été marquées comme lues."),
    })
  }

  const [loadingAction, setSendingState] = useState(false)

  // Supprimer une notification
  const handleDelete = async (id: string) => {
    await deleteNotification(id)
    toast({
      title: t('notifications.toast.delete_success_title', "Notification supprimée"),
      description: t('notifications.toast.delete_success_desc', "Le message a été retiré de votre espace."),
    })
  }

  // Supprimer toutes les notifications
  const handleDeleteAll = async () => {
    setIsDeleteAllOpen(false)
    setSendingState(true)
    const ids = displayNotifications.map(n => n.id)
    await deleteNotifications(ids)
    setSendingState(false)
    toast({
      title: t('notifications.toast.clear_success_title', "Page vidée"),
      description: t('notifications.toast.clear_success_desc', "Toutes vos notifications ont été supprimées."),
    })
  }

  // Publier un communiqué (Directeur)
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast({
        title: t('notifications.toast.fields_required_title', "Champs obligatoires"),
        description: t('notifications.toast.fields_required_desc', "Veuillez saisir un titre et un contenu pour votre communiqué."),
        variant: "destructive"
      })
      return
    }

    setIsSending(true)
    try {
      const destinataireRole = targetType === 'classe' ? 'parent' : targetType
      const classeId = targetType === 'classe' ? selectedClasseId : undefined

      await addNotification({
        titre: title,
        description: description,
        type: 'communique',
        destinataireRole: destinataireRole as any,
        classeId: classeId
      })

      // Reset
      setTitle('')
      setDescription('')
      setTargetType('all')
      setSelectedClasseId('')
      setIsModalOpen(false)

      toast({
        title: t('notifications.toast.publish_success_title', "Communiqué publié"),
        description: t('notifications.toast.publish_success_desc', "Votre annonce a été diffusée avec succès auprès des destinataires cibles."),
        className: "bg-success text-white border-none shadow-lg"
      })

    } catch (err) {
      console.error(err)
      toast({
        title: t('notifications.toast.publish_error_title', "Erreur de publication"),
        description: t('notifications.toast.publish_error_desc', "Une erreur est survenue lors de la diffusion de votre message."),
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  // Choisir l'icône correspondante au type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'paiement':
        return <CreditCard className="h-5 w-5 text-emerald-500" />
      case 'absence':
        return <CalendarOff className="h-5 w-5 text-rose-500" />
      case 'bulletin':
        return <FileText className="h-5 w-5 text-amber-500" />
      case 'inscription':
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case 'communique':
        return <Megaphone className="h-5 w-5 text-indigo-500" />
      default:
        return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  if (!currentUser) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-danger mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-text">{t('notifications.session_expired_title', "Session expirée")}</h3>
          <p className="text-sm text-muted-foreground">{t('notifications.session_expired_desc', "Veuillez vous reconnecter pour accéder aux notifications.")}</p>
        </div>
      </div>
    )
  }

  const unreadCount = displayNotifications.filter(n => !n.lu).length

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={dir}>
      {/* HEADER DE LA PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-primary/10 text-primary">
              <Bell className="h-8 w-8" />
            </span>
            {t('notifications.title', "Notifications")}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {t('notifications.subtitle', "Restez informé de l'actualité administrative et académique de l'établissement en temps réel.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end shrink-0 self-start sm:self-center">
          {/* Bouton Tout marquer comme lu */}
          {unreadCount > 0 && (
            <Button 
              onClick={handleMarkAllRead}
              size="sm"
              disabled={loadingAction}
              className="font-bold text-xs rounded-xl flex items-center gap-2 border border-primary/30 text-primary bg-transparent hover:bg-primary hover:text-white transition-all duration-200"
            >
              {loadingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              {t('notifications.mark_all_read', "Tout marquer comme lu")}
            </Button>
          )}

          {/* Bouton Supprimer tout */}
          {displayNotifications.length > 0 && (
            <Button 
              onClick={() => setIsDeleteAllOpen(true)}
              size="sm"
              variant="outline"
              disabled={loadingAction}
              className="font-bold text-xs rounded-xl flex items-center gap-2 border border-rose-200 text-rose-600 bg-transparent hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 dark:border-rose-900/30 dark:hover:bg-rose-950/20"
            >
              {loadingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t('notifications.delete_all', "Supprimer tout")}
            </Button>
          )}

          {/* Bouton Publier un communiqué (Directeur uniquement) */}
          {currentUser.role === 'directeur' && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white hover:bg-primary-dark font-bold text-xs rounded-xl flex items-center gap-2 shadow-md">
                    <Megaphone className="h-4 w-4" />
                    {t('notifications.publish_communique', "Diffuser un communiqué")}
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] border border-border rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display font-bold text-lg text-text">
                    {t('notifications.publish_modal_title', "Publier un nouveau communiqué")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {t('notifications.publish_modal_desc', "Rédigez un message à diffuser aux enseignants, aux parents ou à des classes ciblées.")}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handlePublish} className="space-y-4 py-3">
                  {/* Titre */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block text-start">
                      {t('notifications.communique_title_label', "Titre du communiqué :")}
                    </label>
                    <Input
                      placeholder={t('notifications.communique_title_placeholder', "Ex: Convocation réunion des parents")}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="font-medium text-xs py-5 rounded-lg"
                      required
                    />
                  </div>

                  {/* Ciblage */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block text-start">
                      {t('notifications.target_label', "Destinataires cibles :")}
                    </label>
                    <Select 
                      value={targetType} 
                      onValueChange={(val: any) => {
                        setTargetType(val)
                        if (val !== 'classe') setSelectedClasseId('')
                      }}
                    >
                      <SelectTrigger className="rounded-lg text-xs py-5 font-semibold text-slate-700">
                        <SelectValue placeholder={t('notifications.target_placeholder', "Choisir la cible")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('notifications.target_all', "Tout le monde (Tous)")}</SelectItem>
                        <SelectItem value="parent">{t('notifications.target_parents', "Tous les Parents")}</SelectItem>
                        <SelectItem value="enseignant">{t('notifications.target_teachers', "Tous les Enseignants")}</SelectItem>
                        <SelectItem value="classe">{t('notifications.target_class', "Parents d'une classe spécifique")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Choix de la classe si ciblage classe */}
                  {targetType === 'classe' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-3 duration-200">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block text-start">
                        {t('notifications.select_class_label', "Sélectionner la classe ciblée :")}
                      </label>
                      <Select 
                        value={selectedClasseId} 
                        onValueChange={setSelectedClasseId}
                        required={targetType === 'classe'}
                      >
                        <SelectTrigger className="rounded-lg text-xs py-5 font-semibold text-slate-700">
                          <SelectValue placeholder={t('notifications.select_class_placeholder', "Choisir la classe")} />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block text-start">
                      {t('notifications.content_label', "Contenu de l'annonce :")}
                    </label>
                    <textarea
                      placeholder={t('notifications.content_placeholder', "Rédigez ici les détails de votre annonce pédagogique ou administrative...")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg leading-relaxed text-start"
                      required
                    />
                  </div>

                  <DialogFooter className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-xl font-bold text-xs"
                    >
                      {t('notifications.cancel', "Annuler")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSending}
                      className="bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {t('notifications.publish_btn', "Diffuser")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* LISTE DES NOTIFICATIONS */}
      <div className="max-w-4xl mx-auto space-y-4">
        {displayNotifications.length === 0 ? (
          <Card className="shadow-sm border-border/50 bg-card p-16 text-center flex flex-col items-center rounded-2xl">
            <div className="p-4 rounded-full bg-muted/60 mb-4 text-muted-foreground">
              <Bell className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-text">{t('notifications.empty_title', "Aucune notification")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t('notifications.empty_desc', "Vous êtes complètement à jour ! Aucune alerte académique ou administrative à signaler pour le moment.")}
            </p>
          </Card>
        ) : (
          displayNotifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`shadow-sm border-border/50 bg-card transition-all duration-200 border-l-4 rounded-xl overflow-hidden hover:shadow-md ${
                !notif.lu ? 'border-l-primary bg-primary/[0.01]' : 'border-l-slate-300'
              }`}
            >
              <CardContent className="p-5 flex gap-4">
                {/* Icône de type */}
                <div className={`p-3 rounded-xl shrink-0 self-start ${
                  !notif.lu ? 'bg-primary/10' : 'bg-slate-100'
                }`}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold text-text leading-snug ${
                        !notif.lu ? 'font-extrabold text-primary' : 'font-medium'
                      }`}>
                        {notif.titre}
                      </h4>
                      {!notif.lu && (
                        <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px] h-4 uppercase px-1.5 py-0 shrink-0">
                          {t('notifications.badge_new', "Nouveau")}
                        </Badge>
                      )}
                      
                      {/* Badge destinataire pour les directeurs */}
                      {currentUser.role === 'directeur' && notif.type === 'communique' && (
                        <Badge variant="outline" className="text-[9px] font-bold text-slate-500 px-1.5 py-0 border-slate-200 shrink-0">
                          {notif.destinataireRole === 'all' 
                            ? t('notifications.target_badge_all', 'Tous') 
                            : notif.destinataireRole === 'enseignant'
                            ? t('notifications.target_badge_teachers', 'Enseignants')
                            : notif.classeId
                            ? t('notifications.target_badge_class', 'Classe: {name}').replace('{name}', classes.find(c => c.id === notif.classeId)?.nom || 'Classe')
                            : t('notifications.target_badge_parents', 'Parents')
                          }
                        </Badge>
                      )}
                    </div>
                    
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {notif.description}
                  </p>

                  <div className="flex items-center gap-3 pt-2.5">
                    {!notif.lu && (
                      <Button 
                        onClick={() => markNotificationAsRead(notif.id)}
                        variant="ghost" 
                        size="sm"
                        className="font-bold text-xs text-primary hover:text-primary-dark p-0 h-auto"
                      >
                        {t('notifications.mark_as_read', "Marquer comme lu")}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => handleDelete(notif.id)}
                      variant="ghost" 
                      size="sm"
                      className="font-bold text-xs text-danger hover:text-danger/80 p-0 h-auto flex items-center gap-1 ms-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('notifications.delete_btn', "Supprimer")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Note informative de synchronisation */}
        <Card className="shadow-sm border-border/50 bg-muted/20 border border-border/40 p-4 rounded-xl">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-text uppercase">{t('notifications.channel_title', "Canal de transmission officiel")}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('notifications.channel_desc', "Les notifications présentées dans cet espace correspondent à l'activité administrative enregistrée sur l'application **GestScol**. Les alertes critiques (scolarité en retard, conseil de classe, urgence de santé) font également l'objet d'un SMS envoyé directement aux numéros ivoiriens (+225) des parents d'élèves.")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Modale de Confirmation de Suppression de toutes les notifications */}
      <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <DialogContent className="sm:max-w-[400px] border border-border rounded-2xl bg-card text-text">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              {t('notifications.delete_all_title', "Supprimer toutes les notifications")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              {t('notifications.delete_all_desc', "Êtes-vous sûr de vouloir vider toutes les notifications de votre espace ? Cette action est irréversible.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteAllOpen(false)}
              className="rounded-xl font-bold text-xs"
            >
              {t('notifications.cancel', "Annuler")}
            </Button>
            <Button
              type="button"
              onClick={handleDeleteAll}
              disabled={loadingAction}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
            >
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : t('notifications.delete_all_confirm', "Oui, supprimer tout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
