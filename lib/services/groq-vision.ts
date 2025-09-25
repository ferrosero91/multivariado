// Servicio de visión con Groq para reconocimiento de ejercicios matemáticos
// Basado en el script Python proporcionado

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
  }

  private loadApiKey() {
    // Usar el administrador de entorno centralizado
    this.apiKey = getGroqApiKey()
  }

  /**
   * Configura la API key manualmente (útil para debugging)
   */
  public setApiKey(apiKey: string) {
    this.apiKey = apiKey
    console.log('🔑 API Key configurada manualmente')
  }

  /**
   * Fuerza la recarga de la API key desde las variables de entorno
   */
  public reloadApiKey() {
    envManager.reloadConfig()
    this.loadApiKey()
  }

  /**
   * Extrae y resuelve ejercicios matemáticos de una imagen usando Groq Vision
   */
  async extractMathFromImage(imageData: string | File): Promise<MathExtractionResult> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured')
    }

    try {
      // Convertir imagen a base64 data URI
      const dataUri = await this.convertToDataUri(imageData)
      
      // Crear mensajes para el modelo (igual que en Python)
      const messages = [
        {
          role: "system",
          content: `Eres un experto profesor de matemáticas que extrae y resuelve ejercicios de imágenes con explicaciones detalladas.

IMPORTANTE: Devuelve SOLO un JSON válido con estos campos exactos:
{
  "extracted_text": "texto tal cual extraído de la imagen",
  "extracted_equation": "ecuación matemática exacta y limpia",
  "solution_steps": ["paso detallado 1", "paso detallado 2", "..."],
  "final_answer": "resultado final completo"
}

REGLAS PARA SOLUTION_STEPS:
- Cada paso debe ser una explicación completa y detallada
- Incluir el razonamiento matemático detrás de cada operación
- Mostrar transformaciones algebraicas paso a paso
- Para ecuaciones diferenciales: explicar el método, factor integrante, etc.
- Para derivadas: mostrar reglas aplicadas y simplificaciones
- Para integrales: explicar técnicas de integración usadas
- Mínimo 5-8 pasos para problemas complejos
- Usar terminología matemática precisa

REGLAS GENERALES:
- extracted_equation debe ser matemáticamente válida
- final_answer debe incluir constantes de integración si aplica
- solution_steps debe tener explicaciones pedagógicas claras
- Si hay múltiples ecuaciones, procesarlas por separado`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrae el ejercicio de la imagen y resuélvelo paso a paso con explicaciones detalladas."
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
          response_format: { type: "json_object" }
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      // Parsear respuesta JSON
      const parsed: GroqVisionResponse = JSON.parse(content)

      return {
        text: parsed.extracted_text || "Texto no extraído",
        equation: parsed.extracted_equation || "Ecuación no encontrada",
        steps: parsed.solution_steps || ["No se pudieron generar pasos"],
        answer: parsed.final_answer || "Respuesta no disponible",
        confidence: 95, // Alta confianza para Groq Vision
        provider: "Groq Vision"
      }

    } catch (error) {
      console.error('Error en Groq Vision:', error)
      throw new Error(`Error procesando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Resuelve problemas matemáticos de texto usando Groq
   */
  async solveMathProblemText(problem: string): Promise<MathExtractionResult> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured')
    }

    try {
      const messages = [
        {
          role: "system",
          content: `Eres un experto profesor de matemáticas que resuelve problemas matemáticos con explicaciones detalladas.

IMPORTANTE: Devuelve SOLO un JSON válido con estos campos exactos:
{
  "extracted_text": "problema tal cual proporcionado",
  "extracted_equation": "ecuación matemática principal",
  "solution_steps": ["paso detallado 1", "paso detallado 2", "..."],
  "final_answer": "resultado final completo"
}

REGLAS PARA SOLUTION_STEPS:
- Cada paso debe ser una explicación completa y detallada
- Incluir el razonamiento matemático detrás de cada operación
- Mostrar transformaciones algebraicas paso a paso
- Para ecuaciones diferenciales: explicar el método, factor integrante, etc.
- Para derivadas: mostrar reglas aplicadas y simplificaciones
- Para integrales: explicar técnicas de integración usadas
- Mínimo 5-8 pasos para problemas complejos
- Usar terminología matemática precisa`
        },
        {
          role: "user",
          content: `Resuelve este problema matemático paso a paso con explicaciones detalladas: ${problem}`
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
          response_format: { type: "json_object" }
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      // Parsear respuesta JSON
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
      console.error('Error en Groq text solving:', error)
      throw new Error(`Error resolviendo problema: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Convierte imagen a data URI base64
   */
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

  /**
   * Verifica si el servicio está disponible
   */
  isAvailable(): boolean {
    // Si no hay API key, intentar recargarla
    if (!this.apiKey) {
      this.loadApiKey()
    }
    return !!this.apiKey
  }

  /**
   * Test de conectividad
   */
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

// Instancia singleton
export const groqVision = new GroqVisionService()
