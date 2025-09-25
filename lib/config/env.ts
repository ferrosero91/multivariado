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
      // 1. Variables de entorno estándar de Next.js
      const nextEnv = process.env[`NEXT_PUBLIC_${key}`]
      if (nextEnv && nextEnv.trim()) {
        return nextEnv.trim()
      }

      // 2. Variables de entorno sin prefijo (para casos especiales)
      const directEnv = process.env[key]
      if (directEnv && directEnv.trim()) {
        return directEnv.trim()
      }

      // 3. En el cliente, verificar diferentes ubicaciones
      if (typeof window !== 'undefined') {
        // __NEXT_DATA__
        const nextData = (window as any).__NEXT_DATA__?.props?.pageProps?.env?.[`NEXT_PUBLIC_${key}`]
        if (nextData) return nextData

        // globalThis
        const globalEnv = (globalThis as any).process?.env?.[`NEXT_PUBLIC_${key}`]
        if (globalEnv) return globalEnv

        // window directo
        const windowEnv = (window as any)[`NEXT_PUBLIC_${key}`]
        if (windowEnv) return windowEnv
      }

      return null
    }

    const config: EnvConfig = {
      GROQ_API_KEY: getEnvVar('GROQ_API_KEY'),
      OPENROUTER_API_KEY: getEnvVar('OPENROUTER_API_KEY'),
      HUGGINGFACE_API_KEY: getEnvVar('HUGGINGFACE_API_KEY'),
      OCR_SPACE_API_KEY: getEnvVar('OCR_SPACE_API_KEY'),
    }

    // Configuración cargada exitosamente

    // La API key debe estar configurada en .env.local
    // NEXT_PUBLIC_GROQ_API_KEY=tu_api_key_aqui

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
