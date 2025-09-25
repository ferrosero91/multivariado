"use client"

import React, { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Camera,
    Upload,
    X,
    CheckCircle,
    Loader2,
    AlertCircle,
    Eye,
    Zap,
    Copy,
    RotateCcw,
    Brain,
    Sparkles,
    BookOpen
} from "lucide-react"
import { groqVision } from "@/lib/services/groq-vision"

interface MathExtractionResult {
  text: string
  equation: string
  steps: string[]
  answer: string
  confidence: number
  provider: string
}

interface GroqVisionOCRProps {
    onEquationDetected: (equation: string, confidence: number) => void
    onSolutionFound?: (steps: string[], answer: string, equation?: string) => void
    onClose?: () => void
}

export default function GroqVisionOCR({ onEquationDetected, onSolutionFound, onClose }: GroqVisionOCRProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState<MathExtractionResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState('')

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // Verificar si Groq Vision está disponible
    const isGroqAvailable = groqVision.isAvailable()

    /**
     * Procesar imagen con Groq Vision
     */
    const processImageWithGroqVision = async (imageData: string | File) => {
        setIsProcessing(true)
        setProgress(0)
        setError(null)
        setResult(null)

        try {
            // Paso 1: Preparar imagen
            setCurrentStep('Preparando imagen para análisis...')
            setProgress(20)
            
            await new Promise(resolve => setTimeout(resolve, 500)) // UX delay

            // Paso 2: Enviar a Groq Vision
            setCurrentStep('🤖 Analizando imagen con Groq Vision...')
            setProgress(40)

            const extractionResult = await groqVision.extractMathFromImage(imageData)
            setProgress(70)

            // Paso 3: Procesar resultados
            setCurrentStep('📝 Procesando solución matemática...')
            setProgress(90)

            setResult(extractionResult)
            setProgress(100)
            setCurrentStep('¡Análisis completado!')

            // Notificar a componente padre
            if (extractionResult.equation) {
                onEquationDetected(extractionResult.equation, extractionResult.confidence)
            }

            if (onSolutionFound && extractionResult.steps && extractionResult.answer) {
                onSolutionFound(extractionResult.steps, extractionResult.answer, extractionResult.equation)
            }

        } catch (err) {
            console.error('❌ Groq Vision processing failed:', err)
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido en Groq Vision'
            setError(errorMessage)
        } finally {
            setIsProcessing(false)
            setProgress(0)
            setCurrentStep('')
        }
    }

    // Funciones de cámara
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
                setIsCameraOpen(true)
            }
        } catch (error) {
            setError('No se pudo acceder a la cámara. Verifica los permisos.')
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setIsCameraOpen(false)
    }, [])

    const captureImage = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return

        const canvas = canvasRef.current
        const video = videoRef.current
        const ctx = canvas.getContext('2d')

        if (!ctx) return

        // Capturar en alta resolución
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        const capturedDataUrl = canvas.toDataURL('image/png', 1.0)
        setCapturedImage(capturedDataUrl)
        stopCamera()
        
        // Procesar inmediatamente con Groq Vision
        processImageWithGroqVision(capturedDataUrl)
    }, [stopCamera])

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona un archivo de imagen válido')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const result = e.target?.result as string
            setCapturedImage(result)
            processImageWithGroqVision(file)
        }
        reader.readAsDataURL(file)
    }, [])

    const resetScanner = () => {
        setResult(null)
        setError(null)
        setCapturedImage(null)
        setProgress(0)
        setCurrentStep('')
    }

    const copyEquation = () => {
        if (result?.equation) {
            navigator.clipboard.writeText(result.equation)
        }
    }

    const useEquation = () => {
        if (result?.equation) {
            onEquationDetected(result.equation, result.confidence)
        }
    }

    if (!isGroqAvailable) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        Groq Vision No Configurado
                    </CardTitle>
                    <CardDescription>
                        Para usar el reconocimiento avanzado de imágenes, configura tu API key de Groq.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                            Agrega <code>NEXT_PUBLIC_GROQ_API_KEY=tu_api_key</code> en tu archivo .env.local
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-600" />
                            Groq Vision OCR
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                IA Avanzada
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Reconocimiento inteligente de ejercicios matemáticos con Groq Vision
                            <span className="block text-xs text-purple-600 dark:text-purple-400 mt-1">
                                ✨ Extrae y resuelve automáticamente problemas de cálculo
                            </span>
                        </CardDescription>
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={startCamera}
                        disabled={isProcessing || isCameraOpen}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                        <Camera className="h-4 w-4 mr-2" />
                        Capturar con Cámara
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex-1"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Imagen
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={resetScanner}
                        disabled={isProcessing}
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Limpiar
                    </Button>
                </div>

                {/* Vista de cámara */}
                {isCameraOpen && (
                    <div className="space-y-4">
                        <div className="relative bg-black rounded-lg overflow-hidden">
                            <video
                                ref={videoRef}
                                className="w-full h-48 sm:h-64 object-cover"
                                autoPlay
                                playsInline
                            />
                            <div className="absolute inset-0 border-2 border-dashed border-purple-400 m-4 rounded-lg pointer-events-none">
                                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                                    Centra el ejercicio aquí
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={captureImage} className="flex-1 bg-purple-600 hover:bg-purple-700">
                                <Camera className="h-4 w-4 mr-2" />
                                Capturar y Analizar
                            </Button>
                            <Button variant="outline" onClick={stopCamera}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Imagen capturada */}
                {capturedImage && (
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Imagen Analizada:
                        </h4>
                        <img
                            src={capturedImage}
                            alt="Imagen capturada"
                            className="w-full max-h-64 object-contain bg-gray-100 rounded-lg border"
                        />
                    </div>
                )}

                {/* Progreso */}
                {isProcessing && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            <span className="text-sm font-medium">{currentStep}</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                        <div className="text-xs text-muted-foreground text-center">
                            {progress < 30 && "Preparando imagen..."}
                            {progress >= 30 && progress < 80 && "🤖 Groq Vision analizando matemáticas..."}
                            {progress >= 80 && "Finalizando análisis..."}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-red-800 dark:text-red-200">Error en Groq Vision</h4>
                            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Resultados */}
                {result && (
                    <div className="space-y-6">
                        <h4 className="font-semibold flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Análisis Completado por Groq Vision:
                        </h4>

                        {/* Ecuación extraída */}
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                <span className="font-semibold">Ecuación Detectada:</span>
                                <Badge className="text-xs bg-purple-600">
                                    {result.confidence}% precisión
                                </Badge>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-700 mb-3">
                                <div className="text-lg font-semibold text-purple-900 dark:text-purple-100 text-center">
                                    {result.equation}
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Button size="sm" onClick={copyEquation} variant="outline">
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copiar
                                </Button>
                                <Button size="sm" onClick={useEquation} className="bg-purple-600 hover:bg-purple-700">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Usar Ecuación
                                </Button>
                            </div>
                        </div>

                        {/* Solución paso a paso */}
                        {result.steps && result.steps.length > 0 ? (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <h5 className="font-semibold mb-4 flex items-center gap-2 text-green-800 dark:text-green-200">
                                    <BookOpen className="h-5 w-5" />
                                    Solución Paso a Paso ({result.steps.length} pasos):
                                </h5>
                                <div className="space-y-3">
                                    {result.steps.map((step, index) => (
                                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-green-100 dark:border-green-800 shadow-sm p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                                    {step}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <h5 className="font-semibold mb-2 flex items-center gap-2 text-orange-800 dark:text-orange-200">
                                    <AlertCircle className="h-5 w-5" />
                                    Pasos de Solución:
                                </h5>
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    Los pasos detallados no están disponibles para este problema.
                                </p>
                            </div>
                        )}

                        {/* Respuesta final */}
                        {result.answer && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg shadow-lg">
                                <h5 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                                    <Zap className="h-5 w-5" />
                                    Respuesta Final:
                                </h5>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <div className="text-center text-xl font-bold text-blue-900 dark:text-blue-100">
                                        {result.answer}
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-center">
                                    <Badge className="bg-blue-600 text-white text-xs">
                                        Solución verificada por IA
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                <canvas ref={canvasRef} className="hidden" />
            </CardContent>
        </Card>
    )
}
