"use client"

import { useMemo, useState, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text, Environment } from "@react-three/drei"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Move3D } from "lucide-react"
import * as THREE from "three"

interface SurfacePlot3DProps {
  expression: string
  xRange?: [number, number]
  yRange?: [number, number]
  title?: string
}

const evaluateExpression = (expr: string, x: number, y: number): number => {
  try {
    const processedExpr = expr
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\bx\b/g, `(${x})`)
      .replace(/\by\b/g, `(${y})`)
      .replace(/\^/g, "**")
      .replace(/sin/g, "Math.sin")
      .replace(/cos/g, "Math.cos")
      .replace(/tan/g, "Math.tan")
      .replace(/ln/g, "Math.log")
      .replace(/log/g, "Math.log10")
      .replace(/sqrt/g, "Math.sqrt")
      .replace(/pi/g, "Math.PI")
      .replace(/e\b/g, "Math.E")
      .replace(/abs/g, "Math.abs")
      .replace(/exp/g, "Math.exp")
      .replace(/floor/g, "Math.floor")
      .replace(/ceil/g, "Math.ceil")
      .replace(/round/g, "Math.round")

    const result = Function(`"use strict"; return (${processedExpr})`)()

    if (!isFinite(result) || isNaN(result)) {
      return 0
    }

    // Limitar valores extremos
    return Math.max(-100, Math.min(100, result))
  } catch (error) {
    return 0
  }
}

function Surface3D({
  expression,
  xRange,
  yRange,
}: { expression: string; xRange: [number, number]; yRange: [number, number] }) {
  const { geometry, minZ, maxZ } = useMemo(() => {
    console.log("[v0] Generating 3D surface geometry for:", expression)

    const gridSize = 100
    const stepX = (xRange[1] - xRange[0]) / (gridSize - 1)
    const stepY = (yRange[1] - yRange[0]) / (gridSize - 1)

    const vertices = []
    const colors = []
    const indices = []

    let minZ = Number.POSITIVE_INFINITY
    let maxZ = Number.NEGATIVE_INFINITY

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = xRange[0] + i * stepX
        const y = yRange[0] + j * stepY
        const z = evaluateExpression(expression, x, y)

        vertices.push(x, z, y) // Note: Y and Z swapped for proper 3D orientation

        if (isFinite(z)) {
          minZ = Math.min(minZ, z)
          maxZ = Math.max(maxZ, z)
        }
      }
    }

    if (!isFinite(minZ) || !isFinite(maxZ) || minZ === maxZ) {
      minZ = -1
      maxZ = 1
    }

    const zRange = maxZ - minZ

    // Colores estilo GeoGebra - gradiente azul a rojo
    for (let i = 0; i < vertices.length; i += 3) {
      const z = vertices[i + 1]
      const normalizedZ = (z - minZ) / zRange
      const color = new THREE.Color()
      
      // Gradiente estilo GeoGebra: azul (bajo) -> verde -> amarillo -> rojo (alto)
      if (normalizedZ < 0.25) {
        // Azul a cyan
        color.setRGB(0, normalizedZ * 4, 1)
      } else if (normalizedZ < 0.5) {
        // Cyan a verde
        const t = (normalizedZ - 0.25) * 4
        color.setRGB(0, 1, 1 - t)
      } else if (normalizedZ < 0.75) {
        // Verde a amarillo
        const t = (normalizedZ - 0.5) * 4
        color.setRGB(t, 1, 0)
      } else {
        // Amarillo a rojo
        const t = (normalizedZ - 0.75) * 4
        color.setRGB(1, 1 - t, 0)
      }
      
      colors.push(color.r, color.g, color.b)
    }

    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const a = i * gridSize + j
        const b = i * gridSize + j + 1
        const c = (i + 1) * gridSize + j
        const d = (i + 1) * gridSize + j + 1

        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setIndex(indices)
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
    geometry.computeVertexNormals()

    console.log("[v0] Generated 3D surface with", vertices.length / 3, "vertices")
    console.log("[v0] Z range:", minZ.toFixed(3), "to", maxZ.toFixed(3))

    return { geometry, minZ, maxZ }
  }, [expression, xRange, yRange])

  return (
    <group>
      {/* Superficie principal estilo GeoGebra */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshLambertMaterial 
          vertexColors 
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.9}
          wireframe={false}
        />
      </mesh>
      
      {/* Wireframe sutil para mejor definición */}
      <mesh geometry={geometry}>
        <meshBasicMaterial 
          color="#333333"
          wireframe={true}
          transparent={true}
          opacity={0.15}
        />
      </mesh>
    </group>
  )
}

