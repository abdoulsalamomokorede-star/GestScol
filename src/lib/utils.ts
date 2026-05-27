import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCFA(montant: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant).replace('XOF', 'FCFA')
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export function formatTelephone(tel: string): string {
  // Format ivoirien basique: +225 XX XX XX XX XX
  const cleaned = ('' + tel).replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+225 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`
  }
  return tel
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
