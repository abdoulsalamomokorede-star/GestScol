'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const { currentUser, setCurrentUser, ecole, initializeAnneesScolaires, fetchSupabaseData } = useSchoolStore()
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

  useEffect(() => {
    if (hasHydrated) {
      initializeAnneesScolaires()
      fetchSupabaseData().then(() => {
        setIsInitialFetchDone(true)
      })
    }
  }, [hasHydrated, initializeAnneesScolaires, fetchSupabaseData])

  useEffect(() => {
    // Si l'hydratation est terminée et que le state est toujours vide
    if (hasHydrated && !currentUser) {
      // On efface le cookie et on retourne au login
      supabase.auth.signOut().then(() => {
        const path = window.location.pathname
        if (path.startsWith('/login')) return // Already redirecting
        
        if (path.startsWith('/enseignant')) {
          router.push('/login/enseignant')
        } else if (path.startsWith('/parent')) {
          router.push('/login/parent')
        } else {
          router.push('/login')
        }
      })
    }
  }, [currentUser, hasHydrated, router, supabase])

  // Évite les erreurs d'hydratation et le rendu d'une page vide sans redirection
  if (!hasHydrated || !currentUser || !isInitialFetchDone) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // --- SUBSCRIPTION GUARD ---
  // On vérifie le statut de l'abonnement
  const isAbonnementInvalide = ecole?.abonnement && ['expire', 'suspendu'].includes(ecole.abonnement.statut)
  
  if (isAbonnementInvalide) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-border">
          <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Accès Suspendu</h1>
            <p className="text-sm text-slate-600">
              L'abonnement de votre établissement (<span className="font-semibold">{ecole.nom}</span>) est actuellement 
              <span className="text-red-500 font-bold ml-1">{ecole.abonnement?.statut === 'expire' ? 'expiré' : 'suspendu'}</span>.
            </p>
            
            <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-xs w-full flex items-start gap-3 mt-2">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-left">
                L'accès à l'espace de gestion et aux espaces parents/enseignants est restreint jusqu'au renouvellement de la souscription.
              </p>
            </div>

            {currentUser.role === 'directeur' ? (
              <div className="pt-4 w-full">
                <p className="text-xs text-slate-500 mb-3">Veuillez régulariser la situation pour restaurer l'accès.</p>
                <button className="w-full py-2.5 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Renouveler l'abonnement
                </button>
              </div>
            ) : (
              <div className="pt-4 w-full">
                <p className="text-xs text-slate-500 mb-3">Veuillez contacter la direction de l'établissement pour plus d'informations.</p>
                <button 
                  onClick={() => {
                    supabase.auth.signOut().then(() => {
                      setCurrentUser(null) // Nettoyer l'état Zustand et le cookie currentUser
                      const path = window.location.pathname
                      if (path.startsWith('/enseignant')) {
                        router.push('/login/enseignant')
                      } else if (path.startsWith('/parent')) {
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
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar className="hidden md:flex w-64" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
