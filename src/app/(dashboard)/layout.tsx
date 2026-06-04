'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useSchoolStore } from '@/store/useSchoolStore'
import { AlertTriangle, Lock, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentUser, setCurrentUser, ecole, ecoleId, initializeAnneesScolaires, fetchSupabaseData } = useSchoolStore()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Écouter la fin de l'hydratation de Zustand pour éviter les faux-positifs
    const unsubFinishHydration = useSchoolStore.persist.onFinishHydration(() => setHasHydrated(true))
    setHasHydrated(useSchoolStore.persist.hasHydrated())

    return () => {
      unsubFinishHydration()
    }
  }, [])

  // Réinitialiser le chargement uniquement si l'utilisateur ou l'école active change
  useEffect(() => {
    if (hasHydrated) {
      setIsInitialFetchDone(false)
    }
  }, [hasHydrated, currentUser?.id, ecoleId])

  useEffect(() => {
    if (hasHydrated && !isInitialFetchDone) {
      if (pathname.startsWith('/ecoles')) {
        setIsInitialFetchDone(true)
        return
      }
      initializeAnneesScolaires()
      fetchSupabaseData().then(() => {
        setIsInitialFetchDone(true)
      })
    }
  }, [hasHydrated, isInitialFetchDone, pathname, initializeAnneesScolaires, fetchSupabaseData])

  // Synchroniser lastRole dans sessionStorage dès que l'utilisateur est chargé
  useEffect(() => {
    if (hasHydrated && currentUser) {
      sessionStorage.setItem('lastRole', currentUser.role)
    }
  }, [hasHydrated, currentUser])

  useEffect(() => {
    // Si l'hydratation est terminée et que le state est toujours vide
    if (hasHydrated && !currentUser) {
      // Garantir l'effacement du cookie de session locale
      setCurrentUser(null)
      // On efface le cookie et on retourne au login
      supabase.auth.signOut().then(() => {
        if (pathname.startsWith('/login')) return // Already redirecting
        
        const lastRole = typeof window !== 'undefined' ? sessionStorage.getItem('lastRole') : null
        
        if (lastRole === 'enseignant') {
          router.push('/login/enseignant')
        } else if (lastRole === 'parent') {
          router.push('/login/parent')
        } else {
          router.push('/login')
        }
      })
    }
  }, [currentUser, hasHydrated, router, supabase, setCurrentUser, pathname])

  useEffect(() => {
    if (hasHydrated && currentUser && isInitialFetchDone && !ecoleId && !pathname.startsWith('/ecoles')) {
      router.push('/ecoles')
    }
  }, [hasHydrated, currentUser, isInitialFetchDone, ecoleId, router, pathname])

  // Évite les erreurs d'hydratation et le rendu d'une page vide sans redirection
  // Si nous sommes sur la page de choix des écoles, nous ne bloquons pas l'affichage par fetchSupabaseData
  const shouldWaitFetch = !pathname.startsWith('/ecoles')
  if (!hasHydrated || !currentUser || (shouldWaitFetch && !isInitialFetchDone)) {
    const isEcolesPath = pathname.startsWith('/ecoles')
    return (
      <div className={`h-screen w-full flex items-center justify-center ${isEcolesPath ? 'bg-slate-900 text-slate-400' : 'bg-background'}`}>
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isEcolesPath ? 'border-emerald-500' : 'border-primary'}`}></div>
      </div>
    )
  }

  // --- SUBSCRIPTION GUARD ---
  // On vérifie le statut de l'abonnement et la date de fin temporelle d'expiration
  const isAbonnementInvalide = ecole?.abonnement && (
    ['expire', 'suspendu'].includes(ecole.abonnement.statut) ||
    (ecole.abonnement.dateFin && new Date(ecole.abonnement.dateFin) < new Date())
  )
  
  // Si le Directeur ou l'utilisateur est sur la page d'abonnement, on ne bloque pas pour permettre le renouvellement
  const isPageAbonnement = pathname.startsWith('/abonnement')
  
  if (isAbonnementInvalide && !isPageAbonnement && currentUser.role !== 'directeur') {
    const isExpired = ecole.abonnement?.statut === 'expire' || (ecole.abonnement?.dateFin && new Date(ecole.abonnement.dateFin) < new Date())
    
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-border">
          <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Accès Suspendu</h1>
            <p className="text-sm text-slate-600">
              L&apos;abonnement de votre établissement (<span className="font-semibold">{ecole.nom}</span>) est actuellement 
              <span className="text-red-500 font-bold ml-1">{isExpired ? 'expiré' : 'suspendu'}</span>.
            </p>
            
            <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-xs w-full flex items-start gap-3 mt-2">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-left">
                L&apos;accès à l&apos;espace de gestion et aux espaces parents/enseignants est restreint jusqu&apos;au renouvellement de la souscription.
              </p>
            </div>

            <div className="pt-4 w-full">
              <p className="text-xs text-slate-500 mb-3">Veuillez contacter la direction de l'établissement pour plus d'informations.</p>
              <button 
                onClick={() => {
                  const role = currentUser?.role
                  supabase.auth.signOut().then(() => {
                    setCurrentUser(null) // Nettoyer l'état Zustand et le cookie currentUser
                    if (role === 'enseignant') {
                      router.push('/login/enseignant')
                    } else if (role === 'parent') {
                      router.push('/login/parent')
                    } else {
                      router.push('/login')
                    }
                  })
                }}
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (pathname.startsWith('/ecoles')) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar className="hidden md:flex w-64" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        {/* Bandeau d'abonnement expiré persistant pour le Directeur */}
        {isAbonnementInvalide && currentUser.role === 'directeur' && (
          <div className="bg-red-600 text-white py-2.5 px-6 text-xs font-bold flex items-center justify-between gap-4 border-b border-red-700 shadow-md shrink-0">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
              <span>Votre abonnement GestScol a expiré. Vous êtes en mode <strong>Lecture Seule</strong>. La création, modification et suppression de données sont inactives.</span>
            </span>
            <button 
              onClick={() => window.location.href = '/abonnement'}
              className="bg-white hover:bg-slate-50 text-red-700 px-3 py-1.5 rounded-lg border-none shadow-sm transition-all font-semibold shrink-0"
            >
              Renouveler mon abonnement
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
