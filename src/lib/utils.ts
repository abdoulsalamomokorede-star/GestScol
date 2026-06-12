import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useSchoolStore } from "@/store/useSchoolStore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCFA(montant: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant)

  // Use Left-to-Right Mark to force the currency layout order to remain LTR in RTL contexts
  return `\u200E${formatted} FCFA`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  let lang = 'fr-FR'
  try {
    const state = useSchoolStore.getState()
    if (state && state.currentLanguage === 'ar') {
      lang = 'ar-EG'
    }
  } catch (e) {}

  return new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export function formatTelephone(tel: string): string {
  if (!tel) return tel
  const cleaned = ('' + tel).replace(/\D/g, '')
  
  // Si le numéro a 10 chiffres (ex: 0707070707)
  if (cleaned.length === 10) {
    return `\u200E+225 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`
  }
  // Si le numéro commence déjà par 225
  if ((cleaned.length === 12 || cleaned.length === 13) && cleaned.startsWith('225')) {
    const startIdx = cleaned.length === 12 ? 3 : 3
    const digits = cleaned.slice(3)
    return `\u200E+225 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
  }
  
  return `\u200E${tel}`
}

export function getInitiales(nom: string, prenom: string): string {
  return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase()
}

export function getStatutColor(statut: string): string {
  switch (statut) {
    case 'paye': return 'bg-success text-white'
    case 'en_attente': return 'bg-warning text-white'
    case 'retard': return 'bg-danger text-white'
    case 'actif': return 'bg-success text-white'
    case 'suspendu': return 'bg-warning text-white'
    case 'exclu': return 'bg-danger text-white'
    default: return 'bg-muted text-muted-foreground'
  }
}

export function translateDbError(errorMsg: string): string {
  if (!errorMsg) return "Une erreur inattendue s'est produite."
  if (errorMsg.startsWith('DEBUG_')) return errorMsg;
  
  const msg = errorMsg.toLowerCase()
  
  if (msg.includes('duplicate key value')) {
    if (msg.includes('identifiant')) {
      return "Un compte avec cet identifiant ou ce nom existe déjà. Veuillez modifier les informations."
    }
    if (msg.includes('email')) {
      return "Cette adresse e-mail est déjà utilisée par un autre compte."
    }
    return "Une donnée identique existe déjà dans le système (Doublon détecté)."
  }
  
  if (msg.includes('violates foreign key constraint')) {
    return "L'opération a échoué car elle fait référence à une donnée inexistante ou bloquée."
  }
  
  if (msg.includes('network') || msg.includes('fetch')) {
    return "Problème de connexion. Veuillez vérifier votre accès à internet."
  }
  
  return errorMsg
}

export function getSafeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-zA-Z0-9_-]/g, "_") // Remplacer le reste par des underscores
    .replace(/_+/g, "_") // Fusionner les underscores consécutifs
}

export function getAnneeScolaireActuelle(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0 = Janvier, 8 = Septembre
  if (month >= 8) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}

