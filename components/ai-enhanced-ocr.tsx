"use client"

import { useState, useRef, useCallback } from "react"
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
    Sparkles
} from "lucide-react"
import { aiSolver } from "@/lib/ai-solver"

interface AIEnhancedOCRProps {
    onEquationDetected: (equation: string, confidence: number) => void
    onClose?: () => void
}

interface OCRResult {
    text: string
    confidence: number
    provider: string
    processed: string
    aiCorrected?: string
    aiConfidence?: number
}

export default function AIEnhancedOCR({ onEquationDetected, onClose }: AIEnhancedOCRProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [results, setResults] = useState<OCRResult[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState('')

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // Función principal que combina OCR + IA
    const performAIEnhancedOCR = async (imageData: string | File) => {
        setIsProcessing(true)
        setProgress(0)
        setError(null)
        setResults([])

        try {
            console.log('🚀 Iniciando OCR mejorado con IA...')

            // Paso 1: OCR tradicional (30% del progreso)
            setCurrentStep('Extrayendo texto con OCR...')
            setProgress(10)
            const ocrResults = await performTraditionalOCR(imageData)
            setProgress(30)

            if (ocrResults.length === 0) {
                throw new Error('No se pudo extraer texto de la imagen')
            }

            // Paso 2: Análisis con IA (70% del progreso restante)
            setCurrentStep('Analizando con IA para mejorar precisión...')
            setProgress(40)
            
            const aiEnhancedResults = await enhanceWithAI(ocrResults, imageData)
            setProgress(90)

            // Paso 3: Combinar y seleccionar mejor resultado
            setCurrentStep('Seleccionando mejor resultado...')
            const finalResults = combineResults(ocrResults, aiEnhancedResults)
            setResults(finalResults)
            setProgress(100)

            if (finalResults.length > 0) {
                const bestResult = finalResults[0] // Ya están ordenados por confianza
                onEquationDetected(bestResult.aiCorrected || bestResult.processed, bestResult.aiConfidence || bestResult.confidence)
            }

            setCurrentStep('¡Completado!')

        } catch (err) {
            console.error('❌ Error en OCR mejorado:', err)
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setIsProcessing(false)
            setProgress(0)
            setCurrentStep('')
        }
    }

    // OCR tradicional (rápido)
    const performTraditionalOCR = async (imageData: string | File): Promise<OCRResult[]> => {
        const results: OCRResult[] = []

        // Solo usar OCR.space que ya tienes configurado
        try {
            const result = await tryOCRSpaceAPI(imageData)
            if (result.text.trim()) {
                results.push({
                    ...result,
                    provider: 'OCR.space',
                    processed: processMathText(result.text)
                })
            }
        } catch (error) {
            console.log('❌ OCR.space falló:', error)
        }

        return results
    }

    // Mejora con IA (usa las IAs que ya tienes configuradas)
    const enhanceWithAI = async (ocrResults: OCRResult[], imageData: string | File): Promise<OCRResult[]> => {
        const enhancedResults: OCRResult[] = []

        for (const ocrResult of ocrResults) {
            try {
                console.log('🤖 Mejorando con IA:', ocrResult.text)

                // Crear prompt específico para corrección de OCR matemático
                const prompt = `Corrige este texto de OCR matemático: "${ocrResult.text}"

Errores comunes a corregir:
- 'f' o 'J' → '∫' (integral)
- 'e tan 2x' → 'e^(tan(2x))'
- 'sec 2x' → 'sec²(2x)'
- 'e x' → 'e^x'
- Espacios en exponentes
- Símbolos mal reconocidos

Responde SOLO con la expresión matemática corregida:`

                // Usar el sistema de IA que ya tienes
                const aiResponse = await aiSolver.solveMathProblem(prompt)
                
                if (aiResponse && aiResponse.solution) {
                    const correctedText = aiResponse.solution.trim()
                    
                    // Verificar que la corrección sea válida
                    if (correctedText.length > 0 && correctedText !== ocrResult.text) {
                        enhancedResults.push({
                            ...ocrResult,
                            aiCorrected: correctedText,
                            aiConfidence: Math.min(95, ocrResult.confidence + 20) // Boost de confianza
                        })
                        console.log('✅ IA mejoró:', ocrResult.text, '->', correctedText)
                    } else {
                        enhancedResults.push(ocrResult)
                    }
                } else {
                    enhancedResults.push(ocrResult)
                }

            } catch (error) {
                console.log('⚠️ IA no pudo mejorar:', error)
                enhancedResults.push(ocrResult)
            }
        }

        return enhancedResults
    }

    // Combinar resultados OCR + IA
    const combineResults = (ocrResults: OCRResult[], aiResults: OCRResult[]): OCRResult[] => {
        // Usar los resultados mejorados por IA, ordenados por confianza
        return aiResults.sort((a, b) => (b.aiConfidence || b.confidence) - (a.aiConfidence || a.confidence))
    }

    // API OCR.space (ya configurada)
    const tryOCRSpaceAPI = async (imageData: string | File): Promise<{ text: string; confidence: number }> => {
        const formData = new FormData()
        
        if (typeof imageData === 'string') {
            const response = await fetch(imageData)
            const blob = await response.blob()
            formData.append('file', blob, 'image.png')
        } else {
            formData.append('file', imageData)
        }
        
        const apiKey = process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY || 'helloworld'
        formData.append('apikey', apiKey)
        formData.append('language', 'eng')
        formData.append('isOverlayRequired', 'false')
        formData.append('OCREngine', '2')
        formData.append('scale', 'true')

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        })

        if (response.ok) {
            const data = await response.json()
            
            if (data.ParsedResults && data.ParsedResults[0]) {
                const result = data.ParsedResults[0]
                
                if (result.ErrorMessage) {
                    throw new Error(`OCR.space error: ${result.ErrorMessage}`)
                }
                
                return {
                    text: result.ParsedText || '',
                    confidence: result.TextOverlay?.HasOverlay ? 85 : 70
                }
            }
        }
        
        throw new Error('OCR.space API failed')
    }

    // Procesamiento básico de texto matemático
    const processMathText = (rawText: string): string => {
        return rawText
            .replace(/\s+/g, ' ')
            .replace(/[|_]/g, '')
            .trim()
            .replace(/\bf\b/gi, '∫')
            .replace(/\bJ\b/gi, '∫')
            .replace(/e\s*tan\s*2x/gi, 'e^(tan(2x))')
            .replace(/sec\s*2x/gi, 'sec²(2x)')
            .replace(/e\s*x/gi, 'e^x')
            .replace(/dx/gi, 'dx')
    }

    // Función auxiliar para convertir archivo a base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    // Funciones de cámara
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
                setIsCameraOpen(true)
            }
        } catch (error) {
            setError('No se pudo acceder a la cámara')
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

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        const capturedDataUrl = canvas.toDataURL('image/png', 1.0)
        setCapturedImage(capturedDataUrl)
        stopCamera()
        performAIEnhancedOCR(capturedDataUrl)
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
            performAIEnhancedOCR(file)
        }
        reader.readAsDataURL(file)
    }, [])

    const resetScanner = () => {
        setResults([])
        setError(null)
        setCapturedImage(null)
        setProgress(0)
        setCurrentStep('')
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            OCR + IA Híbrido
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                IA Mejorada
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Combina OCR tradicional con IA para máxima precisión en escritura a mano
                            <span className="block text-xs text-purple-600 dark:text-purple-400 mt-1">
                                ✨ Usa tus IAs configuradas para corregir errores de OCR
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
                        className="flex-1"
                    >
                        <Camera className="h-4 w-4 mr-2" />
                        Usar Cámara
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
                        Reiniciar
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
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={captureImage} className="flex-1">
                                <Camera className="h-4 w-4 mr-2" />
                                Capturar y Analizar con IA
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
                        <h4 className="font-semibold">Imagen Capturada:</h4>
                        <img 
                            src={capturedImage} 
                            alt="Imagen capturada" 
                            className="w-full max-h-64 object-contain bg-gray-100 rounded-lg"
                        />
                    </div>
                )}

                {/* Progreso */}
                {isProcessing && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-medium">{currentStep}</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                        <div className="text-xs text-muted-foreground text-center">
                            {progress < 30 && "Extrayendo texto con OCR..."}
                            {progress >= 30 && progress < 90 && "🤖 IA analizando y corrigiendo errores..."}
                            {progress >= 90 && "Finalizando..."}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-red-800 dark:text-red-200">Error</h4>
                            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Resultados */}
                {results.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Resultados OCR + IA:
                        </h4>
                        
                        <div className="space-y-3">
                            {results.map((result, index) => (
                                <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-purple-50 dark:from-green-900/20 dark:to-purple-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {result.provider}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    OCR: {result.confidence}%
                                                </Badge>
                                                {result.aiCorrected && (
                                                    <Badge className="text-xs bg-purple-600">
                                                        IA: {result.aiConfidence}%
                                                    </Badge>
                                                )}
                                                {index === 0 && (
                                                    <Badge className="text-xs bg-green-600">
                                                        Mejor resultado
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">OCR Original:</p>
                                                    <p className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                                                        {result.text}
                                                    </p>
                                                </div>
                                                
                                                {result.aiCorrected && (
                                                    <div>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Sparkles className="h-3 w-3" />
                                                            Corregido por IA:
                                                        </p>
                                                        <input
                                                            type="text"
                                                            value={result.aiCorrected}
                                                            onChange={(e) => {
                                                                const newResults = [...results]
                                                                newResults[index].aiCorrected = e.target.value
                                                                setResults(newResults)
                                                            }}
                                                            className="w-full font-mono text-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-2 rounded border-2 border-purple-200 dark:border-purple-700 font-semibold"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1">
                                            <Button 
                                                size="sm" 
                                                onClick={() => onEquationDetected(result.aiCorrected || result.processed, result.aiConfidence || result.confidence)}
                                            >
                                                <Zap className="h-3 w-3 mr-1" />
                                                Usar
                                            </Button>
                                            
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(result.aiCorrected || result.processed)}
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copiar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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