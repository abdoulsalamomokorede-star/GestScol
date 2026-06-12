'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useTranslation } from '@/hooks/useTranslation'
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
  const { t } = useTranslation()

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
          { name: 'Tableau de bord', translationKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['directeur'] },
          { name: 'Mon Tableau de bord', translationKey: 'nav.dashboard', href: '/enseignant/dashboard', icon: LayoutDashboard, roles: ['enseignant'] },
          { name: 'Mon Tableau de bord', translationKey: 'nav.dashboard', href: '/parent/dashboard', icon: LayoutDashboard, roles: ['parent'] },
          { name: 'Inscriptions', translationKey: 'nav.inscriptions', href: '/inscriptions', icon: ClipboardList, roles: ['directeur'] },
        ]
      },
      {
        title: 'Établissement',
        items: [
          { name: 'Enseignants', translationKey: 'nav.enseignants', href: '/enseignants', icon: Briefcase, roles: ['directeur'], premium: true },
          { name: 'Élèves', translationKey: 'nav.eleves', href: '/eleves', icon: Users, roles: ['directeur'] },
          { name: 'Classes', translationKey: 'nav.classes', href: '/classes', icon: GraduationCap, roles: ['directeur'] },
        ]
      },
      {
        title: 'Pédagogie & Suivi',
        items: [
          { name: 'Notes', translationKey: 'nav.notes', href: '/notes', icon: PenTool, roles: ['directeur', 'enseignant'], premium: true },
          { name: 'Absences', translationKey: 'nav.absences', href: '/absences', icon: CalendarOff, roles: ['directeur', 'enseignant', 'parent'], premium: true },
          { name: 'Bulletins', translationKey: 'nav.bulletins', href: '/bulletins', icon: FileText, roles: ['directeur'], premium: true },
        ]
      },
      {
        title: 'Gestion & Support',
        items: [
          { name: 'Paiements', translationKey: 'nav.paiements', href: '/paiements', icon: CreditCard, roles: ['directeur', 'parent'] },
          { name: 'Support', translationKey: 'nav.support', href: '/support', icon: LifeBuoy, roles: ['directeur'], premium: true },
          { name: 'Mon Abonnement', translationKey: 'nav.abonnement', href: '/abonnement', icon: Zap, roles: ['directeur'] },
          { name: 'Paramètres', translationKey: 'nav.parametres', href: '/parametres', icon: Settings, roles: ['directeur'] },
          { name: "Guide d'Aide", translationKey: 'nav.aide', href: '/aide', icon: HelpCircle, roles: ['directeur', 'enseignant', 'parent'] },
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

  const getSectionTitle = (title: string) => {
    switch (title) {
      case 'Général': return t('nav.section.general', 'Général')
      case 'Établissement': return t('nav.section.etablissement', 'Établissement')
      case 'Pédagogie & Suivi': return t('nav.section.pedagogie', 'Pédagogie & Suivi')
      case 'Gestion & Support': return t('nav.section.gestion', 'Gestion & Support')
      default: return title
    }
  }

  return (
    <div className={cn("bg-sidebar flex flex-col text-slate-800 dark:text-slate-200 border-e border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-none flex-shrink-0 h-full", className)}>
      {/* Header Sidebar */}
      <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-slate-800/40 shrink-0">
        <div className="mb-2 transition-transform duration-300 hover:scale-105">
          <Link href={currentUser.role === 'parent' ? '/parent/dashboard' : currentUser.role === 'enseignant' ? '/enseignant/dashboard' : '/dashboard'}>
            <img src={logoImg.src} alt="GestScol Logo" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        <h2 className="text-xl font-display font-extrabold text-center leading-tight tracking-wide text-slate-900 dark:text-white">
          GestScol
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center font-medium">
          {ecole?.nom || ecoleMock.nom}
          <br />
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full mt-1.5 inline-block font-bold">
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
                  className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 uppercase tracking-widest font-display transition-colors focus:outline-none"
                >
                  <span>{getSectionTitle(section.title)}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-300" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-300 rtl:rotate-180" />
                  )}
                </button>
                
                {/* Items de section affichés si la section est dépliée */}
                {isOpen && (
                  <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                    {section.items.map((item) => {
                      const isActive = pathname.startsWith(item.href)
                      const isLocked = false
                      
                      if (isLocked) {
                        return (
                          <div
                            key={item.name}
                            className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-slate-400 dark:text-slate-500 cursor-not-allowed select-none bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800"
                            title="Fonctionnalité Premium — Abonnement Standard requis"
                          >
                            <div className="flex items-center">
                              <item.icon className="me-3 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                              <span>{t(item.translationKey, item.name)}</span>
                            </div>
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
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
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                          )}
                        >
                          <item.icon className={cn('me-3 h-4 w-4 shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500')} />
                          <span>{t(item.translationKey, item.name)}</span>
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
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/40 space-y-2 shrink-0">
        <Link
          href="/ecoles"
          onClick={onNavigate}
          className="flex items-center w-full px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
        >
          <Building2 className="me-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
          {currentUser.role === 'directeur' ? t('nav.my_schools', 'Mes écoles') : t('nav.schools', 'Écoles')}
        </Link>

        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 rounded-md transition-colors"
        >
          <LogOut className="me-3 h-5 w-5" />
          {t('nav.logout', 'Déconnexion')}
        </button>

        {currentUser && (
          <div className="flex items-center gap-2.5 px-3 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/40 select-none min-w-0">
            <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-800 shrink-0">
              {currentUser.photoUrl ? (
                <AvatarImage src={currentUser.photoUrl} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
                {getInitiales(currentUser.nom, currentUser.prenom)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex flex-col">
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate leading-none">
                {currentUser.prenom} {currentUser.nom}
              </span>
              <span className="text-[8.5px] text-slate-400 dark:text-slate-500 truncate font-mono mt-0.5 leading-none">
                {currentUser.email}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
