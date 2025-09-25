"use client"

import { useMemo, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ZoomIn, ZoomOut, RotateCcw, Grid3X3 } from "lucide-react"

interface FunctionPlot2DProps {
  expression: string
  xRange?: [number, number]
  title?: string
  showGrid?: boolean
  showAxes?: boolean
  color?: string
}

const evaluateFunction = (expr: string, x: number): number => {
  try {
    const processedExpr = expr
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\bx\b/g, `(${x})`)
      .replace(/\^/g, "**")
      .replace(/\*\*/g, "**")
      // Funciones con paréntesis
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/asin\(/g, "Math.asin(")
      .replace(/acos\(/g, "Math.acos(")
      .replace(/atan\(/g, "Math.atan(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/exp\(/g, "Math.exp(")
      // Constantes
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\be\b/g, "Math.E")
      // Multiplicación implícita
      .replace(/(\d)([a-zA-Z])/g, '$1*$2')
      .replace(/([a-zA-Z])(\d)/g, '$1*$2')
      .replace(/\)\(/g, ')*(')

    const result = Function(`"use strict"; return (${processedExpr})`)()
    
    if (!isFinite(result) || isNaN(result)) {
      return NaN
    }
    
    // Limitar valores extremos
    return Math.max(-1000, Math.min(1000, result))
  } catch (error) {
    return NaN
  }
}

export default function FunctionPlot2D({
  expression,
  xRange = [-10, 10],
  title = "Gráfica de Función",
  showGrid = true,
  showAxes = true,
  color = "#2563eb"
}: FunctionPlot2DProps) {
  const [zoom, setZoom] = useState(1)
  const [showGridLines, setShowGridLines] = useState(showGrid)

  const plotData = useMemo(() => {
    console.log("[v0] Generating 2D plot data for:", expression)
    
    const points = []
    const numPoints = 500 // Alta resolución para curvas suaves
    const step = (xRange[1] - xRange[0]) / (numPoints - 1)
    
    for (let i = 0; i < numPoints; i++) {
      const x = xRange[0] + i * step
      const y = evaluateFunction(expression, x)
      
      if (isFinite(y)) {
        points.push({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) })
      }
    }
    
    console.log("[v0] Generated", points.length, "points for 2D plot")
    return points
  }, [expression, xRange])

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 5))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1))
  const handleReset = () => setZoom(1)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>f(x) = {expression}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Zoom: {(zoom * 100).toFixed(0)}%
            </Badge>
            <Badge variant="outline">
              Puntos: {plotData.length}
            </Badge>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2">
          <Button onClick={handleZoomIn} variant="outline" size="sm">
            <ZoomIn className="h-4 w-4 mr-2" />
            Zoom +
          </Button>
          <Button onClick={handleZoomOut} variant="outline" size="sm">
            <ZoomOut className="h-4 w-4 mr-2" />
            Zoom -
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={() => setShowGridLines(!showGridLines)} 
            variant={showGridLines ? "default" : "outline"} 
            size="sm"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Rejilla
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Gráfica estilo GeoGebra */}
        <div className="w-full h-96 bg-white dark:bg-gray-900 rounded-lg border">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {showGridLines && (
                <CartesianGrid 
                  strokeDasharray="2 2" 
                  stroke="#e0e0e0" 
                  strokeWidth={0.5}
                />
              )}
              
              <XAxis 
                dataKey="x" 
                type="number"
                scale="linear"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => value.toFixed(1)}
                stroke="#666666"
                fontSize={12}
              />
              
              <YAxis 
                dataKey="y"
                type="number"
                scale="linear"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => value.toFixed(1)}
                stroke="#666666"
                fontSize={12}
              />

              {/* Ejes de referencia */}
              {showAxes && (
                <>
                  <ReferenceLine x={0} stroke="#888888" strokeWidth={1} />
                  <ReferenceLine y={0} stroke="#888888" strokeWidth={1} />
                </>
              )}

              <Tooltip 
                formatter={(value: any) => [Number(value).toFixed(3), "f(x)"]}
                labelFormatter={(label: any) => `x = ${Number(label).toFixed(3)}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Información adicional */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <Badge variant="outline" className="mb-1">
              Dominio X
            </Badge>
            <p className="text-xs text-muted-foreground">
              [{xRange[0]}, {xRange[1]}]
            </p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              Resolución
            </Badge>
            <p className="text-xs text-muted-foreground">
              {plotData.length} puntos
            </p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              Tipo
            </Badge>
            <p className="text-xs text-muted-foreground">
              Función 2D
            </p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              Estado
            </Badge>
            <p className="text-xs text-muted-foreground">
              ✅ Graficada
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
