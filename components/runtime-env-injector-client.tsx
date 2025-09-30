'use client'

import { useEffect } from 'react'

interface RuntimeEnvInjectorProps {
  env: Record<string, string | undefined>
}

// Componente del cliente para inyectar variables
export function RuntimeEnvInjectorClient({ env }: RuntimeEnvInjectorProps) {
  useEffect(() => {
    console.log('🔧 Inyectando variables de entorno en runtime...')
    console.log('📦 Variables recibidas del servidor:', Object.keys(env))
    
    // Verificar qué variables tienen valores
    Object.entries(env).forEach(([key, value]) => {
      if (value) {
        console.log(`✅ ${key}: Disponible (${value.substring(0, 10)}...)`)
      } else {
        console.log(`❌ ${key}: No disponible`)
      }
    })

    // Inyectar en window
    Object.entries(env).forEach(([key, value]) => {
      if (value) {
        (window as any)[key] = value
      }
    })

    // Inyectar en globalThis.process.env
    if (!(globalThis as any).process) {
      (globalThis as any).process = { env: {} }
    }

    Object.entries(env).forEach(([key, value]) => {
      if (value) {
        (globalThis as any).process.env[key] = value
      }
    })

    // Verificar inyección
    console.log('🔍 Verificando inyección:')
    Object.keys(env).forEach(key => {
      const windowValue = (window as any)[key]
      const processValue = (globalThis as any).process?.env?.[key]
      console.log(`  ${key}: window=${!!windowValue}, process.env=${!!processValue}`)
    })

    console.log('✅ Variables de entorno inyectadas correctamente')
  }, [env])

  return null
}