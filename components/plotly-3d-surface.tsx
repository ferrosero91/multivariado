"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdvancedMathEngine } from "./advanced-math-engine"

interface Plotly3DSurfaceProps {
  expression: string
  xRange?: [number, number]
  yRange?: [number, number]
  title?: string
}

export default function Plotly3DSurface({
  expression,
  xRange = [-5, 5],
  yRange = [-5, 5],
  title = "Superficie 3D",
}: Plotly3DSurfaceProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlotly = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Importar Plotly dinámicamente
        const Plotly = await import("plotly.js-dist-min")

        if (!plotRef.current) return

        console.log("[v0] Creating 3D surface plot for:", expression)

        // Generar datos de la superficie
        const zData = AdvancedMathEngine.generate3DPlotData(expression, xRange, yRange, 40)

        // Crear arrays para x e y
        const xData = Array.from({ length: 40 }, (_, i) => xRange[0] + (i / 39) * (xRange[1] - xRange[0]))
        const yData = Array.from({ length: 40 }, (_, i) => yRange[0] + (i / 39) * (yRange[1] - yRange[0]))

        const data = [
          {
            z: zData,
            x: xData,
            y: yData,
            type: "surface" as const,
            colorscale: "Viridis",
            showscale: true,
            opacity: 0.9,
            contours: {
              z: {
                show: true,
                usecolormap: true,
                highlightcolor: "#42f462",
                project: { z: true },
              },
            },
          },
        ]

        const layout = {
          title: {
            text: `${title}: f(x,y) = ${expression}`,
            font: { size: 16 },
          },
          scene: {
            xaxis: { title: "X", range: xRange },
            yaxis: { title: "Y", range: yRange },
            zaxis: { title: "Z" },
            camera: {
              eye: { x: 1.5, y: 1.5, z: 1.5 },
            },
          },
          margin: { l: 0, r: 0, b: 0, t: 40 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
        }

        const config = {
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ["pan2d", "lasso2d"],
          displaylogo: false,
        }

        await Plotly.newPlot(plotRef.current, data, layout, config)
        console.log("[v0] 3D surface plot created successfully")
      } catch (err) {
        console.error("[v0] Error creating 3D plot:", err)
        setError("Error al crear la gráfica 3D")
      } finally {
        setIsLoading(false)
      }
    }

    if (expression && plotRef.current) {
      loadPlotly()
    }
  }, [expression, xRange, yRange, title])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Visualización 3D interactiva de f(x,y) = {expression}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Generando gráfica 3D...</p>
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

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong>Controles:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Arrastra para rotar la vista</li>
            <li>Usa la rueda del mouse para hacer zoom</li>
            <li>Haz clic en los botones de la barra superior para más opciones</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
