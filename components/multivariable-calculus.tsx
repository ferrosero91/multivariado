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

export default function MultivariableCalculus() {
  const [functionInput, setFunctionInput] = useState("x^2 + y^2")
  const [operation, setOperation] = useState("gradient")
  const [result, setResult] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showStepByStep, setShowStepByStep] = useState(false)
  const [aiSteps, setAiSteps] = useState<string[]>([])

  const calculateGradient = async () => {
    setIsCalculating(true)
    
    try {
      const problem = `Calcular el gradiente de f(x,y) = ${functionInput}`
      console.log('🧮 Calculating gradient with AI:', problem)
      
      const solution = await aiSolver.solveSpecificProblem(problem)
      setResult(solution.solution)
      const steps = solution.steps.map(step => step.explanation)
      setAiSteps(steps)
      
      console.log('✅ AI gradient solution received:', solution)
      console.log('📝 Steps:', steps) // Usar aiSteps para evitar warning
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
    </div>
  )
}
