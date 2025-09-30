'use client'

import { useEffect } from 'react'

export default function RuntimeEnvInjectorClient() {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    try {
      // Obtener las variables del script inline
      const runtimeEnv = (window as any).__RUNTIME_ENV__
      
      if (!runtimeEnv) {
        console.log('⚠️ No se encontraron variables de entorno en __RUNTIME_ENV__')
        return
      }

      console.log('🔧 Inyectando variables de entorno:', Object.keys(runtimeEnv))

      // Asegurar que process.env existe en window
      if (!(window as any).process) {
        (window as any).process = { env: {} }
      }

      // Inyectar cada variable
      for (const [key, value] of Object.entries(runtimeEnv)) {
        if (typeof value === 'string') {
          // Solo inyectar en window.process.env para evitar errores
          (window as any).process.env[key] = value
          console.log(`✅ ${key}: disponible`)
        }
      }
      
      console.log('✅ Variables inyectadas correctamente en window.process.env')
    } catch (error) {
      console.error('❌ Error al inyectar variables:', error)
    }
  }, [])

  return null
}