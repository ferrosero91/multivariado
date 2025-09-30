// Servicio de IA para resolver ecuaciones matemáticas paso a paso
// Sistema multi-IA con fallback automático

interface SolutionStep {
  step: number
  description: string
  equation: string
  explanation: string
}

interface MathSolution {
  problem: string
  solution: string
  steps: SolutionStep[]
  type: string
  confidence: number
  provider?: string
}

interface AIProvider {
  name: string
  isAvailable: boolean
  priority: number
  solve: (problem: string) => Promise<MathSolution>
}

class AIMathSolver {
  private providers: AIProvider[] = []
  private groqApiKey: string | null = null
  private openRouterApiKey: string | null = null
  private huggingFaceApiKey: string | null = null

  constructor() {
    // Obtener API keys de variables de entorno
    this.groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || null
    this.openRouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || null
    this.huggingFaceApiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || null
    
    this.initializeProviders()
    
    if (typeof window !== 'undefined') {
      console.log('🤖 Multi-AI Math Solver initialized')
      this.logProviderStatus()
    }
  }

  private initializeProviders() {
    // Groq (Prioridad alta - muy rápido y preciso)
    this.providers.push({
      name: 'Groq',
      isAvailable: !!this.groqApiKey,
      priority: 1,
      solve: (problem: string) => this.solveWithGroq(problem)
    })

    // OpenRouter (Prioridad media - modelos gratuitos disponibles)
    this.providers.push({
      name: 'OpenRouter',
      isAvailable: true, // Tiene modelos gratuitos sin API key
      priority: 2,
      solve: (problem: string) => this.solveWithOpenRouter(problem)
    })

    // Hugging Face (Prioridad media - API gratuita)
    this.providers.push({
      name: 'Hugging Face',
      isAvailable: true, // API gratuita disponible
      priority: 3,
      solve: (problem: string) => this.solveWithHuggingFace(problem)
    })

    // Cohere (Prioridad baja - API gratuita limitada)
    this.providers.push({
      name: 'Cohere',
      isAvailable: true,
      priority: 4,
      solve: (problem: string) => this.solveWithCohere(problem)
    })

    // Ollama Local (Prioridad baja - requiere instalación local)
    this.providers.push({
      name: 'Ollama Local',
      isAvailable: false, // Se detectará dinámicamente
      priority: 5,
      solve: (problem: string) => this.solveWithOllama(problem)
    })

    // Fallback Local (Siempre disponible)
    this.providers.push({
      name: 'Local Fallback',
      isAvailable: true,
      priority: 10,
      solve: (problem: string) => Promise.resolve(this.generateFallbackSolution(problem))
    })

    // Ordenar por prioridad
    this.providers.sort((a, b) => a.priority - b.priority)
  }

  private logProviderStatus() {
    console.log('🔧 AI Providers Status:')
    this.providers.forEach(provider => {
      const status = provider.isAvailable ? '✅ Disponible' : '❌ No disponible'
      console.log(`  ${provider.name}: ${status} (Prioridad: ${provider.priority})`)
    })
  }

  // Método para verificar dinámicamente la disponibilidad de proveedores
  async checkProviderAvailability(): Promise<void> {
    console.log('🔍 Checking provider availability...')
    
    // Verificar Ollama local
    try {
      const ollamaProvider = this.providers.find(p => p.name === 'Ollama Local')
      if (ollamaProvider) {
        const response = await fetch('http://localhost:11434/api/tags', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        })
        ollamaProvider.isAvailable = response.ok
        console.log(`🏠 Ollama Local: ${ollamaProvider.isAvailable ? '✅ Available' : '❌ Not running'}`)
      }
    } catch (error) {
      const ollamaProvider = this.providers.find(p => p.name === 'Ollama Local')
      if (ollamaProvider) {
        ollamaProvider.isAvailable = false
      }
    }

