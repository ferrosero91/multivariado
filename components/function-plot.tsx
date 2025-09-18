"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { MathEvaluator } from "./math-evaluator"

interface FunctionPlotProps {
  expression: string
  derivative?: string
  xRange?: [number, number]
  title?: string
  showDerivative?: boolean
  criticalPoints?: Array<{ x: number; y: number; type: string }>
  tangentLine?: { point: [number, number]; slope: number }
}

export default function FunctionPlot({
  expression,
  derivative,
  xRange = [-10, 10],
  title = "Gráfica de la Función",
  showDerivative = false,
  criticalPoints = [],
  tangentLine,
}: FunctionPlotProps) {
  const mathEvaluator = MathEvaluator.getInstance()

  const data = useMemo(() => {
    if (!expression.trim()) return []

    const points = []
    const step = (xRange[1] - xRange[0]) / 400 // Más puntos para mejor resolución

    console.log("[v0] Generating plot data for expression:", expression)

    for (let x = xRange[0]; x <= xRange[1]; x += step) {
      try {
        const y = mathEvaluator.evaluate(expression, x)

        // Filtrar valores válidos
        if (isFinite(y) && Math.abs(y) < 10000) {
          const point: any = {
            x: Number(x.toFixed(4)),
            y: Number(y.toFixed(4)),
          }

          // Agregar derivada si se solicita
          if (showDerivative && derivative) {
            const yDerivative = mathEvaluator.evaluate(derivative, x)
            if (isFinite(yDerivative) && Math.abs(yDerivative) < 10000) {
              point.derivative = Number(yDerivative.toFixed(4))
            }
          }

          // Agregar línea tangente si existe
          if (tangentLine && Math.abs(x - tangentLine.point[0]) < step * 2) {
            const tangentY = tangentLine.slope * (x - tangentLine.point[0]) + tangentLine.point[1]
            if (isFinite(tangentY)) {
              point.tangent = Number(tangentY.toFixed(4))
            }
          }

          points.push(point)
        }
      } catch (error) {
        // Continuar con el siguiente punto
        continue
      }
    }

    console.log("[v0] Generated", points.length, "plot points")
    return points
  }, [expression, derivative, xRange, showDerivative, tangentLine, mathEvaluator])

  const computedCriticalPoints = useMemo(() => {
    if (criticalPoints.length > 0) return criticalPoints
    if (!expression.trim()) return []

    try {
      return mathEvaluator.findCriticalPoints(expression, xRange)
    } catch (error) {
      console.warn("[v0] Error finding critical points:", error)
      return []
    }
  }, [expression, xRange, criticalPoints, mathEvaluator])

  const chartConfig = {
    function: {
      label: `f(x) = ${expression}`,
      color: "#2563eb", // usando colores directos en lugar de CSS variables
    },
    derivative: {
      label: `f'(x) = ${derivative}`,
      color: "#dc2626", // usando colores directos
    },
    tangent: {
      label: "Línea Tangente",
      color: "#16a34a", // usando colores directos
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Visualización interactiva de {expression}
          {showDerivative && derivative && ` y su derivada ${derivative}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                type="number"
                scale="linear"
                domain={xRange}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <YAxis
                tickFormatter={(value) => value.toFixed(1)}
                domain={["dataMin - 1", "dataMax + 1"]} // Mejor ajuste automático del dominio Y
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => [
                  value.toFixed(3),
                  name === "y" ? "f(x)" : name === "derivative" ? "f'(x)" : name,
                ]}
                labelFormatter={(x) => `x = ${Number(x).toFixed(3)}`}
              />
              <Legend />

              {/* Líneas de referencia */}
              <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
              <ReferenceLine x={0} stroke="#666" strokeDasharray="2 2" />

              {/* Función principal */}
              <Line
                type="monotone"
                dataKey="y"
                stroke="#2563eb" // color directo para asegurar visibilidad
                strokeWidth={2}
                dot={false}
                name="f(x)"
                connectNulls={false}
              />

              {/* Derivada */}
              {showDerivative && derivative && (
                <Line
                  type="monotone"
                  dataKey="derivative"
                  stroke="#dc2626" // color directo
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="f'(x)"
                  connectNulls={false}
                />
              )}

              {/* Línea tangente */}
              {tangentLine && (
                <Line
                  type="monotone"
                  dataKey="tangent"
                  stroke="#16a34a" // color directo
                  strokeWidth={2}
                  strokeDasharray="10 5"
                  dot={false}
                  name="Tangente"
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Puntos críticos */}
        {computedCriticalPoints.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Puntos Críticos:</h4>
            <div className="flex flex-wrap gap-2">
              {computedCriticalPoints.map((point, index) => (
                <div key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full text-sm">
                  {point.type}: ({point.x.toFixed(2)}, {point.y.toFixed(2)})
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
