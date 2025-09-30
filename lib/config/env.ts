// Configuración centralizada de variables de entorno
// Este archivo maneja la carga de variables de entorno de manera robusta

interface EnvConfig {
  GROQ_API_KEY: string | null
  OPENROUTER_API_KEY: string | null
  HUGGINGFACE_API_KEY: string | null
  OCR_SPACE_API_KEY: string | null
}

class EnvironmentManager {
  private static instance: EnvironmentManager
  private config: EnvConfig

  private constructor() {
    this.config = this.loadEnvironment()
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager()
    }
    return EnvironmentManager.instance
  }

  private loadEnvironment(): EnvConfig {
    // Estrategia múltiple para cargar variables de entorno
    const getEnvVar = (key: string): string | null => {
      console.log(`🔍 Buscando variable: ${key}`)
      
      // Lista de todas las posibles ubicaciones para la variable
      const sources = [
        { name: `NEXT_PUBLIC_${key}`, value: process.env[`NEXT_PUBLIC_${key}`] },
        { name: key, value: process.env[key] },
        { name: `process.env.${key}`, value: (globalThis as any).process?.env?.[key] },
        { name: `process.env.NEXT_PUBLIC_${key}`, value: (globalThis as any).process?.env?.[`NEXT_PUBLIC_${key}`] }
      ]

      // En el cliente, agregar más fuentes
      if (typeof window !== 'undefined') {
        sources.push(
          { name: `__NEXT_DATA__.NEXT_PUBLIC_${key}`, value: (window as any).__NEXT_DATA__?.props?.pageProps?.env?.[`NEXT_PUBLIC_${key}`] },
          { name: `window.NEXT_PUBLIC_${key}`, value: (window as any)[`NEXT_PUBLIC_${key}`] },
          { name: `globalThis.NEXT_PUBLIC_${key}`, value: (globalThis as any)[`NEXT_PUBLIC_${key}`] }
        )
      }

      // Buscar en todas las fuentes
      for (const source of sources) {
        if (source.value && source.value.trim()) {
          console.log(`✅ Variable ${key} encontrada en: ${source.name}`)
          return source.value.trim()
        } else {
          console.log(`❌ ${source.name}: ${source.value ? 'vacía' : 'no disponible'}`)
        }
      }

      console.log(`⚠️ Variable ${key} no encontrada en ninguna fuente`)
      return null
    }

    console.log('🔧 Cargando configuración de entorno...')
    const config: EnvConfig = {
      GROQ_API_KEY: getEnvVar('GROQ_API_KEY'),
      OPENROUTER_API_KEY: getEnvVar('OPENROUTER_API_KEY'),
      HUGGINGFACE_API_KEY: getEnvVar('HUGGINGFACE_API_KEY'),
      OCR_SPACE_API_KEY: getEnvVar('OCR_SPACE_API_KEY'),
    }

    console.log('📋 Configuración final:', {
      GROQ_API_KEY: config.GROQ_API_KEY ? '✅ Configurada' : '❌ No disponible',
      OPENROUTER_API_KEY: config.OPENROUTER_API_KEY ? '✅ Configurada' : '❌ No disponible',
      HUGGINGFACE_API_KEY: config.HUGGINGFACE_API_KEY ? '✅ Configurada' : '❌ No disponible',
      OCR_SPACE_API_KEY: config.OCR_SPACE_API_KEY ? '✅ Configurada' : '❌ No disponible'
    })

    return config
  }

  public getGroqApiKey(): string | null {
    return this.config.GROQ_API_KEY
  }

  public getOpenRouterApiKey(): string | null {
    return this.config.OPENROUTER_API_KEY
  }

  public getHuggingFaceApiKey(): string | null {
    return this.config.HUGGINGFACE_API_KEY
  }

  public getOcrSpaceApiKey(): string | null {
    return this.config.OCR_SPACE_API_KEY
  }

  public reloadConfig(): void {
    this.config = this.loadEnvironment()
  }

  public setGroqApiKey(apiKey: string): void {
    this.config.GROQ_API_KEY = apiKey
  }
}

// Exportar instancia singleton
export const envManager = EnvironmentManager.getInstance()

// Funciones de conveniencia
export const getGroqApiKey = (): string | null => envManager.getGroqApiKey()
export const getOpenRouterApiKey = (): string | null => envManager.getOpenRouterApiKey()
export const getHuggingFaceApiKey = (): string | null => envManager.getHuggingFaceApiKey()
export const getOcrSpaceApiKey = (): string | null => envManager.getOcrSpaceApiKey()
