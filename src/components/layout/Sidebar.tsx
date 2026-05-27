'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { ecoleMock } from '@/data/mockData'
import logoImg from '@/app/logo.png'
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  FileText, 
  CreditCard, 
  CalendarOff,
  Settings,
  LogOut,
  BookOpen,
  Briefcase,
  ClipboardList,
  Library,
  PenTool
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export default function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, setCurrentUser, activeAnneeScolaire, ecole } = useSchoolStore()
  const supabase = createClient()

  if (!currentUser) return null

  const handleLogout = async () => {
    const role = currentUser.role
    await supabase.auth.signOut()
    setCurrentUser(null) // Nettoyage de Zustand et du cookie currentUser
    if (role === 'enseignant') {
      window.location.href = '/login/enseignant'
    } else if (role === 'parent') {
      window.location.href = '/login/parent'
    } else {
      window.location.href = '/login'
    }
  }

  const getNavigation = () => {
    const baseNav = [
      { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, roles: ['directeur'] },
      { name: 'Inscriptions', href: '/inscriptions', icon: ClipboardList, roles: ['directeur'] },
      { name: 'Mon Tableau de bord', href: '/enseignant/dashboard', icon: LayoutDashboard, roles: ['enseignant'] },
      { name: 'Mon Tableau de bord', href: '/parent/dashboard', icon: LayoutDashboard, roles: ['parent'] },
      { name: 'Enseignants', href: '/enseignants', icon: Briefcase, roles: ['directeur'] },
      { name: 'Élèves', href: '/eleves', icon: Users, roles: ['directeur'] },
      { name: 'Classes', href: '/classes', icon: GraduationCap, roles: ['directeur'] },
      { name: 'Notes', href: '/notes', icon: PenTool, roles: ['directeur', 'enseignant'] },
      { name: 'Paiements', href: '/paiements', icon: CreditCard, roles: ['directeur', 'parent'] },
      { name: 'Absences', href: '/absences', icon: CalendarOff, roles: ['directeur', 'enseignant', 'parent'] },
      { name: 'Bulletins', href: '/bulletins', icon: FileText, roles: ['directeur'] },
    ]

    return baseNav.filter(item => item.roles.includes(currentUser.role))
  }

  const navigation = getNavigation()

  return (
    <div className={cn("bg-sidebar flex flex-col text-white shadow-xl flex-shrink-0 h-full", className)}>
      {/* Header Sidebar */}
      <div className="p-6 flex flex-col items-center border-b border-white/10 shrink-0">
        <div className="mb-2 transition-transform duration-300 hover:scale-105">
          <Link href={currentUser.role === 'parent' ? '/parent/dashboard' : currentUser.role === 'enseignant' ? '/enseignant/dashboard' : '/dashboard'}>
            <img src={logoImg.src} alt="GestScol Logo" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        <h2 className="text-xl font-display font-extrabold text-center leading-tight tracking-wide">
          GestScol
        </h2>
        <p className="text-xs text-white/60 mt-1.5 text-center font-medium">
          {ecole?.nom || ecoleMock.nom}
          <br />
          <span className="text-[10px] bg-primary/20 text-primary-light px-2 py-0.5 rounded-full mt-1.5 inline-block font-bold">
            {activeAnneeScolaire?.nom || ecoleMock.anneeScolaire}
          </span>
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
        <nav className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-white' : 'text-white/70')} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Sidebar */}
      <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
        {currentUser.role === 'directeur' && (
          <Link 
            href="/parametres"
            onClick={onNavigate}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname.startsWith('/parametres')
                ? 'bg-primary text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Settings className="mr-3 h-5 w-5" />
            Paramètres
          </Link>
        )}
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Déconnexion
        </button>

      </div>
    </div>
  )
}
