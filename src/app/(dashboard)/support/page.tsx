'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useToast } from '@/hooks/use-toast'
import {
  LifeBuoy,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Send,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PremiumGuard } from '@/components/ui/PremiumGuard'

interface FaqItem {
  question: string
  answer: string
}

export default function SupportPage() {
  const router = useRouter()
  const { currentUser, ecole } = useSchoolStore()
  const { toast } = useToast()

  // États du formulaire
  const [sujet, setSujet] = useState('')
  const [description, setDescription] = useState('')
  const [priorite, setPriorite] = useState<'normale' | 'urgente'>('normale')
  const [loading, setLoading] = useState(false)

  // État de la FAQ
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  // Redirection si l'établissement utilise la formule gratuite
  if (ecole?.abonnement?.plan === 'gratuit') {
    return (
      <PremiumGuard 
        title="Support & Assistance" 
        description="Obtenez de l'aide de la part de nos techniciens locaux. Soumettez des tickets d'assistance, accédez au support technique direct par WhatsApp ou téléphone, et résolvez rapidement tous vos blocages opérationnels."
      />
    )
  }

  // Redirection si ce n'est pas le directeur
  if (!currentUser || currentUser.role !== 'directeur') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-danger mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-text">Accès Interdit</h3>
          <p className="text-sm text-muted-foreground">Seul le directeur de l'établissement dispose d'un accès au support premium.</p>
        </div>
      </div>
    )
  }

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sujet.trim() || !description.trim()) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir le sujet et la description de votre demande.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    // Simulation de création de ticket
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Ticket d'assistance créé !",
        description: "Votre demande a été transmise à notre équipe de support technique. Un conseiller vous répondra sous peu.",
        variant: "default",
        className: "bg-success text-white border-none shadow-lg"
      })
      setSujet('')
      setDescription('')
      setPriorite('normale')
    }, 1500)
  }

  const faqs: FaqItem[] = [
    {
      question: "Comment exporter la liste des élèves sous format Excel ?",
      answer: "Rendez-vous dans le module 'Élèves', puis cliquez sur le bouton 'Exporter' situé en haut à droite de la table des élèves. Le fichier Excel (.xlsx) contenant l'ensemble des fiches actives sera instantanément téléchargé sur votre appareil."
    },
    {
      question: "Comment fonctionne le calcul automatique des rangs des élèves ?",
      answer: "GestScol calcule automatiquement le rang des élèves au sein d'une même classe en effectuant un classement par ordre décroissant de la moyenne pondérée de chaque élève pour un trimestre donné. En cas d'ex æquo, les élèves se voient attribuer le même rang."
    },
    {
      question: "Comment modifier le montant de la scolarité annuelle d'une classe ?",
      answer: "Accédez au module 'Paiements', puis ouvrez l'onglet 'Gestion des Scolarités' (réservé exclusivement aux directeurs). Cliquez sur 'Ajuster le tarif' à côté de la classe concernée pour mettre à jour instantanément la tarification de base pour les nouvelles inscriptions."
    },
    {
      question: "Le quota de mon abonnement est atteint, comment puis-je le surclasser ?",
      answer: "Accédez au module 'Mon Abonnement' pour consulter votre taux de consommation d'élèves. Si vous atteignez la limite (50 pour la formule Gratuite, 300 pour la Standard), vous pouvez surclasser votre offre à tout moment en cliquant sur le bouton de mise à niveau de l'offre supérieure via notre passerelle CinetPay."
    },
    {
      question: "Comment réinitialiser le mot de passe d'accès d'un enseignant ou d'un parent ?",
      answer: "Dans votre espace d'administration, rendez-vous dans le module Parametres\\Creation de Comptes, puis sous la section Comptes existants, cliquez sur 'Mot de passe' de l'utilisateur concerné pour entrer un nouveau mot de passe."
    }
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* En-tête avec titre premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-text tracking-tight flex items-center gap-3">
            <LifeBuoy className="h-8 w-8 text-primary shrink-0" />
            Support & Assistance Premium
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Bénéficiez d'une assistance technique locale et d'un accompagnement personnalisé pour votre établissement.
          </p>
        </div>

        {/* Badge de support émeraude */}
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-bold rounded-full w-fit">
          Directeur — Canal Prioritaire
        </Badge>
      </div>

      {/* Cartes de contact rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* WhatsApp */}
        <a
          href="https://wa.me/2250586037974"
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <Card className="border border-border/60 hover:border-primary/40 hover:shadow-xl transition-all duration-300 h-full bg-card relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 bg-emerald-50 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-text text-base group-hover:text-primary transition-colors">WhatsApp Assistance</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Discutez en direct avec un conseiller technique 24h/7 pour une résolution en direct.
                </p>
              </div>
              <div className="pt-2 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                <span>+225 05 86 03 79 74</span>
                <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full ml-2">En ligne</span>
              </div>
            </CardContent>
          </Card>
        </a>

        {/* Ligne Directe */}
        <a href="tel:+2250103004856" className="group block">
          <Card className="border border-border/60 hover:border-amber-500/40 hover:shadow-xl transition-all duration-300 h-full bg-card relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors" />
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Phone className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-text text-base group-hover:text-amber-600 transition-colors">Service Client local</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Contactez directement nos bureaux basés à Abidjan pour toute urgence ou question commerciale.
                </p>
              </div>
              <div className="pt-2 flex items-center text-xs font-semibold text-amber-600 gap-1 group-hover:translate-x-1 transition-transform">
                <span>+225 01 03 00 48 56</span>
              </div>
            </CardContent>
          </Card>
        </a>

        {/* Support Email */}
        <a href="mailto:support@gestscol.ci" className="group block">
          <Card className="border border-border/60 hover:border-slate-500/40 hover:shadow-xl transition-all duration-300 h-full bg-card relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-slate-500/5 rounded-bl-full group-hover:bg-slate-500/10 transition-colors" />
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Mail className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-text text-base group-hover:text-slate-800 transition-colors">Support par Email</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Envoyez vos rapports de bugs complexes ou vos demandes spécifiques de personnalisation.
                </p>
              </div>
              <div className="pt-2 flex items-center text-xs font-semibold text-slate-700 gap-1 group-hover:translate-x-1 transition-transform">
                <span>support@gestscol.ci</span>
              </div>
            </CardContent>
          </Card>
        </a>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Formulaire de Ticket de support */}
        <div className="lg:col-span-3">
          <Card className="border border-border/60 shadow-md bg-card h-full">
            <CardHeader className="p-6 border-b border-border/40">
              <CardTitle className="text-lg font-bold font-display text-text">
                Ouvrir un ticket de support technique
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Détaillez votre demande ou signalez une anomalie ci-dessous. Notre équipe d'ingénieurs s'en occupera immédiatement.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateTicket} className="space-y-5">

                {/* Métadonnées de l'établissement */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between text-xs text-slate-600">
                  <div>
                    <span className="font-semibold block text-slate-800">Établissement</span>
                    {ecole?.nom || "Groupe Scolaire Excellence"}
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-800">Directeur demandeur</span>
                    {currentUser.prenom} {currentUser.nom}
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-800">Email de contact</span>
                    {currentUser.email}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sujet" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Sujet de votre demande
                  </label>
                  <Input
                    type="text"
                    id="sujet"
                    placeholder="Ex: Demande d'ajustement du format de bulletin ou souci d'export Excel..."
                    value={sujet}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSujet(e.target.value)}
                    required
                    className="py-5 font-medium text-xs text-[#1E293B] border-slate-200 rounded-xl focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Niveau d'urgence
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setPriorite('normale')}
                      className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${priorite === 'normale'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <Clock className="h-4 w-4" />
                      Normal (Sous 24 heures)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriorite('urgente')}
                      className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${priorite === 'urgente'
                        ? 'border-danger bg-danger/5 text-danger shadow-sm animate-pulse'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      Urgent (Prioritaire — Sous 1 heure)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Description détaillée
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    placeholder="Veuillez décrire le problème rencontré ou l'ajustement souhaité. Si possible, précisez la classe ou l'élève concerné."
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    required
                    className="flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-xs font-medium text-[#1E293B] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-xl font-bold text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>Envoi du ticket...</>
                  ) : (
                    <>
                      Transmettre ma demande
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Technique Directeurs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/60 shadow-md bg-card h-full">
            <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center gap-3 space-y-0">
              <div className="h-10 w-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold font-display text-text">
                  Questions Fréquentes (FAQ)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Sélection de réponses rapides aux questions de gestion courantes.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx
                  return (
                    <div
                      key={idx}
                      className="border-b border-slate-100 pb-3.5 last:border-0 last:pb-0"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left gap-3 text-xs font-bold text-slate-800 hover:text-primary transition-colors focus:outline-none py-1"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-185 text-primary' : ''}`} />
                      </button>

                      {isOpen && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed pl-1 animate-in slide-in-from-top-1 duration-200">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Box sécurité et données */}
              <div className="mt-8 bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-600">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">Sécurité des Données</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Toutes vos données scolaires et financières font l'objet d'un chiffrement de bout en bout et d'une sauvegarde automatisée quotidienne. Notre équipe technique n'a accès à vos données que sur demande explicite pour des fins de maintenance ou d'assistance.
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
