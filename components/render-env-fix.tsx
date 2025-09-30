"use client"

import { useEffect } from 'react'

// Componente específico para corregir problemas de variables de entorno en Render
export function RenderEnvFix() {
  useEffect(() => {
    // Solo ejecutar en el cliente y en producción
    if (typeof window === 'undefined') return

    console.log('🔧 [Render Fix] Iniciando corrección de variables de entorno...')

    // Detectar si estamos en Render
    const isRender = window.location.hostname.includes('onrender.com') || 
                     process.env.NODE_ENV === 'production'

    if (!isRender) {
      console.log('🏠 [Render Fix] Entorno local detectado, saltando corrección')
      return
    }

    console.log('🌐 [Render Fix] Entorno de producción Render detectado')

    // Función para inyectar variables de entorno desde múltiples fuentes
    const injectEnvVars = () => {
      // Variables que necesitamos
      const requiredVars = [
        'NEXT_PUBLIC_GROQ_API_KEY',
        'NEXT_PUBLIC_OPENROUTER_API_KEY', 
        'NEXT_PUBLIC_HUGGINGFACE_API_KEY',
        'NEXT_PUBLIC_OCR_SPACE_API_KEY'
      ]

      // Crear objeto process.env si no existe
      if (!(window as any).process) {
        (window as any).process = { env: {} }
      }

      if (!(globalThis as any).process) {
        (globalThis as any).process = { env: {} }
      }

      // Intentar obtener variables desde el HTML (inyectadas por el servidor)
      const scriptTag = document.querySelector('script[data-env-vars]')
      if (scriptTag) {
        try {
          const envData = JSON.parse(scriptTag.textContent || '{}')
          console.log('📦 [Render Fix] Variables encontradas en script tag:', Object.keys(envData))
          
          Object.entries(envData).forEach(([key, value]) => {
            if (value) {
              (window as any).process.env[key] = value;
              (globalThis as any).process.env[key] = value;
              (window as any)[key] = value
              console.log(`✅ [Render Fix] ${key} inyectada desde script tag`)
            }
          })
        } catch (e) {
          console.error('❌ [Render Fix] Error parseando variables del script tag:', e)
        }
      }

      // Verificar __NEXT_DATA__ (Next.js runtime data)
      if ((window as any).__NEXT_DATA__?.props?.pageProps?.env) {
        const envData = (window as any).__NEXT_DATA__.props.pageProps.env
        console.log('📦 [Render Fix] Variables encontradas en __NEXT_DATA__:', Object.keys(envData))
        
        Object.entries(envData).forEach(([key, value]) => {
          if (value) {
            (window as any).process.env[key] = value;
            (globalThis as any).process.env[key] = value;
            (window as any)[key] = value
            console.log(`✅ [Render Fix] ${key} inyectada desde __NEXT_DATA__`)
          }
        })
      }

      // Verificar variables ya presentes en window
      requiredVars.forEach(varName => {
        if ((window as any)[varName]) {
          (window as any).process.env[varName] = (window as any)[varName];
          (globalThis as any).process.env[varName] = (window as any)[varName]
          console.log(`✅ [Render Fix] ${varName} encontrada en window`)
        }
      })

      // Verificar estado final
      console.log('🔍 [Render Fix] Estado final de variables:')
      requiredVars.forEach(varName => {
        const value = (window as any).process.env[varName] || 
                     (globalThis as any).process.env[varName] ||
                     (window as any)[varName]
        console.log(`  ${varName}: ${value ? '✅ Disponible' : '❌ No disponible'}`)
      })

      // Forzar recarga de servicios que dependen de estas variables
      if ((window as any).process.env.NEXT_PUBLIC_GROQ_API_KEY) {
        console.log('🔄 [Render Fix] Forzando recarga de servicios...')
        
        // Disparar evento personalizado para que los servicios se recarguen
        window.dispatchEvent(new CustomEvent('env-vars-updated', {
          detail: { source: 'render-fix' }
        }))
      }
    }

    // Ejecutar inmediatamente
    injectEnvVars()

    // También ejecutar después de que la página esté completamente cargada
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectEnvVars)
    }

    // Y después de que todos los scripts se hayan cargado
    window.addEventListener('load', injectEnvVars)

    // Cleanup
    return () => {
      document.removeEventListener('DOMContentLoaded', injectEnvVars)
      window.removeEventListener('load', injectEnvVars)
    }
  }, [])

  return null // Este componente no renderiza nada
}