import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const hasUserSession = request.cookies.has('currentUser')
  const isAuthenticated = !!user && hasUserSession

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isPublicPage = pathname === '/' || isAuthPage
  const isEcolesPage = pathname === '/ecoles'

  if (!isAuthenticated && !isPublicPage && !isEcolesPage) {
    // Rediriger vers login si non connecté et page privée
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated) {
    try {
      // Récupérer le rôle, l'école d'origine et la dernière école sélectionnée (école courante)
      const { data: profile } = await supabase
        .from('utilisateurs')
        .select('role, ecole_id, ecole_courante_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        const role = profile.role
        const ecoleId = profile.ecole_courante_id || profile.ecole_id

        // Si on est connecté et qu'on essaie d'aller sur une page d'auth ou la landing page
        if (isAuthPage || pathname === '/') {
          if (ecoleId) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          } else {
            return NextResponse.redirect(new URL('/ecoles', request.url))
          }
        }

        // Si on essaie d'aller sur le dashboard ou les pages de l'école alors qu'on n'a pas sélectionné d'école
        const isSchoolRequiredPage = 
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/parent') ||
          pathname.startsWith('/enseignant') ||
          pathname.startsWith('/eleves') ||
          pathname.startsWith('/classes') ||
          pathname.startsWith('/matieres') ||
          pathname.startsWith('/enseignants') ||
          pathname.startsWith('/notes') ||
          pathname.startsWith('/bulletins') ||
          pathname.startsWith('/paiements') ||
          pathname.startsWith('/absences') ||
          pathname.startsWith('/support') ||
          pathname.startsWith('/aide') ||
          pathname.startsWith('/parametres') ||
          pathname.startsWith('/notifications') ||
          pathname.startsWith('/profil')

        if (isSchoolRequiredPage && !ecoleId) {
          return NextResponse.redirect(new URL('/ecoles', request.url))
        }

        // Matrice d'isolation par rôle (RBAC)
        if (role === 'parent') {
          // Un parent n'a aucun droit d'accès aux pages administratives, gestion d'élèves, classes ou appel/notes
          // Mais il doit pouvoir accéder à la fiche dossier de ses enfants : /eleves/[id] et voir le récapitulatif des absences
          const isElevesList = pathname === '/eleves' || pathname === '/eleves/'
          if (
            isElevesList ||
            pathname.startsWith('/classes') ||
            pathname.startsWith('/matieres') ||
            pathname.startsWith('/enseignants') ||
            pathname.startsWith('/parametres') ||
            pathname.startsWith('/inscriptions') ||
            pathname.startsWith('/notes')
          ) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        } else if (role === 'enseignant') {
          // Un enseignant n'a aucun droit d'accès aux pages financières, bulletins globaux, ou configurations d'école
          if (
            pathname.startsWith('/eleves') ||
            pathname.startsWith('/classes') ||
            pathname.startsWith('/matieres') ||
            pathname.startsWith('/enseignants') ||
            pathname.startsWith('/parametres') ||
            pathname.startsWith('/inscriptions') ||
            pathname.startsWith('/paiements') ||
            pathname.startsWith('/bulletins')
          ) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        }
      }
    } catch (dbErr) {
      console.error("Erreur de récupération du profil de rôle dans proxy.ts :", dbErr)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
