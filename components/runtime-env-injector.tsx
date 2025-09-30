'use client'

import { useEffect } from 'react'

interface RuntimeEnvInjectorProps {
  env: Record<string, string | undefined>
}

export function RuntimeEnvInjector({ env }: RuntimeEnvInjectorProps) {
  useEffect(() => {
    console.log('🔧 Inyectando variables de entorno en runtime...')
    
    // Inyectar en window
    Object.entries(env).forEach(([key, value]) => {
      if (value) {
        (window as any)[key] = value
        console.log(`✅ Runtime env: ${key} = ${value.substring(0, 10)}...`)
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

    console.log('✅ Variables de entorno inyectadas correctamente')
  }, [env])

  return null
}

// Función helper para crear las props del servidor
export function createRuntimeEnvProps() {
  return {
    env: {
      NEXT_PUBLIC_GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY,
      NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
      NEXT_PUBLIC_HUGGINGFACE_API_KEY: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY,
      NEXT_PUBLIC_OCR_SPACE_API_KEY: process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY || process.env.OCR_SPACE_API_KEY,
    }
  }
}