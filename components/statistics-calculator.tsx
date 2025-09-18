"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { aiSolver } from "@/lib/ai-solver"

export default function StatisticsCalculator() {
  const [data, setData] = useState<number[]>([])
  const [results, setResults] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateStatistics = async (values: number[]) => {
    if (values.length === 0) return

    setIsCalculating(true)

    try {
      const problem = `Calcular estadísticas descriptivas para los datos: [${values.join(', ')}]. Incluir media, mediana, moda, varianza, desviación estándar y rango.`
      console.log('🧮 Calculating statistics with AI:', problem)

      const solution = await aiSolver.solveSpecificProblem(problem)

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
        </CardContent>
      </Card>
    </div>
  )
}