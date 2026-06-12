'use client'

import { useState } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  HelpCircle, 
  BookOpen, 
  GraduationCap, 
  Users, 
  UserCheck,
  CreditCard, 
  CalendarOff, 
  FileText, 
  Info, 
  ClipboardList, 
  PenTool, 
  ShieldAlert,
  Zap,
  Settings
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

type RoleType = 'directeur' | 'enseignant' | 'parent'

export default function AidePage() {
  const { currentUser, ecole } = useSchoolStore()
  const { t, dir, isAr } = useTranslation()
  const [activeTab, setActiveTab] = useState<RoleType>(
    currentUser ? (currentUser.role as RoleType) : 'directeur'
  )

  if (!currentUser) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-300" dir={dir}>
      {/* HEADER DE LA PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-3 text-start">
            <span className="p-2 rounded-2xl bg-primary/10 text-primary">
              <HelpCircle className="h-8 w-8" />
            </span>
            {t('aide.title', "Guide d'Utilisation")}
          </h1>
          <p className="text-muted-foreground text-sm mt-2 text-start">
            {t('aide.subtitle', "Consultez le manuel d'utilisation officiel et détaillé de la plateforme **GestScol** pour maîtriser l'ensemble de vos fonctionnalités métier.")}
          </p>
        </div>
      </div>

      {/* SÉLECTEUR D'ONGLETS DE RÔLES */}
      {currentUser.role === 'directeur' && (
        <div className="flex flex-wrap border-b border-border/50 gap-2 sm:gap-0">
          <button
            onClick={() => setActiveTab('directeur')}
            className={`pb-4 px-6 font-display font-bold text-sm transition-all duration-200 relative ${
              activeTab === 'directeur'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4.5 w-4.5" />
              {t('aide.tab.director', "Espace Directeur")}
              <Badge className="bg-primary/10 text-primary border-none text-[9px] font-bold py-0 h-4 ms-1">
                {t('aide.tab.my_space', "Mon Espace")}
              </Badge>
            </span>
            {activeTab === 'directeur' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('enseignant')}
            className={`pb-4 px-6 font-display font-bold text-sm transition-all duration-200 relative ${
              activeTab === 'enseignant'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5" />
              {t('aide.tab.teacher', "Espace Enseignant")}
            </span>
            {activeTab === 'enseignant' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('parent')}
            className={`pb-4 px-6 font-display font-bold text-sm transition-all duration-200 relative ${
              activeTab === 'parent'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5" />
              {t('aide.tab.parent', "Espace Parent")}
            </span>
            {activeTab === 'parent' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
            )}
          </button>
        </div>
      )}

      {/* CONTENU DU GUIDE */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Manuels d'utilisation */}
        <div className="lg:col-span-2 space-y-6">

          {/* MANUEL : ESPACE DIRECTEUR */}
          {activeTab === 'directeur' && (
            <div className="space-y-6 animate-in fade-in duration-300 text-start">
              
              {/* Introduction */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-dark/5 border border-primary/20 space-y-2">
                <h3 className="font-display font-bold text-primary flex items-center gap-2 text-sm sm:text-base">
                  <GraduationCap className="h-5 w-5" />
                  {t('aide.director.intro_title', "Introduction à la Gestion Administrative & Financière")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {t('aide.director.intro_desc', "En tant que Directeur, vous disposez d'un accès décisionnel complet sur GestScol. Cet espace vous permet de centraliser la scolarité de vos élèves, de suivre la comptabilité de l'école en Francs CFA (FCFA), d'administrer les équipes pédagogiques, et de générer instantanément les bulletins de notes trimestriels conformes.")}
                </p>
              </div>

              {/* Inscriptions & Limites */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-muted/10 border-b border-border/40 p-4 flex flex-row items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-text">{t('aide.director.sec1_title', "1. Module Inscriptions & Gestion d'Abonnement")}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold">
                      {t('aide.director.sec1_desc', "Inscrire vos élèves et administrer les limites de la formule gratuite.")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-4 font-medium">
                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.director.sec1_proc_title', "Procédure d'inscription & de Réinscription :")}</h5>
                    <p>
                      {t('aide.director.sec1_proc_desc', "Pour éviter de devoir ressaisir les informations civiles de chaque élève à chaque nouvelle rentrée scolaire, GestScol sépare intelligemment la création du dossier permanent de l'inscription de l'année :")}
                    </p>
                    <ol className="list-decimal ps-5 space-y-2 text-xs">
                      <li>
                        <strong>{t('aide.director.sec1_step1_title', "Étape 1 : Création unique du Dossier Élève (Onglet « Élèves »)")}</strong><br />
                        {t('aide.director.sec1_step1_desc', "Rendez-vous dans l'onglet **Élèves** et cliquez sur **« Ajouter un élève »**. Renseignez ses informations civiles (Nom, Prénom, Genre, Date de naissance), les contacts de ses parents (Nom, Téléphone +225, Email pour le portail parent) et importez sa photo de profil. Ce dossier est permanent et n'est créé qu'**une seule fois** durant tout le cursus de l'enfant dans votre école.")}
                      </li>
                      <li>
                        <strong>{t('aide.director.sec1_step2_title', "Étape 2 : Inscription ou Réinscription Annuelle (Onglet « Inscriptions »)")}</strong><br />
                        {t('aide.director.sec1_step2_desc', "Une fois le dossier permanent créé, rendez-vous dans l'onglet **Inscriptions** pour l'affecter à une classe pour l'année en cours. Cliquez sur **« Nouvelle Inscription »** (ou Réinscription), recherchez simplement l'élève dans la liste déroulante rapide, sélectionnez sa classe pour l'année scolaire active et validez. GestScol configure automatiquement sa scolarité et génère son inscription sans aucune saisie redondante.")}
                      </li>
                    </ol>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800 leading-relaxed font-semibold">
                    <Zap className="h-5.5 w-5.5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-950 uppercase text-[10px] tracking-wider">{t('aide.director.sec1_limit_title', "Plafond et Règle d'Abonnement :")}</p>
                      <p>
                        {t('aide.director.sec1_limit_desc1', "La version de démonstration ou le plan **Gratuit** de GestScol limite l'effectif à un maximum de **50 élèves**.")}
                      </p>
                      <p>
                        {t('aide.director.sec1_limit_desc2', "Dès que vous atteignez le seuil des **50 élèves inscrits**, toute nouvelle inscription est verrouillée. L'interface affiche un bandeau de rappel. Vous devez alors cliquer sur **« Mon Abonnement »** pour migrer vers la version Premium. La redirection s'effectue de manière sécurisée vers la passerelle ouest-africaine **CinetPay** pour activer le plan payant.")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suivi Financier */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-muted/10 border-b border-border/40 p-4 flex flex-row items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-text">{t('aide.director.sec2_title', "2. Gestion Financière & Encaissements en FCFA")}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold">
                      {t('aide.director.sec2_desc', "Paramétrer les scolarités, encaisser les versements et éditer les reçus officiels.")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-4 font-medium">
                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.director.sec2_config_title', "Configuration des Tarifs :")}</h5>
                    <p>
                      {t('aide.director.sec2_config_desc', "Depuis l'onglet **Classes**, le Directeur configure pour chaque niveau le montant annuel exigé pour l'inscription et la scolarité. Ces montants s'appliquent automatiquement à l'ensemble des élèves inscrits dans cette classe.")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.director.sec2_payment_title', "Enregistrement des versements :")}</h5>
                    <p>
                      {t('aide.director.sec2_payment_desc', "Lorsqu'un parent effectue un versement (comptant ou par tranches), rendez-vous dans l'onglet **Paiements** de l'élève :")}
                    </p>
                    <ul className="list-disc ps-5 space-y-1 text-xs">
                      <li>{t('aide.director.sec2_payment_step1', "Cliquez sur **« Enregistrer un versement »** pour ouvrir le volet d'encaissement.")}</li>
                      <li>{t('aide.director.sec2_payment_step2', "Saisissez le montant encaissé en **Francs CFA (FCFA)**.")}</li>
                      <li>{t('aide.director.sec2_payment_step3', "Sélectionnez le mode de paiement choisi : **Espèces**, **Wave**, **Orange Money** ou **MTN MoMo**, puis indiquez la référence du transfert.")}</li>
                      <li>{t('aide.director.sec2_payment_step4', "GestScol recalcule immédiatement le solde restant dû et met à jour l'historique de l'élève.")}</li>
                    </ul>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-xs text-primary leading-relaxed font-semibold">
                    <FileText className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold uppercase text-[10px] tracking-wider">{t('aide.director.sec2_receipt_title', "Génération de Reçu Officiel A4 :")}</p>
                      {t('aide.director.sec2_receipt_desc', "Pour chaque versement validé, GestScol offre la possibilité d'imprimer un reçu de paiement au format **A4 standardisé**. Ce reçu contient le logo de l'école, le nom de l'élève, le montant versé, le mode, la date, la référence de transaction et le solde restant. Il est conçu pour être imprimé ou partagé en PDF avec les parents pour leur comptabilité familiale.")}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Évaluations */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-muted/10 border-b border-border/40 p-4 flex flex-row items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-text">{t('aide.director.sec3_title', "3. Notes, Calculs de Moyennes & Édition de Bulletins")}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold">
                      {t('aide.director.sec3_desc', "Comprendre les règles de notation, de pondération par coefficient et de génération.")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-4 font-medium">
                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.director.sec3_formula_title', "Calcul Mathématique de Moyenne Pondérée :")}</h5>
                    <p>
                      {t('aide.director.sec3_formula_desc', "Les enseignants ou la direction saisissent des évaluations sur **20**. Pour un trimestre donné, la moyenne générale de l'élève est obtenue via la formule pondérée officielle :")}
                    </p>
                    <div className="p-3 bg-muted/40 border border-border/50 rounded-xl text-center font-mono font-bold text-primary text-xs sm:text-sm">
                      {t('aide.director.sec3_formula_value', "Moyenne = Σ(note × coefficient) / Σ(coefficients)")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.director.sec3_rank_title', "Classement & Rangs :")}</h5>
                    <p>
                      {t('aide.director.sec3_rank_desc', "GestScol calcule automatiquement le classement (le rang de chaque élève) au sein de sa classe pour le trimestre sélectionné. En cas d'égalité de moyenne, les élèves partagent le même rang.")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.director.sec3_appr_title', "Appréciations Trimestrielles Automatiques :")}</h5>
                    <p>
                      {t('aide.director.sec3_appr_desc', "Afin de faire gagner du temps aux équipes, le logiciel formule automatiquement une appréciation pédagogique normalisée selon la moyenne générale de l'élève :")}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <div>• <span dir="ltr">&ge; 16.00 / 20</span> : « {t('mention.excellent', 'Excellent')} »</div>
                      <div>• <span dir="ltr">&ge; 14.00 / 20</span> : « {t('mention.tres_bien', 'Très Bien')} »</div>
                      <div>• <span dir="ltr">&ge; 12.00 / 20</span> : « {t('mention.bien', 'Bien')} »</div>
                      <div>• <span dir="ltr">&ge; 10.00 / 20</span> : « {t('mention.assez_bien', 'Assez Bien')} »</div>
                      <div>• <span dir="ltr">&ge; 08.00 / 20</span> : « {t('mention.passable', 'Passable')} »</div>
                      <div>• <span dir="ltr">&lt; 08.00 / 20</span> : « {t('mention.insuffisant', 'Insuffisant')} »</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.director.sec3_gen_title', "Génération Automatisée en Un Clic :")}</h5>
                    <p>
                      {t('aide.director.sec3_gen_desc', "Dans l'onglet **Bulletins**, sélectionnez une classe et un trimestre, puis cliquez sur **« Calculer les bulletins »**. Le système rassemble l'ensemble des notes, moyennes de matières, coefficients, absences enregistrées sur la période, calcule les résultats globaux et génère un **bulletin officiel au format A4 PDF** prêt à être imprimé ou téléchargé.")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Absences & Paramètres */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-muted/10 border-b border-border/40 p-4 flex flex-row items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-600 shrink-0">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-text">{t('aide.director.sec4_title', "4. Absences, Équipes & Paramètres")}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold">
                      {t('aide.director.sec4_desc', "Valider les justificatifs d'absences et modifier les informations de l'école.")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-4 font-medium">
                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.director.sec4_abs_title', "Gestion des justificatifs d'absences :")}</h5>
                    <p>
                      {t('aide.director.sec4_abs_desc1', "Depuis l'onglet **Absences** (onglet Historique & Suivi), le Directeur consulte l'ensemble des absences signalées par les enseignants ou déclarées en ligne par les parents.")}
                    </p>
                    <p>
                      {t('aide.director.sec4_abs_desc2', "Pour chaque absence marquée « En attente de justificatif », le Directeur peut cliquer sur **« Justifier »** après avoir reçu le document papier (certificat médical, etc.) fourni par le parent. La saisie du motif officiel approuve l'absence, met à jour le statut en **« Justifiée »** et met à jour instantanément l'affichage dans l'espace du parent d'élève.")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.director.sec4_admin_title', "Administration Institutionnelle :")}</h5>
                    <p>
                      {t('aide.director.sec4_admin_desc', "Depuis l'onglet **Paramètres** (accessible dans le footer de votre sidebar), vous pouvez :")}
                    </p>
                    <ul className="list-disc ps-5 space-y-1 text-xs">
                      <li>{t('aide.director.sec4_admin_item1', "Modifier le nom complet de l'école, sa ville, son adresse physique.")}</li>
                      <li>{t('aide.director.sec4_admin_item2', "Saisir son numéro de téléphone au format officiel ivoirien **+225 XX XX XX XX XX (10 chiffres)**.")}</li>
                      <li>{t('aide.director.sec4_admin_item3', "Charger le logo officiel de l'établissement scolaire pour personnaliser les reçus et bulletins trimestriels.")}</li>
                      <li>{t('aide.director.sec4_admin_item4', "Créer et administrer les années scolaires (ex: \"2024-2025\").")}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* MANUEL : ESPACE ENSEIGNANT */}
          {activeTab === 'enseignant' && (
            <div className="space-y-6 animate-in fade-in duration-300 text-start">
              
              {/* Introduction */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-dark/5 border border-primary/20 space-y-2">
                <h3 className="font-display font-bold text-primary flex items-center gap-2 text-sm sm:text-base">
                  <Users className="h-5 w-5 animate-pulse shrink-0" />
                  {t('aide.teacher.intro_title', "Introduction à la Gestion Pédagogique")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {t('aide.teacher.intro_desc', "En tant qu'Enseignant Principal sur GestScol, vous disposez d'un espace dédié pour effectuer le suivi quotidien de votre classe. Vos actions prioritaires consistent à enregistrer la présence des élèves à chaque séance (Appel) et à renseigner leurs notes trimestrielles d'évaluation.")}
                </p>
              </div>

              {/* Appel Journalier */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-muted/10 border-b border-border/40 p-4 flex flex-row items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
                    <CalendarOff className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-text">{t('aide.teacher.sec1_title', "1. Appel Journalier & Suivi d'Assiduité")}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold">
                      {t('aide.teacher.sec1_desc', "Procédure pas à pas pour consigner la présence des élèves de votre classe.")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-4 font-medium">
                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.teacher.sec1_method_title', "Méthode de saisie :")}</h5>
                    <p>
                      {t('aide.teacher.sec1_method_desc', "Pour faire l'appel, rendez-vous dans l'onglet **Absences** et suivez les étapes :")}
                    </p>
                    <ul className="list-disc ps-5 space-y-1.5 text-xs">
                      <li>{t('aide.teacher.sec1_step1', "Choisissez la date de l'appel (par défaut, la date du jour est sélectionnée).")}</li>
                      <li>{t('aide.teacher.sec1_step2', "Sélectionnez la séance concernée : **Matin (7h-12h)** ou **Après-midi (13h-17h)**.")}</li>
                      <li>{t('aide.teacher.sec1_step3', "La liste des élèves s'affiche. Par défaut, pour vous faire gagner du temps, tous les élèves sont marqués comme **« Présent »** (bouton vert).")}</li>
                      <li>{t('aide.teacher.sec1_step4', "Il vous suffit de cliquer sur le bouton d'un élève pour le marquer **« Absent »** (le bouton bascule en rouge).")}</li>
                      <li>{t('aide.teacher.sec1_step5', "Validez la saisie en cliquant sur le bouton **« Enregistrer l'appel »**.")}</li>
                    </ul>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-xs text-primary leading-relaxed font-semibold">
                    <UserCheck className="h-5 w-5 shrink-0 text-primary mt-0.5 animate-bounce" />
                    <div className="space-y-1">
                      <p className="font-bold uppercase text-[10px] tracking-wider">{t('aide.teacher.sec1_alert_title', "Alerte Parent Immédiate :")}</p>
                      {t('aide.teacher.sec1_alert_desc', "Dès que vous validez votre feuille d'appel, GestScol envoie instantanément une **notification en temps réel** sur l'espace privé du parent de chaque élève marqué absent. Le parent est ainsi immédiatement averti et invité à justifier le motif ou à prendre contact avec l'établissement.")}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-muted/10 border-b border-border/40 p-4 flex flex-row items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                    <PenTool className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-text">{t('aide.teacher.sec2_title', "2. Saisie des Notes d'Évaluation")}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold">
                      {t('aide.teacher.sec2_desc', "Notation rigoureuse des évaluations trimestrielles.")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-4 font-medium">
                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.teacher.sec2_rules_title', "Règles de saisie :")}</h5>
                    <p>
                      {t('aide.teacher.sec2_rules_desc', "Depuis l'onglet **Notes**, vous accédez au carnet de notes de vos élèves :")}
                    </p>
                    <ul className="list-disc ps-5 space-y-1.5 text-xs">
                      <li>{t('aide.teacher.sec2_step1', "Sélectionnez la matière concernée (parmi les matières enseignées dans votre classe).")}</li>
                      <li>{t('aide.teacher.sec2_step2', "Sélectionnez le trimestre actif (1er, 2e, ou 3e Trimestre).")}</li>
                      <li>{t('aide.teacher.sec2_step3', "Saisissez la note de chaque élève. La note doit impérativement se situer dans la plage de **0 à 20** (les valeurs décimales sont acceptées, ex: *14.5*). Les valeurs hors de cette plage sont bloquées.")}</li>
                      <li>{t('aide.teacher.sec2_step4', "Cliquez sur **« Enregistrer »** pour persister les notes.")}</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-2.5 text-xs text-slate-600 font-semibold">
                    <Info className="h-5 w-5 text-primary shrink-0" />
                    {t('aide.teacher.sec2_sync_desc', "Ces notes sont directement synchronisées et utilisées par le système pour le calcul des moyennes trimestrielles pondérées par coefficient et pour la génération automatique du bulletin de notes officiel par la direction de l'école.")}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* MANUEL : ESPACE PARENT */}
          {activeTab === 'parent' && (
            <div className="space-y-6 animate-in fade-in duration-300 text-start">
              
              {/* Introduction */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-dark/5 border border-primary/20 space-y-2">
                <h3 className="font-display font-bold text-primary flex items-center gap-2 text-sm sm:text-base">
                  <BookOpen className="h-5 w-5 shrink-0" />
                  {t('aide.parent.intro_title', "Introduction à l'Espace Famille")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {t('aide.parent.intro_desc', "Bienvenue sur votre espace privé GestScol. Cet espace a été conçu pour vous permettre de suivre de près et en temps réel le parcours scolaire de vos enfants. Vous pouvez y consulter leurs évaluations, télécharger leurs bulletins officiels, suivre vos versements de scolarité, et signaler directement une absence à l'administration.")}
                </p>
              </div>

              {/* Suivi Scolaire */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-muted/10 border-b border-border/40 p-4 flex flex-row items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-text">{t('aide.parent.sec1_title', "1. Suivi des Notes & Relevés Trimestriels")}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold">
                      {t('aide.parent.sec1_desc', "Consulter en direct les résultats et appréciation de vos enfants.")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-3 font-medium">
                  <p>
                    {t('aide.parent.sec1_desc', "Depuis votre portail, vous pouvez suivre à tout moment la progression scolaire de vos enfants :")}
                  </p>
                  <ul className="list-disc ps-5 space-y-1.5 text-xs">
                    <li>{t('aide.parent.sec1_item1', "**Relevé en direct** : Visualisez chaque note saisie par l'enseignant avec son coefficient et la date d'évaluation.")}</li>
                    <li>{t('aide.parent.sec1_item2', "**Assiduité & Moyenne** : Consultez le taux de présence de votre enfant estimé sur l'année ainsi que sa moyenne trimestrielle calculée.")}</li>
                    <li>{t('aide.parent.sec1_item3', "**Téléchargement du Bulletin** : Dès que le Directeur a calculé et approuvé les résultats de la classe, le **bulletin trimestriel officiel (PDF A4)** de votre enfant devient téléchargeable en un clic sur votre espace.")}</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Comptabilité Familiale */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-muted/10 border-b border-border/40 p-4 flex flex-row items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-text">{t('aide.parent.sec2_title', "2. Suivi Financier de la Scolarité en FCFA")}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold">
                      {t('aide.parent.sec2_desc', "Consulter vos paiements, soldes restants et reçus de versements.")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-3 font-medium">
                  <p>
                    {t('aide.parent.sec2_desc', "L'onglet **Paiements** vous évite tout déplacement administratif pour vérifier l'état financier de votre enfant :")}
                  </p>
                  <ul className="list-disc ps-5 space-y-1.5 text-xs">
                    <li>{t('aide.parent.sec2_item1', "**Cumul des versements** : Suivez le total des paiements déjà enregistrés en **Francs CFA (FCFA)**.")}</li>
                    <li>{t('aide.parent.sec2_item2', "**Solde Restant** : Visualisez en direct le reste à payer sur la scolarité annuelle.")}</li>
                    <li>{t('aide.parent.sec2_item3', "**Historique détaillé** : Consultez le détail de chaque transaction validée par la direction (date, montant, mode: Wave/Orange Money/MTN/Espèces, référence).")}</li>
                    <li>{t('aide.parent.sec2_item4', "**Alertes Retards** : Un indicateur rouge **Retard** s'affiche si un versement obligatoire n'a pas été complété dans les délais fixés par l'école.")}</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Signalement Absences */}
              <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-muted/10 border-b border-border/40 p-4 flex flex-row items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
                    <CalendarOff className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-text">{t('aide.parent.sec3_title', "3. Signalement & Justification d'Absences")}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-semibold">
                      {t('aide.parent.sec3_desc', "Avertir immédiatement l'établissement en cas d'indisponibilité ou maladie.")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-slate-600 space-y-4 font-medium">
                  <div className="space-y-2">
                    <h5 className="font-bold text-text uppercase text-[10px] tracking-wider text-primary">{t('aide.parent.sec3_proc_title', "Procédure de signalement en direct :")}</h5>
                    <p>
                      {t('aide.parent.sec3_proc_desc', "Votre enfant est malade ou contraint de s'absenter ? Pour avertir la direction sans attendre, utilisez le formulaire **« Signaler une absence »** disponible dans l'onglet **Absences** :")}
                    </p>
                    <ul className="list-disc ps-5 space-y-1 text-xs">
                      <li>{t('aide.parent.sec3_step1', "Sélectionnez l'enfant concerné (si vous avez plusieurs enfants inscrits).")}</li>
                      <li>{t('aide.parent.sec3_step2', "Renseignez la date de son absence et la séance concernée (**Matin** ou **Après-midi**).")}</li>
                      <li>{t('aide.parent.sec3_step3', "Saisissez le motif de son indisponibilité (ex: *Rendez-vous pédiatre à 9h, Paludisme*) et validez.")}</li>
                    </ul>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-xs text-primary leading-relaxed font-semibold">
                    <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold uppercase text-[10px] tracking-wider">{t('aide.parent.sec3_proof_title', "Justification Papier Obligatoire :")}</p>
                      {t('aide.parent.sec3_proof_desc', "Le signalement en ligne alerte immédiatement l'école en direct sur le bureau du Directeur. Toutefois, conformément aux règles administratives scolaires, le parent doit impérativement fournir le justificatif physique signé (dispense, certificat médical officiel) lors du retour de l'élève. Dès réception, le Directeur passera le statut de l'absence en **« Justifiée »** sur votre portail.")}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

        </div>

        {/* Colonne Droite */}
        <div className="space-y-6">

          {/* Support d'Assistance */}
          <Card className="shadow-sm border-border/50 bg-card border-l-4 border-l-primary overflow-hidden text-start">
            <CardHeader className="pb-3 bg-muted/10 border-b border-border/40">
              <CardTitle className="text-xs font-bold text-text uppercase flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-primary shrink-0" />
                {t('support.title', "Support & Assistance")}
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground font-semibold">
                {t('support.phone.desc_short', "Contacter GestScol Côte d'Ivoire.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 text-xs font-semibold text-slate-600 leading-relaxed space-y-3">
              <p>
                {t('aide.support.subtitle_desc', "Pour toute assistance sur l'interfaçage de vos comptes Wave ou Orange Money, ou en cas de dysfonctionnement sur votre réseau local :")}
              </p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>{t('aide.support.email', "Email : support@gestscol.ci")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>{t('aide.support.phone_label', "Téléphone : ")}<span dir="ltr" className="inline-block">+225 07 07 07 07 07</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>{t('aide.support.hours', "Horaire : Lundi au Vendredi (8h00 - 17h00)")}</span>
                </li>
              </ul>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 italic mt-2 leading-relaxed">
                {t('aide.support.host_info', "GestScol est hébergé sur des serveurs CDN ouest-africains ultra-rapides, garantissant des temps de réponse optimaux même avec une connexion mobile 3G/4G lente sur smartphone Tecno, Infinix ou Samsung.")}
              </div>
            </CardContent>
          </Card>

          {/* Note informative */}
          <Card className="shadow-sm border-border/50 bg-muted/20 border border-border/40 p-5 rounded-2xl text-start">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-text uppercase">{t('aide.support.channel_title', "Canal de Transmission")}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('aide.support.channel_desc', "L'ensemble des relevés de notes, des reçus financiers et des alertes d'absences consultables sur cette plateforme GestScol constitue le canal de liaison numérique légal de l'école avec les familles. Les informations y sont chiffrées de bout en bout pour garantir la sécurité et la confidentialité de vos enfants.")}
                </p>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
