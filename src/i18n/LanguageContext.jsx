import { createContext, useContext, useState, useEffect } from 'react'
import { translations, languages } from './translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
    document.documentElement.lang = language
  }, [language])

  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k]
      } else {
        // Fallback to English
        value = translations['en']
        for (const fallbackKey of keys) {
          if (value && value[fallbackKey]) {
            value = value[fallbackKey]
          } else {
            return key // Return key if not found
          }
        }
        break
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export { languages }
