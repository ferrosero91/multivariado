"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  Clock, 
  Lightbulb, 
  Calculator, 
  ArrowRight, 
  Copy, 
  Download,
  Loader2,
  AlertCircle,
  Brain,
  Zap
} from "lucide-react"
import { aiSolver, type MathSolution } from "@/lib/ai-solver"

interface StepByStepperProps {
  expression: string
}

export default function StepByStepper({ expression }: StepByStepperProps) {
  const [solution, setSolution] = useState<MathSolution | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (expression) {
      solveProblem()
    }
  }, [expression])

  const solveProblem = async () => {
    console.log('🔧 Starting problem solving for:', expression)
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('📞 Calling AI solver...')
      const result = await aiSolver.solveSpecificProblem(expression)
      console.log('✅ Got result from AI solver:', result)
      setSolution(result)
      setCurrentStep(0)
    } catch (err) {
      console.error('❌ Error solving problem:', err)
      setError(`Error al resolver el problema: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Aquí podrías agregar una notificación de éxito
  }

  const nextStep = () => {
    if (solution && currentStep < solution.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Resolviendo problema...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Nuestro sistema de IA está analizando tu problema matemático
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al resolver
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={solveProblem} variant="outline">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  if (!solution) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 dark:text-gray-400">No se pudo generar una solución</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con información del problema */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Problema a resolver
              </CardTitle>
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 font-mono text-lg">
                {expression}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(expression)}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              <Calculator className="h-3 w-3 mr-1" />
              {solution.type}
            </Badge>
            
            {solution.provider && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                <Brain className="h-3 w-3 mr-1" />
                Resuelto por {solution.provider}
              </Badge>
            )}
            
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
              <Zap className="h-3 w-3 mr-1" />
              {Math.round(solution.confidence * 100)}% confianza
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Confianza: {Math.round(solution.confidence * 100)}%
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Solución final */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-green-800 dark:text-green-300 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Solución Final
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 font-mono text-xl text-center border border-green-200 dark:border-green-800">
            {solution.solution}
          </div>
        </CardContent>
      </Card>

      {/* Navegación de pasos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
            Solución Paso a Paso
          </CardTitle>
          
          {/* Indicador de progreso */}
          <div className="flex items-center gap-2 mt-4">
            {solution.steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  index === currentStep
                    ? 'bg-purple-600 text-white shadow-lg'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-400 dark:hover:bg-slate-600'
                }`}
              >
                {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Paso actual */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Paso {currentStep + 1}: {solution.steps[currentStep]?.description}
              </h3>
              <Badge variant="outline">
                {currentStep + 1} de {solution.steps.length}
              </Badge>
            </div>
            
            <Separator />
            
            {/* Ecuación del paso */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="font-mono text-lg text-center text-blue-900 dark:text-blue-300">
                {solution.steps[currentStep]?.equation}
              </div>
            </div>
            
            {/* Explicación */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                Explicación:
              </h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {solution.steps[currentStep]?.explanation}
              </p>
            </div>
            
            {/* Navegación */}
            <div className="flex justify-between items-center pt-4">
              <Button
                onClick={prevStep}
                disabled={currentStep === 0}
                variant="outline"
                className="flex items-center"
              >
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                Paso Anterior
              </Button>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Paso {currentStep + 1} de {solution.steps.length}
              </div>
              
              <Button
                onClick={nextStep}
                disabled={currentStep === solution.steps.length - 1}
                className="flex items-center bg-purple-600 hover:bg-purple-700"
              >
                Siguiente Paso
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Todos los pasos (vista completa) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Vista Completa de la Solución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {solution.steps.map((step, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 transition-all ${
                  index === currentStep
                    ? 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-l-gray-300 bg-gray-50 dark:bg-slate-800 dark:border-l-slate-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    index === currentStep
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-300 text-gray-700 dark:bg-slate-600 dark:text-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {step.description}
                    </h4>
                    <div className="bg-white dark:bg-slate-700 rounded p-3 font-mono text-sm mb-2 border">
                      {step.equation}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acciones adicionales */}
      <div className="flex gap-2 justify-center">
        <Button
          onClick={() => copyToClipboard(JSON.stringify(solution, null, 2))}
          variant="outline"
          className="flex items-center"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copiar Solución
        </Button>
        
        <Button
          onClick={solveProblem}
          variant="outline"
          className="flex items-center"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Resolver de Nuevo
        </Button>
      </div>
    </div>
  )
}