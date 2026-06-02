'use client'

import { useState } from 'react'
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
  Briefcase,
  ClipboardList,
  PenTool,
  Zap,
  HelpCircle,
  LifeBuoy,
  ChevronDown,
  ChevronRight,
  Building2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitiales } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Général': true,
    'Établissement': true,
    'Pédagogie & Suivi': true,
    'Gestion & Support': true,
    'Facturation': true
  })

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

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

  const isExpired = ecole?.abonnement && (
    ['expire', 'suspendu'].includes(ecole.abonnement.statut) ||
    (ecole.abonnement.dateFin && new Date(ecole.abonnement.dateFin) < new Date())
  )

  const getNavigationSections = () => {
    const plan = ecole?.abonnement?.plan || 'gratuit'
    const sections = [
      {
        title: 'Général',
        items: [
          { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, roles: ['directeur'] },
          { name: 'Mon Tableau de bord', href: '/enseignant/dashboard', icon: LayoutDashboard, roles: ['enseignant'] },
          { name: 'Mon Tableau de bord', href: '/parent/dashboard', icon: LayoutDashboard, roles: ['parent'] },
          { name: 'Inscriptions', href: '/inscriptions', icon: ClipboardList, roles: ['directeur'] },
        ]
      },
      {
        title: 'Établissement',
        items: [
          { name: 'Enseignants', href: '/enseignants', icon: Briefcase, roles: ['directeur'], premium: true },
          { name: 'Élèves', href: '/eleves', icon: Users, roles: ['directeur'] },
          { name: 'Classes', href: '/classes', icon: GraduationCap, roles: ['directeur'] },
        ]
      },
      {
        title: 'Pédagogie & Suivi',
        items: [
          { name: 'Notes', href: '/notes', icon: PenTool, roles: ['directeur', 'enseignant'], premium: true },
          { name: 'Absences', href: '/absences', icon: CalendarOff, roles: ['directeur', 'enseignant', 'parent'], premium: true },
          { name: 'Bulletins', href: '/bulletins', icon: FileText, roles: ['directeur'], premium: true },
        ]
      },
      {
        title: 'Gestion & Support',
        items: [
          { name: 'Paiements', href: '/paiements', icon: CreditCard, roles: ['directeur', 'parent'] },
          { name: 'Support', href: '/support', icon: LifeBuoy, roles: ['directeur'], premium: true },
          { name: 'Mon Abonnement', href: '/abonnement', icon: Zap, roles: ['directeur'] },
          { name: 'Paramètres', href: '/parametres', icon: Settings, roles: ['directeur'] },
          { name: "Guide d'Aide", href: '/aide', icon: HelpCircle, roles: ['directeur', 'enseignant', 'parent'] },
        ]
      }
    ]

    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          const hasRole = item.roles.includes(currentUser.role)
          return hasRole
        })
      }))
      .filter(section => section.items.length > 0)
  }

  const sections = getNavigationSections()
  const plan = ecole?.abonnement?.plan || 'gratuit'

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
      <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
        <nav className="px-3 space-y-4">
          {sections.map((section) => {
            const isOpen = openSections[section.title] ?? true
            return (
              <div key={section.title} className="space-y-1.5 transition-all">
                {/* Bouton cliquable de section pliante */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-white/35 hover:text-white uppercase tracking-widest font-display transition-colors focus:outline-none"
                >
                  <span>{section.title}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 shrink-0 text-white/40 transition-transform duration-300" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0 text-white/40 transition-transform duration-300" />
                  )}
                </button>
                
                {/* Items de section affichés si la section est dépliée */}
                {isOpen && (
                  <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                    {section.items.map((item) => {
                      const isActive = pathname.startsWith(item.href)
                      const isLocked = item.premium && plan === 'gratuit'
                      
                      if (isLocked) {
                        return (
                          <div
                            key={item.name}
                            className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-white/40 cursor-not-allowed select-none bg-white/[0.02] border border-white/5"
                            title="Fonctionnalité Premium — Abonnement Standard requis"
                          >
                            <div className="flex items-center">
                              <item.icon className="mr-3 h-4 w-4 shrink-0 text-white/30" />
                              <span>{item.name}</span>
                            </div>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                              👑 Premium
                            </span>
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200',
                            isActive 
                              ? 'bg-primary text-white shadow-md shadow-primary/20' 
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          <item.icon className={cn('mr-3 h-4 w-4 shrink-0 transition-colors', isActive ? 'text-white' : 'text-white/60')} />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Footer Sidebar */}
      <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
        <Link
          href="/ecoles"
          onClick={onNavigate}
          className="flex items-center w-full px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
        >
          <Building2 className="mr-3 h-5 w-5 text-white/60" />
          {currentUser.role === 'directeur' ? 'Mes écoles' : 'Écoles'}
        </Link>

        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Déconnexion
        </button>

        {currentUser && (
          <div className="flex items-center space-x-2.5 px-3 pt-3 mt-1 border-t border-white/5 select-none min-w-0">
            <Avatar className="h-7 w-7 border border-white/10 shrink-0">
              {currentUser.photoUrl ? (
                <AvatarImage src={currentUser.photoUrl} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-white/10 text-white font-semibold text-[10px]">
                {getInitiales(currentUser.nom, currentUser.prenom)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex flex-col">
              <span className="text-[10px] font-bold text-white/80 truncate leading-none">
                {currentUser.prenom} {currentUser.nom}
              </span>
              <span className="text-[8.5px] text-white/40 truncate font-mono mt-0.5 leading-none">
                {currentUser.email}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
