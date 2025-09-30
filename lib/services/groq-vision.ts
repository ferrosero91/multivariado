// Servicio de visión con Groq para reconocimiento de ejercicios matemáticos
// IMPLEMENTACIÓN EXACTA del script Python - SIN MODIFICACIONES

import { getGroqApiKey, envManager } from '@/lib/config/env'

interface GroqVisionResponse {
  extracted_text: string
  extracted_equation: string
  solution_steps: string[]
  final_answer: string
}

interface MathExtractionResult {
  text: string
  equation: string
  steps: string[]
  answer: string
  confidence: number
  provider: string
}

export class GroqVisionService {
  private apiKey: string | null = null
  private baseUrl = "https://api.groq.com/openai/v1"

  constructor() {
    this.loadApiKey()
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Solo en el cliente
    if (typeof window !== 'undefined') {
      // Escuchar eventos de actualización de variables de entorno
      window.addEventListener('env-vars-updated', () => {
        console.log('🔄 [GroqVision] Recargando API key por evento env-vars-updated')
        this.apiKey = null // Forzar recarga
        this.loadApiKey()
      })
      
      // Escuchar evento de variables listas desde el script injector
      window.addEventListener('env-vars-ready', (event: any) => {
        console.log('🎉 [GroqVision] Variables de entorno listas desde script injector:', event.detail)
        this.apiKey = null // Forzar recarga
        this.loadApiKey()
      })
      
      // Verificar si las variables ya están listas
      if ((window as any).__ENV_VARS_READY__) {
        console.log('✅ [GroqVision] Variables ya estaban listas, recargando API key')
        this.apiKey = null
        this.loadApiKey()
      }
    }
  }

  private loadApiKey() {
    // Intentar múltiples fuentes de API key con logs de debug
    const sources = [
      { name: 'NEXT_PUBLIC_GROQ_API_KEY', value: process.env.NEXT_PUBLIC_GROQ_API_KEY },
      { name: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY },
      { name: 'getGroqApiKey()', value: getGroqApiKey() }
    ]

    // En el cliente, agregar fuentes adicionales para Render
    if (typeof window !== 'undefined') {
      sources.push(
        { name: 'window.process.env.NEXT_PUBLIC_GROQ_API_KEY', value: (window as any).process?.env?.NEXT_PUBLIC_GROQ_API_KEY },
        { name: 'window.NEXT_PUBLIC_GROQ_API_KEY', value: (window as any).NEXT_PUBLIC_GROQ_API_KEY },
        { name: 'globalThis.process.env.NEXT_PUBLIC_GROQ_API_KEY', value: (globalThis as any).process?.env?.NEXT_PUBLIC_GROQ_API_KEY },
        { name: '__NEXT_DATA__.props.pageProps.env.NEXT_PUBLIC_GROQ_API_KEY', value: (window as any).__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_GROQ_API_KEY }
      )
    }

    console.log('🔍 [Groq Vision] Buscando API key de Groq...')
    
    for (const source of sources) {
      if (source.value && source.value.trim()) {
        this.apiKey = source.value.trim()
        console.log(`✅ [Groq Vision] API key encontrada desde: ${source.name}`)
        return
      } else {
        console.log(`❌ [Groq Vision] ${source.name}: ${source.value ? 'vacía' : 'no disponible'}`)
      }
    }

    this.apiKey = null
    console.log('⚠️ [Groq Vision] No se encontró API key de Groq en ninguna fuente')
  }

  public setApiKey(apiKey: string) {
    this.apiKey = apiKey
    console.log('🔑 API Key configurada manualmente')
  }

  public reloadApiKey() {
    envManager.reloadConfig()
    this.loadApiKey()
  }

  /**
   * IMPLEMENTACIÓN EXACTA del script Python
   */
  async extractMathFromImage(imageData: string | File): Promise<MathExtractionResult> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured')
    }

    try {
      const dataUri = await this.convertToDataUri(imageData)
      
      // Mensajes EXACTOS del script Python
      const messages = [
        {
          role: "system",
          content: "Devuelve SOLO un JSON válido con los siguientes campos:\n{\n  \"extracted_text\": \"texto tal cual extraído\",\n  \"extracted_equation\": \"ecuación matemática exacta\",\n  \"solution_steps\": [\"paso1\", \"paso2\", ...],\n  \"final_answer\": \"resultado final\"\n}"
        },
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: "Extrae el ejercicio de la imagen y resuélvelo paso a paso."
            },
            {
              type: "image_url", 
              image_url: {
                url: dataUri
              }
            }
          ]
        }
      ]

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: messages,
          temperature: 0,
          response_format: { type: "json_object" } // 🔑 fuerza JSON
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      console.log('\n=== JSON DEL MODELO ===\n')
      console.log(content)

      // Intentamos decodificar a dict (igual que Python)
      const parsed: GroqVisionResponse = JSON.parse(content)
      
      console.log('\n=== Ecuación extraída ===')
      console.log(parsed.extracted_equation || "❌ No encontrada")

      return {
        text: parsed.extracted_text || "Texto no extraído",
        equation: parsed.extracted_equation || "Ecuación no encontrada",
        steps: parsed.solution_steps || ["No se pudieron generar pasos"],
        answer: parsed.final_answer || "Respuesta no disponible",
        confidence: 95,
        provider: "Groq Vision"
      }

    } catch (error) {
      console.error('❌ Error al llamar a la API:', error)
      throw new Error(`Error procesando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * IMPLEMENTACIÓN EXACTA del script Python para texto
   */
  async solveMathProblemText(problem: string): Promise<MathExtractionResult> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured')
    }

    try {
      // Mensajes EXACTOS del script Python
      const messages = [
        {
          role: "system",
          content: "Devuelve SOLO un JSON válido con los siguientes campos:\n{\n  \"extracted_text\": \"texto tal cual extraído\",\n  \"extracted_equation\": \"ecuación matemática exacta\",\n  \"solution_steps\": [\"paso1\", \"paso2\", ...],\n  \"final_answer\": \"resultado final\"\n}"
        },
        {
          role: "user",
          content: `Extrae el ejercicio de la imagen y resuélvelo paso a paso. Problema: ${problem}`
        }
      ]

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: messages,
          temperature: 0,
          response_format: { type: "json_object" } // 🔑 fuerza JSON
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      console.log('\n=== JSON DEL MODELO ===\n')
      console.log(content)

      // Intentamos decodificar a dict (igual que Python)
      const parsed: GroqVisionResponse = JSON.parse(content)

      return {
        text: parsed.extracted_text || problem,
        equation: parsed.extracted_equation || problem,
        steps: parsed.solution_steps || ["No se pudieron generar pasos"],
        answer: parsed.final_answer || "Respuesta no disponible",
        confidence: 95,
        provider: "Groq Vision"
      }

    } catch (error) {
      console.error('❌ Error al llamar a la API:', error)
      throw new Error(`Error resolviendo problema: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  private async convertToDataUri(imageData: string | File): Promise<string> {
    if (typeof imageData === 'string') {
      return imageData
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(imageData)
    })
  }

  isAvailable(): boolean {
    // Siempre recargar la API key para asegurar que tenemos la más reciente
    this.loadApiKey()
    
    const available = !!this.apiKey
    console.log(`🔑 Groq Vision disponible: ${available}`)
    
    if (!available) {
      console.log('💡 Para configurar Groq Vision:')
      console.log('   - En desarrollo: Agrega NEXT_PUBLIC_GROQ_API_KEY a .env.local')
      console.log('   - En producción: Configura GROQ_API_KEY en las variables de entorno')
    }
    
    return available
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export const groqVision = new GroqVisionService()