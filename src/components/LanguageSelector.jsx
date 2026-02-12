import { useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { useLanguage, languages } from '../i18n/LanguageContext'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLang = languages.find(l => l.code === language) || languages[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="text-sm font-medium text-gray-700">{currentLang.code.toUpperCase()}</span>
        <Globe size={16} className="text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-2">
              <p className="text-xs text-gray-500 px-2 py-1 font-medium">Select Language</p>
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    language === lang.code 
                      ? 'bg-amber-50 text-amber-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="flex-1 text-left text-sm">{lang.name}</span>
                  {language === lang.code && (
                    <Check size={16} className="text-amber-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
