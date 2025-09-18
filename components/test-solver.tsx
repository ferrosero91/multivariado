"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { aiSolver } from "@/lib/ai-solver"

export default function TestSolver() {
  const [problem, setProblem] = useState("x^2 + 2x + 1 = 0")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testSolver = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("🧪 Testing solver with problem:", problem)
      const solution = await aiSolver.solveMathProblem(problem)
      console.log("✅ Solution received:", solution)
      setResult(solution)
    } catch (err) {
      console.error("❌ Error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Prueba del Solucionador de IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Ingresa un problema matemático"
          />
          <Button onClick={testSolver} disabled={loading}>
            {loading ? "Resolviendo..." : "Resolver"}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ Error: {error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">✅ Solución:</h3>
              <p className="text-green-700">{result.solution}</p>
              <p className="text-sm text-green-600">Tipo: {result.type}</p>
              <p className="text-sm text-green-600">Confianza: {Math.round(result.confidence * 100)}%</p>
            </div>

            {result.steps && result.steps.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📝 Pasos:</h3>
                {result.steps.map((step: any, index: number) => (
                  <div key={index} className="mb-2 p-2 bg-white rounded border">
                    <p className="font-medium">Paso {step.step}: {step.description}</p>
                    <p className="font-mono text-sm">{step.equation}</p>
                    <p className="text-sm text-gray-600">{step.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>💡 Abre la consola del navegador (F12) para ver logs detallados</p>
        </div>
      </CardContent>
    </Card>
  )
}