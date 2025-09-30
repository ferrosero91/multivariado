'use client'

import { useEffect, useState } from 'react'

interface EnvDiagnostics {
  groqFromWindow: string | null
  groqFromProcess: string | null
  groqFromGlobal: string | null
  groqFromNextData: string | null
  allWindowKeys: string[]
  processEnvKeys: string[]
  globalProcessKeys: string[]
  isProduction: boolean
  userAgent: string
}

export function EnvDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<EnvDiagnostics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const runDiagnostics = () => {
      const diag: EnvDiagnostics = {
        groqFromWindow: (window as any).NEXT_PUBLIC_GROQ_API_KEY || (window as any).GROQ_API_KEY || null,
        groqFromProcess: (window as any).process?.env?.NEXT_PUBLIC_GROQ_API_KEY || (window as any).process?.env?.GROQ_API_KEY || null,
        groqFromGlobal: (globalThis as any).process?.env?.NEXT_PUBLIC_GROQ_API_KEY || (globalThis as any).process?.env?.GROQ_API_KEY || null,
        groqFromNextData: (window as any).__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_GROQ_API_KEY || null,
        allWindowKeys: Object.keys(window).filter(key => key.includes('GROQ') || key.includes('API')),
        processEnvKeys: Object.keys((window as any).process?.env || {}),
        globalProcessKeys: Object.keys((globalThis as any).process?.env || {}),
        isProduction: process.env.NODE_ENV === 'production',
        userAgent: navigator.userAgent
      }
      
      setDiagnostics(diag)
      
      // Log para debugging
      console.log('🔍 [Env Diagnostics] Diagnóstico completo:', diag)
    }

    runDiagnostics()
    
    // Ejecutar diagnóstico cuando las variables estén listas
    const handleEnvReady = () => {
      console.log('🔄 [Env Diagnostics] Re-ejecutando diagnóstico por env-vars-ready')
      setTimeout(runDiagnostics, 100)
    }
    
    window.addEventListener('env-vars-ready', handleEnvReady)
    window.addEventListener('env-vars-updated', handleEnvReady)
    
    return () => {
      window.removeEventListener('env-vars-ready', handleEnvReady)
      window.removeEventListener('env-vars-updated', handleEnvReady)
    }
  }, [])

  // Solo mostrar cuando se presione Ctrl+Shift+D (nunca por defecto)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isVisible])

  // Solo mostrar cuando se active manualmente
  if (!diagnostics || !isVisible) {
    return null
  }

  const hasGroqKey = !!(diagnostics.groqFromWindow || diagnostics.groqFromProcess || diagnostics.groqFromGlobal)

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-yellow-400">🔍 Diagnóstico de Variables</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <div className={`p-2 rounded ${hasGroqKey ? 'bg-green-900' : 'bg-red-900'}`}>
          <strong>Estado Groq API:</strong> {hasGroqKey ? '✅ Encontrada' : '❌ No encontrada'}
        </div>
        
        <div>
          <strong>Groq desde window:</strong> 
          <span className={diagnostics.groqFromWindow ? 'text-green-400' : 'text-red-400'}>
            {diagnostics.groqFromWindow ? ' ✅ Sí' : ' ❌ No'}
          </span>
        </div>
        
        <div>
          <strong>Groq desde process.env:</strong> 
          <span className={diagnostics.groqFromProcess ? 'text-green-400' : 'text-red-400'}>
            {diagnostics.groqFromProcess ? ' ✅ Sí' : ' ❌ No'}
          </span>
        </div>
        
        <div>
          <strong>Groq desde globalThis:</strong> 
          <span className={diagnostics.groqFromGlobal ? 'text-green-400' : 'text-red-400'}>
            {diagnostics.groqFromGlobal ? ' ✅ Sí' : ' ❌ No'}
          </span>
        </div>
        
        <div>
          <strong>Entorno:</strong> {diagnostics.isProduction ? 'Producción' : 'Desarrollo'}
        </div>
        
        <div>
          <strong>Keys en window:</strong> {diagnostics.allWindowKeys.length}
          {diagnostics.allWindowKeys.length > 0 && (
            <div className="text-gray-300 text-xs ml-2">
              {diagnostics.allWindowKeys.join(', ')}
            </div>
          )}
        </div>
        
        <div>
          <strong>Keys en process.env:</strong> {diagnostics.processEnvKeys.length}
        </div>
        
        <div>
          <strong>Keys en globalThis:</strong> {diagnostics.globalProcessKeys.length}
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Presiona Ctrl+Shift+D para ocultar
        </div>
      </div>
    </div>
  )
}