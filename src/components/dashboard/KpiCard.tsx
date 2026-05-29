import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon, Lock } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  subtitle?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  isLocked?: boolean
}

export default function KpiCard({ title, value, icon: Icon, subtitle, trend, isLocked }: KpiCardProps) {
  return (
    <Card className={`border-border/50 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out relative overflow-hidden ${isLocked ? 'opacity-70 bg-slate-50/50' : ''}`}>
      <CardContent className="p-6 flex items-center space-x-4">
        <div className={`p-3 rounded-xl flex-shrink-0 ${isLocked ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
          {isLocked ? <Lock className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-muted-foreground whitespace-normal leading-tight">{title}</p>
            {isLocked && (
              <span className="text-[9px] bg-amber-500/20 text-amber-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                👑 Premium
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 mt-1">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-text truncate">
              {isLocked ? "—" : value}
            </h3>
            {trend && !isLocked && (
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {isLocked ? "Abonnement Standard requis" : subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
