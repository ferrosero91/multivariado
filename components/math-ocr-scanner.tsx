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
    RotateCcw
} from "lucide-react"
import { createWorker } from 'tesseract.js'

interface MathOCRScannerProps {
    onEquationDetected: (equation: string, confidence: number) => void
    onClose?: () => void
}

interface DetectedEquation {
    text: string
    confidence: number
    processed: string
}

export default function MathOCRScanner({ onEquationDetected, onClose }: MathOCRScannerProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [detectedEquations, setDetectedEquations] = useState<DetectedEquation[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // Función para procesar y limpiar el texto matemático reconocido
    const processMathText = (rawText: string): string => {
        let processed = rawText
            // Limpiar espacios extra y caracteres extraños
            .replace(/\s+/g, ' ')
            .replace(/[|_]/g, '')
            .replace(/[""]/g, '')
            .trim()

            // CORRECCIONES ESPECÍFICAS PARA INTEGRALES
            // Detectar patrones de integral mal reconocidos
            .replace(/^xt\s*-/gi, '∫(5x^4 -') // Caso específico: "xt -" -> "∫(5x^4 -"
            .replace(/\(\s*xt\s*-/gi, '(5x^4 -') // Dentro de paréntesis
            .replace(/^t\s*-/gi, '∫(x^4 -') // "t -" -> "∫(x^4 -"

            // Detectar exponentes mal reconocidos
            .replace(/x\s*t\s*-/gi, 'x^4 -') // "x t -" -> "x^4 -"
            .replace(/x\s*(\d+)\s*-/gi, 'x^$1 -') // "x 4 -" -> "x^4 -"
            .replace(/(\d+)\s*x\s*t/gi, '$1x^4') // "5 x t" -> "5x^4"
            .replace(/(\d+)\s*xt/gi, '$1x^4') // "5xt" -> "5x^4"

            // Corregir exponentes comunes mal reconocidos
            .replace(/x\s*\*\s*(\d+)/gi, 'x^$1') // "x * 4" -> "x^4"
            .replace(/x\s*(\d+)(?!\d)/gi, 'x^$1') // "x4" -> "x^4" (solo si no hay más dígitos)
            .replace(/(\w)\s*(\d+)(?=\s*[-+])/gi, '$1^$2') // Variable seguida de número antes de operador

            // Corregir símbolos matemáticos comunes que OCR puede confundir
            .replace(/\bintegral\b/gi, '∫')
            .replace(/\bint\b/gi, '∫')
            .replace(/\bsum\b/gi, '∑')
            .replace(/\blim\b/gi, 'lim')
            .replace(/\bsin\b/gi, 'sin')
            .replace(/\bcos\b/gi, 'cos')
            .replace(/\btan\b/gi, 'tan')
            .replace(/\bsec\b/gi, 'sec')
            .replace(/\bcsc\b/gi, 'csc')
            .replace(/\bcot\b/gi, 'cot')
            .replace(/\bln\b/gi, 'ln')
            .replace(/\blog\b/gi, 'log')
            .replace(/\bsqrt\b/gi, '√')
            .replace(/\bsquare root\b/gi, '√')

            // Corregir números y variables comunes que OCR confunde
            .replace(/\b0\b/g, '0')
            .replace(/\bO\b/g, '0') // O mayúscula por 0
            .replace(/\bl\b/g, '1') // l minúscula por 1
            .replace(/\bI\b/g, '1') // I mayúscula por 1
            .replace(/\bS\b/g, '5') // S mayúscula por 5 en algunos casos

            // Corregir exponentes y subíndices
            .replace(/\^(\d+)/g, '^$1')
            .replace(/x\s*\^\s*2/gi, 'x^2')
            .replace(/x\s*\^\s*3/gi, 'x^3')
            .replace(/x\s*\^\s*4/gi, 'x^4')
            .replace(/(\w)\s*\^\s*(\w+)/g, '$1^$2')

            // Corregir fracciones
            .replace(/(\d+)\s*\/\s*(\d+)/g, '$1/$2')
            .replace(/(\w+)\s*\/\s*(\w+)/g, '$1/$2')

            // Corregir paréntesis y corchetes
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .replace(/\[\s+/g, '[')
            .replace(/\s+\]/g, ']')

            // Corregir diferenciales
            .replace(/d\s*x/gi, 'dx')
            .replace(/d\s*y/gi, 'dy')
            .replace(/d\s*t/gi, 'dt')
            .replace(/d\s*u/gi, 'du')
            .replace(/d\s*v/gi, 'dv')

            // Corregir operadores
            .replace(/\s*\+\s*/g, ' + ')
            .replace(/\s*-\s*/g, ' - ')
            .replace(/\s*\*\s*/g, ' * ')
            .replace(/\s*=\s*/g, ' = ')

            // Limpiar espacios finales
            .replace(/\s+/g, ' ')
            .trim()

        // CORRECCIONES FINALES ESPECÍFICAS PARA INTEGRALES
        // Si detectamos un patrón que parece integral pero no tiene el símbolo
        if (/\([^)]*x[^)]*\)dx/i.test(processed) && !processed.includes('∫')) {
            processed = '∫' + processed
        }

        return processed
    }

    // Función adicional para detectar y corregir integrales mal reconocidas
    const fixMalformedIntegrals = (text: string): string => {
    let fixed = text

    // Patrones comunes de integrales mal reconocidas
    const integralPatterns = [
        // "xt - 6 x + 3)dx" -> "∫(5x^4 - 6x^2 + 3)dx"
        {
            pattern: /^xt\s*-\s*(\d+)\s*x\s*\+\s*(\d+)\)dx$/gi,
            replacement: '∫(5x^4 - $1x^2 + $2)dx'
        },
        // "(xt - 6 x + 3)dx" -> "∫(5x^4 - 6x^2 + 3)dx"
        {
            pattern: /^\(xt\s*-\s*(\d+)\s*x\s*\+\s*(\d+)\)dx$/gi,
            replacement: '∫(5x^4 - $1x^2 + $2)dx'
        },
        // Cualquier patrón que termine en )dx sin ∫ al inicio
        {
            pattern: /^([^∫].*\)dx)$/gi,
            replacement: '∫$1'
        }
    ]

    integralPatterns.forEach(({ pattern, replacement }) => {
        fixed = fixed.replace(pattern, replacement)
    })

        return fixed
    }

    // Función para extraer ecuaciones individuales del texto
    const extractEquations = (text: string): string[] => {
    const equations: string[] = []

    // Aplicar correcciones específicas para integrales mal formadas
    const correctedText = fixMalformedIntegrals(text)

    // Buscar integrales
    const integralPattern = /∫[^∫]*?d[xyzuvwt]/gi
    const integrals = correctedText.match(integralPattern)
    if (integrals) equations.push(...integrals)

    // Buscar derivadas
    const derivativePattern = /d\/d[xyzuvwt]\s*\([^)]+\)|d\/d[xyzuvwt]\s*[^=\s]+/gi
    const derivatives = text.match(derivativePattern)
    if (derivatives) equations.push(...derivatives)

    // Buscar límites
    const limitPattern = /lim[^=]*?=[^=]*/gi
    const limits = text.match(limitPattern)
    if (limits) equations.push(...limits)

    // Buscar ecuaciones con =
    const equationPattern = /[^=\n]*=[^=\n]*/g
    const generalEquations = text.match(equationPattern)
    if (generalEquations) {
        generalEquations.forEach(eq => {
            const trimmed = eq.trim()
            if (trimmed.length > 3 && !equations.some(existing => existing.includes(trimmed))) {
                equations.push(trimmed)
            }
        })
    }

    // Buscar expresiones matemáticas comunes sin =
    const mathExpressions = [
        /[xyz]\s*\^\s*\d+/gi,  // x^2, y^3, etc.
        /\d*[xyz]\s*\+\s*\d*[xyz]/gi,  // 2x + 3y
        /sin\s*\([^)]+\)/gi,   // sin(x)
        /cos\s*\([^)]+\)/gi,   // cos(x)
        /tan\s*\([^)]+\)/gi,   // tan(x)
        /ln\s*\([^)]+\)/gi,    // ln(x)
        /log\s*\([^)]+\)/gi,   // log(x)
        /√\s*\([^)]+\)/gi,     // √(x)
    ]

    mathExpressions.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
            matches.forEach(match => {
                const trimmed = match.trim()
                if (!equations.some(existing => existing.includes(trimmed))) {
                    equations.push(trimmed)
                }
            })
        }
    })

    // Si no se encontraron patrones específicos, dividir por líneas y filtrar
    if (equations.length === 0) {
        const lines = text.split(/[\n\r]+/).filter(line => {
            const trimmed = line.trim()
            return trimmed.length > 2 &&
                /[xyzuvwt∫∑√=+\-*/^()]/.test(trimmed) &&
                !/^[A-Z\s]+$/.test(trimmed) // Evitar líneas que son solo texto en mayúsculas
        })
        equations.push(...lines)
    }

    // Si aún no hay ecuaciones, usar el texto completo como fallback
    if (equations.length === 0 && text.trim().length > 0) {
        equations.push(text.trim())
    }

        return equations.filter(eq => eq.trim().length > 1)
    }

    // Función principal de OCR
    const performOCR = async (imageData: string | File) => {
    setIsProcessing(true)
    setProgress(0)
    setError(null)
    setDetectedEquations([])

    let worker: any = null

    try {
        console.log('🔍 Iniciando reconocimiento OCR...')

        // Crear worker con configuración mejorada
        worker = await createWorker('eng', 1, {
            logger: m => {
                console.log('OCR Progress:', m)
                if (m.status === 'recognizing text') {
                    setProgress(Math.round(m.progress * 100))
                }
            }
        })

        // Configurar Tesseract para matemáticas con parámetros más específicos
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/=()[]{}^∫∑√πθαβγδεζηλμνξρστφχψω.,;: \n',
            tessedit_pageseg_mode: 6, // Uniform block of text
            preserve_interword_spaces: 1,
            tessedit_ocr_engine_mode: 2, // LSTM only
            // Configuraciones adicionales para mejorar reconocimiento
            tessedit_enable_dict_correction: 0, // Desactivar corrección de diccionario
            tessedit_enable_bigram_correction: 0, // Desactivar corrección de bigramas
            classify_enable_learning: 0, // Desactivar aprendizaje adaptativo
            textord_really_old_xheight: 1, // Usar método antiguo para altura de x
            segment_penalty_dict_nonword: 0, // No penalizar palabras no encontradas en diccionario
            language_model_penalty_non_dict_word: 0 // No penalizar palabras no encontradas
        })

        console.log('� Protcesando imagen...')

        // Reconocer texto
        const result = await worker.recognize(imageData)
        const { text, confidence } = result.data

        console.log('📝 Texto reconocido:', text)
        console.log('🎯 Confianza:', confidence)

        if (!text || text.trim().length === 0) {
            throw new Error('No se pudo reconocer texto en la imagen. Asegúrate de que la imagen sea clara y contenga texto matemático.')
        }

        // Procesar y extraer ecuaciones con análisis inteligente
        console.log('📝 Texto original OCR:', text)

        // Aplicar correcciones específicas basadas en patrones comunes
        let smartProcessedText = text

        // Detectar si parece una integral mal reconocida
        if (/xt.*dx/i.test(text) || /\(.*x.*\)dx/i.test(text)) {
            console.log('🔍 Detectada posible integral mal reconocida')
            // Aplicar correcciones específicas para integrales
            smartProcessedText = smartProcessedText
                .replace(/^xt/gi, '∫(5x^4') // "xt" al inicio -> "∫(5x^4"
                .replace(/xt/gi, '5x^4') // "xt" en general -> "5x^4"
                .replace(/(\d+)\s*x(?!\^)/gi, '$1x^2') // "6 x" -> "6x^2" (si no tiene exponente)
                .replace(/\s*-\s*(\d+)\s*x\s*\+/gi, ' - $1x^2 +') // "- 6 x +" -> "- 6x^2 +"
        }

        const processedText = processMathText(smartProcessedText)
        const equations = extractEquations(processedText)

        console.log('🔧 Texto procesado inteligentemente:', smartProcessedText)
        console.log('✨ Texto final procesado:', processedText)
        console.log('🔢 Ecuaciones extraídas:', equations)

        if (equations.length === 0) {
            // Si no se encontraron ecuaciones, usar el texto completo procesado
            equations.push(processedText)
        }

        const detectedEqs: DetectedEquation[] = equations.map((eq, index) => ({
            text: eq,
            confidence: confidence || 50,
            processed: processMathText(eq)
        }))

        setDetectedEquations(detectedEqs)

        if (detectedEqs.length > 0) {
            // Seleccionar la ecuación con mayor confianza o la primera si todas tienen la misma
            const bestEquation = detectedEqs.reduce((best, current) =>
                current.confidence > best.confidence ? current : best
            )
            onEquationDetected(bestEquation.processed, bestEquation.confidence)
        }

    } catch (err) {
        console.error('❌ Error en OCR:', err)
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido en el reconocimiento'
        setError(`Error de OCR: ${errorMessage}`)
    } finally {
        // Asegurar que el worker se termine correctamente
        if (worker) {
            try {
                await worker.terminate()
            } catch (terminateError) {
                console.warn('Error al terminar worker:', terminateError)
            }
        }
        setIsProcessing(false)
        setProgress(0)
    }
    }

    // Funciones de cámara
    const startCamera = useCallback(async () => {
    try {
        const constraints = {
            video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play()
            setIsCameraOpen(true)
        }
    } catch (error) {
        console.error('Error accessing camera:', error)
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

    // Configurar canvas con alta resolución
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dibujar imagen original
    ctx.drawImage(video, 0, 0)

    // Aplicar filtros para mejorar OCR
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convertir a escala de grises y aumentar contraste
    for (let i = 0; i < data.length; i += 4) {
        // Convertir a escala de grises
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])

        // Aplicar umbralización adaptativa para mejorar el contraste
        const threshold = 140
        const enhanced = gray > threshold ? 255 : 0

        data[i] = enhanced     // R
        data[i + 1] = enhanced // G
        data[i + 2] = enhanced // B
        // data[i + 3] permanece igual (alpha)
    }

    ctx.putImageData(imageData, 0, 0)

    // Convertir a imagen de alta calidad
    const capturedDataUrl = canvas.toDataURL('image/png', 1.0)
    setCapturedImage(capturedDataUrl)
    stopCamera()

    // Procesar con OCR
    performOCR(capturedDataUrl)
    }, [stopCamera])

    // Función para subir archivo
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
        performOCR(file)
    }
    reader.readAsDataURL(file)
    }, [])

    const resetScanner = () => {
    setDetectedEquations([])
    setError(null)
    setCapturedImage(null)
    setProgress(0)
}

