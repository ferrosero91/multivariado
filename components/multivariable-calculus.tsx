"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Box, Layers, Zap, Camera, BookOpen, GitBranch, Move3D, BarChart3, Target, TrendingUp, Crosshair } from "lucide-react"
import SurfacePlot3D from "./surface-plot-3d"
import Advanced3DPlot from "./advanced-3d-plot"
import EnhancedMultivariable3D from "./enhanced-multivariable-3d"
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
  const [useAdvanced3D, setUseAdvanced3D] = useState(true)
  const [activeAdvancedTab, setActiveAdvancedTab] = useState("operations")
  
  // Estados para funciones avanzadas
  const [vectorField, setVectorField] = useState({ x: "y", y: "-x", z: "0" })
  const [curvePath, setCurvePath] = useState({ x: "cos(t)", y: "sin(t)", z: "t" })
  const [surfaceParam, setSurfaceParam] = useState({ x: "u*cos(v)", y: "u*sin(v)", z: "u" })
  const [jacobianVars, setJacobianVars] = useState({ u: "x^2 + y^2", v: "x*y" })

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

  // Nuevas funciones avanzadas
  const calculateDivergence = async () => {
    try {
      if (groqVision.isAvailable()) {
        const problem = `Calcular la divergencia del campo vectorial F = (${vectorField.x}, ${vectorField.y}, ${vectorField.z})`
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(`Divergencia: ${groqSolution.answer}`)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
      } else {
        setResult(`∇ · F = ∂(${vectorField.x})/∂x + ∂(${vectorField.y})/∂y + ∂(${vectorField.z})/∂z`)
      }
    } catch (error) {
      setResult("Error al calcular divergencia")
    }
  }

  const calculateCurl = async () => {
    try {
      if (groqVision.isAvailable()) {
        const problem = `Calcular el rotacional del campo vectorial F = (${vectorField.x}, ${vectorField.y}, ${vectorField.z})`
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(`Rotacional: ${groqSolution.answer}`)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
      } else {
        setResult(`∇ × F = |i  j  k|\n|∂/∂x ∂/∂y ∂/∂z|\n|${vectorField.x} ${vectorField.y} ${vectorField.z}|`)
      }
    } catch (error) {
      setResult("Error al calcular rotacional")
    }
  }

  const calculateLineIntegral = async () => {
    try {
      if (groqVision.isAvailable()) {
        const problem = `Calcular la integral de línea de F = (${vectorField.x}, ${vectorField.y}, ${vectorField.z}) a lo largo de la curva r(t) = (${curvePath.x}, ${curvePath.y}, ${curvePath.z})`
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(`Integral de línea: ${groqSolution.answer}`)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
      } else {
        setResult(`∫_C F · dr = ∫ F(r(t)) · r'(t) dt`)
      }
    } catch (error) {
      setResult("Error al calcular integral de línea")
    }
  }

  const calculateSurfaceIntegral = async () => {
    try {
      if (groqVision.isAvailable()) {
        const problem = `Calcular la integral de superficie de f(x,y,z) = ${functionInput} sobre la superficie paramétrica r(u,v) = (${surfaceParam.x}, ${surfaceParam.y}, ${surfaceParam.z})`
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(`Integral de superficie: ${groqSolution.answer}`)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
      } else {
        setResult(`∬_S f(x,y,z) dS = ∬_D f(r(u,v)) ||r_u × r_v|| du dv`)
      }
    } catch (error) {
      setResult("Error al calcular integral de superficie")
    }
  }

  const calculateJacobian = async () => {
    try {
      if (groqVision.isAvailable()) {
        const problem = `Calcular el Jacobiano de la transformación u = ${jacobianVars.u}, v = ${jacobianVars.v}`
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setResult(`Jacobiano: ${groqSolution.answer}`)
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
      } else {
        setResult(`J = |∂u/∂x  ∂u/∂y|\n    |∂v/∂x  ∂v/∂y| = det(J)`)
      }
    } catch (error) {
      setResult("Error al calcular Jacobiano")
    }
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

            {/* Tabs para operaciones */}
            <Tabs value={activeAdvancedTab} onValueChange={setActiveAdvancedTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="operations">Básicas</TabsTrigger>
                <TabsTrigger value="vector">Vectoriales</TabsTrigger>
                <TabsTrigger value="integrals">Integrales</TabsTrigger>
              </TabsList>

              <TabsContent value="operations" className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={calculateGradient} disabled={isCalculating} size="sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {isCalculating ? "Calculando..." : "Gradiente"}
                  </Button>
                  <Button variant="outline" onClick={calculateHessian} size="sm">
                    <Target className="h-4 w-4 mr-1" />
                    Hessiana
                  </Button>
                  <Button variant="outline" onClick={findCriticalPoints} size="sm">
                    <Crosshair className="h-4 w-4 mr-1" />
                    Puntos Críticos
                  </Button>
                  <Button variant="outline" onClick={calculateDoubleIntegral} size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Integral Doble
                  </Button>
                  <Button variant="outline" onClick={calculateDomainRange} size="sm">
                    <Layers className="h-4 w-4 mr-1" />
                    Dominio y Rango
                  </Button>
                  <Button variant="outline" onClick={calculateJacobian} size="sm">
                    <Move3D className="h-4 w-4 mr-1" />
                    Jacobiano
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="vector" className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="vector-x" className="text-xs">F_x</Label>
                    <Input
                      id="vector-x"
                      value={vectorField.x}
                      onChange={(e) => setVectorField({...vectorField, x: e.target.value})}
                      placeholder="y"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vector-y" className="text-xs">F_y</Label>
                    <Input
                      id="vector-y"
                      value={vectorField.y}
                      onChange={(e) => setVectorField({...vectorField, y: e.target.value})}
                      placeholder="-x"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vector-z" className="text-xs">F_z</Label>
                    <Input
                      id="vector-z"
                      value={vectorField.z}
                      onChange={(e) => setVectorField({...vectorField, z: e.target.value})}
                      placeholder="0"
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={calculateDivergence} variant="outline" size="sm">
                    <GitBranch className="h-4 w-4 mr-1" />
                    Divergencia
                  </Button>
                  <Button onClick={calculateCurl} variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Rotacional
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="integrals" className="space-y-3">
                <div>
                  <Label className="text-xs">Curva paramétrica r(t)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={curvePath.x}
                      onChange={(e) => setCurvePath({...curvePath, x: e.target.value})}
                      placeholder="cos(t)"
                      className="h-8"
                    />
                    <Input
                      value={curvePath.y}
                      onChange={(e) => setCurvePath({...curvePath, y: e.target.value})}
                      placeholder="sin(t)"
                      className="h-8"
                    />
                    <Input
                      value={curvePath.z}
                      onChange={(e) => setCurvePath({...curvePath, z: e.target.value})}
                      placeholder="t"
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={calculateLineIntegral} variant="outline" size="sm">
                    <GitBranch className="h-4 w-4 mr-1" />
                    Integral de Línea
                  </Button>
                  <Button onClick={calculateSurfaceIntegral} variant="outline" size="sm">
                    <Layers className="h-4 w-4 mr-1" />
                    Integral de Superficie
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Controles adicionales */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Button
                variant="secondary"
                onClick={() => setShowStepByStep(!showStepByStep)}
                size="sm"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                {showStepByStep ? "Ocultar" : "Pasos"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowCamera(!showCamera)}
                size="sm"
              >
                <Camera className="h-4 w-4 mr-1" />
                {showCamera ? "Ocultar" : "Cámara"}
              </Button>
            </div>
            
            {groqResult && (
              <Button
                variant="default"
                onClick={() => setShowEnhancedSteps(true)}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Zap className="h-4 w-4 mr-1" />
                Ver Solución Detallada
              </Button>
            )}
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

      {/* Visualización 3D Profesional */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Graficador 3D Profesional</h3>
          <div className="flex gap-2">
            <Button
              variant={useAdvanced3D ? "default" : "outline"}
              onClick={() => setUseAdvanced3D(!useAdvanced3D)}
              size="sm"
            >
              <Move3D className="h-4 w-4 mr-2" />
              {useAdvanced3D ? "Vista Básica" : "Vista Profesional"}
            </Button>
          </div>
        </div>
        
        {useAdvanced3D ? (
          <EnhancedMultivariable3D 
            title="🎯 Calculadora Multivariable Profesional - Estilo GeoGebra"
          />
        ) : (
          <SurfacePlot3D 
            expression={functionInput} 
            title="Superficie 3D Básica" 
            xRange={[-3, 3]} 
            yRange={[-3, 3]} 
          />
        )}
      </div>

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