    // Verificar otros proveedores con requests de prueba ligeros
    await this.testProviderConnectivity()
  }

  private async testProviderConnectivity(): Promise<void> {
    const testPromises = this.providers
      .filter(p => p.name !== 'Local Fallback' && p.name !== 'Ollama Local')
      .map(async (provider) => {
        try {
          // Test rápido de conectividad (sin resolver problema completo)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 segundos

          let testUrl = ''
          switch (provider.name) {
            case 'Groq':
              testUrl = 'https://api.groq.com/openai/v1/models'
              break
            case 'OpenRouter':
              testUrl = 'https://openrouter.ai/api/v1/models'
              break
            case 'Hugging Face':
              testUrl = 'https://api-inference.huggingface.co/models/gpt2'
              break
            case 'Cohere':
              testUrl = 'https://api.cohere.ai/v1/models'
              break
          }

          if (testUrl) {
            const response = await fetch(testUrl, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'Content-Type': 'application/json',
                ...(provider.name === 'Groq' && this.groqApiKey && { 'Authorization': `Bearer ${this.groqApiKey}` }),
                ...(provider.name === 'OpenRouter' && { 'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000' }),
                ...(provider.name === 'Hugging Face' && this.huggingFaceApiKey && { 'Authorization': `Bearer ${this.huggingFaceApiKey}` })
              }
            })

            clearTimeout(timeoutId)
            
            // Considerar disponible si responde (incluso con error de auth)
            provider.isAvailable = response.status < 500
            console.log(`🌐 ${provider.name}: ${provider.isAvailable ? '✅ Reachable' : '❌ Unreachable'} (${response.status})`)
          }
        } catch (error) {
          provider.isAvailable = false
          console.log(`🌐 ${provider.name}: ❌ Connection failed`)
        }
      })

    await Promise.allSettled(testPromises)
  }

  async solveMathProblem(problem: string): Promise<MathSolution> {
    console.log('🔍 Solving problem with multi-AI system:', problem)
    
    // Obtener proveedores disponibles ordenados por prioridad
    const availableProviders = this.providers.filter(p => p.isAvailable)
    
    console.log('🚀 Available providers:', availableProviders.map(p => p.name).join(', '))
    
    // Intentar con cada proveedor en orden de prioridad
    for (const provider of availableProviders) {
      try {
        console.log(`🔄 Trying ${provider.name}...`)
        
        const startTime = Date.now()
        const result = await Promise.race([
          provider.solve(problem),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 15000) // 15 segundos timeout
          )
        ])
        
        const duration = Date.now() - startTime
        console.log(`✅ ${provider.name} succeeded in ${duration}ms`)
        
        // Agregar información del proveedor al resultado
        result.provider = provider.name
        
        // Verificar calidad de la respuesta
        if (this.isValidSolution(result)) {
          return result
        } else {
          console.log(`⚠️ ${provider.name} returned invalid solution, trying next provider`)
          continue
        }
        
      } catch (error) {
        console.log(`❌ ${provider.name} failed:`, error instanceof Error ? error.message : 'Unknown error')
        
        // Si es el último proveedor disponible, no continuar
        if (provider === availableProviders[availableProviders.length - 1]) {
          console.log('🛠️ All providers failed, using local fallback')
          break
        }
        
        continue
      }
    }
    
    // Si todos fallan, usar fallback local
    console.log('🔧 Using local fallback solution')
    const fallback = this.generateFallbackSolution(problem)
    fallback.provider = 'Local Fallback'
    return fallback
  }

  private isValidSolution(solution: MathSolution): boolean {
    // Verificar que la solución tenga contenido válido
    return !!(
      solution.solution && 
      solution.solution.trim().length > 0 &&
      solution.steps && 
      solution.steps.length > 0 &&
      solution.solution !== 'Ver pasos para la solución'
    )
  }

  private async solveWithGroq(problem: string): Promise<MathSolution> {
    console.log('🚀 Starting Groq API call for:', problem)

    const prompt = `Eres un experto profesor de matemáticas especializado en cálculo multivariado, derivadas, integrales y ecuaciones diferenciales.

PROBLEMA: ${problem}

INSTRUCCIONES CRÍTICAS:
🚨 ECUACIONES DIFERENCIALES: Si ves "dy" y "dx" es una ECUACIÓN DIFERENCIAL
- Para 2x dy = (x + y) dx: separar variables o usar factor integrante
- NO solo dividir algebraicamente

🚨 LÍMITES MULTIVARIADOS: Si ves lim con (x,y) → (0,0)
- NUNCA apliques L'Hôpital a límites multivariados
- DEBES verificar múltiples trayectorias
- Si diferentes trayectorias → NO EXISTE

DETECCIÓN DE TIPOS:
- "dy/dx" o "dy" y "dx" → Ecuación Diferencial
- "d/dx" → Derivada
- "∫" → Integral
- "lim(x,y)" → Límite Multivariado
- "x^2 + 3x" sin operador → Derivada
- "=" con variables → Ecuación algebraica

METODOLOGÍA PARA ECUACIONES DIFERENCIALES:
1. Identificar tipo (separable, lineal, exacta)
2. Aplicar método apropiado
3. Integrar correctamente
4. Incluir constante de integración

Responde SOLO con JSON válido:
{
  "type": "tipo correcto del problema",
  "solution": "respuesta matemática final",
  "steps": [
    {
      "step": 1,
      "description": "nombre del paso",
      "equation": "ecuación matemática",
      "explanation": "explicación detallada del método"
    }
  ]
}

IMPORTANTE: Responde ÚNICAMENTE el JSON, sin texto adicional.`

    // Lista de modelos disponibles en orden de preferencia
    const models = [
      'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile', 
      'llama-3.2-3b-preview',
      'gemma2-9b-it'
    ]

    for (const model of models) {
      try {
        console.log(`🚀 Trying model: ${model}`)

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'Eres un profesor de matemáticas experto. Respondes ÚNICAMENTE con JSON válido, sin explicaciones adicionales.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 1500,
          }),
        })

        console.log(`📊 Response status for ${model}:`, response.status)

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Success with model: ${model}`)

          const content = data.choices?.[0]?.message?.content?.trim()

          if (!content) {
            console.error(`❌ No content in API response from ${model}`)
            continue
          }

          console.log('🤖 Groq response:', content)

          try {
            // Limpiar la respuesta para extraer solo el JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            const jsonString = jsonMatch ? jsonMatch[0] : content
            
            const parsed = JSON.parse(jsonString)
            
            return {
              problem,
              solution: parsed.solution || 'Ver pasos para la solución',
              steps: parsed.steps || [],
              type: parsed.type || 'Matemáticas',
              confidence: 0.95
            }
          } catch (parseError) {
            console.error(`❌ Error parsing response from ${model}:`, parseError)
            console.log('📝 Raw content:', content)
            return this.parseTextResponse(problem, content)
          }
        } else {
          const errorText = await response.text()
          console.warn(`⚠️ Model ${model} failed:`, response.status, errorText)
          continue
        }
      } catch (error) {
        console.warn(`⚠️ Error with model ${model}:`, error)
        continue
      }
    }

    // Si todos los modelos fallan, lanzar error
    throw new Error('All Groq models failed or are unavailable')
  }

  private async solveWithCohere(problem: string): Promise<MathSolution> {
    console.log('🔮 Using Cohere API')
    
    const prompt = `Eres un experto profesor de matemáticas especializado en cálculo multivariado, derivadas, integrales y ecuaciones diferenciales.