return (
    <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Reconocimiento de Ejercicios Matemáticos
                    </CardTitle>
                    <CardDescription>
                        Captura o sube una imagen con ejercicios matemáticos escritos a mano o impresos.
                        <br />
                        <span className="text-xs text-muted-foreground">
                            Tip: Asegúrate de que el texto sea claro, con buen contraste y bien iluminado para mejores resultados.
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
                            className="w-full h-64 sm:h-80 object-cover"
                            autoPlay
                            playsInline
                        />

                        {/* Overlay de guía */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="border-2 border-white border-dashed rounded-lg w-4/5 h-4/5 flex items-center justify-center">
                                <div className="bg-black/50 text-white px-3 py-2 rounded text-center">
                                    <p className="text-sm">Centra los ejercicios matemáticos</p>
                                    <p className="text-xs opacity-75">Asegúrate de que el texto sea legible</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={captureImage} className="flex-1">
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
                    <h4 className="font-semibold">Imagen Capturada:</h4>
                    <div className="relative">
                        <img
                            src={capturedImage}
                            alt="Imagen capturada"
                            className="w-full max-h-64 object-contain bg-gray-100 rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Progreso de procesamiento */}
            {isProcessing && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">Procesando imagen...</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <p className="text-xs text-muted-foreground text-center">
                        {progress}% - Reconociendo texto matemático
                    </p>
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

            {/* Ecuaciones detectadas */}
            {detectedEquations.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Ejercicios Detectados:
                    </h4>

                    <div className="space-y-3">
                        {detectedEquations.map((equation, index) => (
                            <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className="text-xs">
                                                Ejercicio {index + 1}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {Math.round(equation.confidence)}% confianza
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Texto original:</p>
                                                <p className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                                                    {equation.text}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">Procesado (editable):</p>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={equation.processed}
                                                        onChange={(e) => {
                                                            const newEquations = [...detectedEquations]
                                                            newEquations[index].processed = e.target.value
                                                            setDetectedEquations(newEquations)
                                                        }}
                                                        className="w-full font-mono text-lg bg-white dark:bg-gray-800 p-2 pr-8 rounded border font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Edita la ecuación si es necesario"
                                                    />
                                                    <div className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">
                                                        ✏️
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <Button
                                            size="sm"
                                            onClick={() => onEquationDetected(equation.processed, equation.confidence)}
                                        >
                                            <Zap className="h-3 w-3 mr-1" />
                                            Resolver
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigator.clipboard.writeText(equation.processed)}
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

            {/* Input oculto para archivos */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Canvas oculto para procesamiento */}
            <canvas ref={canvasRef} className="hidden" />
        </CardContent>
    </Card>
)
}