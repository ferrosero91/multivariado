"use client"

import { useMemo, useState, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text, Environment, Line, Plane } from "@react-three/drei"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCcw, Move3D, Layers, GitBranch, Circle, Cylinder } from "lucide-react"
import * as THREE from "three"

interface Advanced3DPlotProps {
  functionExpression?: string
  title?: string
}

interface PlaneData {
  equation: string
  color: string
  opacity: number
  visible: boolean
}

interface LineData {
  parametric: {
    x: string
    y: string
    z: string
  }
  color: string
  visible: boolean
}

interface QuadricData {
  type: 'ellipsoid' | 'hyperboloid1' | 'hyperboloid2' | 'paraboloid' | 'cone' | 'cylinder'
  params: { a: number; b: number; c: number }
  color: string
  visible: boolean
}

const evaluateExpression = (expr: string, x: number, y: number): number => {
  try {
    const processedExpr = expr
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\bx\b/g, `(${x})`)
      .replace(/\by\b/g, `(${y})`)
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
    
    if (!isFinite(result) || isNaN(result)) {
      return 0
    }
    
    return Math.max(-50, Math.min(50, result))
  } catch (error) {
    return 0
  }
}

const evaluateParametric = (expr: string, t: number): number => {
  try {
    const processedExpr = expr
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\bt\b/g, `(${t})`)
      .replace(/\^/g, "**")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\be\b/g, "Math.E")

    const result = Function(`"use strict"; return (${processedExpr})`)()
    return isFinite(result) ? result : 0
  } catch (error) {
    return 0
  }
}

// Componente para superficies 3D
function Surface3D({ expression, color = "#4f46e5" }: { expression: string; color?: string }) {
  const geometry = useMemo(() => {
    const gridSize = 60
    const range = 5
    const step = (2 * range) / (gridSize - 1)
    
    const vertices = []
    const indices = []
    const colors = []
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = -range + i * step
        const y = -range + j * step
        const z = evaluateExpression(expression, x, y)
        
        vertices.push(x, z, y)
        
        // Color basado en altura
        const normalizedZ = (z + 10) / 20
        const hue = (1 - normalizedZ) * 0.7
        const colorObj = new THREE.Color().setHSL(hue, 0.8, 0.6)
        colors.push(colorObj.r, colorObj.g, colorObj.b)
      }
    }
    
    // Generar índices para triángulos
    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const a = i * gridSize + j
        const b = i * gridSize + (j + 1)
        const c = (i + 1) * gridSize + j
        const d = (i + 1) * gridSize + (j + 1)
        
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setIndex(indices)
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    
    return geo
  }, [expression])
  
  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.8} />
    </mesh>
  )
}

// Componente para planos 3D
function Plane3D({ equation, color, opacity }: { equation: string; color: string; opacity: number }) {
  const planeGeometry = useMemo(() => {
    // Parsear ecuación del plano ax + by + cz = d
    try {
      const size = 10
      const geo = new THREE.PlaneGeometry(size, size, 20, 20)
      
      // Calcular normal del plano y posición
      // Por simplicidad, asumimos planos como z = ax + by + c
      const vertices = geo.attributes.position.array as Float32Array
      
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i]
        const y = vertices[i + 1]
        vertices[i + 2] = evaluateExpression(equation, x, y)
      }
      
      geo.attributes.position.needsUpdate = true
      geo.computeVertexNormals()
      
      return geo
    } catch (error) {
      return new THREE.PlaneGeometry(5, 5)
    }
  }, [equation])
  
  return (
    <mesh geometry={planeGeometry}>
      <meshLambertMaterial color={color} side={THREE.DoubleSide} transparent opacity={opacity} />
    </mesh>
  )
}

// Componente para rectas paramétricas
function ParametricLine({ parametric, color }: { parametric: LineData['parametric']; color: string }) {
  const points = useMemo(() => {
    const pts = []
    const tMin = -5
    const tMax = 5
    const steps = 100
    const step = (tMax - tMin) / steps
    
    for (let i = 0; i <= steps; i++) {
      const t = tMin + i * step
      const x = evaluateParametric(parametric.x, t)
      const y = evaluateParametric(parametric.y, t)
      const z = evaluateParametric(parametric.z, t)
      pts.push(new THREE.Vector3(x, z, y))
    }
    
    return pts
  }, [parametric])
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={3}
    />
  )
}

