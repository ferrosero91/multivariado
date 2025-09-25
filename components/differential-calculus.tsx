"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, Target, Zap, Camera } from "lucide-react"
import FunctionPlot from "./function-plot"
import CameraUpload from "./camera-upload"
import { MathEvaluator } from "./math-evaluator"
import { aiSolver } from "@/lib/ai-solver"
import { groqVision } from "@/lib/services/groq-vision"
import EnhancedStepDisplay from "./enhanced-step-display"

export default function DifferentialCalculus() {
  const [functionInput, setFunctionInput] = useState("x^2 + 3*x + 2")
  const [variable, setVariable] = useState("x")
  const [order, setOrder] = useState("1")
  const [result, setResult] = useState("")
  const [derivative, setDerivative] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [criticalPoints, setCriticalPoints] = useState<Array<{ x: number; y: number; type: string }>>([])
  const [tangentLine, setTangentLine] = useState<{ point: [number, number]; slope: number } | undefined>()
  const [tangentPoint, setTangentPoint] = useState("1")
  const [aiSteps, setAiSteps] = useState<string[]>([])
  const [groqResult, setGroqResult] = useState<{steps: string[], answer: string} | null>(null)
  const [showEnhancedSteps, setShowEnhancedSteps] = useState(false)

  const mathEvaluator = MathEvaluator.getInstance()

  const calculateDerivative = async () => {
    setIsCalculating(true)

    try {
      // Primero intentar con Groq Vision si está disponible
      if (groqVision.isAvailable()) {
        console.log('🚀 Using Groq Vision for derivative calculation...')
        const problem = `d/dx (${functionInput})`
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(groqSolution.answer)
        setDerivative(groqSolution.answer)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
        
        console.log('✅ Groq Vision solution received:', groqSolution)
      } else {
        // Fallback al AI solver normal
        const problem = `d/dx (${functionInput})`
        console.log('🧮 Calculating derivative with AI fallback:', problem)
        
        const solution = await aiSolver.solveSpecificProblem(problem)
        
        setResult(solution.solution)
        setDerivative(solution.solution)
        setGroqResult(null)
        
        // Verificar si hay pasos válidos
        if (solution.steps && solution.steps.length > 0) {
          const steps = solution.steps.map(step => step.explanation)
          setAiSteps(steps)
          console.log('📝 AI steps received:', steps)
        } else {
          console.log('⚠️ No AI steps received, using default steps')
          setAiSteps([])
        }
        
        console.log('✅ AI solution received:', solution)
      }

      // Encontrar puntos críticos automáticamente (usando evaluador matemático como fallback)
      try {
        const criticalPts = mathEvaluator.findCriticalPoints(functionInput, [-5, 5])
        setCriticalPoints(criticalPts)
      } catch (error) {
        console.log('⚠️ Could not find critical points:', error)
        setCriticalPoints([])
      }
    } catch (error) {
      console.error("[v0] Error calculating derivative:", error)
      setResult("Error al calcular la derivada. Verifica la expresión.")
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateLimit = async () => {
    setIsCalculating(true)
    
    try {
      // Primero intentar con Groq Vision si está disponible
      if (groqVision.isAvailable()) {
        console.log('🚀 Using Groq Vision for limit calculation...')
        const problem = `lim(x→0) (${functionInput})`
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(groqSolution.answer)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
        
        console.log('✅ Groq Vision limit solution received:', groqSolution)
      } else {
        // Fallback al AI solver normal
        const problem = `lim(x→0) (${functionInput})`
        console.log('🧮 Calculating limit with AI fallback:', problem)
        
        const solution = await aiSolver.solveSpecificProblem(problem)
        setResult(solution.solution)
        setGroqResult(null)
        
        console.log('✅ AI limit solution received:', solution)
      }
    } catch (error) {
      console.error('❌ Error calculating limit:', error)
      // Fallback al método numérico
      try {
        const limitValue = mathEvaluator.evaluate(functionInput, 0)
        if (isFinite(limitValue)) {
          setResult(`lim(x→0) f(x) = ${limitValue.toFixed(4)}`)
        } else {
          setResult("El límite no existe o es infinito")
        }
      } catch (fallbackError) {
        setResult("Error al calcular el límite")
      }
    } finally {
      setIsCalculating(false)
    }
    setDerivative("")
    setCriticalPoints([])
  }

  const findCriticalPoints = () => {
    try {
      const criticalPts = mathEvaluator.findCriticalPoints(functionInput, [-10, 10])
      setCriticalPoints(criticalPts)

      if (criticalPts.length > 0) {
        const pointsText = criticalPts.map((p) => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) - ${p.type}`).join(", ")
        setResult(`Puntos críticos encontrados: ${pointsText}`)
      } else {
        setResult("No se encontraron puntos críticos en el rango [-10, 10]")
      }
    } catch (error) {
      setResult("Error al encontrar puntos críticos")
    }
  }

  const calculateTangentLine = () => {
    try {
      const x = Number.parseFloat(tangentPoint)
      if (isNaN(x)) {
        setResult("Por favor ingresa un punto válido para la tangente")
        return
      }

      const y = mathEvaluator.evaluate(functionInput, x)
      const slope = mathEvaluator.derivative(functionInput, x)

      if (isFinite(y) && isFinite(slope)) {
        const point: [number, number] = [x, y]
        setTangentLine({ point, slope })

        // Ecuación de la línea tangente: y - y1 = m(x - x1)
        // y = mx - mx1 + y1
        const b = y - slope * x
        setResult(`Línea tangente en x=${x}: y = ${slope.toFixed(3)}x + ${b.toFixed(3)}`)
      } else {
        setResult("No se puede calcular la tangente en este punto")
      }
    } catch (error) {
      setResult("Error al calcular la línea tangente")
    }
  }

  const calculateDomainRange = async () => {
    try {
      // Usar Groq Vision para calcular dominio y rango
      if (groqVision.isAvailable()) {
        console.log('🚀 Using Groq Vision for domain and range calculation...')
        const problem = `Determinar el dominio y rango de la función f(x) = ${functionInput}`
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(`Dominio y Rango: ${groqSolution.answer}`)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
        
        console.log('✅ Groq Vision domain/range solution received:', groqSolution)
      } else {
        // Análisis básico local
        let domain = "ℝ (todos los reales)"
        let range = "Depende de la función"
        
        if (functionInput.includes("sqrt")) {
          domain = "x ≥ 0 (para √x)"
        } else if (functionInput.includes("1/x") || functionInput.includes("/x")) {
          domain = "ℝ - {0} (todos los reales excepto 0)"
        } else if (functionInput.includes("ln") || functionInput.includes("log")) {
          domain = "x > 0 (reales positivos)"
        }
        
        setResult(`Dominio: ${domain}\nRango: ${range}`)
      }
    } catch (error) {
      console.error('❌ Error calculating domain and range:', error)
      setResult("Error al calcular dominio y rango")
    }
  }

  const handleImageProcessed = (expression: string) => {
    setFunctionInput(expression)
    setShowCamera(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Entrada de Función
            </CardTitle>
            <CardDescription>Ingresa la función que deseas derivar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="function">Función f(x)</Label>
              <Input
                id="function"
                value={functionInput}
                onChange={(e) => setFunctionInput(e.target.value)}
                placeholder="Ej: x^2 + 3*x + 2, sin(x), ln(x)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="variable">Variable</Label>
                <Select value={variable} onValueChange={setVariable}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="x">x</SelectItem>
                    <SelectItem value="y">y</SelectItem>
                    <SelectItem value="t">t</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="order">Orden</Label>
                <Select value={order} onValueChange={setOrder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Primera</SelectItem>
                    <SelectItem value="2">Segunda</SelectItem>
                    <SelectItem value="3">Tercera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tangent-point">Punto para Tangente</Label>
              <Input
                id="tangent-point"
                value={tangentPoint}
                onChange={(e) => setTangentPoint(e.target.value)}
                placeholder="Ej: 1"
                type="number"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button onClick={calculateDerivative} disabled={isCalculating}>
                {isCalculating ? "Calculando..." : "Calcular Derivada"}
              </Button>
              <Button variant="outline" onClick={calculateLimit}>
                Calcular Límite
              </Button>
              <Button variant="outline" onClick={findCriticalPoints}>
                Puntos Críticos
              </Button>
              <Button variant="outline" onClick={calculateTangentLine}>
                Línea Tangente
              </Button>
              <Button variant="outline" onClick={calculateDomainRange}>
                Dominio y Rango
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowCamera(!showCamera)}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {showCamera ? "Ocultar Cámara" : "Usar Cámara"}
              </Button>
              {groqResult && (
                <Button
                  variant="default"
                  onClick={() => setShowEnhancedSteps(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Zap className="h-4 w-4" />
                  Ver Solución Detallada
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resultados
            </CardTitle>
            <CardDescription>Solución paso a paso</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Resultado:</h4>
                  <p className="font-mono text-lg">{result}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold">Pasos de la solución (IA):</h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {aiSteps.length > 0 ? (
                      aiSteps.map((step, index) => (
                        <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="font-medium">{index + 1}.</span> {step}
                        </div>
                      ))
                    ) : (
                      <div className="space-y-1">
                        <p>1. Analizar la función de entrada</p>
                        <p>2. Aplicar reglas de derivación</p>
                        <p>3. Calcular valores numéricos</p>
                        <p>4. Generar visualización gráfica</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <Zap className="h-3 w-3 mr-1" />
                    Cálculo Numérico
                  </Badge>
                  {criticalPoints.length > 0 && (
                    <Badge variant="outline">{criticalPoints.length} Puntos Críticos</Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Los resultados aparecerán aquí</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Camera Upload */}
      {showCamera && (
        <CameraUpload
          onImageProcessed={handleImageProcessed}
          onImageSelected={(imageUrl) => console.log("[v0] Image selected:", imageUrl)}
        />
      )}

      <FunctionPlot
        expression={functionInput}
        derivative={derivative}
        title={`Visualización de f(x) = ${functionInput}`}
        showDerivative={!!derivative}
        criticalPoints={criticalPoints}
        tangentLine={tangentLine}
        xRange={[-5, 5]}
      />

      {/* Modal de Solución Detallada con Groq Vision */}
      {showEnhancedSteps && groqResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
            <div className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-2xl font-bold">Solución Detallada con IA</h2>
                <Button variant="ghost" onClick={() => setShowEnhancedSteps(false)} size="sm">
                  ✕
                </Button>
              </div>
              <EnhancedStepDisplay 
                steps={groqResult.steps}
                equation={`d/dx (${functionInput})`}
                answer={groqResult.answer}
                provider="Groq Vision"
                confidence={95}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
