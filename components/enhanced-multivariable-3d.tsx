"use client"

import { useMemo, useState, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text, Environment, Line } from "@react-three/drei"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCcw, Move3D, Layers, GitBranch, Circle, Calculator, Ruler, Zap } from "lucide-react"
import * as THREE from "three"
import { groqVision } from "@/lib/services/groq-vision"

interface EnhancedMultivariable3DProps {
  title?: string
}

// Tipos de datos
interface QuadricData {
  type: 'ellipsoid' | 'hyperboloid1' | 'hyperboloid2' | 'paraboloidElliptic' | 'paraboloidHyperbolic' | 'cone' | 'cylinderElliptic' | 'cylinderParabolic' | 'cylinderHyperbolic'
  equation: string
  params: { a: number; b: number; c: number }
  color: string
  visible: boolean
}

interface PlaneData {
  equation: string // Ax + By + Cz = D
  coefficients: { A: number; B: number; C: number; D: number }
  color: string
  opacity: number
  visible: boolean
}

interface LineData {
  type: 'parametric' | 'intersection'
  parametric?: { x: string; y: string; z: string }
  intersection?: { plane1: string; plane2: string }
  color: string
  visible: boolean
}

// Funciones de evaluación matemática
const evaluateExpression = (expr: string, variables: Record<string, number>): number => {
  try {
    let processedExpr = expr.toLowerCase().replace(/\s+/g, "")
    
    // Reemplazar variables
    Object.entries(variables).forEach(([variable, value]) => {
      const regex = new RegExp(`\\b${variable}\\b`, 'g')
      processedExpr = processedExpr.replace(regex, `(${value})`)
    })
    
    // Operadores y funciones
    processedExpr = processedExpr
      .replace(/\^/g, "**")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/exp\(/g, "Math.exp(")
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\be\b/g, "Math.E")
      .replace(/(\d)([a-zA-Z])/g, '$1*$2')
      .replace(/([a-zA-Z])(\d)/g, '$1*$2')
      .replace(/\)\(/g, ')*(')

    const result = Function(`"use strict"; return (${processedExpr})`)()
    return isFinite(result) ? Math.max(-100, Math.min(100, result)) : 0
  } catch (error) {
    return 0
  }
}

