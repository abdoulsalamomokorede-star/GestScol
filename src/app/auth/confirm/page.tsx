'use client'

import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchUserProfile } from '@/app/actions/register'
import { useSchoolStore } from '@/store/useSchoolStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2, KeyRound } from 'lucide-react'
import logoImg from '@/app/logo.png'
import Link from 'next/link'

function ConfirmPageContent() {
  const searchParams = useSearchParams()
  const { setCurrentUser } = useSchoolStore()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  const handleConfirm = () => {
    if (!tokenHash || !type) {
      setError("Les paramètres de confirmation sont manquants ou invalides.")
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { data, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any
        })

        if (otpError) {
          setError(otpError.message || "Une erreur est survenue lors de la confirmation du compte.")
          return
        }

        const authUser = data.user
        if (!authUser) {
          setError("Utilisateur introuvable après confirmation.")
          return
        }

        const result = await fetchUserProfile(authUser.id)
        if (result.success && result.user) {
          setSuccess(true)
          
          // Connecte l'utilisateur en mettant à jour le store Zustand et le cookie currentUser
          setCurrentUser(result.user)

          // Détermine la redirection appropriée selon le rôle de l'utilisateur
          let redirectUrl = '/ecoles'
          if (result.user.role === 'parent') {
            redirectUrl = '/parent/dashboard'
          } else if (result.user.role === 'enseignant') {
            redirectUrl = '/enseignant/dashboard'
          } else if (result.user.role === 'directeur') {
            if (result.user.ecoleId || result.user.ecoleCouranteId) {
              redirectUrl = '/dashboard'
            } else {
              redirectUrl = '/ecoles'
            }
          }

          // Si une redirection spécifique était passée dans l'URL (Next), l'utiliser en priorité
          const finalRedirect = next || redirectUrl

          // Redirection après 3 secondes de célébration visuelle
          setTimeout(() => {
            window.location.href = finalRedirect
          }, 3000)
        } else {
          setError(result.error || "Une erreur est survenue lors de la récupération de votre profil.")
        }
      } catch (err: any) {
        setError(err.message || "Une erreur inattendue est survenue.")
      }
    })
  }

  // Si aucun paramètre n'est fourni, afficher immédiatement une erreur
  if (!tokenHash || !type) {
    return (
      <Card className="w-full max-w-md shadow-2xl border-rose-100/50 dark:border-rose-900/10 text-center">
        <CardHeader className="space-y-2 pb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500">
            <XCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Lien Invalide
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Ce lien de confirmation ne contient pas les identifiants requis.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Veuillez utiliser le lien complet envoyé dans votre e-mail d'inscription, ou connectez-vous si votre compte est déjà actif.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 w-full">
          <Button asChild className="w-full bg-primary hover:bg-emerald-700 text-white font-bold">
            <Link href="/login">Connexion Directeur</Link>
          </Button>
          <div className="flex gap-2 w-full justify-between mt-1">
            <Button asChild variant="outline" className="flex-1 text-xs py-4">
              <Link href="/login/enseignant">Espace Enseignant</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 text-xs py-4">
              <Link href="/login/parent">Espace Parent</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-slate-100/50 dark:border-slate-800/50 text-center bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl transition-all duration-300">
      <CardHeader className="space-y-2 pb-6">
        {success ? (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 animate-bounce">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        ) : error ? (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500">
            <XCircle className="h-8 w-8" />
          </div>
        ) : (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-7 w-7" />
          </div>
        )}

        <CardTitle className="text-2xl font-bold font-display text-slate-900 dark:text-white">
          {success ? "Compte validé !" : error ? "Activation échouée" : "Confirmer votre compte"}
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          {success 
            ? "Félicitations, votre accès est maintenant actif." 
            : error 
              ? "Impossible de valider votre inscription."
              : "Finalisez la création de votre profil GestScol."
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        {success ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Votre compte GestScol a été activé avec succès. Vous allez être redirigé vers votre espace personnel dans quelques secondes.
          </p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Le jeton de sécurité est invalide, expiré ou a déjà été consommé par votre messagerie.
            </p>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-md text-xs text-rose-600 dark:text-rose-400 text-start font-mono break-all">
              Erreur : {error}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Pour empêcher les robots et les filtres de messagerie d'activer votre compte prématurément, veuillez cliquer sur le bouton ci-dessous pour confirmer votre e-mail et vous connecter.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {!success && !error && (
          <Button 
            onClick={handleConfirm} 
            disabled={isPending}
            className="w-full bg-primary hover:bg-emerald-700 text-white font-bold py-6 text-base shadow-lg shadow-emerald-500/20 dark:shadow-none transition-all duration-200"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Vérification du code...
              </>
            ) : (
              "Confirmer mon compte"
            )}
          </Button>
        )}

        {error && (
          <div className="flex flex-col gap-2 w-full">
            <Button asChild className="w-full bg-primary hover:bg-emerald-700 text-white font-bold py-5">
              <Link href="/login">Retourner à la connexion Directeur</Link>
            </Button>
            <div className="flex gap-2 w-full justify-between mt-1">
              <Button asChild variant="outline" className="flex-1 text-xs py-4">
                <Link href="/login/enseignant">Espace Enseignant</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 text-xs py-4">
                <Link href="/login/parent">Espace Parent</Link>
              </Button>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-405 font-medium py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirection automatique...
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

function ConfirmLoadingFallback() {
  return (
    <Card className="w-full max-w-md shadow-2xl border-slate-100/50 dark:border-slate-800/50 text-center bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl">
      <CardHeader className="space-y-4 pb-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <CardTitle className="text-xl font-bold font-display text-slate-900 dark:text-white">
          Chargement de la session
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Veuillez patienter pendant le chargement des clés de sécurité de votre compte...
        </p>
      </CardContent>
    </Card>
  )
}

export default function ConfirmPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-850 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Brand header */}
      <div className="flex flex-col items-center mb-8 animate-fadeIn">
        <img src={logoImg.src} alt="GestScol Logo" className="h-14 w-auto object-contain mb-3" />
        <h1 className="text-2xl font-display font-extrabold text-white tracking-wide">GestScol</h1>
      </div>

      <div className="w-full max-w-md animate-scaleIn">
        <Suspense fallback={<ConfirmLoadingFallback />}>
          <ConfirmPageContent />
        </Suspense>
      </div>

      {/* Footer copyright */}
      <div className="text-xs text-slate-500 text-center mt-12">
        <p>© {new Date().getFullYear()} GestScol. Tous droits réservés.</p>
      </div>
    </div>
  )
}
