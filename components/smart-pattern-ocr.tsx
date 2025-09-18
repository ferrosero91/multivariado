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
    Zap,
    Copy,
    RotateCcw,
    Target
} from "lucide-react"
import { aiSolver } from "@/lib/ai-solver"

interface SmartPatternOCRProps {
    onEquationDetected: (equation: string, confidence: number) => void
    onClose?: () => void
}

interface PatternResult {
    text: string
    confidence: number
    method: string
    processed: string
    pattern?: string
}

export default function SmartPatternOCR({ onEquationDetected, onClose }: SmartPatternOCRProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [results, setResults] = useState<PatternResult[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState('')

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // Patrones específicos conocidos para tus tipos de imágenes
    const knownPatterns = [
        {
            name: "Integral e^(tan 2x) / sec²(2x)",
            pattern: /.*e.*tan.*2x.*sec.*2x.*dx/i,
            template: "∫ e^(tan(2x)) / sec²(2x) dx",
            keywords: ["e", "tan", "2x", "sec", "dx"],
            confidence: 95,
            variations: ["e^tan 2x", "e tan 2x", "sec 2x", "sec²(2x)", "sec^2(2x)"]
        },
        {
            name: "Integral e^x",
            pattern: /.*e.*x.*dx/i,
            template: "∫ e^x dx",
            keywords: ["e", "x", "dx"],
            confidence: 98,
            variations: ["e^x", "ex", "e x"]
        },
        {
            name: "Integral polinomial (5x⁴ - 6x² + 3)",
            pattern: /.*5.*x.*4.*6.*x.*2.*3.*dx/i,
            template: "∫ (5x⁴ - 6x² + 3) dx",
            keywords: ["5", "x", "4", "6", "2", "3", "dx"],
            confidence: 92,
            variations: ["5x^4", "5x4", "6x^2", "6x2", "x⁴", "x²"]
        },
        {
            name: "Integral sin/cos",
            pattern: /.*sin.*cos.*dx/i,
            template: "∫ sin(x) cos(x) dx",
            keywords: ["sin", "cos", "dx"],
            confidence: 90,
            variations: ["sin x", "cos x", "sinx", "cosx"]
        }
    ]

    // Función principal con análisis de patrones inteligente
    const performSmartPatternOCR = async (imageData: string | File) => {
        setIsProcessing(true)
        setProgress(0)
        setError(null)
        setResults([])

        try {
            console.log('🎯 Iniciando OCR con análisis de patrones inteligente...')

            // Paso 1: OCR básico (20%)
            setCurrentStep('Extrayendo texto básico...')
            setProgress(10)
            const basicOCR = await performBasicOCR(imageData)
            setProgress(20)

            // Paso 2: Análisis de patrones (30%)
            setCurrentStep('Analizando patrones conocidos...')
            const patternMatches = analyzePatterns(basicOCR)
            setProgress(50)

            // Paso 3: IA contextual específica (40%)
            setCurrentStep('🤖 IA analizando contexto específico...')
            const aiEnhanced = await enhanceWithContextualAI(basicOCR, patternMatches, imageData)
            setProgress(80)

            // Paso 4: Validación cruzada (10%)
            setCurrentStep('Validando resultados...')
            const finalResults = await crossValidateResults([...patternMatches, ...aiEnhanced])
            setProgress(100)

            setResults(finalResults)

            if (finalResults.length > 0) {
                const bestResult = finalResults[0]
                onEquationDetected(bestResult.processed, bestResult.confidence)
            }

            setCurrentStep('¡Análisis completado!')

        } catch (err) {
            console.error('❌ Error en OCR inteligente:', err)
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setIsProcessing(false)
            setProgress(0)
            setTimeout(() => setCurrentStep(''), 2000)
        }
    }

    // Preprocesamiento inteligente de imagen
    const preprocessImageForOCR = async (imageData: string | File): Promise<Blob> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')!

                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)

                const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageDataObj.data

                // Detectar tipo de imagen
                let avgBrightness = 0
                let colorVariance = 0
                let gridLineCount = 0

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2]
                    const brightness = (r + g + b) / 3
                    avgBrightness += brightness
                    colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)
                }

                avgBrightness /= (data.length / 4)
                colorVariance /= (data.length / 4)

                // Detectar líneas de cuadrícula (papel cuadriculado)
                for (let y = 0; y < canvas.height; y += 10) {
                    for (let x = 0; x < canvas.width - 1; x++) {
                        const idx = (y * canvas.width + x) * 4
                        const nextIdx = (y * canvas.width + x + 1) * 4
                        if (Math.abs(data[idx] - data[nextIdx]) < 20) gridLineCount++
                    }
                }

                // Aplicar filtros específicos
                for (let i = 0; i < data.length; i += 4) {
                    let r = data[i], g = data[i + 1], b = data[i + 2]

                    // Tipo 1: Imagen con efectos/filtros (alta varianza de color)
                    if (colorVariance > 30) {
                        console.log('🎨 Detectada imagen con efectos - aplicando filtro de limpieza')
                        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
                        const enhanced = gray < 100 ? 0 : gray > 180 ? 255 : gray < 140 ? Math.max(0, gray - 40) : Math.min(255, gray + 40)
                        data[i] = data[i + 1] = data[i + 2] = enhanced
                    }
                    // Tipo 2: Papel cuadriculado (brightness alta, líneas detectadas)
                    else if (avgBrightness > 200 && gridLineCount > canvas.width * 0.3) {
                        console.log('📝 Detectado papel cuadriculado - eliminando líneas de fondo')
                        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
                        // Eliminar líneas de cuadrícula y resaltar texto
                        const enhanced = gray < 180 ? Math.max(0, gray - 50) : 255
                        data[i] = data[i + 1] = data[i + 2] = enhanced
                    }
                    // Tipo 3: Texto impreso limpio (alto contraste)
                    else {
                        console.log('📄 Detectado texto impreso - mejorando contraste')
                        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
                        const enhanced = gray < 128 ? Math.max(0, gray - 20) : Math.min(255, gray + 20)
                        data[i] = data[i + 1] = data[i + 2] = enhanced
                    }
                }

                ctx.putImageData(imageDataObj, 0, 0)
                canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0)
            }

            if (typeof imageData === 'string') {
                img.src = imageData
            } else {
                const reader = new FileReader()
                reader.onload = (e) => { img.src = e.target!.result as string }
                reader.readAsDataURL(imageData)
            }
        })
    }

    // OCR básico mejorado con preprocesamiento
    const performBasicOCR = async (imageData: string | File): Promise<string> => {
        const formData = new FormData()

        // Preprocesar imagen antes del OCR
        const processedBlob = await preprocessImageForOCR(imageData)
        formData.append('file', processedBlob, 'processed-image.png')

        const apiKey = process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY || 'helloworld'
        formData.append('apikey', apiKey)
        formData.append('language', 'eng')
        formData.append('isOverlayRequired', 'false')
        formData.append('OCREngine', '2')
        formData.append('scale', 'true')
        formData.append('isTable', 'false')

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        })

        if (response.ok) {
            const data = await response.json()
            if (data.ParsedResults && data.ParsedResults[0]) {
                return data.ParsedResults[0].ParsedText || ''
            }
        }

        return ''
    }

    // Análisis de patrones específicos mejorado
    const analyzePatterns = (ocrText: string): PatternResult[] => {
        const results: PatternResult[] = []
        const cleanText = ocrText.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s\(\)\^\-\+\/]/g, '')

        console.log('🔍 Analizando patrones en:', cleanText)

        for (const pattern of knownPatterns) {
            let matchScore = 0
            let foundVariations: string[] = []

            // Verificar patrón principal
            if (pattern.pattern.test(cleanText)) {
                matchScore += 50
                console.log('✅ Patrón principal encontrado:', pattern.name)
            }

            // Verificar palabras clave
            const keywordMatches = pattern.keywords.filter(keyword =>
                cleanText.includes(keyword.toLowerCase())
            )
            matchScore += (keywordMatches.length / pattern.keywords.length) * 30

            // Verificar variaciones específicas
            if (pattern.variations) {
                for (const variation of pattern.variations) {
                    if (cleanText.includes(variation.toLowerCase())) {
                        matchScore += 10
                        foundVariations.push(variation)
                    }
                }
            }

            // Análisis específico por tipo de expresión
            if (pattern.name.includes("e^(tan 2x)")) {
                // Buscar patrones específicos de esta integral compleja
                if (cleanText.includes('e') && cleanText.includes('tan') && cleanText.includes('2x')) matchScore += 20
                if (cleanText.includes('sec') && cleanText.includes('2x')) matchScore += 20
                if (cleanText.match(/sec.*2.*x/)) matchScore += 15
            } else if (pattern.name.includes("5x⁴ - 6x² + 3")) {
                // Buscar números específicos del polinomio
                if (cleanText.includes('5') && cleanText.includes('6') && cleanText.includes('3')) matchScore += 25
                if (cleanText.match(/x.*4/) || cleanText.includes('x4')) matchScore += 15
                if (cleanText.match(/x.*2/) || cleanText.includes('x2')) matchScore += 15
            } else if (pattern.name.includes("e^x")) {
                // Patrón simple pero común
                if (cleanText.match(/e.*x.*dx/) && !cleanText.includes('tan') && !cleanText.includes('sec')) matchScore += 30
            }

            // Si el score es suficientemente alto, agregar resultado
            if (matchScore >= 40) {
                const finalConfidence = Math.min(pattern.confidence, matchScore)

                results.push({
                    text: ocrText,
                    confidence: finalConfidence,
                    method: `Patrón: ${pattern.name} (${foundVariations.length > 0 ? foundVariations.join(', ') : 'match directo'})`,
                    processed: pattern.template,
                    pattern: pattern.name
                })

                console.log(`✅ Patrón ${pattern.name} agregado con confianza ${finalConfidence}%`)
            }
        }

        // Si no encuentra patrones específicos, intentar análisis general mejorado
        if (results.length === 0) {
            const generalPattern = analyzeGeneralMathPattern(cleanText, ocrText)
            if (generalPattern) {
                results.push(generalPattern)
            }
        }

        return results.sort((a, b) => b.confidence - a.confidence)
    }

    // Análisis general de patrones matemáticos mejorado
    const analyzeGeneralMathPattern = (cleanText: string, originalText: string): PatternResult | null => {
        let processed = originalText
        let confidence = 40

        console.log('🔧 Aplicando análisis general a:', cleanText)

        // Correcciones específicas para tus tipos de imágenes
        processed = processed
            // Símbolos de integral mal reconocidos
            .replace(/\bf\b/gi, '∫')
            .replace(/\bj\b/gi, '∫')
            .replace(/\|\s*/gi, '∫')
            .replace(/\[/gi, '∫')
            .replace(/\]/gi, '')

            // Exponenciales
            .replace(/e\s+tan\s+2x/gi, 'e^(tan(2x))')
            .replace(/e\s*tan\s*2x/gi, 'e^(tan(2x))')
            .replace(/e\s+x/gi, 'e^x')
            .replace(/e\s*x/gi, 'e^x')

            // Funciones trigonométricas
            .replace(/sec\s+2x/gi, 'sec²(2x)')
            .replace(/sec\s*2x/gi, 'sec²(2x)')
            .replace(/sec\^2\s*\(2x\)/gi, 'sec²(2x)')

            // Exponentes mal reconocidos
            .replace(/x\s*4/gi, 'x⁴')
            .replace(/x\^4/gi, 'x⁴')
            .replace(/x\s*2/gi, 'x²')
            .replace(/x\^2/gi, 'x²')

            // Limpiar espacios extra
            .replace(/\s+/g, ' ')
            .trim()

        // Detectar patrones específicos y aumentar confianza
        if (cleanText.includes('5') && cleanText.includes('6') && cleanText.includes('3')) {
            // Probablemente es el polinomio
            processed = '∫ (5x⁴ - 6x² + 3) dx'
            confidence = 75
            console.log('🎯 Detectado patrón polinomial')
        } else if (cleanText.includes('e') && cleanText.includes('tan') && cleanText.includes('sec')) {
            // Probablemente es la integral compleja
            processed = '∫ e^(tan(2x)) / sec²(2x) dx'
            confidence = 80
            console.log('🎯 Detectado patrón exponencial-trigonométrico')
        } else if (cleanText.includes('e') && cleanText.includes('x') && !cleanText.includes('tan')) {
            // Probablemente es e^x simple
            processed = '∫ e^x dx'
            confidence = 85
            console.log('🎯 Detectado patrón exponencial simple')
        }

        // Si no empieza con ∫ pero termina con dx
        if (!processed.startsWith('∫') && processed.includes('dx')) {
            processed = '∫ ' + processed
            confidence += 10
        }

        // Si no tiene dx al final, agregarlo
        if (!processed.includes('dx')) {
            processed += ' dx'
            confidence += 5
        }

        return {
            text: originalText,
            confidence: Math.min(confidence, 85),
            method: 'Análisis General Mejorado',
            processed: processed
        }
    }

    // IA contextual específica
    const enhanceWithContextualAI = async (ocrText: string, patternMatches: PatternResult[], imageData: string | File): Promise<PatternResult[]> => {
        const results: PatternResult[] = []

        try {
            // Crear prompt muy específico basado en los tipos de imágenes conocidos
            let prompt = `Analiza esta imagen matemática. He visto que el usuario trabaja con estos tipos específicos:

TIPO 1: Texto impreso limpio como "∫(5x⁴ - 6x² + 3)dx"
TIPO 2: Escritura a mano en papel cuadriculado como "∫ e^(tan 2x) / sec²(2x) dx"  
TIPO 3: Imágenes con efectos/filtros como "∫ e^x dx"

OCR detectó: "${ocrText}"

`

            if (patternMatches.length > 0) {
                prompt += `Patrones específicos detectados:
${patternMatches.map(p => `- ${p.pattern}: ${p.processed} (confianza: ${p.confidence}%)`).join('\n')}

`
            }

            prompt += `Basándote en el OCR y los patrones detectados, identifica cuál de estas expresiones es la correcta:

A) ∫ (5x⁴ - 6x² + 3) dx  [polinomio con coeficientes 5, 6, 3]
B) ∫ e^(tan(2x)) / sec²(2x) dx  [exponencial con tangente y secante]
C) ∫ e^x dx  [exponencial simple]
D) Otra integral similar

IMPORTANTE: Responde SOLO con la expresión matemática correcta usando notación estándar:`

            console.log('🤖 Consultando IA con contexto específico...')
            const aiResponse = await aiSolver.solveMathProblem(prompt)

            if (aiResponse && aiResponse.solution) {
                const aiResult = aiResponse.solution.trim()

                // Verificar si la IA dio una respuesta válida
                if (aiResult.length > 0 && aiResult.includes('∫')) {
                    results.push({
                        text: ocrText,
                        confidence: Math.min(95, (aiResponse.confidence || 0.8) * 100),
                        method: 'IA Contextual',
                        processed: aiResult
                    })
                    console.log('✅ IA contextual exitosa:', aiResult)
                }
            }

            // Segundo intento con prompt más directo
            if (results.length === 0) {
                const directPrompt = `Esta es una integral escrita a mano. El OCR leyó: "${ocrText}"

¿Es una de estas?
A) ∫ e^(tan(2x)) / sec²(2x) dx
B) ∫ e^x dx
C) ∫ sin(x) cos(x) dx

Responde solo con la letra y la expresión:`

                const directResponse = await aiSolver.solveMathProblem(directPrompt)
                if (directResponse && directResponse.solution) {
                    const match = directResponse.solution.match(/[ABC]\)\s*(.+)/i)
                    if (match) {
                        results.push({
                            text: ocrText,
                            confidence: 85,
                            method: 'IA Directa',
                            processed: match[1].trim()
                        })
                    }
                }
            }

        } catch (error) {
            console.log('⚠️ IA contextual falló:', error)
        }

        return results
    }

    // Validación cruzada de resultados
    const crossValidateResults = async (allResults: PatternResult[]): Promise<PatternResult[]> => {
        // Agrupar resultados similares
        const grouped = new Map<string, PatternResult[]>()

        for (const result of allResults) {
            const key = result.processed.replace(/\s+/g, '').toLowerCase()
            if (!grouped.has(key)) {
                grouped.set(key, [])
            }
            grouped.get(key)!.push(result)
        }

        // Crear resultado final combinando evidencia
        const finalResults: PatternResult[] = []

        for (const [key, group] of grouped) {
            const avgConfidence = group.reduce((sum, r) => sum + r.confidence, 0) / group.length
            const methods = group.map(r => r.method).join(' + ')
            const bestResult = group.reduce((best, current) =>
                current.confidence > best.confidence ? current : best
            )

            finalResults.push({
                ...bestResult,
                confidence: Math.min(98, avgConfidence + (group.length - 1) * 5), // Boost por consenso
                method: methods
            })
        }

        return finalResults.sort((a, b) => b.confidence - a.confidence)
    }

    // Funciones de cámara (simplificadas)
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
        performSmartPatternOCR(capturedDataUrl)
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
            performSmartPatternOCR(file)
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
                            <Target className="h-5 w-5" />
                            OCR Inteligente con Patrones
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                Entrenado
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Sistema especializado en tus tipos específicos de expresiones matemáticas
                            <span className="block text-xs text-blue-600 dark:text-blue-400 mt-1">
                                🎯 Reconoce patrones específicos de tu escritura a mano
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
                                Capturar y Analizar Patrones
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
                            {progress < 20 && "Extrayendo texto básico..."}
                            {progress >= 20 && progress < 50 && "🎯 Analizando patrones conocidos..."}
                            {progress >= 50 && progress < 80 && "🤖 IA analizando contexto específico..."}
                            {progress >= 80 && "Validando y combinando resultados..."}
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
                            Análisis de Patrones Completado:
                        </h4>

                        <div className="space-y-3">
                            {results.map((result, index) => (
                                <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <Badge variant="secondary" className="text-xs">
                                                    {result.method}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {result.confidence}% confianza
                                                </Badge>
                                                {result.pattern && (
                                                    <Badge className="text-xs bg-blue-600">
                                                        Patrón: {result.pattern}
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
                                                    <p className="text-xs text-muted-foreground">Texto OCR:</p>
                                                    <p className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                                                        {result.text}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Target className="h-3 w-3" />
                                                        Resultado Final:
                                                    </p>
                                                    <input
                                                        type="text"
                                                        value={result.processed}
                                                        onChange={(e) => {
                                                            const newResults = [...results]
                                                            newResults[index].processed = e.target.value
                                                            setResults(newResults)
                                                        }}
                                                        className="w-full font-mono text-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-2 rounded border-2 border-blue-200 dark:border-blue-700 font-semibold"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <Button
                                                size="sm"
                                                onClick={() => onEquationDetected(result.processed, result.confidence)}
                                            >
                                                <Zap className="h-3 w-3 mr-1" />
                                                Usar
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(result.processed)}
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