// Componente para superficies cuádricas con todas las fórmulas
function QuadricSurface({ type, params, color }: { type: QuadricData['type']; params: QuadricData['params']; color: string }) {
  const geometry = useMemo(() => {
    const { a, b, c } = params
    const segments = 40
    
    switch (type) {
      case 'ellipsoid': {
        // x²/a² + y²/b² + z²/c² = 1
        const geo = new THREE.SphereGeometry(1, segments, segments)
        const positions = geo.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] *= a     // x
          positions[i + 1] *= c // y (z en three.js)
          positions[i + 2] *= b // z (y en three.js)
        }
        geo.attributes.position.needsUpdate = true
        geo.computeVertexNormals()
        return geo
      }
      
      case 'hyperboloid1': {
        // x²/a² + y²/b² - z²/c² = 1 (una hoja)
        const geo = new THREE.SphereGeometry(1, segments, segments)
        const positions = geo.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i]
          const y = positions[i + 2]
          const z = positions[i + 1]
          
          // Hiperboloide de una hoja
          const factor = Math.sqrt(1 + (z * z) / (c * c))
          positions[i] = x * factor * a
          positions[i + 1] = z * c
          positions[i + 2] = y * factor * b
        }
        geo.attributes.position.needsUpdate = true
        geo.computeVertexNormals()
        return geo
      }
      
      case 'hyperboloid2': {
        // x²/a² + y²/b² - z²/c² = -1 (dos hojas)
        const geo1 = new THREE.SphereGeometry(1, segments, segments/2)
        const geo2 = new THREE.SphereGeometry(1, segments, segments/2)
        
        // Hoja superior
        const pos1 = geo1.attributes.position.array as Float32Array
        for (let i = 0; i < pos1.length; i += 3) {
          const x = pos1[i]
          const y = pos1[i + 2]
          const z = Math.abs(pos1[i + 1]) + 1
          
          const factor = Math.sqrt((z * z) / (c * c) - 1)
          pos1[i] = x * factor * a
          pos1[i + 1] = z * c
          pos1[i + 2] = y * factor * b
        }
        
        // Hoja inferior
        const pos2 = geo2.attributes.position.array as Float32Array
        for (let i = 0; i < pos2.length; i += 3) {
          const x = pos2[i]
          const y = pos2[i + 2]
          const z = -(Math.abs(pos2[i + 1]) + 1)
          
          const factor = Math.sqrt((z * z) / (c * c) - 1)
          pos2[i] = x * factor * a
          pos2[i + 1] = z * c
          pos2[i + 2] = y * factor * b
        }
        
        // Combinar geometrías
        geo1.attributes.position.needsUpdate = true
        geo2.attributes.position.needsUpdate = true
        geo1.computeVertexNormals()
        geo2.computeVertexNormals()
        
        return geo1 // Retornamos solo una por simplicidad
      }
      
      case 'paraboloidElliptic': {
        // z = x²/a² + y²/b² (paraboloide elíptico)
        const geo = new THREE.CylinderGeometry(0, 2, 4, segments)
        const positions = geo.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i] * a
          const y = positions[i + 2] * b
          const z = positions[i + 1]
          
          positions[i] = x
          positions[i + 1] = (x * x) / (a * a) + (y * y) / (b * b)
          positions[i + 2] = y
        }
        geo.attributes.position.needsUpdate = true
        geo.computeVertexNormals()
        return geo
      }
      
      case 'paraboloidHyperbolic': {
        // z = x²/a² - y²/b² (paraboloide hiperbólico - silla de montar)
        const size = 4
        const geo = new THREE.PlaneGeometry(size, size, segments, segments)
        const positions = geo.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i]
          const y = positions[i + 2]
          positions[i + 1] = (x * x) / (a * a) - (y * y) / (b * b)
        }
        geo.attributes.position.needsUpdate = true
        geo.computeVertexNormals()
        return geo
      }
      
      case 'cone': {
        // x²/a² + y²/b² = z²/c²
        const geo = new THREE.ConeGeometry(2, 4, segments)
        const positions = geo.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] *= a
          positions[i + 2] *= b
        }
        geo.attributes.position.needsUpdate = true
        geo.computeVertexNormals()
        return geo
      }
      
      case 'cylinderElliptic': {
        // x²/a² + y²/b² = 1
        const geo = new THREE.CylinderGeometry(1, 1, 4, segments)
        const positions = geo.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] *= a
          positions[i + 2] *= b
        }
        geo.attributes.position.needsUpdate = true
        geo.computeVertexNormals()
        return geo
      }
      
      default:
        return new THREE.SphereGeometry(1, segments, segments)
    }
  }, [type, params])

  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial color={color} transparent opacity={0.75} side={THREE.DoubleSide} />
    </mesh>
  )
}

// Componente para planos 3D
function Plane3D({ coefficients, color, opacity }: { coefficients: PlaneData['coefficients']; color: string; opacity: number }) {
  const geometry = useMemo(() => {
    const { A, B, C, D } = coefficients
    const size = 10
    const geo = new THREE.PlaneGeometry(size, size, 20, 20)
    
    // Si C ≠ 0, resolver para z = (D - Ax - By)/C
    if (Math.abs(C) > 0.001) {
      const positions = geo.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const y = positions[i + 2]
        positions[i + 1] = (D - A * x - B * y) / C
      }
    } else if (Math.abs(B) > 0.001) {
      // Si B ≠ 0, resolver para y = (D - Ax - Cz)/B
      const positions = geo.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const z = positions[i + 1]
        positions[i + 2] = (D - A * x - C * z) / B
      }
    }
    
    geo.attributes.position.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [coefficients])
  
  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial color={color} side={THREE.DoubleSide} transparent opacity={opacity} />
    </mesh>
  )
}

// Componente para superficies z = f(x,y)
function FunctionSurface({ equation, color, domain = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 } }: { equation: string; color: string; domain?: { xMin: number; xMax: number; yMin: number; yMax: number } }) {
  const geometry = useMemo(() => {
    const { xMin, xMax, yMin, yMax } = domain
    const width = xMax - xMin
    const height = yMax - yMin
    const resolution = 80 // Mayor resolución para mejor calidad
    const geo = new THREE.PlaneGeometry(width, height, resolution, resolution)
    const positions = geo.attributes.position.array as Float32Array
    
    // Ajustar posiciones para que coincidan con el dominio
    for (let i = 0; i < positions.length; i += 3) {
      // Convertir de coordenadas normalizadas a coordenadas del dominio
      const x = xMin + (positions[i] + width/2) * (width / width)
      const y = yMin + (positions[i + 2] + height/2) * (height / height)
      
      try {
        const z = evaluateExpression(equation, { x, y, z: 0 })
        positions[i + 1] = z // Y es Z en Three.js
      } catch (error) {
        positions[i + 1] = 0 // Valor predeterminado en caso de error
      }
    }
    
    geo.attributes.position.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [equation, domain])
  
  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  )
}

