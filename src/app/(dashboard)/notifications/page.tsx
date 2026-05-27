'use client'

import { useState } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Info 
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface NotificationItem {
  id: string
  title: string
  description: string
  date: string
  type: 'paiement' | 'absence' | 'bulletin' | 'inscription' | 'systeme'
  eleveId?: string
  classeId?: string
  read: boolean
}

export default function NotificationsPage() {
  const { currentUser, eleves, classes } = useSchoolStore()

  // Base de données mockée de notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Reçu de versement scolarité',
      description: 'Un versement de 35 000 FCFA a été enregistré via Wave pour l\'élève Amenan Grace Kouassi (Classe: CM2 A).',
      date: new Date(Date.now() - 3600000 * 2).toISOString(), // Il y a 2h
      type: 'paiement',
      eleveId: 'el-1',
      classeId: 'c3',
      read: false
    },
    {
      id: '2',
      title: 'Absence enregistrée',
      description: 'L\'absence de l\'élève Mamadou Traoré (Classe: CM2 A) a été signalée pour la séance du matin (Motif: Visite médicale).',
      date: new Date(Date.now() - 3600000 * 5).toISOString(), // Il y a 5h
      type: 'absence',
      eleveId: 'el-2',
      classeId: 'c3',
      read: false
    },
    {
      id: '3',
      title: 'Bulletin du 1er Trimestre disponible',
      description: 'Le bulletin officiel de l\'élève Mireille Essi Aka (Classe: CP1 A) a été généré et approuvé par la direction.',
      date: new Date(Date.now() - 86400000 * 1).toISOString(), // Hier
      type: 'bulletin',
      eleveId: 'el-11',
      classeId: 'c1',
      read: true
    },
    {
      id: '4',
      title: 'Nouvel élève inscrit',
      description: 'Dossier d\'inscription complété et validé pour Ibrahim Cheick Diallo (Classe: CP1 A).',
      date: new Date(Date.now() - 86400000 * 2).toISOString(), // Il y a 2 jours
      type: 'inscription',
      eleveId: 'el-12',
      classeId: 'c1',
      read: true
    },
    {
      id: '5',
      title: 'Alerte de paiement en retard',
      description: 'La date limite pour la 2ème tranche de scolarité est dépassée pour les élèves de la classe de CE2 B.',
      date: new Date(Date.now() - 86400000 * 3).toISOString(), // Il y a 3 jours
      type: 'systeme',
      classeId: 'c2',
      read: true
    }
  ])

  // Filtrer par rôle
  const displayNotifications = notifications.filter(notif => {
    if (!currentUser) return false
    
    // Directeur : Voit tout
    if (currentUser.role === 'directeur') {
      return true
    }
    
    // Parent : Voit uniquement les notifications liées à ses enfants
    if (currentUser.role === 'parent') {
      if (notif.type === 'systeme') return true
      
      const parentKidsIds = eleves
        .filter(el => el.parentUserId === currentUser.id)
        .map(el => el.id)
      
      return !!(notif.eleveId && parentKidsIds.includes(notif.eleveId))
    }
    
    // Enseignant : Voit uniquement ce qui concerne ses classes assignées
    if (currentUser.role === 'enseignant') {
      // Trouver les classes où l'enseignant est principal
      const teacherClassesIds = classes
        .filter(c => c.enseignantPrincipalId === currentUser.id)
        .map(c => c.id)
        
      if (notif.type === 'systeme') return true
      
      // Si la notification est liée à une classe
      if (notif.classeId && teacherClassesIds.includes(notif.classeId)) {
        return notif.type === 'absence' || notif.type === 'bulletin'
      }
      
      // Si liée à un élève, vérifier la classe de l'élève
      if (notif.eleveId) {
        const el = eleves.find(e => e.id === notif.eleveId)
        if (el && teacherClassesIds.includes(el.classeId)) {
          return notif.type === 'absence' || notif.type === 'bulletin'
        }
      }
      
      return false
    }
    
    return false
  })

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'paiement':
        return <CreditCard className="h-5 w-5 text-emerald-500" />
      case 'absence':
        return <CalendarOff className="h-5 w-5 text-rose-500" />
      case 'bulletin':
        return <FileText className="h-5 w-5 text-amber-500" />
      case 'inscription':
        return <UserPlus className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  if (!currentUser) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-danger mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-text">Session expirée</h3>
          <p className="text-sm text-muted-foreground">Veuillez vous reconnecter pour accéder aux notifications.</p>
        </div>
      </div>
    )
  }

  const unreadCount = displayNotifications.filter(n => !n.read).length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER DE LA PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-primary/10 text-primary">
              <Bell className="h-8 w-8" />
            </span>
            Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Restez informé de l&apos;actualité administrative et académique de l&apos;établissement en temps réel.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button 
            onClick={markAllRead}
            variant="outline" 
            size="sm"
            className="font-bold text-xs rounded-xl flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary shrink-0 self-start sm:self-center"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* LISTE DES NOTIFICATIONS */}
      <div className="max-w-4xl mx-auto space-y-4">
        {displayNotifications.length === 0 ? (
          <Card className="shadow-sm border-border/50 bg-card p-12 text-center flex flex-col items-center">
            <div className="p-4 rounded-full bg-muted/60 mb-4 text-muted-foreground">
              <Bell className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-text">Aucune notification</h3>
            <p className="text-sm text-muted-foreground mt-1">Vous êtes complètement à jour ! Rien à signaler pour le moment.</p>
          </Card>
        ) : (
          displayNotifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`shadow-sm border-border/50 bg-card transition-all duration-200 border-l-4 ${
                !notif.read ? 'border-l-primary bg-primary/[0.01]' : 'border-l-muted/60'
              }`}
            >
              <CardContent className="p-5 flex gap-4">
                <div className={`p-3 rounded-xl shrink-0 self-start ${
                  !notif.read ? 'bg-primary/10' : 'bg-muted/50'
                }`}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold text-text leading-snug ${
                        !notif.read ? 'font-extrabold text-primary' : 'font-medium'
                      }`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px] h-4 uppercase px-1.5 py-0">Nouveau</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDate(notif.date)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {notif.description}
                  </p>

                  <div className="flex items-center gap-3 pt-2.5">
                    {!notif.read && (
                      <Button 
                        onClick={() => markRead(notif.id)}
                        variant="ghost" 
                        size="sm"
                        className="font-bold text-xs text-primary hover:text-primary-dark p-0 h-auto"
                      >
                        Marquer comme lu
                      </Button>
                    )}
                    <Button 
                      onClick={() => deleteNotification(notif.id)}
                      variant="ghost" 
                      size="sm"
                      className="font-bold text-xs text-danger hover:text-danger/80 p-0 h-auto flex items-center gap-1 ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Note informative de synchronisation */}
        <Card className="shadow-sm border-border/50 bg-muted/20 border border-border/40 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-text uppercase">Canal de transmission officiel</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Les notifications présentées dans cet espace correspondent à l&apos;activité administrative enregistrée sur l&apos;application **GestScol**. Les alertes critiques (scolarité en retard, conseil de classe, urgence de santé) font également l&apos;objet d&apos;un SMS envoyé directement aux numéros ivoiriens (+225) des parents d&apos;élèves.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
