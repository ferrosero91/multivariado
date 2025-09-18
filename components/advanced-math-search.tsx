"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Camera, Upload, Mic, Zap, BookOpen, X, CheckCircle, Loader2, Volume2 } from "lucide-react"

interface AdvancedMathSearchProps {
  onSearch: (query: string, type: "text" | "image" | "voice") => void
  onSolve: (problem: string) => void
}

export default function AdvancedMathSearch({ onSearch, onSolve }: AdvancedMathSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState("")
  const [confidence, setConfidence] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startVoiceRecognition = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Tu navegador no soporta reconocimiento de voz")
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "es-ES"

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setSearchQuery(transcript)
      onSearch(transcript, "voice")
      setIsListening(false)
    }

    recognition.onerror = (error: any) => {
      setIsListening(false)
      console.error("Error en el reconocimiento de voz:", error)
      alert("Error en el reconocimiento de voz")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [onSearch])

  const startCamera = useCallback(async () => {
    try {
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Tu navegador no soporta acceso a la cámara")
        return
      }

      const constraints = {
        video: {
          facingMode: "environment", // Cámara trasera en móviles
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: "continuous",
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsCameraOpen(true)
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error)

      let errorMessage = "No se pudo acceder a la cámara."

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage =
          "Permisos de cámara denegados. Por favor, permite el acceso a la cámara en la configuración de tu navegador y recarga la página."
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "No se encontró ninguna cámara en tu dispositivo."
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage =
          "La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara."
      } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
        errorMessage = "La cámara no cumple con los requisitos necesarios."
      } else if (error.name === "NotSupportedError") {
        errorMessage = "Tu navegador no soporta acceso a la cámara."
      } else if (error.name === "AbortError") {
        errorMessage = "Acceso a la cámara cancelado."
      }

      alert(errorMessage)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
  }, [])

  const captureAndProcessImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsProcessing(true)
    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Configurar canvas con la resolución del video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Capturar frame del video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Aplicar filtros para mejorar el OCR
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convertir a escala de grises y aumentar contraste
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      const enhanced = gray > 128 ? 255 : 0 // Binarización
      data[i] = enhanced
      data[i + 1] = enhanced
      data[i + 2] = enhanced
    }

    ctx.putImageData(imageData, 0, 0)

    // Simular OCR avanzado (en producción usarías Tesseract.js o API externa)
    await simulateAdvancedOCR(canvas)

    setIsProcessing(false)
    stopCamera()
  }, [stopCamera])

  const simulateAdvancedOCR = async (canvas: HTMLCanvasElement) => {
    // Simular procesamiento OCR
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Ejemplos de ecuaciones que podría reconocer
    const sampleEquations = [
      "x^2 + 2x + 1 = 0",
      "∫ x^2 dx",
      "d/dx (sin(x))",
      "lim(x→0) sin(x)/x",
      "∂f/∂x = 2x + y",
      "√(x^2 + y^2)",
      "e^(x+1) = 5",
    ]

    const randomEquation = sampleEquations[Math.floor(Math.random() * sampleEquations.length)]
    const confidence = Math.floor(Math.random() * 20) + 80 // 80-100%

    console.log("[v0] Starting advanced OCR processing...")
    console.log("[v0] OCR completed with confidence:", confidence)

    setOcrResult(randomEquation)
    setConfidence(confidence)
    setSearchQuery(randomEquation)
  }

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    // Crear canvas para procesar la imagen
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = async () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      await simulateAdvancedOCR(canvas)
      setIsProcessing(false)
    }

    img.src = URL.createObjectURL(file)
  }, [])

  const handleSolveEquation = () => {
    if (searchQuery.trim()) {
      console.log('🎯 Solving equation:', searchQuery)
      onSolve(searchQuery)
    } else {
      console.log('⚠️ No equation to solve')
    }
  }

  const quickActions = [
    { label: "Derivada", query: "d/dx (x^2 + 3x + 1)" },
    { label: "Integral", query: "∫ x^2 dx" },
    { label: "Límite", query: "lim(x→0) sin(x)/x" },
    { label: "Ecuación", query: "x^2 - 4x + 3 = 0" },
  ]

  const handleQuickAction = (query: string) => {
    setSearchQuery(query)
    // Automáticamente resolver cuando se selecciona una acción rápida
    setTimeout(() => {
      onSolve(query)
    }, 100)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Buscador principal estilo Symbolab */}
      <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Input principal */}
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <Input
              placeholder="d/dx (x^2 + 3x + 1)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-12 pr-20 sm:pr-24 py-3 sm:py-4 text-base sm:text-lg border-0 bg-gray-50 dark:bg-slate-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-600 transition-all text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && handleSolveEquation()}
            />

            {/* Botones de input alternativo */}
            <div className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 flex gap-0.5 sm:gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={startCamera}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md sm:rounded-lg"
                title="Capturar con cámara"
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md sm:rounded-lg"
                title="Subir imagen"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={startVoiceRecognition}
                className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md sm:rounded-lg ${isListening
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                  : "hover:bg-gray-200 dark:hover:bg-slate-600"
                  }`}
                title="Reconocimiento de voz"
                disabled={isListening}
              >
                {isListening ? <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse" /> : <Mic className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />}
              </Button>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Button
              onClick={handleSolveEquation}
              disabled={!searchQuery.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium sm:font-semibold py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg text-sm sm:text-base"
            >
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Resolver Paso a Paso</span>
              <span className="sm:hidden">Resolver</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => onSearch(searchQuery, "text")}
              disabled={!searchQuery.trim()}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 border border-border hover:bg-accent rounded-lg sm:rounded-xl font-medium sm:font-semibold transition-all text-sm sm:text-base"
            >
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Explicar Concepto</span>
              <span className="sm:hidden">Explicar</span>
            </Button>
          </div>

          {/* Acciones rápidas */}
          <div className="space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Acciones rápidas:</p>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {quickActions.map((action, index) => (
                <Badge
                  key={index}
                  className="cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-full font-medium transition-all hover:scale-105 shadow-sm text-xs sm:text-sm"
                  onClick={() => handleQuickAction(action.query)}
                >
                  {action.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cámara */}
      {isCameraOpen && (
        <Card className="border border-primary mt-3 sm:mt-4">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Capturar Ecuación</h3>
                <Button variant="ghost" size="sm" onClick={stopCamera}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} className="w-full h-48 sm:h-64 object-cover" autoPlay playsInline />

                {/* Overlay de guía */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                    <p className="text-white text-xs sm:text-sm bg-black/50 px-2 py-1 rounded text-center">Centra la ecuación aquí</p>
                  </div>
                </div>
              </div>

              <Button onClick={captureAndProcessImage} disabled={isProcessing} className="w-full text-sm sm:text-base">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Capturar y Analizar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado del OCR */}
      {ocrResult && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 mt-3 sm:mt-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm sm:text-base">
                  Ecuación Reconocida (Confianza: {confidence}%)
                </h4>
                <p className="text-green-700 dark:text-green-300 font-mono text-sm sm:text-lg mt-1 break-all">{ocrResult}</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Button size="sm" onClick={() => setSearchQuery(ocrResult)} className="text-xs sm:text-sm">
                    Usar esta ecuación
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOcrResult("")} className="text-xs sm:text-sm">
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input oculto para subir archivos */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

      {/* Canvas oculto para procesamiento */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