// Componente para superficies cuádricas
function QuadricSurface({ type, params, color }: { type: QuadricData['type']; params: QuadricData['params']; color: string }) {
  const geometry = useMemo(() => {
    const { a, b, c } = params
    const segments = 32
    
    switch (type) {
      case 'ellipsoid':
        return new THREE.SphereGeometry(1, segments, segments)
      
      case 'paraboloid':
        const paraboloidGeometry = new THREE.CylinderGeometry(0, 2, 4, segments)
        const positions = paraboloidGeometry.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i] / a
          const y = positions[i + 1]
          const z = positions[i + 2] / c
          positions[i + 1] = x * x + z * z // y = x²/a² + z²/c²
        }
        paraboloidGeometry.attributes.position.needsUpdate = true
        paraboloidGeometry.computeVertexNormals()
        return paraboloidGeometry
      
      case 'cone':
        return new THREE.ConeGeometry(2, 4, segments)
      
      case 'cylinder':
        return new THREE.CylinderGeometry(1, 1, 4, segments)
      
      case 'hyperboloid1':
        const hyp1Geometry = new THREE.SphereGeometry(1, segments, segments)
        const hyp1Positions = hyp1Geometry.attributes.position.array as Float32Array
        for (let i = 0; i < hyp1Positions.length; i += 3) {
          const x = hyp1Positions[i]
          const y = hyp1Positions[i + 1] 
          const z = hyp1Positions[i + 2]
          // Hiperboloide de una hoja: x²/a² + y²/b² - z²/c² = 1
          const factor = Math.sqrt(1 + (z * z) / (c * c))
          hyp1Positions[i] = x * factor * a
          hyp1Positions[i + 1] = y * factor * b
        }
        hyp1Geometry.attributes.position.needsUpdate = true
        hyp1Geometry.computeVertexNormals()
        return hyp1Geometry
      
      default:
        return new THREE.SphereGeometry(1, segments, segments)
    }
  }, [type, params])

  const scale = useMemo(() => {
    const { a, b, c } = params
    return [a, b, c] as [number, number, number]
  }, [params])

  return (
    <mesh geometry={geometry} scale={scale}>
      <meshLambertMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  )
}

// Componente para ejes 3D profesionales
function ProfessionalAxes() {
  return (
    <group>
      {/* Rejilla del plano XY */}
      <gridHelper 
        args={[20, 40, "#666666", "#cccccc"]} 
        position={[0, 0, 0]}
      />
      
      {/* Ejes principales */}
      <Line
        points={[[-10, 0, 0], [10, 0, 0]]}
        color="#ff4444"
        lineWidth={4}
      />
      <Line
        points={[[0, -10, 0], [0, 10, 0]]}
        color="#44ff44"
        lineWidth={4}
      />
      <Line
        points={[[0, 0, -10], [0, 0, 10]]}
        color="#4444ff"
        lineWidth={4}
      />
      
      {/* Etiquetas de ejes */}
      <Text position={[10.5, 0, 0]} fontSize={0.8} color="#ff4444" fontWeight="bold">
        X
      </Text>
      <Text position={[0, 10.5, 0]} fontSize={0.8} color="#44ff44" fontWeight="bold">
        Y
      </Text>
      <Text position={[0, 0, 10.5]} fontSize={0.8} color="#4444ff" fontWeight="bold">
        Z
      </Text>
      
      {/* Marcas en los ejes */}
      {[-5, -2.5, 2.5, 5].map((val) => (
        <group key={`marks-${val}`}>
          <Text position={[val, -0.5, 0]} fontSize={0.3} color="#666666">
            {val}
          </Text>
          <Text position={[-0.5, val, 0]} fontSize={0.3} color="#666666">
            {val}
          </Text>
          <Text position={[0, -0.5, val]} fontSize={0.3} color="#666666">
            {val}
          </Text>
        </group>
      ))}
    </group>
  )
}

