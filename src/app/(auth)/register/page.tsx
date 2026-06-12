'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, GraduationCap, Users, ArrowRight, ShieldCheck } from 'lucide-react'
import logoImg from '@/app/logo.png'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageToggle from '@/components/layout/LanguageToggle'

export default function RegisterPage() {
  const router = useRouter()
  const { t, dir, isAr } = useTranslation()

  const profiles = [
    {
      title: t('register.director_title', "Je suis Directeur"),
      description: t('register.director_desc', "Gérez votre établissement, inscrivez vos élèves, suivez les paiements et générez les bulletins."),
      badge: t('register.director_badge', "Accès complet"),
      link: "/register/directeur",
      icon: Building2,
      color: "emerald",
      borderHover: "hover:border-emerald-500 hover:shadow-emerald-500/5",
      iconColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30",
      badgeColor: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30",
      textColor: "text-emerald-600 dark:text-emerald-450 group-hover:text-emerald-700"
    },
    {
      title: t('register.teacher_title', "Je suis Enseignant"),
      description: t('register.teacher_desc', "Saisissez les notes, gérez les absences de vos élèves et consultez vos classes."),
      badge: t('register.teacher_badge', "Accès limité"),
      link: "/register/enseignant",
      icon: GraduationCap,
      color: "blue",
      borderHover: "hover:border-blue-500 hover:shadow-blue-500/5",
      iconColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30",
      badgeColor: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30",
      textColor: "text-blue-600 dark:text-blue-450 group-hover:text-blue-700"
    },
    {
      title: t('register.parent_title', "Je suis Parent"),
      description: t('register.parent_desc', "Suivez la scolarité de vos enfants, consultez les bulletins et les paiements."),
      badge: t('register.parent_badge', "Accès enfant"),
      link: "/register/parent",
      icon: Users,
      color: "amber",
      borderHover: "hover:border-amber-500 hover:shadow-amber-500/5",
      iconColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30",
      badgeColor: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-200/50 dark:border-amber-900/30",
      textColor: "text-amber-600 dark:text-amber-450 group-hover:text-amber-700"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden text-slate-800 dark:text-slate-200" dir={dir}>
      {/* Sélecteur de langue absolu */}
      <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto z-50">
        <LanguageToggle />
      </div>

      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] -z-10" />

      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Link href="/" className="mb-4 transition-transform duration-300 hover:scale-105 inline-block">
          <img src={logoImg.src} alt="GestScol Logo" className="h-16 w-auto object-contain" />
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent font-display">
          {t('register.title_part', "Créer votre compte GestScol")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-sm">
          {t('register.subtitle_part', "Sélectionnez votre profil d'utilisateur pour démarrer votre inscription autonome.")}
        </p>
      </div>

      {/* Profile Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-10">
        {profiles.map((profile, idx) => {
          const Icon = profile.icon
          return (
            <button
              key={idx}
              onClick={() => router.push(profile.link)}
              className={`flex flex-col items-start text-start bg-white dark:bg-card border border-slate-200/80 dark:border-border/60 rounded-2xl p-6 md:p-8 transition-all duration-300 group hover:-translate-y-1 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 hover:shadow-lg ${profile.borderHover}`}
            >
              <div className="flex items-center justify-between w-full mb-6">
                <div className={`p-3.5 rounded-xl ${profile.iconColor}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${profile.badgeColor}`}>
                  {profile.badge}
                </span>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1 font-display">
                {profile.title}
              </h2>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed mb-6 flex-1">
                {profile.description}
              </p>

              <span className={`text-xs font-bold flex items-center gap-1 transition-colors pt-2 border-t border-slate-100 dark:border-border/60 w-full ${profile.textColor}`}>
                {t('register.cta_register', "S'inscrire")} <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </span>
            </button>
          )
        })}
      </div>

      {/* Info Card */}
      <div className="w-full max-w-xl bg-white dark:bg-card border border-slate-200 dark:border-border/60 shadow-sm rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400 text-start">
        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t('register.security_info', "Pour la sécurité de l'établissement, les comptes Enseignant et Parent feront l'objet d'une validation de la part de la direction avant d'accéder aux dossiers.")}
        </p>
      </div>

      {/* Login link */}
      <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
        {t('register.already_registered', "Vous avez déjà un compte ?")}{" "}
        <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline font-bold transition-colors">
          {t('register.login_link', "Se connecter")}
        </Link>
      </div>
    </div>
  )
}

