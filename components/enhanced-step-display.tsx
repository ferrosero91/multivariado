"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import MathTextRenderer from "@/components/math-text-renderer"

interface StepDisplayProps {
  steps: string[]
  equation: string
  answer: string
  provider?: string
  confidence?: number
}

// Función para detectar el tipo de problema matemático
const detectProblemType = (equation: string): { type: string; color: string } => {
  const eq = equation.toLowerCase()
  
  if (eq.includes('lim') && (eq.includes('(x,y)') || eq.includes('x,y') || eq.includes('→') || eq.includes('->')) && (eq.includes('(0,0)') || eq.includes('0,0'))) {
    return { type: 'Límite Multivariado', color: 'purple' }
  } else if (eq.includes('lim') || eq.includes('límite') || eq.includes('limite')) {
    return { type: 'Cálculo de Límites', color: 'indigo' }
  } else if (eq.includes('∫') || eq.includes('integral') || eq.includes('dx') || eq.includes('dy') || eq.includes('∫∫')) {
    return { type: 'Cálculo Integral', color: 'green' }
  } else if (eq.includes("d/dx") || eq.includes("d/dy") || eq.includes("∂/∂") || eq.includes("derivada")) {
    return { type: 'Cálculo Diferencial', color: 'blue' }
  } else if (eq.includes('=') && (eq.includes('dy/dx') || eq.includes('y\'') || eq.includes("y''"))) {
    return { type: 'Ecuación Diferencial', color: 'red' }
  } else if (eq.includes('∇') || eq.includes('grad') || eq.includes('div') || eq.includes('curl')) {
    return { type: 'Cálculo Vectorial', color: 'orange' }
  } else {
    return { type: 'Álgebra', color: 'gray' }
  }
}

export default function EnhancedStepDisplay({ 
  steps, 
  equation, 
  answer, 
  provider = "Groq", 
  confidence = 95 
}: StepDisplayProps) {
  const problemType = detectProblemType(equation)
  
  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.gray
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header con problema */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Solución Paso a Paso
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Problema a resolver
              </h3>
              <div className="text-2xl font-mono text-blue-900 dark:text-blue-100">
                <MathTextRenderer text={equation} className="text-center" />
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge variant="secondary" className={getColorClasses(problemType.color)}>
                {problemType.type}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                Resuelto por {provider}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                {confidence}% confianza
              </Badge>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                Solución Final
              </h3>
              <div className="text-xl font-mono text-green-900 dark:text-green-100">
                <MathTextRenderer text={answer} className="text-center" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pasos detallados */}
      <Card className="border-2 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
            Desarrollo Paso a Paso ({steps.length} pasos)
          </h3>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="border-l-4 border-blue-500 pl-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-r-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-blue-800 dark:text-blue-200 mb-3">
                      Paso {index + 1}:
                    </h4>
                    <div className="text-base leading-relaxed">
                      <MathTextRenderer text={step} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Footer con resultado final destacado */}
      <Card className="border-2 border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
            🎉 Resultado Final
          </h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-green-300 dark:border-green-600 shadow-lg">
            <div className="text-2xl font-mono font-bold text-green-900 dark:text-green-100">
              <MathTextRenderer text={answer} />
            </div>
          </div>
          <p className="mt-4 text-green-700 dark:text-green-300 text-sm">
            Solución verificada con {confidence}% de confianza
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