// Componente para rectas paramétricas
function ParametricLine({ parametric, color }: { parametric: { x: string; y: string; z: string }; color: string }) {
  const points = useMemo(() => {
    const pts = []
    const tMin = -10
    const tMax = 10
    const steps = 200
    const step = (tMax - tMin) / steps
    
    for (let i = 0; i <= steps; i++) {
      const t = tMin + i * step
      const x = evaluateExpression(parametric.x, { t })
      const y = evaluateExpression(parametric.y, { t })
      const z = evaluateExpression(parametric.z, { t })
      pts.push(new THREE.Vector3(x, z, y)) // Y y Z intercambiados para Three.js
    }
    
    return pts
  }, [parametric])
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={4}
    />
  )
}

// Componente para superficies paramétricas 3D
function ParametricSurface({ parametric, color, domain = { uMin: 0, uMax: 2*Math.PI, vMin: 0, vMax: Math.PI } }: 
  { parametric: { x: string; y: string; z: string }; color: string; domain?: { uMin: number; uMax: number; vMin: number; vMax: number } }) {
  const geometry = useMemo(() => {
    const { uMin, uMax, vMin, vMax } = domain
    const uSegments = 50
    const vSegments = 50
    
    // Crear una geometría de buffer personalizada
    const geo = new THREE.BufferGeometry()
    
    // Generar vértices y caras
    const vertices = []
    const indices = []
    
    // Generar vértices
    for (let i = 0; i <= uSegments; i++) {
      const u = uMin + (i / uSegments) * (uMax - uMin)
      for (let j = 0; j <= vSegments; j++) {
        const v = vMin + (j / vSegments) * (vMax - vMin)
        
        try {
          const x = evaluateExpression(parametric.x, { u, v })
          const y = evaluateExpression(parametric.y, { u, v })
          const z = evaluateExpression(parametric.z, { u, v })
          
          // En Three.js, Y es el eje vertical (Z en matemáticas)
          vertices.push(x, z, y)
        } catch (error) {
          vertices.push(0, 0, 0) // Valor predeterminado en caso de error
        }
      }
    }
    
    // Generar índices para triángulos
    for (let i = 0; i < uSegments; i++) {
      for (let j = 0; j < vSegments; j++) {
        const a = i * (vSegments + 1) + j
        const b = a + 1
        const c = a + (vSegments + 1)
        const d = c + 1
        
        // Dos triángulos por cuadrado
        indices.push(a, b, c)
        indices.push(c, b, d)
      }
    }
    
    // Configurar atributos de la geometría
    geo.setIndex(indices)
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geo.computeVertexNormals()
    
    return geo
  }, [parametric, domain])
  
  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  )
}

