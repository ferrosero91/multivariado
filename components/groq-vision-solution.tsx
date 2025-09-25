"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import EnhancedStepDisplay from "@/components/enhanced-step-display"
import {
    X,
    Copy
} from "lucide-react"

interface GroqVisionSolutionProps {
    equation: string
    steps: string[]
    answer: string
    onClose: () => void
}

export default function GroqVisionSolution({ equation, steps, answer, onClose }: GroqVisionSolutionProps) {
    const copyEquation = () => {
        navigator.clipboard.writeText(equation)
    }

    const copyAnswer = () => {
        navigator.clipboard.writeText(answer)
    }

    const copyFullSolution = () => {
        const fullSolution = `Ecuación: ${equation}\n\nSolución:\n${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\nRespuesta: ${answer}`
        navigator.clipboard.writeText(fullSolution)
    }

    return (
        <div className="w-full max-w-6xl mx-auto relative">
            {/* Botón de cerrar flotante */}
            <div className="absolute top-4 right-4 z-10">
                <Button variant="ghost" size="sm" onClick={onClose} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
                    <X className="h-4 w-4" />
                </Button>
            </div>
            
            {/* Display mejorado de pasos */}
            <EnhancedStepDisplay 
                steps={steps}
                equation={equation}
                answer={answer}
                provider="Groq Vision"
                confidence={95}
            />
            
            {/* Botones de acción */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto">
                <Button onClick={copyFullSolution} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Solución Completa
                </Button>
                <Button onClick={copyEquation} variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Ecuación
                </Button>
                <Button onClick={copyAnswer} variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Respuesta
                </Button>
            </div>
        </div>
    )
}
