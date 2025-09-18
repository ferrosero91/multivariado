"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, Camera, Zap } from "lucide-react"
import CameraUpload from "./camera-upload"
import FunctionPlot from "./function-plot"
import { MathEvaluator } from "./math-evaluator"
import { aiSolver } from "@/lib/ai-solver"

export default function DifferentialEquations() {
  const [equation, setEquation] = useState("")
  const [initialConditions, setInitialConditions] = useState({ x0: "0", y0: "1" })
  const [solution, setSolution] = useState<string>("")
  const [steps, setSteps] = useState<string[]>([])
  const [plotData, setPlotData] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const mathEvaluator = MathEvaluator.getInstance()

  const solveODE = async () => {
    if (!equation.trim()) return

    setIsCalculating(true)
    try {
      // Usar IA para resolver la ecuación diferencial
      const problem = `Resolver la ecuación diferencial: ${equation} con condiciones iniciales x(${initialConditions.x0}) = ${initialConditions.y0}`
      console.log('🧮 Solving differential equation with AI:', problem)
      
      const aiSolution = await aiSolver.solveSpecificProblem(problem)
      
      setSolution(aiSolution.solution)
      setSteps(aiSolution.steps.map(step => step.explanation))
      
      console.log('✅ AI differential equation solution received:', aiSolution)

      // Generar datos para la gráfica si es posible
      try {
        setPlotData({
          expression: aiSolution.solution,
          title: "Solución de la Ecuación Diferencial",
        })
      } catch (plotError) {
        console.log('⚠️ Could not generate plot data:', plotError)
      }
    } catch (error) {
      console.error("Error solving ODE:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleImageProcessed = (result: string) => {
    setEquation(result)
  }

  const commonEquations = [
    { name: "Crecimiento exponencial", eq: "dy/dx = y" },
    { name: "Decaimiento exponencial", eq: "dy/dx = -y" },
    { name: "Ecuación lineal simple", eq: "dy/dx = x" },
    { name: "Ecuación de segundo orden", eq: "d²y/dx² + y = 0" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ecuaciones Diferenciales
          </CardTitle>
          <CardDescription>Resuelve ecuaciones diferenciales ordinarias con condiciones iniciales</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
              <TabsTrigger value="camera">
                <Camera className="h-4 w-4 mr-2" />
                Cámara
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="equation">Ecuación Diferencial</Label>
                  <Input
                    id="equation"
                    value={equation}
                    onChange={(e) => setEquation(e.target.value)}
                    placeholder="Ej: dy/dx = y, d²y/dx² + y = 0"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="x0">Condición inicial x₀</Label>
                    <Input
                      id="x0"
                      value={initialConditions.x0}
                      onChange={(e) => setInitialConditions((prev) => ({ ...prev, x0: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="y0">Condición inicial y₀</Label>
                    <Input
                      id="y0"
                      value={initialConditions.y0}
                      onChange={(e) => setInitialConditions((prev) => ({ ...prev, y0: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                </div>

                <Button onClick={solveODE} disabled={isCalculating || !equation.trim()} className="w-full">
                  {isCalculating ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-pulse" />
                      Resolviendo...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Resolver Ecuación Diferencial
                    </>
                  )}
                </Button>
              </div>

              {/* Ecuaciones comunes */}
              <div className="space-y-2">
                <Label>Ecuaciones Comunes:</Label>
                <div className="flex flex-wrap gap-2">
                  {commonEquations.map((eq, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setEquation(eq.eq)}
                      className="text-xs"
                    >
                      {eq.name}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="camera">
              <CameraUpload onImageProcessed={handleImageProcessed} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Resultados */}
      {solution && (
        <Card>
          <CardHeader>
            <CardTitle>Solución</CardTitle>
            <CardDescription>
              Solución para: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{equation}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="font-semibold mb-2">Solución Particular:</div>
              <code className="text-lg font-mono">{solution}</code>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="font-semibold">Pasos de la Solución:</div>
              <ol className="list-decimal list-inside space-y-2">
                {steps.map((step, index) => (
                  <li key={index} className="text-sm">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-2">
              <Badge variant="secondary">
                Condición inicial: y({initialConditions.x0}) = {initialConditions.y0}
              </Badge>
              <Badge variant="outline">Método: Analítico</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfica de la solución */}
      {plotData && <FunctionPlot expression={plotData.expression} title={plotData.title} xRange={[-5, 5]} />}
    </div>
  )
}