function Axes() {
  return (
    <group>
      {/* Eje X - Rojo estilo GeoGebra */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 10]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>
      <Text position={[5.2, 0.2, 0]} fontSize={0.4} color="#ff4444">
        X
      </Text>

      {/* Eje Y - Verde estilo GeoGebra */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 10]} />
        <meshBasicMaterial color="#44ff44" />
      </mesh>
      <Text position={[0.2, 5.2, 0]} fontSize={0.4} color="#44ff44">
        Y
      </Text>

      {/* Eje Z - Azul estilo GeoGebra */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 10]} />
        <meshBasicMaterial color="#4444ff" />
      </mesh>
      <Text position={[0.2, 0, 5.2]} fontSize={0.4} color="#4444ff">
        Z
      </Text>

      {/* Rejilla del plano XY estilo GeoGebra */}
      <gridHelper 
        args={[10, 20, "#888888", "#dddddd"]} 
        position={[0, -0.1, 0]}
      />
    </group>
  )
}

export default function SurfacePlot3D({
  expression,
  xRange = [-3, 3],
  yRange = [-3, 3],
  title = "Superficie 3D",
}: SurfacePlot3DProps) {
  const [showAxes, setShowAxes] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex gap-2">
            <Badge variant={wireframe ? "default" : "secondary"}>{wireframe ? "Wireframe" : "Superficie"}</Badge>
            <Badge variant="outline">
              <Move3D className="h-3 w-3 mr-1" />
              3D Interactivo
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>f(x,y) = {expression}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowAxes(!showAxes)} variant="outline" size="sm">
            {showAxes ? "Ocultar" : "Mostrar"} Ejes
          </Button>
          <Button onClick={() => setWireframe(!wireframe)} variant="outline" size="sm">
            {wireframe ? "Superficie" : "Wireframe"}
          </Button>
          <Button onClick={() => setAutoRotate(!autoRotate)} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            {autoRotate ? "Parar" : "Auto-rotar"}
          </Button>
        </div>

        {/* Vista 3D con React Three Fiber */}
        <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden">
          <Canvas 
            camera={{ position: [8, 8, 8], fov: 60 }} 
            style={{ width: "100%", height: "100%" }}
            shadows
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 2]}
          >
            <Suspense
              fallback={
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color="gray" />
                </mesh>
              }
            >
              {/* Iluminación estilo GeoGebra */}
              <ambientLight intensity={0.6} />
              <directionalLight 
                position={[10, 10, 10]} 
                intensity={0.8}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-far={50}
                shadow-camera-left={-15}
                shadow-camera-right={15}
                shadow-camera-top={15}
                shadow-camera-bottom={-15}
              />
              <directionalLight position={[-5, 5, 5]} intensity={0.3} />
              <hemisphereLight intensity={0.4} groundColor="#f0f0f0" />

              {/* Entorno */}
              <Environment preset="studio" />

              {/* Superficie 3D */}
              <Surface3D expression={expression} xRange={xRange} yRange={yRange} />

              {/* Ejes de coordenadas */}
              {showAxes && <Axes />}

              {/* Controles de órbita */}
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                autoRotate={autoRotate}
                autoRotateSpeed={2}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Información de la superficie */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <strong>Dominio X:</strong>
            <br />[{xRange[0]}, {xRange[1]}]
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <strong>Dominio Y:</strong>
            <br />[{yRange[0]}, {yRange[1]}]
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
            <strong>Resolución:</strong>
            <br />
            50×50 puntos
          </div>
        </div>

        {/* Instrucciones de uso */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Controles:</strong> Arrastra para rotar, rueda del mouse para zoom, clic derecho para mover la
            vista.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
