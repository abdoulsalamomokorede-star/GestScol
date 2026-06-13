import 'server-only'

/**
 * Nettoie les entrées textuelles contre les injections HTML/Script (XSS).
 * Retire toutes les balises HTML.
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str
  return str.replace(/<[^>]*>/g, '').trim()
}

/**
 * Valide la taille (max 1 Mo) et la signature Magic Bytes (signature binaire)
 * pour autoriser exclusivement les formats d'image JPEG, PNG et WebP.
 */
export function validateBase64Image(base64DataString: string): { success: boolean; mimeType?: string; error?: string } {
  // 1. Validation de la taille (max 1 Mo)
  // En Base64, 1 Mo de fichier = environ 1.33 Mo de texte (1 370 000 caractères)
  if (base64DataString.length > 1370000) {
    return { success: false, error: "Fichier trop volumineux. La taille maximale autorisée est de 1 Mo." }
  }

  // 2. Validation du type MIME déclaré
  const parts = base64DataString.split(';base64,')
  if (parts.length !== 2) {
    return { success: false, error: "Format d'image non supporté ou corrompu." }
  }

  const mimeType = parts[0].replace('data:', '')
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedMimes.includes(mimeType)) {
    return { success: false, error: "Type d'image non autorisé. Seuls JPEG, PNG et WebP sont acceptés." }
  }

  // 3. Extraction des magic bytes réels (signature binaire)
  const base64Data = parts[1]
  const buffer = Buffer.from(base64Data, 'base64')
  const hex = buffer.subarray(0, 4).toString('hex')

  const MAGIC_BYTES: Record<string, string> = {
    'ffd8ff': 'image/jpeg',
    '89504e47': 'image/png',
    '52494646': 'image/webp',
  }

  const detectedType = Object.entries(MAGIC_BYTES)
    .find(([magic]) => hex.startsWith(magic))?.[1]

  if (!detectedType) {
    return { success: false, error: "Signature de fichier invalide. Tentative d'injection bloquée." }
  }

  return { success: true, mimeType: detectedType }
}
