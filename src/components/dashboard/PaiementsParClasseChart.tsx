'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCFA } from "@/lib/utils"
import { Classe, Eleve, Paiement, Inscription } from "@/types"
import { useTranslation } from '@/hooks/useTranslation'

interface PaiementsParClasseChartProps {
  classes: Classe[]
  eleves: Eleve[]
  paiements: Paiement[]
  inscriptions: Inscription[]
  anneeScolaire: string
}

export default function PaiementsParClasseChart({ classes, eleves, paiements, inscriptions, anneeScolaire }: PaiementsParClasseChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Calculer les données par classe
  const data = classes.map(c => {
    // Filtrer les paiements qui appartiennent à cette classe via l'inscription de l'élève
    const paiementsClasse = paiements.filter(p => {
      const pAnnee = p.anneeScolaire || anneeScolaire
      const inscription = inscriptions.find(i => i.eleveId === p.eleveId && i.anneeScolaire === pAnnee && i.statut === 'validee')
      if (inscription) {
        return inscription.classeId === c.id
      }
      // Fallback à la classe de base si aucune inscription trouvée
      const eleve = eleves.find(e => e.id === p.eleveId)
      return eleve?.classeId === c.id
    })
    
    // Calculer les montants en prenant en compte les paiements partiels
    const paye = paiementsClasse.reduce((sum, p) => sum + (p.statut === 'paye' ? Math.max(p.montant, p.montantPaye || 0) : (p.montantPaye || 0)), 0)
      
    const enAttente = paiementsClasse
      .filter(p => p.statut === 'en_attente')
      .reduce((sum, p) => sum + Math.max(0, p.montant - (p.montantPaye || 0)), 0)
      
    const enRetard = paiementsClasse
      .filter(p => p.statut === 'retard')
      .reduce((sum, p) => sum + Math.max(0, p.montant - (p.montantPaye || 0)), 0)

    return {
      name: c.nom,
      [t('paiements.status.paye', "Payé")]: paye,
      [t('paiements.status.en_attente', "En attente")]: enAttente,
      [t('paiements.status.retard', "En retard")]: enRetard,
      total: paye + enAttente + enRetard
    }
  }).filter(d => d.total > 0) // Ne garder que les classes avec des paiements pour cette période

  return (
    <Card className="col-span-1 md:col-span-2 shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-display text-start">{t('paiements.tariffs.title', "Statut des Paiements par Classe")}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-center">
            {t('paiements.no_payments_desc', "Aucune donnée de paiement pour la période sélectionnée")}
          </div>
        ) : (
          <div className="h-[300px] w-full mt-4">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748B' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => formatCFA(value as number)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar dataKey={t('paiements.status.paye', "Payé")} stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} maxBarSize={50} />
                  <Bar dataKey={t('paiements.status.en_attente', "En attente")} stackId="a" fill="#F59E0B" maxBarSize={50} />
                  <Bar dataKey={t('paiements.status.retard', "En retard")} stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
