import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  subtitle?: string
  trend?: {
    value: string
    isPositive: boolean
  }
}

export default function KpiCard({ title, value, icon: Icon, subtitle, trend }: KpiCardProps) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out">
      <CardContent className="p-6 flex items-center space-x-4">
        <div className="p-3 bg-primary/10 text-primary rounded-xl flex-shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <p className="text-sm font-medium text-muted-foreground whitespace-normal leading-tight">{title}</p>
          <div className="flex flex-wrap items-baseline gap-x-2 mt-1">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-text truncate">{value}</h3>
            {trend && (
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
