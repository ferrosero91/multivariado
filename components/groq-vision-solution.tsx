"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    X,
    CheckCircle,
    Brain,
    Sparkles,
    BookOpen,
    Zap,
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
        <Card className="w-full max-w-5xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-6 w-6 text-purple-600" />
                            Solución Completa - Groq Vision
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                IA Avanzada
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Análisis matemático completo con pasos detallados
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Ecuación */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-lg">Ecuación Analizada:</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-700 mb-4">
                        <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100 text-center">
                            {equation}
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <Button size="sm" onClick={copyEquation} variant="outline">
                            <Copy className="h-3 w-3 mr-2" />
                            Copiar Ecuación
                        </Button>
                    </div>
                </div>

                {/* Pasos de solución */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-green-800 dark:text-green-200">
                        <BookOpen className="h-6 w-6" />
                        Solución Paso a Paso ({steps.length} pasos):
                    </h3>
                    <div className="space-y-4">
                        {steps.map((step, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-green-100 dark:border-green-800 shadow-md p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                                            {step}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Respuesta final */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg shadow-lg">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <Zap className="h-6 w-6" />
                        Respuesta Final:
                    </h3>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-blue-200 dark:border-blue-700 mb-4">
                        <div className="text-center text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {answer}
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Solución verificada por IA
                        </Badge>
                        <Button size="sm" onClick={copyAnswer} variant="outline">
                            <Copy className="h-3 w-3 mr-2" />
                            Copiar Respuesta
                        </Button>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button onClick={copyFullSolution} className="flex-1 bg-purple-600 hover:bg-purple-700">
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Solución Completa
                    </Button>
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cerrar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
