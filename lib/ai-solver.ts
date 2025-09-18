// Servicio de IA para resolver ecuaciones matemáticas paso a paso
// Usando APIs gratuitas como Groq, OpenRouter, o Hugging Face

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
}

class AIMathSolver {
  private groqApiKey: string | null = null
  private groqBaseUrl: string = 'https://api.groq.com/openai/v1'
  private huggingFaceUrl: string = 'https://api-inference.huggingface.co'

  constructor() {
    // Obtener API keys de variables de entorno
    this.groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || null
    
    if (typeof window !== 'undefined') {
      console.log('🤖 AI Math Solver initialized')
      console.log('📡 Groq API:', this.groqApiKey ? '✅ Configured' : '❌ Not configured')
      if (this.groqApiKey) {
        console.log('🔑 API Key preview:', this.groqApiKey.substring(0, 10) + '...')
      }
    }
  }

  async solveMathProblem(problem: string): Promise<MathSolution> {
    console.log('🔍 Solving problem:', problem)
    
    try {
      // Intentar con Groq primero si tenemos API key
      if (this.groqApiKey) {
        console.log('🚀 Using Groq API')
        return await this.solveWithGroq(problem)
      } else {
        console.log('🔄 Using fallback methods')
        return await this.solveWithFallback(problem)
      }
    } catch (error) {
      console.error('❌ Error solving math problem:', error)
      console.log('🛠️ Generating fallback solution')
      return this.generateFallbackSolution(problem)
    }
  }

  private async solveWithGroq(problem: string): Promise<MathSolution> {
    console.log('🚀 Starting Groq API call for:', problem)

    const prompt = `Resuelve este problema matemático paso a paso en español:

PROBLEMA: ${problem}

INSTRUCCIONES ESPECÍFICAS:
- Si es una expresión como "x^2 + 3x + 1" sin operador, asume que se pide la DERIVADA
- Si contiene "d/dx", calcula la derivada
- Si contiene "∫", calcula la integral
- Si contiene "=", resuelve la ecuación
- Si contiene "lim", calcula el límite

Responde SOLO con un JSON válido en este formato exacto:
{
  "type": "tipo de problema (ej: Cálculo Diferencial, Cálculo Integral, Álgebra, etc.)",
  "solution": "respuesta final clara y específica",
  "steps": [
    {
      "step": 1,
      "description": "nombre del paso",
      "equation": "ecuación o expresión matemática",
      "explanation": "explicación clara de qué se hace y por qué"
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

        const response = await fetch(`${this.groqBaseUrl}/chat/completions`, {
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

  private async solveWithFallback(problem: string): Promise<MathSolution> {
    console.log('� Terying fallback methods...')
    
    // Intentar con diferentes APIs gratuitas
    try {
      return await this.solveWithOpenRouter(problem)
    } catch (error) {
      console.log('⚠️ OpenRouter failed, trying Hugging Face...')
      try {
        return await this.solveWithHuggingFace(problem)
      } catch (error2) {
        console.log('⚠️ All APIs failed, using local logic...')
        return this.generateFallbackSolution(problem)
      }
    }
  }

  private async solveWithOpenRouter(problem: string): Promise<MathSolution> {
    // OpenRouter ofrece modelos gratuitos
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        'X-Title': 'EasyCal Pro'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'Eres un profesor de matemáticas. Resuelve problemas paso a paso en español.'
          },
          {
            role: 'user',
            content: `Resuelve paso a paso: ${problem}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0].message.content
      return this.parseTextResponse(problem, content)
    }

    throw new Error('OpenRouter API failed')
  }

  private async solveWithHuggingFace(problem: string): Promise<MathSolution> {
    // Usar Hugging Face Inference API (gratuita)
    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `Resuelve paso a paso: ${problem}`,
          parameters: {
            max_length: 500,
            temperature: 0.1,
          },
        }),
      }
    )

    if (response.ok) {
      const data = await response.json()
      return this.parseTextResponse(problem, data[0]?.generated_text || '')
    }

    throw new Error('Hugging Face API failed')
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