"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Triangle, Square, Circle, Calculator } from "lucide-react"
import { aiSolver } from "@/lib/ai-solver"

export default function GeometryCalculator() {
  const [triangleResults, setTriangleResults] = useState<any>(null)
  const [circleResults, setCircleResults] = useState<any>(null)
  const [rectangleResults, setRectangleResults] = useState<any>(null)

  const calculateTriangle = async (a: number, b: number, c: number) => {
    try {
      const problem = `Calcular área, perímetro y ángulos de un triángulo con lados a=${a}, b=${b}, c=${c}`
      console.log('🧮 Calculating triangle with AI:', problem)
      
      const solution = await aiSolver.solveSpecificProblem(problem)
      
      // También calcular localmente como fallback
      const s = (a + b + c) / 2
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c))
      const perimeter = a + b + c
      const angleA = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * (180 / Math.PI)
      const angleB = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * (180 / Math.PI)
      const angleC = 180 - angleA - angleB

      setTriangleResults({
        area: area.toFixed(2),
        perimeter: perimeter.toFixed(2),
        angles: {
          A: angleA.toFixed(2),
          B: angleB.toFixed(2),
          C: angleC.toFixed(2),
        },
        aiSolution: solution.solution
      })
      
      console.log('✅ AI triangle solution received:', solution)
    } catch (error) {
      console.error('❌ Error calculating triangle:', error)
    }
  }

  const calculateCircle = (radius: number) => {
    const area = Math.PI * radius * radius
    const circumference = 2 * Math.PI * radius
    const diameter = 2 * radius

    setCircleResults({
      area: area.toFixed(2),
      circumference: circumference.toFixed(2),
      diameter: diameter.toFixed(2),
    })
  }

  const calculateRectangle = (width: number, height: number) => {
    const area = width * height
    const perimeter = 2 * (width + height)
    const diagonal = Math.sqrt(width * width + height * height)

    setRectangleResults({
      area: area.toFixed(2),
      perimeter: perimeter.toFixed(2),
      diagonal: diagonal.toFixed(2),
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Calculadora de Geometría</h3>
        <p className="text-muted-foreground">Calcula áreas, perímetros y propiedades de figuras geométricas</p>
      </div>

      <Tabs defaultValue="triangle" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="triangle" className="flex items-center gap-2">
            <Triangle className="h-4 w-4" />
            Triángulo
          </TabsTrigger>
          <TabsTrigger value="circle" className="flex items-center gap-2">
            <Circle className="h-4 w-4" />
            Círculo
          </TabsTrigger>
          <TabsTrigger value="rectangle" className="flex items-center gap-2">
            <Square className="h-4 w-4" />
            Rectángulo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="triangle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Triangle className="h-5 w-5" />
                Cálculos de Triángulo
              </CardTitle>
              <CardDescription>Ingresa las longitudes de los tres lados del triángulo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="side-a">Lado A</Label>
                  <Input id="side-a" type="number" placeholder="5" />
                </div>
                <div>
                  <Label htmlFor="side-b">Lado B</Label>
                  <Input id="side-b" type="number" placeholder="4" />
                </div>
                <div>
                  <Label htmlFor="side-c">Lado C</Label>
                  <Input id="side-c" type="number" placeholder="3" />
                </div>
              </div>
              <Button
                onClick={() => {
                  const a = Number.parseFloat((document.getElementById("side-a") as HTMLInputElement).value)
                  const b = Number.parseFloat((document.getElementById("side-b") as HTMLInputElement).value)
                  const c = Number.parseFloat((document.getElementById("side-c") as HTMLInputElement).value)
                  if (a && b && c) calculateTriangle(a, b, c)
                }}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Triángulo
              </Button>

              {triangleResults && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">Resultados:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Área
                      </Badge>
                      <p className="text-2xl font-bold">{triangleResults.area}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Perímetro
                      </Badge>
                      <p className="text-2xl font-bold">{triangleResults.perimeter}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge variant="outline" className="mb-2">
                      Ángulos
                    </Badge>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>A: {triangleResults.angles.A}°</div>
                      <div>B: {triangleResults.angles.B}°</div>
                      <div>C: {triangleResults.angles.C}°</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Circle className="h-5 w-5" />
                Cálculos de Círculo
              </CardTitle>
              <CardDescription>Ingresa el radio del círculo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="radius">Radio</Label>
                <Input id="radius" type="number" placeholder="5" />
              </div>
              <Button
                onClick={() => {
                  const radius = Number.parseFloat((document.getElementById("radius") as HTMLInputElement).value)
                  if (radius) calculateCircle(radius)
                }}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Círculo
              </Button>

              {circleResults && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">Resultados:</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Área
                      </Badge>
                      <p className="text-xl font-bold">{circleResults.area}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Circunferencia
                      </Badge>
                      <p className="text-xl font-bold">{circleResults.circumference}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Diámetro
                      </Badge>
                      <p className="text-xl font-bold">{circleResults.diameter}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rectangle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Square className="h-5 w-5" />
                Cálculos de Rectángulo
              </CardTitle>
              <CardDescription>Ingresa el ancho y alto del rectángulo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Ancho</Label>
                  <Input id="width" type="number" placeholder="8" />
                </div>
                <div>
                  <Label htmlFor="height">Alto</Label>
                  <Input id="height" type="number" placeholder="6" />
                </div>
              </div>
              <Button
                onClick={() => {
                  const width = Number.parseFloat((document.getElementById("width") as HTMLInputElement).value)
                  const height = Number.parseFloat((document.getElementById("height") as HTMLInputElement).value)
                  if (width && height) calculateRectangle(width, height)
                }}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Rectángulo
              </Button>

              {rectangleResults && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">Resultados:</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Área
                      </Badge>
                      <p className="text-xl font-bold">{rectangleResults.area}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Perímetro
                      </Badge>
                      <p className="text-xl font-bold">{rectangleResults.perimeter}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Diagonal
                      </Badge>
                      <p className="text-xl font-bold">{rectangleResults.diagonal}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
