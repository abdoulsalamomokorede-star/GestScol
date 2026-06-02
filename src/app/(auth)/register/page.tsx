'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, GraduationCap, Users, ArrowRight, ShieldCheck } from 'lucide-react'
import logoImg from '@/app/logo.png'

export default function RegisterPage() {
  const router = useRouter()

  const profiles = [
    {
      title: "Je suis Directeur",
      description: "Gérez votre établissement, inscrivez vos élèves, suivez les paiements et générez les bulletins.",
      badge: "Accès complet",
      link: "/register/directeur",
      icon: Building2,
      color: "emerald",
      borderHover: "hover:border-emerald-500 hover:shadow-emerald-500/10",
      iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    },
    {
      title: "Je suis Enseignant",
      description: "Saisissez les notes, gérez les absences de vos élèves et consultez vos classes.",
      badge: "Accès limité",
      link: "/register/enseignant",
      icon: GraduationCap,
      color: "blue",
      borderHover: "hover:border-blue-500 hover:shadow-blue-500/10",
      iconColor: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
      title: "Je suis Parent",
      description: "Suivez la scolarité de vos enfants, consultez les bulletins et les paiements.",
      badge: "Accès enfant",
      link: "/register/parent",
      icon: Users,
      color: "amber",
      borderHover: "hover:border-amber-500 hover:shadow-amber-500/10",
      iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden text-slate-100">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] -z-10" />

      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Link href="/" className="mb-4 transition-transform duration-300 hover:scale-105 inline-block">
          <img src={logoImg.src} alt="GestScol Logo" className="h-16 w-auto object-contain" />
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
          Créer votre compte GestScol
        </h1>
        <p className="text-sm text-slate-400 mt-2 font-medium max-w-sm">
          Sélectionnez votre profil d&apos;utilisateur pour démarrer votre inscription autonome.
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
              className={`flex flex-col items-start text-left bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-8 transition-all duration-300 group hover:-translate-y-1 hover:bg-slate-900/60 ${profile.borderHover}`}
            >
              <div className="flex items-center justify-between w-full mb-6">
                <div className={`p-3.5 rounded-xl ${profile.iconColor}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${profile.badgeColor}`}>
                  {profile.badge}
                </span>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-slate-100 mb-2 flex items-center gap-1">
                {profile.title}
              </h2>
              
              <p className="text-sm text-slate-400 font-normal leading-relaxed mb-6 flex-1">
                {profile.description}
              </p>

              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:text-emerald-300 transition-colors pt-2 border-t border-slate-800/60 w-full">
                S&apos;inscrire <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </button>
          )
        })}
      </div>

      {/* Info Card */}
      <div className="w-full max-w-xl bg-slate-900/30 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-400">
        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Pour la sécurité de l&apos;établissement, les comptes <strong>Enseignant</strong> et <strong>Parent</strong> feront l&apos;objet d&apos;une validation de la part de la direction avant d&apos;accéder aux dossiers.
        </p>
      </div>

      {/* Login link */}
      <div className="mt-8 text-center text-sm text-slate-400 font-medium">
        Vous avez déjà un compte ?{" "}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold transition-colors">
          Se connecter
        </Link>
      </div>
    </div>
  )
}
