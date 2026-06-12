import { useSchoolStore } from '@/store/useSchoolStore'
import { translations } from '@/lib/translations'

export function useTranslation() {
  const currentLanguage = useSchoolStore((state) => state.currentLanguage) || 'fr'
  const setLanguage = useSchoolStore((state) => state.setLanguage)

  const t = (key: string, fallback: string): string => {
    if (currentLanguage === 'ar') {
      return (translations.ar as any)[key] || fallback
    }
    return fallback
  }

  return {
    t,
    lang: currentLanguage,
    setLanguage,
    dir: (currentLanguage === 'ar' ? 'rtl' : 'ltr') as 'ltr' | 'rtl',
    isAr: currentLanguage === 'ar'
  }
}
