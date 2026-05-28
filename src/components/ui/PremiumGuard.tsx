'use client'

import Link from 'next/link'
import { Zap, Shield, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PremiumGuardProps {
  title: string
  description: string
}

export function PremiumGuard({ title, description }: PremiumGuardProps) {
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full text-amber-600 mb-2">
          <Zap className="h-10 w-10 fill-amber-500 animate-pulse" />
        </div>
        <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Fonctionnalité Premium
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-sans">
          Le module <strong className="text-primary font-bold">{title}</strong> n'est pas disponible dans la formule gratuite.
        </p>
      </div>

      <Card className="border-2 border-primary/20 shadow-xl bg-white overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Shield className="h-48 w-48 text-primary" />
        </div>
        
        <CardContent className="p-8 sm:p-10 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h3 className="text-xl font-display font-bold text-slate-900">
                Passez au niveau supérieur avec GestScol
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                {description} Pour débloquer ce module ainsi que l'accès enseignant/parent, la gestion complète des absences, des notes et l'impression des bulletins officiels conformes, souscrivez à l'un de nos abonnements.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <p className="text-sm text-slate-700 font-sans">
                    <strong className="font-semibold">Espace Enseignant & Parent</strong> : Permettez aux enseignants de saisir leurs notes et aux parents de suivre la scolarité en temps réel.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <p className="text-sm text-slate-700 font-sans">
                    <strong className="font-semibold">Gestion Pédagogique Intégrale</strong> : Saisie des absences, calcul des moyennes pondérées par coefficient et classement automatique.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <p className="text-sm text-slate-700 font-sans">
                    <strong className="font-semibold">Bulletins Trimestriels PDF</strong> : Génération instantanée et impression de bulletins officiels élégants en un clic.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Offre Recommandée</span>
                <h4 className="text-2xl font-display font-extrabold text-slate-900 mt-1">Formule Standard</h4>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-4xl font-extrabold tracking-tight text-primary">150 000</span>
                  <span className="ml-1 text-xl font-semibold text-slate-500">FCFA / an</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Sans frais cachés, idéal pour les écoles primaires et secondaires</p>
              </div>

              <Link href="/abonnement" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-6 rounded-xl shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4 fill-white" />
                  Activer mon abonnement
                </Button>
              </Link>
              
              <Link href="/support" className="text-xs text-slate-500 hover:text-primary transition-colors hover:underline">
                Besoin de conseils ? Contacter un conseiller GestScol
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
