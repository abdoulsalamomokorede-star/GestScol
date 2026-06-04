'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSchoolStore } from '@/store/useSchoolStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import logoImg from '@/app/logo.png'
import { LogOut, Plus, RefreshCw, School, Users, GraduationCap, Shield, Loader2 } from 'lucide-react'
import CarteEcole from '@/components/ecoles/CarteEcole'
import EcoleFormModal from '@/components/ecoles/EcoleFormModal'
import ConfirmSuppressionEcole from '@/components/ecoles/ConfirmSuppressionEcole'
import { EcoleAvecRole } from '@/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { rejoindreEcoleViaCode } from '@/app/actions/register'

export default function EcolesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentUser, setCurrentUser, fetchEcolesUtilisateur, ajouterEcole, supprimerEcole, setEcoleCourante } = useSchoolStore()
  const supabase = createClient()

  const [ecoles, setEcoles] = useState<EcoleAvecRole[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [supprTarget, setSupprTarget] = useState<{ id: string; nom: string } | null>(null)

  // Spécifique aux enseignants : États pour rejoindre une école via code
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  // Spécifique aux parents : Liste des prénoms d'enfants par école
  const [enfantsParEcole, setEnfantsParEcole] = useState<Record<string, string[]>>({})

  // Rejoindre une école
  const handleRejoindreEcole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setIsJoining(true)
    try {
      const res = await rejoindreEcoleViaCode(inviteCode)
      if (!res.success) {
        toast({
          title: "Erreur de rattachement",
          description: res.error || "Impossible de rejoindre l'établissement avec ce code.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Établissement rejoint !",
        description: "Vous faites désormais partie de l'équipe pédagogique.",
        className: "bg-success text-white border-none shadow-lg"
      })
      
      setInviteCode('')
      setIsInviteModalOpen(false)
      chargerEcoles()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  // Charger les écoles de l'utilisateur
  const chargerEcoles = async () => {
    setLoading(true)
    try {
      const data = await fetchEcolesUtilisateur()
      setEcoles(data)

      // Si l'utilisateur est un parent, on va charger ses enfants associés pour afficher leurs prénoms dans les cartes
      if (currentUser?.role === 'parent' && currentUser?.email) {
        const { data: eleves } = await supabase
          .from('eleves')
          .select('id, prenom, ecole_id')
          .or(`parent_email.ilike.${currentUser.email},parent_user_id.eq.${currentUser.id}`)

        if (eleves && eleves.length > 0) {
          const eleveIds = eleves.map(e => e.id)
          
          // Récupérer les inscriptions pour ces élèves
          const { data: inscriptions } = await supabase
            .from('inscriptions')
            .select('eleve_id, annee_scolaire, statut')
            .in('eleve_id', eleveIds)
            .eq('statut', 'validee')
            
          // Récupérer les années scolaires actives
          const { data: anneesScolaires } = await supabase
            .from('annees_scolaires')
            .select('id, statut, ecole_id')
            .eq('statut', 'active')
            
          const mapping: Record<string, string[]> = {}
          
          eleves.forEach((el) => {
            const activeAnnee = anneesScolaires?.find(a => a.ecole_id === el.ecole_id)
            if (!activeAnnee) return
            
            const hasInscription = inscriptions?.some(
              ins => ins.eleve_id === el.id && 
                     ins.annee_scolaire === activeAnnee.id && 
                     ins.statut === 'validee'
            )
            
            if (hasInscription) {
              if (!mapping[el.ecole_id]) {
                mapping[el.ecole_id] = []
              }
              mapping[el.ecole_id].push(el.prenom)
            }
          })
          setEnfantsParEcole(mapping)
        }
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger vos établissements.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const isConnected = typeof document !== 'undefined' && document.cookie.includes('currentUser=true')
    
    if (!isConnected && !currentUser) {
      router.push('/login')
      return
    }

    if (currentUser?.id) {
      chargerEcoles()
    }
  }, [currentUser?.id])

  // Déconnexion
  const handleSignOut = async () => {
    const role = currentUser?.role
    await supabase.auth.signOut()
    setCurrentUser(null)
    if (role === 'enseignant') {
      router.push('/login/enseignant')
    } else if (role === 'parent') {
      router.push('/login/parent')
    } else {
      router.push('/login')
    }
  }

  // Sélectionner une école
  const handleAccederEcole = async (ecoleId: string) => {
    await setEcoleCourante(ecoleId)
    toast({
      title: "Établissement sélectionné !",
      description: "Chargement de votre espace de travail...",
      variant: "default"
    })
    if (currentUser?.role === 'parent') {
      router.push('/parent/dashboard')
    } else if (currentUser?.role === 'enseignant') {
      router.push('/enseignant/dashboard')
    } else {
      router.push('/dashboard')
    }
  }

  // Ajouter une école
  const handleAjouterEcole = async (donnees: any) => {
    const res = await ajouterEcole(donnees)
    if (!res.success) {
      toast({
        title: "Erreur",
        description: res.error || "Impossible de créer l'école.",
        variant: "destructive"
      })
      return
    }
    toast({
      title: "Succès !",
      description: "L'école a bien été créée avec ses paramètres de base.",
      variant: "default"
    })
    chargerEcoles()
  }

  // Supprimer une école
  const handleSupprimerEcole = async (ecoleId: string) => {
    const res = await supprimerEcole(ecoleId)
    if (!res.success) {
      toast({
        title: "Erreur",
        description: res.error || "Impossible de supprimer l'établissement.",
        variant: "destructive"
      })
      return
    }
    toast({
      title: "Suppression validée",
      description: "L'école et toutes ses données en cascade ont été purgées.",
      variant: "default"
    })
    chargerEcoles()
  }

  // Rendu de skeleton loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin" />
          <p className="text-xs uppercase tracking-widest font-bold">Chargement des établissements...</p>
        </div>
      </div>
    )
  }

  // Badges de rôle pour le header
  const roleBadges = {
    directeur: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    enseignant: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    parent: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  }

  const roleNames = {
    directeur: "Directeur",
    enseignant: "Enseignant",
    parent: "Parent d'élève"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Header standalone */}
      <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImg.src} alt="GestScol Logo" className="h-9 w-auto object-contain" />
          <span className="font-extrabold text-lg tracking-wider text-slate-100 hidden sm:inline-block">GestScol</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium hidden sm:inline-block">
              {currentUser?.prenom} {currentUser?.nom}
            </span>
            <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${roleBadges[currentUser?.role || 'directeur']}`}>
              {roleNames[currentUser?.role || 'directeur']}
            </span>
          </div>

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 rounded-xl px-3 flex items-center gap-1 text-xs"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Se déconnecter</span>
          </Button>
        </div>
      </header>

      {/* Corps principal */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 md:px-12 py-12">
        {/* Intro */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100">
              {currentUser?.role === 'parent' ? "Établissements de mes enfants" : "Mes établissements"}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1.5 font-medium">
              {currentUser?.role === 'directeur' && "Sélectionnez ou créez un établissement pour accéder à sa console de gestion."}
              {currentUser?.role === 'enseignant' && "Établissements scolaires dans lesquels vous êtes actuellement affecté."}
              {currentUser?.role === 'parent' && "Consultez la scolarité, les relevés de notes et l&apos;assiduité de vos enfants."}
            </p>
          </div>

          {currentUser?.role === 'directeur' && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 self-start md:self-auto"
            >
              <Plus className="h-4 w-4" /> Créer un établissement
            </Button>
          )}

          {currentUser?.role === 'enseignant' && (
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 self-start md:self-auto shadow-md"
            >
              <Plus className="h-4 w-4" /> Rejoindre un établissement via code
            </Button>
          )}
        </div>

        {/* Liste des cartes écoles */}
        {ecoles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ecoles.map((ecole) => {
              // Injecter le prénom de ses enfants si le rôle est Parent
              const mappedEcole = { ...ecole }
              if (currentUser?.role === 'parent') {
                const prénomsEnfants = enfantsParEcole[ecole.id] || []
                mappedEcole.nbEleves = prénomsEnfants.length // Remplacer par le nombre de ses enfants
                mappedEcole.prenomsEnfants = prénomsEnfants
              }

              return (
                <div key={ecole.id} className="relative group">
                  <CarteEcole
                    ecole={mappedEcole}
                    role={currentUser?.role || 'directeur'}
                    onAcceder={handleAccederEcole}
                    onSupprimer={(id) => setSupprTarget({ id, nom: ecole.nom })}
                  />
                </div>
              )
            })}

            {currentUser?.role === 'directeur' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-slate-950/20 hover:bg-slate-900/20 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl h-[280px] flex flex-col items-center justify-center gap-3 transition-all duration-300 text-slate-400 hover:text-slate-300"
              >
                <div className="p-4 bg-slate-900/60 rounded-full">
                  <Plus className="h-6 w-6 text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Créer une école</p>
                  <p className="text-[11px] text-slate-500 mt-1">Configurez une nouvelle filiale en un clic.</p>
                </div>
              </button>
            )}
          </div>
        ) : (
          /* État vide */
          <div className="flex flex-col items-center justify-center bg-slate-950/20 border border-slate-800/80 rounded-2xl p-12 text-center py-20">
            <div className="h-16 w-16 bg-slate-900 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <School className="h-8 w-8" />
            </div>
            
            {currentUser?.role === 'directeur' ? (
              <>
                <h3 className="text-lg font-bold">Aucun établissement créé</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                  Vous n&apos;avez pas encore configuré d&apos;école sur votre compte GestScol. Créez votre premier établissement pour commencer à inscrire vos élèves.
                </p>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs mt-6 px-6 py-2.5 rounded-xl"
                >
                  Créer mon premier établissement
                </Button>
              </>
            ) : currentUser?.role === 'enseignant' ? (
              <>
                <h3 className="text-lg font-bold">Aucune assignation d&apos;école</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed flex items-center gap-1.5 justify-center">
                  <GraduationCap className="h-4.5 w-4.5 text-blue-400 shrink-0" />
                  Aucune école ne vous a encore assigné à ses classes. Contactez le directeur de votre établissement.
                </p>
                <Button
                  onClick={chargerEcoles}
                  className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs mt-6 rounded-xl flex items-center gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" /> Rafraîchir
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold">Aucune école liée</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed flex items-center gap-1.5 justify-center">
                  <Users className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  Aucun établissement n&apos;est actuellement lié à votre adresse e-mail. Veuillez contacter l&apos;école.
                </p>
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3.5 mt-4 text-[11px] text-amber-400 text-left w-full max-w-md">
                  <strong>Adresse e-mail active :</strong> {currentUser?.email}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Modale d'ajout d'école (Directeur) */}
      <EcoleFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAjouterEcole}
      />

      {/* Modale de confirmation de suppression */}
      {supprTarget && (
        <ConfirmSuppressionEcole
          isOpen={!!supprTarget}
          ecoleId={supprTarget.id}
          ecoleNom={supprTarget.nom}
          onClose={() => setSupprTarget(null)}
          onConfirm={handleSupprimerEcole}
        />
      )}

      {/* Modale de rattachement via code (Enseignant) */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <School className="h-5.5 w-5.5 text-blue-400" />
              Rejoindre un établissement
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Saisissez le code d&apos;invitation à 8 caractères fourni par le Directeur pour lier votre compte enseignant à son école.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRejoindreEcole} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Code d&apos;invitation :
              </label>
              <Input
                placeholder="Ex: AB12CD34"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="bg-slate-950 border-slate-800 text-slate-100 text-center font-extrabold text-sm tracking-widest uppercase py-5 rounded-xl placeholder:tracking-normal placeholder:font-medium"
                maxLength={10}
                required
              />
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setInviteCode('')
                  setIsInviteModalOpen(false)
                }}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs font-bold"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isJoining || !inviteCode.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {isJoining ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Confirmer le code
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
