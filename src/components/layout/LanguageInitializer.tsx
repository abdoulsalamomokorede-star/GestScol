'use client'

import { useEffect } from 'react'
import { useSchoolStore } from '@/store/useSchoolStore'

export default function LanguageInitializer() {
  const currentLanguage = useSchoolStore((state) => state.currentLanguage) || 'fr'

  useEffect(() => {
    document.documentElement.lang = currentLanguage
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr'
  }, [currentLanguage])

  return null
}
