'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, GraduationCap, CheckCircle2, Search, Check, ChevronsUpDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSchoolStore } from '@/store/useSchoolStore'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { PremiumGuard } from '@/components/ui/PremiumGuard'
import { useTranslation } from '@/hooks/useTranslation'

export default function AssignationsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { enseignants, classes, matieres, updateClasse, updateMatiere, ecole } = useSchoolStore()
  const { t, dir, isAr } = useTranslation()
  

  
  const enseignant = enseignants.find(e => e.id === unwrappedParams.id)
  
  if (!enseignant) {
    return (
      <div className="p-6 text-center" dir={dir}>
        <h2 className="text-xl text-danger">{t('enseignants.not_found', "Enseignant introuvable")}</h2>
        <Button className="mt-4" onClick={() => router.push('/enseignants')}>{t('action.back', "Retour")}</Button>
      </div>
    )
  }

  const [classFilter, setClassFilter] = useState('toutes')
  const [classSearchQuery, setClassSearchQuery] = useState('')
  const [isClassComboboxOpen, setIsClassComboboxOpen] = useState(false)
  const [pendingAssignment, setPendingAssignment] = useState<{ matiere: any, otherNames: string } | null>(null)

  const executeAssignation = (matiere: any, isAssigned: boolean) => {
    const currentTeachers = matiere.enseignantIds || []
    const newIds = isAssigned 
      ? [...currentTeachers, enseignant.id] 
      : currentTeachers.filter((id: string) => id !== enseignant.id)
      
    updateMatiere(matiere.id, { enseignantIds: newIds })
    
    toast({ 
      title: t('toast.update_success', "Mise à jour réussie"), 
      description: isAssigned 
        ? t('toast.subject_assigned_to', "Matière assignée à {name}").replace('{name}', `${enseignant.prenom} ${enseignant.nom}`)
        : t('toast.subject_removed_from', "Matière retirée de {name}").replace('{name}', `${enseignant.prenom} ${enseignant.nom}`)
    })
    setPendingAssignment(null)
  }

  // --- Gestion Matières ---
  const handleAssignMatiere = (matiere: any, isAssigned: boolean) => {
    const currentTeachers = matiere.enseignantIds || []
    const hasOtherTeachers = currentTeachers.some((id: string) => id !== enseignant.id)

    if (isAssigned && hasOtherTeachers) {
      const otherNames = currentTeachers
        .filter((id: string) => id !== enseignant.id)
        .map((id: string) => {
          const t = enseignants.find(e => e.id === id)
          return t ? `${t.prenom} ${t.nom}` : ''
        })
        .join(', ')

      // Open the alert dialog instead of executing immediately
      setPendingAssignment({ matiere, otherNames })
    } else {
      executeAssignation(matiere, isAssigned)
    }
  }

  // --- Gestion Professeur Principal ---
  const handleAssignProfPrincipal = (classeId: string, isAssigned: boolean) => {
    updateClasse(classeId, { enseignantPrincipalId: isAssigned ? enseignant.id : '' })
    toast({ 
      title: t('toast.update_success', "Mise à jour réussie"), 
      description: isAssigned 
        ? t('toast.now_principal', "{name} est désormais professeur principal.").replace('{name}', `${enseignant.prenom} ${enseignant.nom}`)
        : t('toast.no_longer_principal', "{name} n'est plus professeur principal.").replace('{name}', `${enseignant.prenom} ${enseignant.nom}`)
    })
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/enseignants')}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <div>
          <h2 className="text-2xl font-display font-bold text-text text-start">
            {t('enseignants.assign.title_prefix', "Assignations : ")}{enseignant.prenom} {enseignant.nom}
          </h2>
          <p className="text-sm text-muted-foreground text-start">
            {t('enseignants.assign.subtitle', "Gérez les classes et matières de cet enseignant")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="matieres" className="w-full" dir={dir}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="matieres">{t('enseignants.assign.tab_subjects', "Matières Enseignées")}</TabsTrigger>
            <TabsTrigger value="titulaire">{t('enseignants.assign.tab_titulaire', "Professeur Principal")}</TabsTrigger>
          </TabsList>
          
          <div className="w-full sm:w-[250px]">
            <Popover open={isClassComboboxOpen} onOpenChange={setIsClassComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isClassComboboxOpen}
                  className="w-full justify-between"
                >
                  {classFilter === 'toutes'
                    ? t('enseignants.assign.all_classes', "Toutes les classes")
                    : classes.find((c) => c.id === classFilter)?.nom || t('enseignants.assign.all_classes', "Toutes les classes")}
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="end">
                <div className="flex flex-col">
                  <div className="flex items-center border-b px-3">
                    <Search className="me-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                      className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 shadow-none text-start"
                      placeholder={t('inscriptions.search_class_placeholder', "Rechercher une classe...")}
                      value={classSearchQuery}
                      onChange={(e) => setClassSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1 text-start">
                    <div
                      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${classFilter === 'toutes' ? 'bg-accent/50' : ''}`}
                      onClick={() => { setClassFilter('toutes'); setIsClassComboboxOpen(false); }}
                    >
                      <Check className={`me-2 h-4 w-4 ${classFilter === 'toutes' ? 'opacity-100' : 'opacity-0'}`} />
                      {t('enseignants.assign.all_classes', "Toutes les classes")}
                    </div>
                    {classes
                      .filter(c => c.nom.toLowerCase().includes(classSearchQuery.toLowerCase()))
                      .map((c) => (
                        <div
                          key={c.id}
                          className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${classFilter === c.id ? 'bg-accent/50' : ''}`}
                          onClick={() => { setClassFilter(c.id); setIsClassComboboxOpen(false); }}
                        >
                          <Check className={`me-2 h-4 w-4 ${classFilter === c.id ? 'opacity-100' : 'opacity-0'}`} />
                          {c.nom}
                        </div>
                      ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <TabsContent value="matieres" className="mt-6 space-y-6">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border/50 text-start">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              {t('enseignants.assign.subjects_by_class', "Matières par classe")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('enseignants.assign.subjects_desc', "Cochez les matières que cet enseignant dispense. Cela permet d'avoir plusieurs enseignants dans une même classe.")}
            </p>

            <div className="space-y-8">
              {classes.filter(c => classFilter === 'toutes' || c.id === classFilter).map(classe => {
                const classeMatieres = matieres.filter(m => m.classeId === classe.id)
                if (classeMatieres.length === 0) return null
                
                return (
                  <div key={classe.id} className="border border-border/50 rounded-md p-4">
                    <h4 className="font-medium text-text mb-3 bg-muted/30 px-3 py-1 rounded inline-block">
                      {classe.nom} ({t(`classes.level.${classe.niveau.toLowerCase()}`, classe.niveau)})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {classeMatieres.map(matiere => {
                        const isAssigned = matiere.enseignantIds?.includes(enseignant.id) || false
                        return (
                          <div 
                            key={matiere.id} 
                            className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                              isAssigned ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-muted/10'
                            }`}
                            onClick={() => handleAssignMatiere(matiere, !isAssigned)}
                          >
                            <span className={isAssigned ? 'font-medium text-primary-dark' : 'text-text'}>
                              {matiere.nom}
                            </span>
                            {isAssigned && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="titulaire" className="mt-6">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border/50 text-start">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-primary" />
              {t('enseignants.assign.principal_classes', "Classes Titulaires")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('enseignants.assign.principal_desc', "Un enseignant peut être le professeur principal d'une ou plusieurs classes. Attention : assigner cet enseignant écrasera le professeur principal actuel de la classe.")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.filter(c => classFilter === 'toutes' || c.id === classFilter).map(classe => {
                const isTitulaire = classe.enseignantPrincipalId === enseignant.id
                const hasOtherTitulaire = classe.enseignantPrincipalId && classe.enseignantPrincipalId !== enseignant.id
                const otherTitulaire = hasOtherTitulaire ? enseignants.find(e => e.id === classe.enseignantPrincipalId) : null
                
                return (
                  <div 
                    key={classe.id} 
                    className={`flex flex-col p-4 rounded-md border transition-colors ${
                      isTitulaire ? 'border-primary bg-primary/5' : 'border-border/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-text">{classe.nom}</span>
                      {isTitulaire && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground mb-4">
                      {t('enseignants.assign.level_prefix', "Niveau: ")}{t(`classes.level.${classe.niveau.toLowerCase()}`, classe.niveau)}
                    </span>
                    
                    {hasOtherTitulaire && !isTitulaire && otherTitulaire && (
                      <span className="text-xs text-warning mb-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {t('enseignants.assign.titulaire_prefix', "Titulaire : ")}{otherTitulaire.prenom} {otherTitulaire.nom}
                      </span>
                    )}

                    <Button 
                      variant={isTitulaire ? "outline" : "default"}
                      className={isTitulaire ? "text-danger border-danger/50 hover:bg-danger hover:text-white mt-auto" : "bg-primary hover:bg-primary-dark text-white mt-auto"}
                      onClick={() => handleAssignProfPrincipal(classe.id, !isTitulaire)}
                    >
                      {isTitulaire ? t('enseignants.assign.btn_remove', "Retirer le rôle") : t('enseignants.assign.btn_set', "Définir comme titulaire")}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <ConfirmDeleteModal
        isOpen={!!pendingAssignment}
        onClose={() => setPendingAssignment(null)}
        onConfirm={() => pendingAssignment && executeAssignation(pendingAssignment.matiere, true)}
        title={t('enseignants.assign.co_teach_title', "Attention : Co-enseignement")}
        description={t('enseignants.assign.co_teach_desc', "Cette matière est déjà assignée à : {otherNames}. Voulez-vous vraiment l'assigner également à {name} pour qu'ils l'enseignent ensemble ?").replace('{otherNames}', pendingAssignment?.otherNames || '').replace('{name}', `${enseignant.prenom} ${enseignant.nom}`)}
        confirmText={t('enseignants.assign.btn_confirm_assign', "Oui, assigner")}
        cancelText={t('action.cancel', "Annuler")}
      />
    </div>
  )
}
