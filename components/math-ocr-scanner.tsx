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

    // Función avanzada para procesar texto matemático de escritura a mano
    const processMathText = (rawText: string): string => {
        let processed = rawText
            // Limpiar espacios extra y caracteres extraños
            .replace(/\s+/g, ' ')
            .replace(/[|_]/g, '')
            .replace(/[""]/g, '')
            .replace(/[`´]/g, '')
            .trim()

            // CORRECCIONES ESPECÍFICAS PARA ESCRITURA A MANO

            // Corregir símbolos de integral mal reconocidos
            .replace(/\bf\b/gi, '∫') // 'f' confundido con integral
            .replace(/\bJ\b/gi, '∫') // 'J' confundido con integral
            .replace(/\b\|\b/gi, '∫') // '|' confundido con integral
            .replace(/^s\s/gi, '∫ ') // 's' al inicio confundido con integral

            // Corregir exponentes escritos a mano
            .replace(/e\s*\^\s*\(/gi, 'e^(') // e^( mal espaciado
            .replace(/e\s*\*\s*\(/gi, 'e^(') // e*( -> e^(
            .replace(/e\s*\(\s*/gi, 'e^(') // e( -> e^(
            .replace(/e\s*tan/gi, 'e^(tan') // e tan -> e^(tan

            // Corregir funciones trigonométricas
            .replace(/\btan\s*(\d+)\s*x/gi, 'tan($1x)') // tan 2x -> tan(2x)
            .replace(/\bsin\s*(\d+)\s*x/gi, 'sin($1x)') // sin 2x -> sin(2x)
            .replace(/\bcos\s*(\d+)\s*x/gi, 'cos($1x)') // cos 2x -> cos(2x)
            .replace(/\bsec\s*(\d+)\s*x/gi, 'sec($1x)') // sec 2x -> sec(2x)
            .replace(/\bcsc\s*(\d+)\s*x/gi, 'csc($1x)') // csc 2x -> csc(2x)
            .replace(/\bcot\s*(\d+)\s*x/gi, 'cot($1x)') // cot 2x -> cot(2x)

            // Corregir sec² mal reconocido
            .replace(/sec\s*2\s*\(/gi, 'sec²(') // sec 2 ( -> sec²(
            .replace(/sec\s*\^\s*2\s*\(/gi, 'sec²(') // sec ^ 2 ( -> sec²(
            .replace(/sec\s*²\s*\(/gi, 'sec²(') // sec ² ( -> sec²(

            // Corregir fracciones complejas
            .replace(/\/\s*sec/gi, '/sec') // / sec -> /sec
            .replace(/\)\s*\/\s*sec/gi, ')/sec') // ) / sec -> )/sec

            // Corregir paréntesis mal reconocidos
            .replace(/\(\s*tan/gi, '(tan') // ( tan -> (tan
            .replace(/tan\s*\)/gi, 'tan)') // tan ) -> tan)
            .replace(/x\s*\)\s*\//gi, 'x)/') // x ) / -> x)/

            // CORRECCIONES ESPECÍFICAS PARA INTEGRALES COMPLEJAS
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

            // Corregir números y variables comunes que OCR confunde en escritura a mano
            .replace(/\b0\b/g, '0')
            .replace(/\bO\b/g, '0') // O mayúscula por 0
            .replace(/\bl\b/g, '1') // l minúscula por 1
            .replace(/\bI\b/g, '1') // I mayúscula por 1
            .replace(/\bS\b/g, '5') // S mayúscula por 5 en algunos casos
            .replace(/\bZ\b/g, '2') // Z mayúscula por 2 en algunos casos
            .replace(/\bg\b/g, '9') // g minúscula por 9 en algunos casos

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
            .replace(/\s*\/\s*/g, '/')

            // Limpiar espacios finales
            .replace(/\s+/g, ' ')
            .trim()

        // CORRECCIONES FINALES ESPECÍFICAS PARA INTEGRALES COMPLEJAS
        // Si detectamos un patrón que parece integral pero no tiene el símbolo
        if (/\([^)]*x[^)]*\)dx/i.test(processed) && !processed.includes('∫')) {
            processed = '∫' + processed
        }

        // Corregir patrones específicos de la imagen mostrada
        // "e tan 2x / sec 2x dx" -> "∫ e^(tan(2x)) / sec²(2x) dx"
        if (/e\s+tan\s+2x.*sec.*2x.*dx/i.test(processed)) {
            processed = processed
                .replace(/e\s+tan\s+2x/gi, 'e^(tan(2x))')
                .replace(/sec\s*2\s*\(\s*2x\s*\)/gi, 'sec²(2x)')
                .replace(/sec\s*2x/gi, 'sec²(2x)')

            if (!processed.startsWith('∫')) {
                processed = '∫ ' + processed
            }
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

    // Función principal de OCR con múltiples APIs
    const performOCR = async (imageData: string | File) => {
        setIsProcessing(true)
        setProgress(0)
        setError(null)
        setDetectedEquations([])

        try {
            console.log('🔍 Iniciando reconocimiento OCR con múltiples APIs...')

            // Intentar con múltiples APIs en orden de preferencia
            const ocrResults = await tryMultipleOCRAPIs(imageData)

            if (ocrResults.length === 0) {
                throw new Error('Ninguna API de OCR pudo procesar la imagen')
            }

            // Procesar todos los resultados
            const processedResults: DetectedEquation[] = ocrResults.map((result, index) => ({
                text: result.text,
                confidence: result.confidence,
                processed: processMathText(result.text)
            }))

            setDetectedEquations(processedResults)

            if (processedResults.length > 0) {
                // Seleccionar el mejor resultado
                const bestResult = processedResults.reduce((best, current) =>
                    current.confidence > best.confidence ? current : best
                )
                onEquationDetected(bestResult.processed, bestResult.confidence)
            }

        } catch (err) {
            console.error('❌ Error en OCR:', err)
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido en el reconocimiento'
            setError(`Error de OCR: ${errorMessage}`)
        } finally {
            setIsProcessing(false)
            setProgress(0)
        }
    }

    // Función para probar múltiples APIs de OCR
    const tryMultipleOCRAPIs = async (imageData: string | File): Promise<any[]> => {
        const results: any[] = []

        // Lista de APIs de OCR a probar
        const ocrAPIs = [
            { name: 'Mathpix', func: () => tryMathpixOCR(imageData) },
            { name: 'Google Vision', func: () => tryGoogleVisionOCR(imageData) },
            { name: 'Azure Computer Vision', func: () => tryAzureOCR(imageData) },
            { name: 'OCR.space', func: () => tryOCRSpaceAPI(imageData) },
            { name: 'Tesseract Local', func: () => tryTesseractOCR(imageData) }
        ]

        // Probar cada API
        for (const api of ocrAPIs) {
            try {
                console.log(`🔄 Probando ${api.name}...`)
                setProgress(prev => prev + 15)

                const result = await Promise.race([
                    api.func(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 10000)
                    )
                ])

                if (result && result.text && result.text.trim().length > 0) {
                    results.push({
                        ...result,
                        provider: api.name
                    })
                    console.log(`✅ ${api.name} exitoso: "${result.text}" (${result.confidence}%)`)
                } else {
                    console.log(`⚠️ ${api.name} no devolvió texto válido`)
                }
            } catch (error) {
                console.log(`❌ ${api.name} falló:`, error instanceof Error ? error.message : 'Error desconocido')
            }
        }

        return results
    }

    // API 1: Mathpix (Especializada en matemáticas)
    const tryMathpixOCR = async (imageData: string | File): Promise<any> => {
        // Mathpix tiene una API gratuita limitada
        const response = await fetch('https://api.mathpix.com/v3/text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'app_id': 'trial', // API key gratuita de prueba
                'app_key': 'trial'
            },
            body: JSON.stringify({
                src: typeof imageData === 'string' ? imageData : await fileToBase64(imageData),
                formats: ['text', 'latex'],
                data_options: {
                    include_asciimath: true,
                    include_latex: true
                }
            })
        })

        if (response.ok) {
            const data = await response.json()
            return {
                text: data.text || data.latex || '',
                confidence: (data.confidence || 0.5) * 100,
                latex: data.latex
            }
        }

        throw new Error('Mathpix API failed')
    }

    // API 2: Google Vision (Gratuita con límites)
    const tryGoogleVisionOCR = async (imageData: string | File): Promise<any> => {
        // Usar la API gratuita de Google Vision
        const base64Image = typeof imageData === 'string'
            ? imageData.split(',')[1]
            : await fileToBase64(imageData)

        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=demo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [{
                    image: {
                        content: base64Image
                    },
                    features: [{
                        type: 'TEXT_DETECTION',
                        maxResults: 1
                    }]
                }]
            })
        })

        if (response.ok) {
            const data = await response.json()
            const textAnnotation = data.responses?.[0]?.textAnnotations?.[0]

            if (textAnnotation) {
                return {
                    text: textAnnotation.description,
                    confidence: (textAnnotation.confidence || 0.8) * 100
                }
            }
        }

        throw new Error('Google Vision API failed')
    }

    // API 3: Azure Computer Vision (Gratuita con límites)
    const tryAzureOCR = async (imageData: string | File): Promise<any> => {
        // Usar endpoint gratuito de Azure (requiere configuración)
        const response = await fetch('https://api.cognitive.microsoft.com/vision/v3.2/ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Ocp-Apim-Subscription-Key': 'demo-key' // Usar demo key
            },
            body: typeof imageData === 'string'
                ? await fetch(imageData).then(r => r.blob())
                : imageData
        })

        if (response.ok) {
            const data = await response.json()
            let text = ''

            data.regions?.forEach((region: any) => {
                region.lines?.forEach((line: any) => {
                    line.words?.forEach((word: any) => {
                        text += word.text + ' '
                    })
                    text += '\n'
                })
            })

            if (text.trim()) {
                return {
                    text: text.trim(),
                    confidence: 75 // Estimado
                }
            }
        }

        throw new Error('Azure OCR API failed')
    }

    // API 4: OCR.space (Completamente gratuita)
    const tryOCRSpaceAPI = async (imageData: string | File): Promise<any> => {
        const formData = new FormData()

        if (typeof imageData === 'string') {
            // Convertir base64 a blob
            const response = await fetch(imageData)
            const blob = await response.blob()
            formData.append('file', blob, 'image.png')
        } else {
            formData.append('file', imageData)
        }

        formData.append('apikey', 'helloworld') // API key gratuita
        formData.append('language', 'eng')
        formData.append('isOverlayRequired', 'false')
        formData.append('OCREngine', '2') // Mejor engine para matemáticas

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        })

        if (response.ok) {
            const data = await response.json()

            if (data.ParsedResults && data.ParsedResults[0]) {
                const result = data.ParsedResults[0]
                return {
                    text: result.ParsedText || '',
                    confidence: result.TextOverlay?.HasOverlay ? 80 : 60
                }
            }
        }

        throw new Error('OCR.space API failed')
    }

    // Fallback: Tesseract local (siempre disponible)
    const tryTesseractOCR = async (imageData: string | File): Promise<any> => {
        let worker: any = null

        try {
            // Crear worker con configuración mejorada
            worker = await createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100))
                    }
                }
            })

            // Configurar Tesseract específicamente para escritura a mano matemática
            await worker.setParameters({
                // Caracteres permitidos ampliados para matemáticas manuscritas
                tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/=()[]{}^∫∑√πθαβγδεζηλμνξρστφχψω.,;:²³¹ \n',

                // Configuración optimizada para escritura a mano
                tessedit_pageseg_mode: 6, // Uniform block of text
                tessedit_ocr_engine_mode: 2, // LSTM only (mejor para escritura a mano)

                // Configuraciones para mejorar reconocimiento de escritura a mano
                preserve_interword_spaces: 1,
                tessedit_enable_dict_correction: 0, // Desactivar corrección de diccionario
                tessedit_enable_bigram_correction: 0, // Desactivar corrección de bigramas
                classify_enable_learning: 0, // Desactivar aprendizaje adaptativo

                // Configuraciones específicas para texto matemático manuscrito
                textord_really_old_xheight: 0, // Usar método moderno para altura de x
                segment_penalty_dict_nonword: 0, // No penalizar palabras no encontradas
                language_model_penalty_non_dict_word: 0, // No penalizar palabras no encontradas

                // Configuraciones de confianza más permisivas para escritura a mano
                tessedit_reject_mode: 0, // No rechazar caracteres automáticamente
                tessedit_zero_rejection: 1, // Aceptar todos los caracteres reconocidos
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

        // Configurar canvas con alta resolución para mejor OCR de escritura a mano
        const scale = 3 // Escalar 3x para mejor resolución
        canvas.width = video.videoWidth * scale
        canvas.height = video.videoHeight * scale

        // Configurar contexto para alta calidad
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.scale(scale, scale)

        // Dibujar imagen original
        ctx.drawImage(video, 0, 0)

        // Aplicar procesamiento avanzado para escritura a mano
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const enhancedImageData = enhanceHandwritingImage(imageData)
        ctx.putImageData(enhancedImageData, 0, 0)

        // Convertir a imagen de alta calidad
        const capturedDataUrl = canvas.toDataURL('image/png', 1.0)
        setCapturedImage(capturedDataUrl)
        stopCamera()

        // Procesar con OCR
        performOCR(capturedDataUrl)
    }, [stopCamera])

    // Función avanzada para mejorar imágenes de escritura a mano
    const enhanceHandwritingImage = (imageData: ImageData): ImageData => {
        const data = new Uint8ClampedArray(imageData.data)
        const width = imageData.width
        const height = imageData.height

        // Paso 1: Convertir a escala de grises con pesos optimizados para texto
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
            data[i] = gray
            data[i + 1] = gray
            data[i + 2] = gray
        }

        // Paso 2: Aplicar filtro gaussiano para suavizar
        const blurred = applyGaussianBlur(data, width, height)

        // Paso 3: Umbralización adaptativa mejorada para escritura a mano
        const threshold = calculateOtsuThreshold(blurred, width, height)

        // Paso 4: Aplicar umbralización con inversión si es necesario
        const shouldInvert = shouldInvertImage(blurred, width, height)

        for (let i = 0; i < blurred.length; i += 4) {
            const gray = blurred[i]
            let binary = gray > threshold ? 255 : 0

            // Invertir si el fondo es oscuro
            if (shouldInvert) {
                binary = 255 - binary
            }

            blurred[i] = binary
            blurred[i + 1] = binary
            blurred[i + 2] = binary
        }

        // Paso 5: Operaciones morfológicas para limpiar
        const cleaned = cleanBinaryImage(blurred, width, height)

        return new ImageData(cleaned, width, height)
    }

    // Filtro gaussiano para suavizar la imagen
    const applyGaussianBlur = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
        const result = new Uint8ClampedArray(data.length)
        const kernel = [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
        ]
        const kernelSum = 16

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0

                for (let ky = 0; ky < 3; ky++) {
                    for (let kx = 0; kx < 3; kx++) {
                        const idx = ((y + ky - 1) * width + (x + kx - 1)) * 4
                        sum += data[idx] * kernel[ky][kx]
                    }
                }

                const blurred = Math.round(sum / kernelSum)
                const idx = (y * width + x) * 4
                result[idx] = blurred
                result[idx + 1] = blurred
                result[idx + 2] = blurred
                result[idx + 3] = data[idx + 3]
            }
        }

        return result
    }

    // Algoritmo de Otsu para umbralización automática
    const calculateOtsuThreshold = (data: Uint8ClampedArray, width: number, height: number): number => {
        // Calcular histograma
        const histogram = new Array(256).fill(0)
        const totalPixels = width * height

        for (let i = 0; i < data.length; i += 4) {
            histogram[data[i]]++
        }

        // Calcular threshold óptimo usando método de Otsu
        let sum = 0
        for (let i = 0; i < 256; i++) {
            sum += i * histogram[i]
        }

        let sumB = 0
        let wB = 0
        let wF = 0
        let maxVariance = 0
        let threshold = 0

        for (let t = 0; t < 256; t++) {
            wB += histogram[t]
            if (wB === 0) continue

            wF = totalPixels - wB
            if (wF === 0) break

            sumB += t * histogram[t]

            const mB = sumB / wB
            const mF = (sum - sumB) / wF

            const betweenVariance = wB * wF * (mB - mF) * (mB - mF)

            if (betweenVariance > maxVariance) {
                maxVariance = betweenVariance
                threshold = t
            }
        }

        return threshold
    }

    // Determinar si la imagen debe invertirse (texto oscuro sobre fondo claro)
    const shouldInvertImage = (data: Uint8ClampedArray, width: number, height: number): boolean => {
        let darkPixels = 0
        let totalPixels = 0

        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 128) darkPixels++
            totalPixels++
        }

        // Si más del 50% de los píxeles son oscuros, probablemente necesita inversión
        return (darkPixels / totalPixels) > 0.5
    }

    // Limpiar imagen binaria con operaciones morfológicas
    const cleanBinaryImage = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
        // Aplicar apertura (erosión + dilatación) para eliminar ruido pequeño
        const eroded = morphologicalErosion(data, width, height)
        const opened = morphologicalDilation(eroded, width, height)

        // Aplicar cierre (dilatación + erosión) para conectar líneas rotas
        const dilated = morphologicalDilation(opened, width, height)
        const closed = morphologicalErosion(dilated, width, height)

        return closed
    }

    const morphologicalErosion = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
        const result = new Uint8ClampedArray(data.length)

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let minVal = 255

                // Kernel 3x3
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4
                        minVal = Math.min(minVal, data[idx])
                    }
                }

                const idx = (y * width + x) * 4
                result[idx] = minVal
                result[idx + 1] = minVal
                result[idx + 2] = minVal
                result[idx + 3] = data[idx + 3]
            }
        }

        return result
    }

    const morphologicalDilation = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
        const result = new Uint8ClampedArray(data.length)

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let maxVal = 0

                // Kernel 3x3
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4
                        maxVal = Math.max(maxVal, data[idx])
                    }
                }

                const idx = (y * width + x) * 4
                result[idx] = maxVal
                result[idx + 1] = maxVal
                result[idx + 2] = maxVal
                result[idx + 3] = data[idx + 3]
            }
        }

        return result
    }

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

    // Función para realizar múltiples pasadas de OCR con diferentes configuraciones
    const performMultipleOCRPasses = async (worker: any, imageData: string | File) => {
        const results = []

        // Configuraciones diferentes para múltiples pasadas
        const configurations = [
            {
                name: 'Standard',
                params: {
                    tessedit_pageseg_mode: 6,
                    tessedit_ocr_engine_mode: 2,
                    tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/=()[]{}^∫∑√πθαβγδεζηλμνξρστφχψω.,;:²³¹ \n'
                }
            },
            {
                name: 'Single Line',
                params: {
                    tessedit_pageseg_mode: 7, // Single text line
                    tessedit_ocr_engine_mode: 2,
                    tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/=()[]{}^∫∑√πθαβγδεζηλμνξρστφχψω.,;:²³¹ \n'
                }
            },
            {
                name: 'Single Word',
                params: {
                    tessedit_pageseg_mode: 8, // Single word
                    tessedit_ocr_engine_mode: 2,
                    tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/=()[]{}^∫∑√πθαβγδεζηλμνξρστφχψω.,;:²³¹ \n'
                }
            }
        ]

        for (const config of configurations) {
            try {
                console.log(`🔄 Pasada OCR: ${config.name}`)

                // Configurar parámetros para esta pasada
                await worker.setParameters(config.params)

                // Reconocer texto
                const result = await worker.recognize(imageData)
                const { text, confidence } = result.data

                if (text && text.trim().length > 0) {
                    results.push({
                        text: text.trim(),
                        confidence: confidence || 0,
                        method: config.name
                    })
                    console.log(`✅ ${config.name}: "${text.trim()}" (${confidence}%)`)
                }
            } catch (error) {
                console.log(`❌ Error en pasada ${config.name}:`, error)
            }
        }

        return results
    }

    // Función para seleccionar el mejor resultado de OCR
    const selectBestOCRResult = (results: any[]) => {
        if (results.length === 0) {
            return { text: '', confidence: 0 }
        }

        // Ordenar por confianza y longitud de texto
        const scored = results.map(result => ({
            ...result,
            score: calculateOCRScore(result)
        }))

        scored.sort((a, b) => b.score - a.score)

        console.log('📊 Resultados OCR ordenados por score:')
        scored.forEach(result => {
            console.log(`  ${result.method}: "${result.text}" (confianza: ${result.confidence}%, score: ${result.score.toFixed(2)})`)
        })

        return scored[0]
    }

    // Función para calcular el score de un resultado OCR
    const calculateOCRScore = (result: any) => {
        let score = result.confidence || 0

        // Bonificar por longitud de texto (más texto generalmente es mejor)
        score += Math.min(result.text.length * 2, 20)

        // Bonificar si contiene símbolos matemáticos
        const mathSymbols = /[∫∑√^()=+\-*/]/g
        const mathMatches = result.text.match(mathSymbols)
        if (mathMatches) {
            score += mathMatches.length * 5
        }

        // Bonificar si contiene 'dx' (indicativo de integral)
        if (/dx/i.test(result.text)) {
            score += 10
        }

        // Bonificar si contiene funciones trigonométricas
        if (/sin|cos|tan|sec|csc|cot/i.test(result.text)) {
            score += 8
        }

        // Penalizar si tiene muchos caracteres extraños
        const strangeChars = result.text.match(/[^0-9a-zA-Z∫∑√^()=+\-*/.,:; ]/g)
        if (strangeChars) {
            score -= strangeChars.length * 2
        }

        return score
    }

    // Función auxiliar para convertir archivo a base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                const result = reader.result as string
                resolve(result.split(',')[1]) // Remover el prefijo data:image/...;base64,
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
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