// Componente principal mejorado
export default function EnhancedMultivariable3D({ 
  title = "Calculadora Multivariable Profesional" 
}: EnhancedMultivariable3DProps) {
  const [autoRotate, setAutoRotate] = useState(false)
  const [showAxes, setShowAxes] = useState(true)
  const [activeTab, setActiveTab] = useState("surfaces")
  
  // Estados para superficies con ejemplos
  const [surfaces, setSurfaces] = useState<{ equation: string; color: string; visible: boolean; domain?: { xMin: number; xMax: number; yMin: number; yMax: number } }[]>([
    { equation: "x^2 + y^2", color: "#3b82f6", visible: true, domain: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 } }
  ])
  const [newSurface, setNewSurface] = useState({ 
    equation: "sin(x)*cos(y)", 
    color: "#10b981",
    domain: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 }
  })
  
  // Estados para superficies paramétricas
  const [parametricSurfaces, setParametricSurfaces] = useState<{ x: string; y: string; z: string; color: string; visible: boolean; domain?: { uMin: number; uMax: number; vMin: number; vMax: number } }[]>([])
  const [newParametricSurface, setNewParametricSurface] = useState({ 
    x: "cos(u)*sin(v)", 
    y: "sin(u)*sin(v)", 
    z: "cos(v)",
    color: "#ec4899",
    domain: { uMin: 0, uMax: 2*Math.PI, vMin: 0, vMax: Math.PI }
  })
  
  // Estados para superficies cuádricas
  const [quadrics, setQuadrics] = useState<QuadricData[]>([])
  const [newQuadric, setNewQuadric] = useState({
    type: 'ellipsoid' as QuadricData['type'],
    equation: "x^2/4 + y^2/9 + z^2/16 = 1",
    params: { a: 2, b: 3, c: 4 },
    color: "#9b59b6"
  })
  
  // Estados para planos
  const [planes, setPlanes] = useState<PlaneData[]>([])
  const [newPlane, setNewPlane] = useState({ 
    equation: "2x + 3y + z = 6", 
    coefficients: { A: 2, B: 3, C: 1, D: 6 },
    color: "#ff6b6b", 
    opacity: 0.6 
  })
  
  // Estados para rectas
  const [lines, setLines] = useState<LineData[]>([])
  const [newLine, setNewLine] = useState({ 
    type: 'parametric' as LineData['type'],
    parametric: { x: "t", y: "2*t", z: "3*t" }, 
    color: "#4ecdc4" 
  })
  
  // Estados para cálculos
  const [calculations, setCalculations] = useState<string[]>([])
  const [pointDistance, setPointDistance] = useState({
    point: { x: 1, y: 2, z: 3 },
    line: { point: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 1, z: 1 } },
    result: ""
  })

  // Funciones para agregar elementos
  const addSurface = () => {
    if (newSurface.equation.trim()) {
      setSurfaces([...surfaces, { ...newSurface, visible: true }])
      setNewSurface({ 
        equation: "", 
        color: "#3b82f6",
        domain: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 }
      })
    }
  }
  
  // Función para agregar superficie paramétrica
  const addParametricSurface = () => {
    if (newParametricSurface.x.trim() && newParametricSurface.y.trim() && newParametricSurface.z.trim()) {
      setParametricSurfaces([...parametricSurfaces, { ...newParametricSurface, visible: true }])
      setNewParametricSurface({ 
        x: "", 
        y: "", 
        z: "",
        color: "#ec4899",
        domain: { uMin: 0, uMax: 2*Math.PI, vMin: 0, vMax: Math.PI }
      })
    }
  }

  const addQuadric = () => {
    setQuadrics([...quadrics, { ...newQuadric, visible: true }])
  }

  const addPlane = () => {
    if (newPlane.equation.trim()) {
      setPlanes([...planes, { ...newPlane, visible: true }])
      setNewPlane({ 
        equation: "", 
        coefficients: { A: 1, B: 1, C: 1, D: 1 },
        color: "#ff6b6b", 
        opacity: 0.6 
      })
    }
  }

  const addLine = () => {
    if (newLine.parametric && Object.values(newLine.parametric).every(v => v.trim())) {
      setLines([...lines, { ...newLine, visible: true }])
      setNewLine({ 
        type: 'parametric',
        parametric: { x: "", y: "", z: "" }, 
        color: "#4ecdc4" 
      })
    }
  }

  // Función para calcular distancia punto-recta
  const calculatePointLineDistance = async () => {
    try {
      const problem = `Calcular la distancia del punto P(${pointDistance.point.x}, ${pointDistance.point.y}, ${pointDistance.point.z}) a la recta que pasa por (${pointDistance.line.point.x}, ${pointDistance.line.point.y}, ${pointDistance.line.point.z}) con dirección (${pointDistance.line.direction.x}, ${pointDistance.line.direction.y}, ${pointDistance.line.direction.z})`
      
      if (groqVision.isAvailable()) {
        const solution = await groqVision.solveMathProblemText(problem)
        setPointDistance({...pointDistance, result: solution.answer})
      } else {
        // Cálculo local básico
        const { point: P, line } = pointDistance
        const { point: A, direction: d } = line
        
        // Vector AP
        const AP = { x: P.x - A.x, y: P.y - A.y, z: P.z - A.z }
        
        // Producto cruz AP × d
        const cross = {
          x: AP.y * d.z - AP.z * d.y,
          y: AP.z * d.x - AP.x * d.z,
          z: AP.x * d.y - AP.y * d.x
        }
        
        // Magnitudes
        const crossMag = Math.sqrt(cross.x**2 + cross.y**2 + cross.z**2)
        const dMag = Math.sqrt(d.x**2 + d.y**2 + d.z**2)
        
        const distance = crossMag / dMag
        setPointDistance({...pointDistance, result: distance.toFixed(4)})
      }
    } catch (error) {
      setPointDistance({...pointDistance, result: "Error en el cálculo"})
    }
  }

  // Parsear ecuación de plano
  const parsePlaneEquation = (equation: string) => {
    try {
      // Formato: Ax + By + Cz = D
      const match = equation.match(/([+-]?\d*\.?\d*)\s*x\s*([+-]\d*\.?\d*)\s*y\s*([+-]\d*\.?\d*)\s*z\s*=\s*([+-]?\d*\.?\d*)/)
      if (match) {
        const A = parseFloat(match[1] || "1")
        const B = parseFloat(match[2] || "1") 
        const C = parseFloat(match[3] || "1")
        const D = parseFloat(match[4] || "0")
        return { A, B, C, D }
      }
    } catch (error) {
      console.error("Error parsing plane equation:", error)
    }
    return { A: 1, B: 1, C: 1, D: 1 }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Move3D className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              Graficación profesional de superficies, planos, rectas y cálculos en 3D
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">GeoGebra Style</Badge>
          </div>
        </div>

        {/* Controles globales */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setShowAxes(!showAxes)} variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" />
            {showAxes ? "Ocultar Ejes" : "Mostrar Ejes"}
          </Button>
          <Button onClick={() => setAutoRotate(!autoRotate)} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            {autoRotate ? "Parar" : "Auto-rotar"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="surfaces">Superficies</TabsTrigger>
            <TabsTrigger value="parametric">Paramétricas</TabsTrigger>
            <TabsTrigger value="quadrics">Cuádricas</TabsTrigger>
            <TabsTrigger value="planes">Planos</TabsTrigger>
            <TabsTrigger value="lines">Rectas</TabsTrigger>
            <TabsTrigger value="calculations">Cálculos</TabsTrigger>
          </TabsList>

          {/* Tab Superficies */}
          <TabsContent value="surfaces" className="space-y-4">
            <div>
              <Label htmlFor="surface-eq">Ecuación z = f(x,y)</Label>
              <Input
                id="surface-eq"
                value={newSurface.equation}
                onChange={(e) => setNewSurface({...newSurface, equation: e.target.value})}
                placeholder="x^2 + y^2, sin(x)*cos(y), x*y - x^2"
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={newSurface.color}
                  onChange={(e) => setNewSurface({...newSurface, color: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Dominio X</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={newSurface.domain?.xMin}
                      onChange={(e) => setNewSurface({
                        ...newSurface, 
                        domain: {...newSurface.domain!, xMin: Number(e.target.value)}
                      })}
                      placeholder="-3"
                      className="w-full"
                    />
                    <Input
                      type="number"
                      value={newSurface.domain?.xMax}
                      onChange={(e) => setNewSurface({
                        ...newSurface, 
                        domain: {...newSurface.domain!, xMax: Number(e.target.value)}
                      })}
                      placeholder="3"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <Label>Dominio Y</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={newSurface.domain?.yMin}
                      onChange={(e) => setNewSurface({
                        ...newSurface, 
                        domain: {...newSurface.domain!, yMin: Number(e.target.value)}
                      })}
                      placeholder="-3"
                      className="w-full"
                    />
                    <Input
                      type="number"
                      value={newSurface.domain?.yMax}
                      onChange={(e) => setNewSurface({
                        ...newSurface, 
                        domain: {...newSurface.domain!, yMax: Number(e.target.value)}
                      })}
                      placeholder="3"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={addSurface} className="w-full">
              <Circle className="h-4 w-4 mr-2" />
              Agregar Superficie
            </Button>
            
            {/* Lista de superficies */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {surfaces.map((surface, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={surface.visible}
                    onChange={(e) => {
                      const newSurfaces = [...surfaces]
                      newSurfaces[index].visible = e.target.checked
                      setSurfaces(newSurfaces)
                    }}
                  />
                  <span className="flex-1 text-sm">z = {surface.equation}</span>
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: surface.color }} />
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Tab Superficies Paramétricas */}
          <TabsContent value="parametric" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="parametric-x">x(u,v)</Label>
                <Input
                  id="parametric-x"
                  value={newParametricSurface.x}
                  onChange={(e) => setNewParametricSurface({...newParametricSurface, x: e.target.value})}
                  placeholder="cos(u)*sin(v)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="parametric-y">y(u,v)</Label>
                <Input
                  id="parametric-y"
                  value={newParametricSurface.y}
                  onChange={(e) => setNewParametricSurface({...newParametricSurface, y: e.target.value})}
                  placeholder="sin(u)*sin(v)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="parametric-z">z(u,v)</Label>
                <Input
                  id="parametric-z"
                  value={newParametricSurface.z}
                  onChange={(e) => setNewParametricSurface({...newParametricSurface, z: e.target.value})}
                  placeholder="cos(v)"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={newParametricSurface.color}
                  onChange={(e) => setNewParametricSurface({...newParametricSurface, color: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Dominio U</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={newParametricSurface.domain?.uMin}
                      onChange={(e) => setNewParametricSurface({
                        ...newParametricSurface, 
                        domain: {...newParametricSurface.domain!, uMin: Number(e.target.value)}
                      })}
                      placeholder="0"
                      className="w-full"
                    />
                    <Input
                      type="number"
                      value={newParametricSurface.domain?.uMax}
                      onChange={(e) => setNewParametricSurface({
                        ...newParametricSurface, 
                        domain: {...newParametricSurface.domain!, uMax: Number(e.target.value)}
                      })}
                      placeholder="2π"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <Label>Dominio V</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={newParametricSurface.domain?.vMin}
                      onChange={(e) => setNewParametricSurface({
                        ...newParametricSurface, 
                        domain: {...newParametricSurface.domain!, vMin: Number(e.target.value)}
                      })}
                      placeholder="0"
                      className="w-full"
                    />
                    <Input
                      type="number"
                      value={newParametricSurface.domain?.vMax}
                      onChange={(e) => setNewParametricSurface({
                        ...newParametricSurface, 
                        domain: {...newParametricSurface.domain!, vMax: Number(e.target.value)}
                      })}
                      placeholder="π"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <Button onClick={addParametricSurface} className="w-full">
              <Circle className="h-4 w-4 mr-2" />
              Agregar Superficie Paramétrica
            </Button>
            
            {/* Lista de superficies paramétricas */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {parametricSurfaces.map((surface, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={surface.visible}
                    onChange={(e) => {
                      const newSurfaces = [...parametricSurfaces]
                      newSurfaces[index].visible = e.target.checked
                      setParametricSurfaces(newSurfaces)
                    }}
                  />
                  <span className="flex-1 text-sm">
                    ({surface.x}, {surface.y}, {surface.z})
                  </span>
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: surface.color }} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab Cuádricas */}
          <TabsContent value="quadrics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de cuádrica</Label>
                <Select 
                  value={newQuadric.type} 
                  onValueChange={(value) => setNewQuadric({...newQuadric, type: value as QuadricData['type']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ellipsoid">Elipsoide</SelectItem>
                    <SelectItem value="hyperboloid1">Hiperboloide (1 hoja)</SelectItem>
                    <SelectItem value="hyperboloid2">Hiperboloide (2 hojas)</SelectItem>
                    <SelectItem value="paraboloidElliptic">Paraboloide Elíptico</SelectItem>
                    <SelectItem value="paraboloidHyperbolic">Paraboloide Hiperbólico</SelectItem>
                    <SelectItem value="cone">Cono Cuádrico</SelectItem>
                    <SelectItem value="cylinderElliptic">Cilindro Elíptico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={newQuadric.color}
                  onChange={(e) => setNewQuadric({...newQuadric, color: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label>Ecuación</Label>
              <Input
                value={newQuadric.equation}
                onChange={(e) => setNewQuadric({...newQuadric, equation: e.target.value})}
                placeholder="x^2/4 + y^2/9 + z^2/16 = 1"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Parámetro a</Label>
                <Input
                  type="number"
                  value={newQuadric.params.a}
                  onChange={(e) => setNewQuadric({
                    ...newQuadric, 
                    params: {...newQuadric.params, a: Number(e.target.value)}
                  })}
                  step="0.1"
                  min="0.1"
                />
              </div>
              <div>
                <Label>Parámetro b</Label>
                <Input
                  type="number"
                  value={newQuadric.params.b}
                  onChange={(e) => setNewQuadric({
                    ...newQuadric, 
                    params: {...newQuadric.params, b: Number(e.target.value)}
                  })}
                  step="0.1"
                  min="0.1"
                />
              </div>
              <div>
                <Label>Parámetro c</Label>
                <Input
                  type="number"
                  value={newQuadric.params.c}
                  onChange={(e) => setNewQuadric({
                    ...newQuadric, 
                    params: {...newQuadric.params, c: Number(e.target.value)}
                  })}
                  step="0.1"
                  min="0.1"
                />
              </div>
            </div>
            
            <Button onClick={addQuadric} className="w-full">
              <Circle className="h-4 w-4 mr-2" />
              Agregar Superficie Cuádrica
            </Button>
            
            {/* Lista de cuádricas */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {quadrics.map((quadric, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={quadric.visible}
                    onChange={(e) => {
                      const newQuadrics = [...quadrics]
                      newQuadrics[index].visible = e.target.checked
                      setQuadrics(newQuadrics)
                    }}
                  />
                  <span className="flex-1 text-sm capitalize">
                    {quadric.type}: {quadric.equation}
                  </span>
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: quadric.color }} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab Planos */}
          <TabsContent value="planes" className="space-y-4">
            <div>
              <Label>Ecuación del plano (Ax + By + Cz = D)</Label>
              <Input
                value={newPlane.equation}
                onChange={(e) => {
                  const equation = e.target.value
                  const coefficients = parsePlaneEquation(equation)
                  setNewPlane({...newPlane, equation, coefficients})
                }}
                placeholder="2x + 3y + z = 6"
                className="mt-2"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={newPlane.color}
                  onChange={(e) => setNewPlane({...newPlane, color: e.target.value})}
                />
              </div>
              <div>
                <Label>Opacidad</Label>
                <Input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={newPlane.opacity}
                  onChange={(e) => setNewPlane({...newPlane, opacity: Number(e.target.value)})}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addPlane} className="w-full">
                  <Layers className="h-4 w-4 mr-2" />
                  Agregar Plano
                </Button>
              </div>
            </div>
            
            {/* Lista de planos */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {planes.map((plane, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={plane.visible}
                    onChange={(e) => {
                      const newPlanes = [...planes]
                      newPlanes[index].visible = e.target.checked
                      setPlanes(newPlanes)
                    }}
                  />
                  <span className="flex-1 text-sm">{plane.equation}</span>
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: plane.color }} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab Rectas */}
          <TabsContent value="lines" className="space-y-4">
            <div>
              <Label>Ecuaciones paramétricas</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input
                  placeholder="x(t) = t"
                  value={newLine.parametric?.x || ""}
                  onChange={(e) => setNewLine({
                    ...newLine, 
                    parametric: {...newLine.parametric!, x: e.target.value}
                  })}
                />
                <Input
                  placeholder="y(t) = 2t"
                  value={newLine.parametric?.y || ""}
                  onChange={(e) => setNewLine({
                    ...newLine, 
                    parametric: {...newLine.parametric!, y: e.target.value}
                  })}
                />
                <Input
                  placeholder="z(t) = 3t"
                  value={newLine.parametric?.z || ""}
                  onChange={(e) => setNewLine({
                    ...newLine, 
                    parametric: {...newLine.parametric!, z: e.target.value}
                  })}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={newLine.color}
                  onChange={(e) => setNewLine({...newLine, color: e.target.value})}
                />
              </div>
              <div className="flex-1 flex items-end">
                <Button onClick={addLine} className="w-full">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Agregar Recta
                </Button>
              </div>
            </div>
            
            {/* Lista de rectas */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {lines.map((line, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={line.visible}
                    onChange={(e) => {
                      const newLines = [...lines]
                      newLines[index].visible = e.target.checked
                      setLines(newLines)
                    }}
                  />
                  <span className="flex-1 text-sm">
                    ({line.parametric?.x}, {line.parametric?.y}, {line.parametric?.z})
                  </span>
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: line.color }} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab Cálculos */}
          <TabsContent value="calculations" className="space-y-4">
            <div>
              <Label>Distancia de punto a recta</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label className="text-xs">Punto P</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={pointDistance.point.x}
                      onChange={(e) => setPointDistance({
                        ...pointDistance,
                        point: {...pointDistance.point, x: Number(e.target.value)}
                      })}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      value={pointDistance.point.y}
                      onChange={(e) => setPointDistance({
                        ...pointDistance,
                        point: {...pointDistance.point, y: Number(e.target.value)}
                      })}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      value={pointDistance.point.z}
                      onChange={(e) => setPointDistance({
                        ...pointDistance,
                        point: {...pointDistance.point, z: Number(e.target.value)}
                      })}
                      className="h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Punto de la recta</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={pointDistance.line.point.x}
                      onChange={(e) => setPointDistance({
                        ...pointDistance,
                        line: {
                          ...pointDistance.line,
                          point: {...pointDistance.line.point, x: Number(e.target.value)}
                        }
                      })}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      value={pointDistance.line.point.y}
                      onChange={(e) => setPointDistance({
                        ...pointDistance,
                        line: {
                          ...pointDistance.line,
                          point: {...pointDistance.line.point, y: Number(e.target.value)}
                        }
                      })}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      value={pointDistance.line.point.z}
                      onChange={(e) => setPointDistance({
                        ...pointDistance,
                        line: {
                          ...pointDistance.line,
                          point: {...pointDistance.line.point, z: Number(e.target.value)}
                        }
                      })}
                      className="h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Vector dirección</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={pointDistance.line.direction.x}
                      onChange={(e) => setPointDistance({
                        ...pointDistance,
                        line: {
                          ...pointDistance.line,
                          direction: {...pointDistance.line.direction, x: Number(e.target.value)}
                        }
                      })}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      value={pointDistance.line.direction.y}
                      onChange={(e) => setPointDistance({
                        ...pointDistance,
                        line: {
                          ...pointDistance.line,
                          direction: {...pointDistance.line.direction, y: Number(e.target.value)}
                        }
                      })}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      value={pointDistance.line.direction.z}
                      onChange={(e) => setPointDistance({
                        ...pointDistance,
                        line: {
                          ...pointDistance.line,
                          direction: {...pointDistance.line.direction, z: Number(e.target.value)}
                        }
                      })}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={calculatePointLineDistance} className="w-full mt-2">
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Distancia
              </Button>
              {pointDistance.result && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm font-medium">Distancia: {pointDistance.result}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Vista 3D - MÁS GRANDE */}
        <div className="w-full h-[800px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden border">
          <Canvas 
            camera={{ position: [15, 15, 15], fov: 60 }} 
            style={{ width: "100%", height: "100%" }}
            shadows
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              {/* Iluminación profesional */}
              <ambientLight intensity={0.4} />
              <directionalLight 
                position={[20, 20, 20]} 
                intensity={1.0}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <directionalLight position={[-10, 10, -10]} intensity={0.3} />
              <hemisphereLight intensity={0.3} groundColor="#f0f0f0" />

              <Environment preset="studio" />

              {/* Ejes profesionales */}
              {showAxes && (
                <group>
                  <gridHelper args={[30, 60, "#666666", "#cccccc"]} position={[0, 0, 0]} />
                  
                  <Line points={[[-15, 0, 0], [15, 0, 0]]} color="#ff4444" lineWidth={4} />
                  <Line points={[[0, -15, 0], [0, 15, 0]]} color="#44ff44" lineWidth={4} />
                  <Line points={[[0, 0, -15], [0, 0, 15]]} color="#4444ff" lineWidth={4} />
                  
                  <Text position={[16, 0, 0]} fontSize={1} color="#ff4444">X</Text>
                  <Text position={[0, 16, 0]} fontSize={1} color="#44ff44">Y</Text>
                  <Text position={[0, 0, 16]} fontSize={1} color="#4444ff">Z</Text>
                </group>
              )}

              {/* Renderizar superficies de funciones */}
              {surfaces.filter(s => s.visible).map((surface, index) => (
                <FunctionSurface
                  key={`surface-${index}`}
                  equation={surface.equation}
                  color={surface.color}
                  domain={surface.domain}
                />
              ))}
              
              {/* Renderizar superficies paramétricas */}
              {parametricSurfaces.filter(s => s.visible).map((surface, index) => (
                <ParametricSurface
                  key={`parametric-${index}`}
                  parametric={{
                    x: surface.x,
                    y: surface.y,
                    z: surface.z
                  }}
                  color={surface.color}
                  domain={surface.domain}
                />
              ))}

              {/* Renderizar superficies cuádricas */}
              {quadrics.filter(q => q.visible).map((quadric, index) => (
                <QuadricSurface
                  key={`quadric-${index}`}
                  type={quadric.type}
                  params={quadric.params}
                  color={quadric.color}
                />
              ))}

              {/* Renderizar planos */}
              {planes.filter(p => p.visible).map((plane, index) => (
                <Plane3D
                  key={`plane-${index}`}
                  coefficients={plane.coefficients}
                  color={plane.color}
                  opacity={plane.opacity}
                />
              ))}

              {/* Renderizar rectas */}
              {lines.filter(l => l.visible && l.parametric).map((line, index) => (
                <ParametricLine
                  key={`line-${index}`}
                  parametric={line.parametric!}
                  color={line.color}
                />
              ))}

              {/* Controles de órbita */}
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                autoRotate={autoRotate}
                autoRotateSpeed={1}
                maxDistance={50}
                minDistance={3}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Información estadística */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
          <div>
            <Badge variant="outline" className="mb-1">Superficies</Badge>
            <p className="text-xs text-muted-foreground">{surfaces.filter(s => s.visible).length} activas</p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">Paramétricas</Badge>
            <p className="text-xs text-muted-foreground">{parametricSurfaces.filter(s => s.visible).length} activas</p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">Cuádricas</Badge>
            <p className="text-xs text-muted-foreground">{quadrics.filter(q => q.visible).length} activas</p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">Planos</Badge>
            <p className="text-xs text-muted-foreground">{planes.filter(p => p.visible).length} activos</p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">Rectas</Badge>
            <p className="text-xs text-muted-foreground">{lines.filter(l => l.visible).length} activas</p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">Resolución</Badge>
            <p className="text-xs text-muted-foreground">800px altura</p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">Calidad</Badge>
            <p className="text-xs text-muted-foreground">Profesional</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
