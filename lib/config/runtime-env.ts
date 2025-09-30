// Configuración de runtime para variables de entorno en producción
// Este archivo se ejecuta en el cliente para inyectar variables de entorno

export function injectRuntimeEnv() {
  // Solo ejecutar en el cliente
  if (typeof window === 'undefined') return

  // Inyectar variables de entorno desde el servidor
  const runtimeConfig = {
    NEXT_PUBLIC_GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY,
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
    NEXT_PUBLIC_HUGGINGFACE_API_KEY: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY,
    NEXT_PUBLIC_OCR_SPACE_API_KEY: process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY || process.env.OCR_SPACE_API_KEY,
  }

  // Inyectar en window para acceso global
  Object.entries(runtimeConfig).forEach(([key, value]) => {
    if (value) {
      (window as any)[key] = value
      console.log(`🔧 Runtime env injected: ${key}`)
    }
  })

  // También inyectar en globalThis.process.env para compatibilidad
  if (!(globalThis as any).process) {
    (globalThis as any).process = { env: {} }
  }

  Object.entries(runtimeConfig).forEach(([key, value]) => {
    if (value) {
      (globalThis as any).process.env[key] = value
    }
  })
}

// Función para obtener variables de entorno en runtime
export function getRuntimeEnv(key: string): string | null {
  // Intentar múltiples fuentes
  const sources = [
    process.env[key],
    process.env[`NEXT_PUBLIC_${key.replace('NEXT_PUBLIC_', '')}`],
    typeof window !== 'undefined' ? (window as any)[key] : null,
    typeof window !== 'undefined' ? (window as any)[`NEXT_PUBLIC_${key.replace('NEXT_PUBLIC_', '')}`] : null,
    (globalThis as any).process?.env?.[key],
    (globalThis as any).process?.env?.[`NEXT_PUBLIC_${key.replace('NEXT_PUBLIC_', '')}`]
  ]

  for (const value of sources) {
    if (value && value.trim()) {
      return value.trim()
    }
  }

  return null
}