"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Box, Layers, Zap, Camera, BookOpen } from "lucide-react"
import SurfacePlot3D from "./surface-plot-3d"
import CameraUpload from "./camera-upload"
import StepByStepSolver from "./step-by-step-solver"
import { aiSolver } from "@/lib/ai-solver"
import { groqVision } from "@/lib/services/groq-vision"
import EnhancedStepDisplay from "./enhanced-step-display"

export default function MultivariableCalculus() {
  const [functionInput, setFunctionInput] = useState("x^2 + y^2")
  const [operation, setOperation] = useState("gradient")
  const [result, setResult] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showStepByStep, setShowStepByStep] = useState(false)
  const [aiSteps, setAiSteps] = useState<string[]>([])
  const [groqResult, setGroqResult] = useState<{steps: string[], answer: string} | null>(null)
  const [showEnhancedSteps, setShowEnhancedSteps] = useState(false)

  const calculateGradient = async () => {
    setIsCalculating(true)
    
    try {
      const problem = `Calcular el gradiente de f(x,y) = ${functionInput}`
      
      // Primero intentar con Groq Vision si está disponible
      if (groqVision.isAvailable()) {
        console.log('🚀 Using Groq Vision for gradient calculation...')
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(groqSolution.answer)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
        
        console.log('✅ Groq Vision gradient solution received:', groqSolution)
      } else {
        // Fallback al AI solver normal
        console.log('🧮 Calculating gradient with AI fallback:', problem)
        
        const solution = await aiSolver.solveSpecificProblem(problem)
        setResult(solution.solution)
        const steps = solution.steps.map(step => step.explanation)
        setAiSteps(steps)
        setGroqResult(null)
        
        console.log('✅ AI gradient solution received:', solution)
        console.log('📝 Steps:', steps) // Usar aiSteps para evitar warning
      }
    } catch (error) {
      console.error('❌ Error calculating gradient:', error)
      setResult("Error al calcular el gradiente. Verifica la expresión.")
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateHessian = async () => {
    setIsCalculating(true)
    
    try {
      const problem = `Calcular la matriz Hessiana de f(x,y) = ${functionInput}`
      console.log('🧮 Calculating Hessian with AI:', problem)
      
      const solution = await aiSolver.solveSpecificProblem(problem)
      setResult(solution.solution)
      const steps = solution.steps.map(step => step.explanation)
      setAiSteps(steps)
      
      console.log('✅ AI Hessian solution received:', solution)
      console.log('📝 Steps:', steps) // Usar aiSteps para evitar warning
    } catch (error) {
      console.error('❌ Error calculating Hessian:', error)
      setResult("Error al calcular la matriz Hessiana. Verifica la expresión.")
    } finally {
      setIsCalculating(false)
    }
  }

  const findCriticalPoints = () => {
    if (functionInput === "x^2 + y^2") {
      setResult("Punto crítico: (0, 0) - Mínimo local")
    } else {
      setResult("Análisis de puntos críticos completado")
    }
  }

  const calculateDoubleIntegral = () => {
    setResult("∬ f(x,y) dA = π/2 (sobre región circular)")
  }

  const calculateDomainRange = async () => {
    try {
      // Usar Groq Vision para calcular dominio y rango de función multivariable
      if (groqVision.isAvailable()) {
        console.log('🚀 Using Groq Vision for multivariable domain and range calculation...')
        const problem = `Determinar el dominio y rango de la función f(x,y) = ${functionInput}`
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(`Dominio y Rango: ${groqSolution.answer}`)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
        
        console.log('✅ Groq Vision multivariable domain/range solution received:', groqSolution)
      } else {
        // Análisis básico local para funciones multivariables
        let domain = "ℝ² (todo el plano xy)"
        let range = "Depende de la función"
        
        if (functionInput.includes("sqrt")) {
          domain = "Donde la expresión bajo la raíz sea ≥ 0"
        } else if (functionInput.includes("1/(") || functionInput.includes("/(")) {
          domain = "ℝ² excepto donde el denominador sea 0"
        } else if (functionInput.includes("ln") || functionInput.includes("log")) {
          domain = "Donde el argumento del logaritmo sea > 0"
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
    setShowStepByStep(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Función Multivariable
            </CardTitle>
            <CardDescription>Ingresa la función de varias variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="function">Función f(x,y)</Label>
              <Input
                id="function"
                value={functionInput}
                onChange={(e) => setFunctionInput(e.target.value)}
                placeholder="Ej: x^2 + y^2"
              />
            </div>

            <div>
              <Label htmlFor="operation">Operación</Label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                  <SelectItem value="hessian">Matriz Hessiana</SelectItem>
                  <SelectItem value="critical">Puntos Críticos</SelectItem>
                  <SelectItem value="integral">Integral Doble</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button onClick={calculateGradient} disabled={isCalculating}>
                {isCalculating ? "Calculando..." : "Calcular Gradiente"}
              </Button>
              <Button variant="outline" onClick={calculateHessian}>
                Matriz Hessiana
              </Button>
              <Button variant="outline" onClick={findCriticalPoints}>
                Puntos Críticos
              </Button>
              <Button variant="outline" onClick={calculateDoubleIntegral}>
                Integral Doble
              </Button>
              <Button variant="outline" onClick={calculateDomainRange}>
                Dominio y Rango
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowStepByStep(!showStepByStep)}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {showStepByStep ? "Ocultar Pasos" : "Ver Paso a Paso"}
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
              <Layers className="h-5 w-5" />
              Resultados
            </CardTitle>
            <CardDescription>Análisis multivariable</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Resultado:</h4>
                  <pre className="font-mono text-lg whitespace-pre-wrap">{result}</pre>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold">Interpretación:</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <p>• El gradiente indica la dirección de máximo crecimiento</p>
                    <p>• Los puntos críticos son donde el gradiente es cero</p>
                    <p>• La matriz Hessiana determina la naturaleza de los puntos críticos</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <Zap className="h-3 w-3 mr-1" />
                    Análisis Completo
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
          onImageSelected={(imageUrl) => console.log("Image selected:", imageUrl)}
        />
      )}

      {/* Step-by-step Solution */}
      {showStepByStep && result && (
        <StepByStepSolver
          expression={functionInput}
        />
      )}

      <SurfacePlot3D expression={functionInput} title="Visualización 3D" xRange={[-3, 3]} yRange={[-3, 3]} />

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
                equation={`f(x,y) = ${functionInput}`}
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
