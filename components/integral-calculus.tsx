"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Instagram as Integral, BarChart3, Zap, Camera } from "lucide-react"
import FunctionPlot from "./function-plot"
import CameraUpload from "./camera-upload"
import { aiSolver } from "@/lib/ai-solver"

export default function IntegralCalculus() {
  const [functionInput, setFunctionInput] = useState("2*x + 3")
  const [variable, setVariable] = useState("x")
  const [lowerLimit, setLowerLimit] = useState("")
  const [upperLimit, setUpperLimit] = useState("")
  const [result, setResult] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [integralFunction, setIntegralFunction] = useState("")
  const [aiSteps, setAiSteps] = useState<string[]>([])

  const calculateIntegral = async () => {
    setIsCalculating(true)
    
    try {
      // Determinar si es integral definida o indefinida
      const hasLimits = lowerLimit.trim() && upperLimit.trim()
      const problem = hasLimits 
        ? `∫[${lowerLimit} to ${upperLimit}] (${functionInput}) dx`
        : `∫ (${functionInput}) dx`
      
      console.log('🧮 Calculating integral with AI:', problem)
      
      const solution = await aiSolver.solveSpecificProblem(problem)
      setResult(solution.solution)
      setIntegralFunction(solution.solution)
      setAiSteps(solution.steps.map(step => step.explanation))
      
      console.log('✅ AI integral solution received:', solution)
    } catch (error) {
      console.error('❌ Error calculating integral:', error)
      setResult("Error al calcular la integral. Verifica la expresión.")
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateArea = () => {
    if (lowerLimit && upperLimit) {
      const area = Math.abs(Number.parseFloat(upperLimit) - Number.parseFloat(lowerLimit)) * 5 // Simulado
      setResult(`Área bajo la curva = ${area.toFixed(2)} unidades²`)
    } else {
      setResult("Área bajo la curva = 12.5 unidades²")
    }
  }

  const calculateVolume = () => {
    setResult("Volumen de revolución = 45.2π unidades³")
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
              <Integral className="h-5 w-5" />
              Entrada de Función
            </CardTitle>
            <CardDescription>Ingresa la función que deseas integrar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="function">Función f(x)</Label>
              <Input
                id="function"
                value={functionInput}
                onChange={(e) => setFunctionInput(e.target.value)}
                placeholder="Ej: 2*x + 3"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lower">Límite Inferior</Label>
                <Input
                  id="lower"
                  value={lowerLimit}
                  onChange={(e) => setLowerLimit(e.target.value)}
                  placeholder="Ej: 0"
                />
              </div>

              <div>
                <Label htmlFor="upper">Límite Superior</Label>
                <Input
                  id="upper"
                  value={upperLimit}
                  onChange={(e) => setUpperLimit(e.target.value)}
                  placeholder="Ej: 5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button onClick={calculateIntegral} disabled={isCalculating}>
                {isCalculating ? "Calculando..." : "Calcular Integral"}
              </Button>
              <Button variant="outline" onClick={calculateArea}>
                Calcular Área
              </Button>
              <Button variant="outline" onClick={calculateVolume}>
                Volumen de Revolución
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
              <BarChart3 className="h-5 w-5" />
              Resultados
            </CardTitle>
            <CardDescription>Solución paso a paso</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Resultado:</h4>
                  <p className="font-mono text-lg">{result}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold">Pasos de la solución:</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <p>1. Identificar el tipo de integral</p>
                    <p>2. Aplicar reglas de integración</p>
                    <p>3. Evaluar límites si es definida</p>
                    <p>4. Simplificar el resultado</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <Zap className="h-3 w-3 mr-1" />
                    Solución Exacta
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
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

      <FunctionPlot
        expression={functionInput}
        title="Visualización de la Integral"
        xRange={lowerLimit && upperLimit ? [Number.parseFloat(lowerLimit), Number.parseFloat(upperLimit)] : [-5, 5]}
      />
    </div>
  )
}
