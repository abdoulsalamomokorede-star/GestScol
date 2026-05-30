'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { getInitiales } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Bell, Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import Link from 'next/link'

const getPageTitle = (pathname: string) => {
  if (pathname.startsWith('/dashboard')) return 'Tableau de bord'
  if (pathname.startsWith('/inscriptions')) return 'Inscriptions'
  if (pathname.startsWith('/enseignant/dashboard')) return 'Mon Tableau de bord'
  if (pathname.startsWith('/eleves')) return 'Gestion des Élèves'
  if (pathname.startsWith('/enseignants')) return 'Gestion des Enseignants'
  if (pathname.startsWith('/classes')) return 'Classes'
  if (pathname.startsWith('/enseignant/classe')) return 'Ma Classe'
  if (pathname.startsWith('/notes')) return 'Saisie des Notes'
  if (pathname.startsWith('/paiements')) return 'Suivi des Paiements'
  if (pathname.startsWith('/absences')) return 'Gestion des Absences'
  if (pathname.startsWith('/bulletins')) return 'Génération des Bulletins'
  if (pathname.startsWith('/notifications')) return 'Notifications'
  if (pathname.startsWith('/profil')) return 'Mon Profil'
  if (pathname.startsWith('/parametres')) return 'Paramètres Généraux'
  if (pathname.startsWith('/aide')) return "Guide d'Utilisation"
  return 'Espace GestScol'
}

export default function Header() {
  const pathname = usePathname()
  const { currentUser, notifications, eleves, classes, fetchNotifications, suppressedNotificationIds } = useSchoolStore()
  const [open, setOpen] = useState(false)

  // Actualiser les notifications au montage
  useEffect(() => {
    fetchNotifications()
  }, [])
  
  if (!currentUser) return null

  const title = getPageTitle(pathname)
  const roleLabel = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)

  // Filtrage intelligent identique à la page /notifications pour avoir le compte précis de notifications non lues avec cloisonnement utilisateur
  const displayNotifications = notifications
    .filter(n => !suppressedNotificationIds?.includes(`${currentUser.id}_${n.id}`))
    .filter(notif => {
    if (!currentUser) return false
    
    // Directeur : Voit tout
    if (currentUser.role === 'directeur') return true
    
    // Parent : Communiqués généraux, communiqués parents, et dossiers de ses propres enfants
    if (currentUser.role === 'parent') {
      if (notif.type === 'communique') {
        return notif.destinataireRole === 'all' || notif.destinataireRole === 'parent'
      }
      if (notif.type === 'systeme' && !notif.eleveId && !notif.classeId) return true

      const parentKidsIds = eleves
        .filter(el => el.parentUserId === currentUser.id)
        .map(el => el.id)
      
      if (notif.eleveId && parentKidsIds.includes(notif.eleveId)) return true

      const parentKidsClasses = eleves
        .filter(el => el.parentUserId === currentUser.id)
        .map(el => el.classeId)

      if (notif.classeId && parentKidsClasses.includes(notif.classeId)) return true
      return false
    }
    
    // Enseignant : Communiqués généraux, communiqués enseignants, et ce qui concerne ses classes principales
    if (currentUser.role === 'enseignant') {
      if (notif.type === 'communique') {
        return notif.destinataireRole === 'all' || notif.destinataireRole === 'enseignant'
      }
      if (notif.type === 'systeme' && !notif.eleveId && !notif.classeId) return true
      
      const teacherClassesIds = classes
        .filter(c => c.enseignantPrincipalId === currentUser.id)
        .map(c => c.id)
        
      if (notif.classeId && teacherClassesIds.includes(notif.classeId)) {
        return notif.type === 'absence' || notif.type === 'bulletin' || notif.type === 'systeme'
      }
      
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

  const unreadCount = displayNotifications.filter(n => !n.lu).length

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 z-10 shadow-sm">
      <div className="flex items-center">
        {/* Menu Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden p-2 mr-2 text-muted-foreground hover:bg-muted rounded-md transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-0">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <Sidebar className="w-full" onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <h1 className="text-xl font-display font-semibold text-text truncate max-w-[200px] md:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Notifications avec badge dynamique */}
        <Link 
          href="/notifications"
          className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors inline-block"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] px-1 rounded-full bg-danger text-white text-[9px] font-extrabold flex items-center justify-center border border-card shadow-sm animate-pulse-subtle">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
 
        {/* Profil Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-3 outline-none group">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                {currentUser.prenom} {currentUser.nom}
              </span>
              <span className="text-xs text-muted-foreground">
                {roleLabel}
              </span>
            </div>
            <Avatar className="h-9 w-9 border border-primary/20">
              <AvatarImage src={currentUser.photoUrl || ''} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {getInitiales(currentUser.nom, currentUser.prenom)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profil" className="w-full cursor-pointer">Profil</Link>
            </DropdownMenuItem>
            {currentUser.role === 'directeur' && (
              <DropdownMenuItem asChild>
                <Link href="/parametres" className="w-full cursor-pointer">Paramètres</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