export default function Advanced3DPlot({ 
  functionExpression = "x^2 + y^2", 
  title = "Visualización 3D Profesional" 
}: Advanced3DPlotProps) {
  const [autoRotate, setAutoRotate] = useState(false)
  const [showAxes, setShowAxes] = useState(true)
  const [activeTab, setActiveTab] = useState("surface")
  
  // Estados para superficies
  const [surfaceExpression, setSurfaceExpression] = useState(functionExpression)
  
  // Estados para planos
  const [planes, setPlanes] = useState<PlaneData[]>([
    { equation: "x + y", color: "#ff6b6b", opacity: 0.6, visible: false }
  ])
  const [newPlane, setNewPlane] = useState({ equation: "", color: "#ff6b6b", opacity: 0.6 })
  
  // Estados para rectas
  const [lines, setLines] = useState<LineData[]>([
    { parametric: { x: "t", y: "t", z: "t" }, color: "#4ecdc4", visible: false }
  ])
  const [newLine, setNewLine] = useState({ 
    parametric: { x: "", y: "", z: "" }, 
    color: "#4ecdc4" 
  })

  // Estados para superficies cuádricas
  const [quadrics, setQuadrics] = useState<QuadricData[]>([])
  const [newQuadric, setNewQuadric] = useState({
    type: 'ellipsoid' as QuadricData['type'],
    params: { a: 1, b: 1, c: 1 },
    color: "#9b59b6"
  })

  const addPlane = () => {
    if (newPlane.equation.trim()) {
      setPlanes([...planes, { ...newPlane, visible: true }])
      setNewPlane({ equation: "", color: "#ff6b6b", opacity: 0.6 })
    }
  }

  const addLine = () => {
    if (newLine.parametric.x.trim() && newLine.parametric.y.trim() && newLine.parametric.z.trim()) {
      setLines([...lines, { ...newLine, visible: true }])
      setNewLine({ parametric: { x: "", y: "", z: "" }, color: "#4ecdc4" })
    }
  }

  const addQuadric = () => {
    setQuadrics([...quadrics, { ...newQuadric, visible: true }])
    setNewQuadric({
      type: 'ellipsoid' as QuadricData['type'],
      params: { a: 1, b: 1, c: 1 },
      color: "#9b59b6"
    })
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
              Visualización profesional de superficies, planos y rectas en 3D
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              3D Avanzado
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setShowAxes(!showAxes)} variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" />
            {showAxes ? "Ocultar Ejes" : "Mostrar Ejes"}
          </Button>
          <Button onClick={() => setAutoRotate(!autoRotate)} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            {autoRotate ? "Parar Rotación" : "Auto-rotar"}
          </Button>
        </div>

        {/* Tabs para diferentes tipos de gráficas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="surface">Superficies</TabsTrigger>
            <TabsTrigger value="quadrics">Cuádricas</TabsTrigger>
            <TabsTrigger value="planes">Planos</TabsTrigger>
            <TabsTrigger value="lines">Rectas</TabsTrigger>
          </TabsList>

          <TabsContent value="surface" className="space-y-4">
            <div>
              <Label htmlFor="surface-expr">Función z = f(x,y)</Label>
              <Input
                id="surface-expr"
                value={surfaceExpression}
                onChange={(e) => setSurfaceExpression(e.target.value)}
                placeholder="x^2 + y^2, sin(x)*cos(y), x*y"
                className="mt-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="quadrics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quadric-type">Tipo de superficie</Label>
                <Select 
                  value={newQuadric.type} 
                  onValueChange={(value) => setNewQuadric({...newQuadric, type: value as QuadricData['type']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ellipsoid">Elipsoide</SelectItem>
                    <SelectItem value="paraboloid">Paraboloide</SelectItem>
                    <SelectItem value="hyperboloid1">Hiperboloide (1 hoja)</SelectItem>
                    <SelectItem value="cone">Cono</SelectItem>
                    <SelectItem value="cylinder">Cilindro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quadric-color">Color</Label>
                <Input
                  id="quadric-color"
                  type="color"
                  value={newQuadric.color}
                  onChange={(e) => setNewQuadric({...newQuadric, color: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="param-a">Parámetro a</Label>
                <Input
                  id="param-a"
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
                <Label htmlFor="param-b">Parámetro b</Label>
                <Input
                  id="param-b"
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
                <Label htmlFor="param-c">Parámetro c</Label>
                <Input
                  id="param-c"
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
            <div className="space-y-2">
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
                  <span className="flex-1 capitalize">
                    {quadric.type} (a={quadric.params.a}, b={quadric.params.b}, c={quadric.params.c})
                  </span>
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: quadric.color }}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="planes" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plane-eq">Ecuación del plano (z = ...)</Label>
                <Input
                  id="plane-eq"
                  value={newPlane.equation}
                  onChange={(e) => setNewPlane({...newPlane, equation: e.target.value})}
                  placeholder="2*x + 3*y - 1"
                />
              </div>
              <div>
                <Label htmlFor="plane-color">Color</Label>
                <Input
                  id="plane-color"
                  type="color"
                  value={newPlane.color}
                  onChange={(e) => setNewPlane({...newPlane, color: e.target.value})}
                />
              </div>
            </div>
            <Button onClick={addPlane} className="w-full">
              <Layers className="h-4 w-4 mr-2" />
              Agregar Plano
            </Button>
            
            {/* Lista de planos */}
            <div className="space-y-2">
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
                  <span className="flex-1">z = {plane.equation}</span>
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: plane.color }}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lines" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="line-x">x(t)</Label>
                <Input
                  id="line-x"
                  value={newLine.parametric.x}
                  onChange={(e) => setNewLine({
                    ...newLine, 
                    parametric: {...newLine.parametric, x: e.target.value}
                  })}
                  placeholder="t, cos(t), 2*t"
                />
              </div>
              <div>
                <Label htmlFor="line-y">y(t)</Label>
                <Input
                  id="line-y"
                  value={newLine.parametric.y}
                  onChange={(e) => setNewLine({
                    ...newLine, 
                    parametric: {...newLine.parametric, y: e.target.value}
                  })}
                  placeholder="t, sin(t), t^2"
                />
              </div>
              <div>
                <Label htmlFor="line-z">z(t)</Label>
                <Input
                  id="line-z"
                  value={newLine.parametric.z}
                  onChange={(e) => setNewLine({
                    ...newLine, 
                    parametric: {...newLine.parametric, z: e.target.value}
                  })}
                  placeholder="t, t^2, sin(t)"
                />
              </div>
            </div>
            <Button onClick={addLine} className="w-full">
              <GitBranch className="h-4 w-4 mr-2" />
              Agregar Recta
            </Button>
            
            {/* Lista de rectas */}
            <div className="space-y-2">
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
                    ({line.parametric.x}, {line.parametric.y}, {line.parametric.z})
                  </span>
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: line.color }}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Vista 3D - Más grande */}
        <div className="w-full h-[700px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden border">
          <Canvas 
            camera={{ position: [12, 12, 12], fov: 60 }} 
            style={{ width: "100%", height: "100%" }}
            shadows
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              {/* Iluminación profesional */}
              <ambientLight intensity={0.4} />
              <directionalLight 
                position={[15, 15, 15]} 
                intensity={1.0}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <directionalLight position={[-10, 10, -10]} intensity={0.3} />
              <hemisphereLight intensity={0.3} groundColor="#f0f0f0" />

              {/* Entorno */}
              <Environment preset="studio" />

              {/* Ejes */}
              {showAxes && <ProfessionalAxes />}

              {/* Superficie principal */}
              {activeTab === "surface" && (
                <Surface3D expression={surfaceExpression} />
              )}

              {/* Planos */}
              {planes.filter(p => p.visible).map((plane, index) => (
                <Plane3D
                  key={`plane-${index}`}
                  equation={plane.equation}
                  color={plane.color}
                  opacity={plane.opacity}
                />
              ))}

              {/* Rectas */}
              {lines.filter(l => l.visible).map((line, index) => (
                <ParametricLine
                  key={`line-${index}`}
                  parametric={line.parametric}
                  color={line.color}
                />
              ))}

              {/* Superficies cuádricas */}
              {quadrics.filter(q => q.visible).map((quadric, index) => (
                <QuadricSurface
                  key={`quadric-${index}`}
                  type={quadric.type}
                  params={quadric.params}
                  color={quadric.color}
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
                minDistance={5}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Información */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <Badge variant="outline" className="mb-1">
              Superficies
            </Badge>
            <p className="text-xs text-muted-foreground">
              1 activa
            </p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              Cuádricas
            </Badge>
            <p className="text-xs text-muted-foreground">
              {quadrics.filter(q => q.visible).length} activas
            </p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              Planos
            </Badge>
            <p className="text-xs text-muted-foreground">
              {planes.filter(p => p.visible).length} activos
            </p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              Rectas
            </Badge>
            <p className="text-xs text-muted-foreground">
              {lines.filter(l => l.visible).length} activas
            </p>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              Resolución
            </Badge>
            <p className="text-xs text-muted-foreground">
              700px altura
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
