"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdvancedMathEngine } from "./advanced-math-engine"

interface Advanced2DPlotProps {
  expression: string
  xRange?: [number, number]
  title?: string
  showDerivative?: boolean
  showCriticalPoints?: boolean
}

export default function Advanced2DPlot({
  expression,
  xRange = [-10, 10],
  title = "Gráfica 2D",
  showDerivative = false,
  showCriticalPoints = false,
}: Advanced2DPlotProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlotly = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const Plotly = await import("plotly.js-dist-min")

        if (!plotRef.current) return

        console.log("[v0] Creating 2D plot for:", expression)

        // Generar datos de la función principal
        const functionData = AdvancedMathEngine.generatePlotData(expression, xRange, 500)

        const traces: any[] = [
          {
            x: functionData.map((p) => p.x),
            y: functionData.map((p) => p.y),
            type: "scatter",
            mode: "lines",
            name: `f(x) = ${expression}`,
            line: { color: "#3b82f6", width: 3 },
          },
        ]

        // Agregar derivada si se solicita
        if (showDerivative) {
          const derivative = AdvancedMathEngine.derivative(expression)
          const derivativeData = AdvancedMathEngine.generatePlotData(derivative, xRange, 500)

          traces.push({
            x: derivativeData.map((p) => p.x),
            y: derivativeData.map((p) => p.y),
            type: "scatter",
            mode: "lines",
            name: `f'(x) = ${derivative}`,
            line: { color: "#ef4444", width: 2, dash: "dash" },
          })
        }

        // Agregar puntos críticos si se solicita
        if (showCriticalPoints) {
          const criticalPoints = AdvancedMathEngine.findCriticalPoints(expression, xRange)

          if (criticalPoints.length > 0) {
            traces.push({
              x: criticalPoints.map((p) => p.x),
              y: criticalPoints.map((p) => p.y),
              type: "scatter",
              mode: "markers",
              name: "Puntos Críticos",
              marker: {
                color: "#f59e0b",
                size: 8,
                symbol: "circle",
                line: { color: "#d97706", width: 2 },
              },
            })
          }
        }

        const layout = {
          title: {
            text: title,
            font: { size: 16 },
          },
          xaxis: {
            title: "x",
            range: xRange,
            gridcolor: "#e5e7eb",
            zerolinecolor: "#374151",
          },
          yaxis: {
            title: "y",
            gridcolor: "#e5e7eb",
            zerolinecolor: "#374151",
          },
          margin: { l: 60, r: 20, b: 60, t: 60 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          showlegend: true,
          legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: "rgba(255,255,255,0.8)",
            bordercolor: "#d1d5db",
            borderwidth: 1,
          },
        }

        const config = {
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ["lasso2d", "select2d"],
          displaylogo: false,
        }

        await Plotly.newPlot(plotRef.current, traces, layout, config)
        console.log("[v0] 2D plot created successfully")
      } catch (err) {
        console.error("[v0] Error creating 2D plot:", err)
        setError("Error al crear la gráfica 2D")
      } finally {
        setIsLoading(false)
      }
    }

    if (expression && plotRef.current) {
      loadPlotly()
    }
  }, [expression, xRange, title, showDerivative, showCriticalPoints])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Gráfica interactiva de f(x) = {expression}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Generando gráfica...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </div>
        )}

        <div ref={plotRef} className="w-full h-96" style={{ display: isLoading || error ? "none" : "block" }} />
      </CardContent>
    </Card>
  )
}