PROBLEMA: ${problem}

INSTRUCCIONES CRÍTICAS:
🚨 ECUACIONES DIFERENCIALES: Si ves "dy" y "dx" es una ECUACIÓN DIFERENCIAL
- Para 2x dy = (x + y) dx: separar variables o usar factor integrante
- NO solo dividir algebraicamente

🚨 LÍMITES MULTIVARIADOS: Si ves lim con (x,y) → (0,0)
- NUNCA apliques L'Hôpital a límites multivariados
- DEBES verificar múltiples trayectorias

TIPOS:
- "dy" y "dx" → Ecuación Diferencial
- "d/dx" → Derivada
- "lim(x,y)" → Límite Multivariado
- "x^2 + 3x" sin operador → Derivada

Responde con JSON:
{
  "type": "tipo correcto",
  "solution": "respuesta final",
  "steps": [{"step": 1, "description": "paso", "equation": "ecuación", "explanation": "explicación"}]
}`

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.huggingFaceApiKey || 'demo-key'}`, // Usar demo key si no hay API key
      },
      body: JSON.stringify({
        model: 'command-light',
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.1,
        stop_sequences: ['}'],
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.generations[0].text
      return this.parseTextResponse(problem, content)
    }

    throw new Error('Cohere API failed')
  }

  private async solveWithOllama(problem: string): Promise<MathSolution> {
    console.log('🏠 Using Ollama Local')
    
    // Verificar si Ollama está disponible localmente
    try {
      const healthCheck = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 segundos timeout
      })
      
      if (!healthCheck.ok) {
        throw new Error('Ollama not available')
      }
    } catch (error) {
      throw new Error('Ollama local server not running')
    }

    const prompt = `Resuelve este problema matemático paso a paso en español: ${problem}

Si es una expresión como "x^2 + 3x + 1" sin operador, calcula la derivada.
Proporciona pasos detallados y la solución final.`

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:3b', // Modelo ligero
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        }
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return this.parseTextResponse(problem, data.response)
    }

    throw new Error('Ollama API failed')
  }

  private async solveWithOpenRouter(problem: string): Promise<MathSolution> {
    console.log('🌐 Using OpenRouter API')
    
    const prompt = `Eres un experto profesor de matemáticas especializado en cálculo multivariado, derivadas, integrales y ecuaciones diferenciales.

PROBLEMA: ${problem}

INSTRUCCIONES CRÍTICAS:
🚨 ECUACIONES DIFERENCIALES: Si ves "dy" y "dx" es una ECUACIÓN DIFERENCIAL
- Para 2x dy = (x + y) dx: separar variables o usar factor integrante
- NO solo dividir algebraicamente

🚨 LÍMITES MULTIVARIADOS: Si ves lim con (x,y) → (0,0)
- NUNCA apliques L'Hôpital a límites multivariados
- DEBES verificar múltiples trayectorias
- Si diferentes trayectorias → NO EXISTE

DETECCIÓN DE TIPOS:
- "dy/dx" o "dy" y "dx" → Ecuación Diferencial
- "d/dx" → Derivada
- "∫" → Integral
- "lim(x,y)" → Límite Multivariado
- "x^2 + 3x" sin operador → Derivada
- "=" con variables → Ecuación algebraica

METODOLOGÍA PARA ECUACIONES DIFERENCIALES:
1. Identificar tipo (separable, lineal, exacta)
2. Aplicar método apropiado
3. Integrar correctamente
4. Incluir constante de integración

Responde SOLO con JSON válido:
{
  "type": "tipo correcto del problema",
  "solution": "respuesta matemática final",
  "steps": [
    {
      "step": 1,
      "description": "nombre del paso",
      "equation": "ecuación matemática",
      "explanation": "explicación detallada del método"
    }
  ]
}`

    // Lista de modelos gratuitos de OpenRouter
    const freeModels = [
      'meta-llama/llama-3.2-3b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2-7b-instruct:free'
    ]

    for (const model of freeModels) {
      try {
        console.log(`🔄 Trying OpenRouter model: ${model}`)
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
            'X-Title': 'EasyCal Pro',
            ...(this.openRouterApiKey && { 'Authorization': `Bearer ${this.openRouterApiKey}` })
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'Eres un profesor de matemáticas experto. Respondes ÚNICAMENTE con JSON válido.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 1200,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content?.trim()
          
          if (content) {
            console.log(`✅ OpenRouter ${model} succeeded`)
            
            try {
              // Intentar parsear como JSON
              const jsonMatch = content.match(/\{[\s\S]*\}/)
              const jsonString = jsonMatch ? jsonMatch[0] : content
              const parsed = JSON.parse(jsonString)
              
              return {
                problem,
                solution: parsed.solution || 'Ver pasos para la solución',
                steps: parsed.steps || [],
                type: parsed.type || 'Matemáticas',
                confidence: 0.85
              }
            } catch (parseError) {
              console.log(`⚠️ JSON parse failed for ${model}, using text parsing`)
              return this.parseTextResponse(problem, content)
            }
          }
        } else {
          console.log(`❌ OpenRouter ${model} failed:`, response.status)
          continue
        }
      } catch (error) {
        console.log(`❌ Error with OpenRouter ${model}:`, error)
        continue
      }
    }

    throw new Error('All OpenRouter models failed')
  }

  private async solveWithHuggingFace(problem: string): Promise<MathSolution> {
    console.log('🤗 Using Hugging Face API')
    
    const prompt = `Eres un experto profesor de matemáticas. Resuelve paso a paso: ${problem}

INSTRUCCIONES CRÍTICAS:
🚨 ECUACIONES DIFERENCIALES: Si ves "dy" y "dx" es una ECUACIÓN DIFERENCIAL
- Para 2x dy = (x + y) dx: separar variables o usar factor integrante
- NO solo dividir algebraicamente

🚨 LÍMITES MULTIVARIADOS: Si ves lim con (x,y) → (0,0)
- NUNCA apliques L'Hôpital a límites multivariados
- DEBES verificar múltiples trayectorias

TIPOS:
- "dy" y "dx" → Ecuación Diferencial
- "d/dx" → Derivada  
- "lim(x,y)" → Límite Multivariado
- "x^2 + 3x" sin operador → Derivada

Proporciona pasos detallados y solución final correcta.`

    // Lista de modelos gratuitos de Hugging Face
    const models = [
      'microsoft/DialoGPT-medium',
      'facebook/blenderbot-400M-distill',
      'microsoft/DialoGPT-small',
      'google/flan-t5-base'
    ]

    for (const model of models) {
      try {
        console.log(`🔄 Trying Hugging Face model: ${model}`)
        
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(this.huggingFaceApiKey && { 'Authorization': `Bearer ${this.huggingFaceApiKey}` })
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                max_length: 800,
                temperature: 0.1,
                do_sample: true,
                top_p: 0.9,
              },
              options: {
                wait_for_model: true,
                use_cache: false
              }
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          
          // Manejar diferentes formatos de respuesta
          let content = ''
          if (Array.isArray(data) && data[0]?.generated_text) {
            content = data[0].generated_text
          } else if (data.generated_text) {
            content = data.generated_text
          } else if (typeof data === 'string') {
            content = data
          }
          
          if (content && content.trim().length > 0) {
            console.log(`✅ Hugging Face ${model} succeeded`)
            return this.parseTextResponse(problem, content)
          }
        } else {
          const errorText = await response.text()
          console.log(`❌ Hugging Face ${model} failed:`, response.status, errorText)
          
          // Si el modelo está cargando, esperar un poco
          if (response.status === 503) {
            console.log('⏳ Model is loading, waiting...')
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
        }
      } catch (error) {
        console.log(`❌ Error with Hugging Face ${model}:`, error)
        continue
      }
    }

    throw new Error('All Hugging Face models failed')
  }

  private parseTextResponse(problem: string, response: string): MathSolution {
    // Parsear respuesta de texto libre
    const lines = response.split('\n').filter(line => line.trim())
    const steps: SolutionStep[] = []
    let solution = ''
    let type = 'General'

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('solución') || line.toLowerCase().includes('respuesta')) {
        solution = line.replace(/^.*?[:=]\s*/, '')
      } else if (line.match(/^\d+\./)) {
        steps.push({
          step: steps.length + 1,
          description: `Paso ${steps.length + 1}`,
          equation: line,
          explanation: line
        })
      }
    })

    return {
      problem,
      solution: solution || 'Ver pasos para la solución',
      steps: steps.length > 0 ? steps : this.generateDefaultSteps(problem),
      type,
      confidence: 0.7
    }
  }

  private generateFallbackSolution(problem: string): MathSolution {
    // Generar solución básica basada en patrones comunes
    const type = this.detectProblemType(problem)
    const steps = this.generateDefaultSteps(problem)
    
    return {
      problem,
      solution: this.generateBasicSolution(problem, type),
      steps,
      type,
      confidence: 0.6
    }
  }

  private detectProblemType(problem: string): string {
    const lowerProblem = problem.toLowerCase()
    
    if (lowerProblem.includes('d/dx') || lowerProblem.includes('derivada')) {
      return 'Cálculo Diferencial'
    } else if (lowerProblem.includes('∫') || lowerProblem.includes('integral')) {
      return 'Cálculo Integral'
    } else if (lowerProblem.includes('lim') || lowerProblem.includes('límite')) {
      return 'Límites'
    } else if (lowerProblem.includes('=') && lowerProblem.includes('x')) {
      return 'Álgebra - Ecuaciones'
    } else if (lowerProblem.includes('sen') || lowerProblem.includes('cos') || lowerProblem.includes('tan')) {
      return 'Trigonometría'
    } else if (lowerProblem.includes('matriz') || lowerProblem.includes('determinante')) {
      return 'Álgebra Lineal'
    } else if (/x\^?\d+|x\*|x\+|x\-/.test(lowerProblem) && !lowerProblem.includes('=')) {
      // Si contiene variables pero no ecuaciones, probablemente es para derivar
      return 'Cálculo Diferencial'
    }
    
    return 'Matemáticas Generales'
  }

  private generateBasicSolution(problem: string, type: string): string {
    switch (type) {
      case 'Cálculo Diferencial':
        return 'Aplicar reglas de derivación'
      case 'Cálculo Integral':
        return 'Aplicar técnicas de integración'
      case 'Álgebra - Ecuaciones':
        return 'Despejar la variable x'
      default:
        return 'Resolver usando métodos matemáticos apropiados'
    }
  }

  private generateDefaultSteps(problem: string): SolutionStep[] {
    const type = this.detectProblemType(problem)
    
    switch (type) {
      case 'Cálculo Diferencial':
        return [
          {
            step: 1,
            description: 'Identificar la función a derivar',
            equation: problem,
            explanation: 'Analizamos la función dada para determinar qué reglas de derivación aplicar.'
          },
          {
            step: 2,
            description: 'Aplicar reglas de derivación',
            equation: 'f\'(x) = ...',
            explanation: 'Aplicamos las reglas correspondientes (regla del producto, cadena, etc.).'
          },
          {
            step: 3,
            description: 'Simplificar el resultado',
            equation: 'Resultado final',
            explanation: 'Simplificamos la expresión obtenida para llegar al resultado final.'
          }
        ]
      
      case 'Álgebra - Ecuaciones':
        return [
          {
            step: 1,
            description: 'Reorganizar la ecuación',
            equation: problem,
            explanation: 'Movemos todos los términos con x a un lado y las constantes al otro.'
          },
          {
            step: 2,
            description: 'Simplificar términos semejantes',
            equation: 'Ecuación simplificada',
            explanation: 'Combinamos términos similares para simplificar la ecuación.'
          },
          {
            step: 3,
            description: 'Despejar x',
            equation: 'x = ...',
            explanation: 'Realizamos las operaciones necesarias para obtener el valor de x.'
          }
        ]
      
      default:
        return [
          {
            step: 1,
            description: 'Analizar el problema',
            equation: problem,
            explanation: 'Identificamos qué tipo de problema matemático tenemos y qué método usar.'
          },
          {
            step: 2,
            description: 'Aplicar método de solución',
            equation: 'Proceso de solución',
            explanation: 'Aplicamos el método matemático apropiado para resolver el problema.'
          },
          {
            step: 3,
            description: 'Verificar y concluir',
            equation: 'Resultado final',
            explanation: 'Verificamos nuestro resultado y presentamos la solución final.'
          }
        ]
    }
  }

  // Método para resolver problemas específicos con lógica local
  async solveSpecificProblem(problem: string): Promise<MathSolution> {
    const lowerProblem = problem.toLowerCase().trim()
    
    console.log('🔍 Analyzing problem type:', problem)
    
    // Intentar primero con IA si está disponible
    if (this.groqApiKey) {
      try {
        console.log('🤖 Trying AI first...')
        const aiResult = await this.solveMathProblem(problem)
        
        // Verificar si la IA devolvió pasos válidos
        if (aiResult.steps && aiResult.steps.length > 0) {
          console.log('✅ AI returned valid steps:', aiResult.steps.length)
          return aiResult
        } else {
          console.log('⚠️ AI returned no steps, falling back to local logic')
        }
      } catch (error) {
        console.log('⚠️ AI failed, using local logic:', error)
      }
    }
    
    // Fallback a lógica local con pasos detallados
    console.log('🛠️ Using local logic for problem type detection')
    
    // Ecuaciones cuadráticas
    if (this.isQuadraticEquation(problem)) {
      return this.solveQuadratic(problem)
    }
    
    // Derivadas explícitas
    if (lowerProblem.includes('d/dx')) {
      return this.solveBasicDerivative(problem)
    }
    
    // Auto-detectar derivadas (expresiones con variables sin =)
    if (/x\^?\d+|x\*|x\+|x\-/.test(lowerProblem) && !lowerProblem.includes('=')) {
      console.log('🔍 Auto-detected derivative problem')
      return this.solveBasicDerivative(`d/dx (${problem})`)
    }
    
    // Integrales básicas
    if (lowerProblem.includes('∫')) {
      return this.solveBasicIntegral(problem)
    }
    
    // Fallback genérico
    return this.generateFallbackSolution(problem)
  }

  private isQuadraticEquation(problem: string): boolean {
    return /x\^?2|x²/.test(problem) && problem.includes('=')
  }

  private solveQuadratic(problem: string): MathSolution {
    // Lógica básica para ecuaciones cuadráticas
    return {
      problem,
      solution: 'x₁ = ..., x₂ = ...',
      steps: [
        {
          step: 1,
          description: 'Identificar coeficientes',
          equation: 'ax² + bx + c = 0',
          explanation: 'Identificamos los valores de a, b y c en la ecuación cuadrática.'
        },
        {
          step: 2,
          description: 'Aplicar fórmula cuadrática',
          equation: 'x = (-b ± √(b² - 4ac)) / 2a',
          explanation: 'Usamos la fórmula cuadrática para encontrar las soluciones.'
        },
        {
          step: 3,
          description: 'Calcular discriminante',
          equation: 'Δ = b² - 4ac',
          explanation: 'El discriminante nos dice cuántas soluciones reales tiene la ecuación.'
        },
        {
          step: 4,
          description: 'Obtener soluciones',
          equation: 'x₁ = ..., x₂ = ...',
          explanation: 'Calculamos las dos soluciones de la ecuación cuadrática.'
        }
      ],
      type: 'Álgebra - Ecuación Cuadrática',
      confidence: 0.95
    }
  }

  private solveBasicDerivative(problem: string): MathSolution {
    // Extraer la función del problema
    const functionMatch = problem.match(/d\/dx\s*\((.+)\)/) || problem.match(/d\/dx\s*(.+)/)
    const func = functionMatch ? functionMatch[1] : problem
    
    // Generar pasos básicos para derivadas comunes
    let steps = []
    let solution = "f'(x) = ..."
    
    if (func.includes('x^2') || func.includes('x²')) {
      // Calcular la derivada real
      let derivativeTerms = []
      
      // Manejar x^2 o x²
      if (func.includes('x^2') || func.includes('x²')) {
        derivativeTerms.push('2x')
      }
      
      // Manejar términos lineales como 3x
      const linearMatch = func.match(/([+-]?\s*\d*)\s*x(?!\^|²)/g)
      if (linearMatch) {
        linearMatch.forEach(term => {
          const coeff = term.replace(/\s/g, '').replace('x', '') || '1'
          if (coeff !== '0') {
            derivativeTerms.push(coeff === '1' ? '1' : coeff === '-1' ? '-1' : coeff)
          }
        })
      }
      
      // Las constantes desaparecen en la derivada
      solution = derivativeTerms.length > 0 ? derivativeTerms.join(' + ').replace(/\+ -/g, '- ') : '0'
      
      steps = [
        {
          step: 1,
          description: 'Identificar términos',
          equation: `f(x) = ${func}`,
          explanation: 'Identificamos cada término de la función para aplicar las reglas de derivación.'
        },
        {
          step: 2,
          description: 'Aplicar regla de potencias para x²',
          equation: 'd/dx(x²) = 2x',
          explanation: 'Para x², aplicamos la regla: d/dx(xⁿ) = n·xⁿ⁻¹, entonces d/dx(x²) = 2x¹ = 2x'
        },
        {
          step: 3,
          description: 'Derivar términos lineales',
          equation: 'd/dx(ax) = a',
          explanation: 'La derivada de un término lineal ax es simplemente el coeficiente a.'
        },
        {
          step: 4,
          description: 'Eliminar constantes',
          equation: 'd/dx(c) = 0',
          explanation: 'La derivada de cualquier constante es cero.'
        },
        {
          step: 5,
          description: 'Resultado final',
          equation: `f'(x) = ${solution}`,
          explanation: 'Combinamos todos los términos derivados para obtener la derivada final.'
        }
      ]
    } else if (func.includes('sin')) {
      solution = func.replace(/sin\(x\)/g, 'cos(x)')
      steps = [
        {
          step: 1,
          description: 'Identificar función trigonométrica',
          equation: `f(x) = ${func}`,
          explanation: 'Tenemos una función que contiene seno.'
        },
        {
          step: 2,
          description: 'Aplicar regla del seno',
          equation: 'd/dx(sin(x)) = cos(x)',
          explanation: 'La derivada del seno es el coseno.'
        },
        {
          step: 3,
          description: 'Resultado final',
          equation: `f'(x) = ${solution}`,
          explanation: 'La derivada de la función es el coseno.'
        }
      ]
    } else {
      steps = [
        {
          step: 1,
          description: 'Identificar la función',
          equation: `f(x) = ${func}`,
          explanation: 'Identificamos la función que vamos a derivar.'
        },
        {
          step: 2,
          description: 'Aplicar reglas de derivación',
          equation: 'f\'(x) = ...',
          explanation: 'Aplicamos las reglas de derivación correspondientes según el tipo de función.'
        }
      ]
    }
    
    return {
      problem,
      solution,
      steps,
      type: 'Cálculo Diferencial',
      confidence: 0.9
    }
  }

  private solveBasicIntegral(problem: string): MathSolution {
    return {
      problem,
      solution: '∫ f(x) dx = F(x) + C',
      steps: [
        {
          step: 1,
          description: 'Identificar la función a integrar',
          equation: problem,
          explanation: 'Identificamos la función que vamos a integrar.'
        },
        {
          step: 2,
          description: 'Aplicar técnicas de integración',
          equation: 'F(x) + C',
          explanation: 'Aplicamos las técnicas de integración apropiadas.'
        }
      ],
      type: 'Cálculo Integral',
      confidence: 0.9
    }
  }
}

export const aiSolver = new AIMathSolver()
export type { MathSolution, SolutionStep }