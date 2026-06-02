'use client'

import { EcoleAvecRole } from '@/types'
import { Building2, Trash2, MapPin, Users, BookOpen, ChevronRight, School } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CarteEcoleProps {
  ecole: EcoleAvecRole
  role: 'directeur' | 'enseignant' | 'parent'
  onAcceder: (ecoleId: string) => void
  onSupprimer?: (ecoleId: string) => void
}

export default function CarteEcole({ ecole, role, onAcceder, onSupprimer }: CarteEcoleProps) {
  // Styles de boutons en fonction du rôle
  const btnStyles = {
    directeur: "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500/20",
    enseignant: "bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500/20",
    parent: "bg-amber-500 hover:bg-amber-600 text-slate-950 focus:ring-amber-500/20"
  }

  const levelsTranslate = {
    prescolaire: "Préscolaire",
    primaire: "Primaire",
    secondaire: "Secondaire"
  }

  return (
    <div className="bg-slate-950/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-slate-700 hover:shadow-xl hover:shadow-emerald-950/10 flex flex-col justify-between h-[280px]">
      <div>
        {/* Header de la carte */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              {ecole.logo ? (
                <img src={ecole.logo} alt={ecole.nom} className="h-full w-full object-cover" />
              ) : (
                <School className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-100 line-clamp-2 leading-snug">{ecole.nom}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{ecole.ville}{ecole.adresse ? `, ${ecole.adresse}` : ''}</span>
              </div>
            </div>
          </div>
          
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full shrink-0">
            {ecole.anneeScolaire}
          </span>
        </div>

        {/* Niveaux enseignés */}
        <div className="flex flex-wrap gap-1 mt-4">
          {ecole.niveaux?.map((lvl) => (
            <span key={lvl} className="text-[9px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/80">
              {levelsTranslate[lvl] || lvl}
            </span>
          ))}
        </div>

        {/* Enfants associés (Parent) */}
        {role === 'parent' && ecole.prenomsEnfants && ecole.prenomsEnfants.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {ecole.prenomsEnfants.map((p, i) => (
              <span key={i} className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                Enfant: {p}
              </span>
            ))}
          </div>
        )}

      </div>

      {/* Statistiques en bas de carte */}
      {role === 'directeur' && (
        <div className="border-t border-slate-900/60 pt-4 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span><strong>{ecole.nbEleves ?? 0}</strong> élèves</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-slate-500" />
              <span><strong>{ecole.nbClasses ?? 0}</strong> classes</span>
            </div>
          </div>

          {ecole.tauxRecouvrement !== undefined && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded">
              {ecole.tauxRecouvrement}% recouvrement
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          onClick={() => onAcceder(ecole.id)}
          className={`flex-1 font-bold text-xs rounded-xl py-2.5 flex items-center justify-center gap-1 shadow-md transition-all duration-200 ${btnStyles[role] || 'bg-slate-700 hover:bg-slate-600 text-white'}`}
        >
          Accéder à l&apos;établissement <ChevronRight className="h-4 w-4" />
        </Button>

        {role === 'directeur' && onSupprimer && (
          <Button
            variant="destructive"
            onClick={() => onSupprimer(ecole.id)}
            className="h-10 w-10 shrink-0 bg-rose-950/20 text-rose-500 border border-rose-900/30 hover:bg-rose-950/40 rounded-xl flex items-center justify-center transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
