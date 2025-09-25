"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Camera, Zap, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from "recharts"
import FunctionPlot2D from "./function-plot-2d"
import { aiSolver } from "@/lib/ai-solver"
import { groqVision } from "@/lib/services/groq-vision"
import CameraUpload from "./camera-upload"
import EnhancedStepDisplay from "./enhanced-step-display"

export default function StatisticsCalculator() {
  const [data, setData] = useState<number[]>([])
  const [results, setResults] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [groqResult, setGroqResult] = useState<{steps: string[], answer: string} | null>(null)
  const [showEnhancedSteps, setShowEnhancedSteps] = useState(false)
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter'>('line')
  const [showAdvancedGraph, setShowAdvancedGraph] = useState(false)
  const [functionExpression, setFunctionExpression] = useState("x^2")

  const calculateStatistics = async (values: number[]) => {
    if (values.length === 0) return

    setIsCalculating(true)

    try {
      const problem = `Calcular estadísticas descriptivas para los datos: [${values.join(', ')}]. Incluir media, mediana, moda, varianza, desviación estándar y rango.`
      
      // Intentar con Groq Vision si está disponible
      if (groqVision.isAvailable()) {
        console.log('🚀 Using Groq Vision for statistics calculation...')
        const groqSolution = await groqVision.solveMathProblemText(problem)
        
        setGroqResult({
          steps: groqSolution.steps,
          answer: groqSolution.answer
        })
        console.log('✅ Groq Vision statistics solution received:', groqSolution)
      } else {
        console.log('🧮 Calculating statistics with AI fallback:', problem)
        const solution = await aiSolver.solveSpecificProblem(problem)
        console.log('✅ AI statistics solution received:', solution)
      }

      // También calcular localmente como fallback
      const n = values.length
      const sum = values.reduce((a, b) => a + b, 0)
      const mean = sum / n

      const sorted = [...values].sort((a, b) => a - b)
      const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]

      const frequency: { [key: number]: number } = {}
      values.forEach((val) => (frequency[val] = (frequency[val] || 0) + 1))
      const maxFreq = Math.max(...Object.values(frequency))
      const mode = Object.keys(frequency)
        .filter((key) => frequency[Number(key)] === maxFreq)
        .map(Number)

      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
      const stdDev = Math.sqrt(variance)
      const range = Math.max(...values) - Math.min(...values)

      setResults({
        count: n,
        sum: sum.toFixed(2),
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        mode: mode.length === values.length ? "No hay moda" : mode.join(", "),
        variance: variance.toFixed(2),
        stdDev: stdDev.toFixed(2),
        range: range.toFixed(2),
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
        aiSolution: solution.solution
      })

      // Preparar datos para gráfica
      const chartData = values.map((value, index) => ({
        index: index + 1,
        value: value,
      }))
      setChartData(chartData)

      console.log('✅ AI statistics solution received:', solution)
    } catch (error) {
      console.error('❌ Error calculating statistics:', error)
      // Fallback sin IA
      const n = values.length
      const sum = values.reduce((a, b) => a + b, 0)
      const mean = sum / n
      const sorted = [...values].sort((a, b) => a - b)
      const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
      const stdDev = Math.sqrt(variance)
      const range = Math.max(...values) - Math.min(...values)

      setResults({
        count: n,
        sum: sum.toFixed(2),
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        mode: "Calculado localmente",
        variance: variance.toFixed(2),
        stdDev: stdDev.toFixed(2),
        range: range.toFixed(2),
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
      })

      const chartData = values.map((value, index) => ({
        index: index + 1,
        value: value,
      }))
      setChartData(chartData)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleDataInput = (input: string) => {
    try {
      const values = input
        .split(/[,\s]+/)
        .map(Number)
        .filter((n) => !isNaN(n))
      setData(values)
      if (values.length > 0) {
        calculateStatistics(values)
      }
    } catch (error) {
      console.error("Error parsing data:", error)
    }
  }

  const handleImageProcessed = (expression: string) => {
    // Procesar la expresión de la imagen con Groq Vision
    console.log('🖼️ Image processed:', expression)
    setShowCamera(false)
    // Aquí podrías parsear la expresión para extraer datos numéricos
    handleDataInput(expression)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Calculadora de Estadística
          </CardTitle>
          <CardDescription>
            Calcula estadísticas descriptivas y visualiza tus datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="data-input">Datos (separados por comas o espacios)</Label>
            <Textarea
              id="data-input"
              placeholder="1, 2, 3, 4, 5 o 1 2 3 4 5"
              onChange={(e) => handleDataInput(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Botones de acción */}
          <div className="space-y-2">
            <Button
              variant="secondary"
              onClick={() => setShowCamera(!showCamera)}
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              {showCamera ? "Ocultar Cámara" : "Usar Cámara"}
            </Button>
            
            {groqResult && (
              <Button
                variant="default"
                onClick={() => setShowEnhancedSteps(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Ver Solución Detallada
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowAdvancedGraph(!showAdvancedGraph)}
              className="w-full"
            >
              <Activity className="h-4 w-4 mr-2" />
              {showAdvancedGraph ? "Ocultar Graficador" : "Graficador Avanzado"}
            </Button>
          </div>

          {data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {data.length} valores
              </Badge>
              <Badge variant="outline">
                Rango: {Math.min(...data)} - {Math.max(...data)}
              </Badge>
            </div>
          )}

          {isCalculating && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Calculando estadísticas con IA...</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.mean}</div>
                    <div className="text-sm text-muted-foreground">Media</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.median}</div>
                    <div className="text-sm text-muted-foreground">Mediana</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.stdDev}</div>
                    <div className="text-sm text-muted-foreground">Desv. Estándar</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.variance}</div>
                    <div className="text-sm text-muted-foreground">Varianza</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.range}</div>
                    <div className="text-sm text-muted-foreground">Rango</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.count}</div>
                    <div className="text-sm text-muted-foreground">Cantidad</div>
                  </CardContent>
                </Card>
              </div>

              {results.aiSolution && (
                <Card className="bg-blue-50 dark:bg-blue-900/20">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Análisis con IA
                    </h4>
                    <p className="text-sm">{results.aiSolution}</p>
                  </CardContent>
                </Card>
              )}

              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Visualización de Datos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="index" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Graficador Avanzado */}
          {showAdvancedGraph && (
            <div className="mt-6 p-4 border rounded-lg">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Graficador de Funciones Matemáticas
              </h4>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="function-input">Función a graficar</Label>
                  <Textarea
                    id="function-input"
                    value={functionExpression}
                    onChange={(e) => setFunctionExpression(e.target.value)}
                    placeholder="Ej: x^2, sin(x), exp(-x^2), x^3-2*x+1"
                    className="mt-2"
                    rows={2}
                  />
                </div>

                <FunctionPlot2D
                  expression={functionExpression}
                  title="Función Matemática"
                  color="#8b5cf6"
                  xRange={[-10, 10]}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Upload */}
      {showCamera && (
        <CameraUpload
          onImageProcessed={handleImageProcessed}
          onImageSelected={(imageUrl) => console.log("Image selected:", imageUrl)}
        />
      )}

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
                equation="Análisis Estadístico"
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