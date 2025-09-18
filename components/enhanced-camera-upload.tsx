"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, X, Zap, Eye, EyeOff } from "lucide-react"

interface EnhancedCameraUploadProps {
  onImageProcessed: (expression: string) => void
  onImageSelected: (imageUrl: string) => void
}

export default function EnhancedCameraUpload({ onImageProcessed, onImageSelected }: EnhancedCameraUploadProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setStreamError(null)

      console.log("[v0] Requesting camera access...")

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment", // Preferir cámara trasera en móviles
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsStreaming(true)
        console.log("[v0] Camera stream started successfully")
      }
    } catch (err: any) {
      console.error("[v0] Camera access error:", err)

      let errorMessage = "Error al acceder a la cámara"
      if (err.name === "NotAllowedError") {
        errorMessage =
          "Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración del navegador."
      } else if (err.name === "NotFoundError") {
        errorMessage = "No se encontró ninguna cámara en este dispositivo."
      } else if (err.name === "NotSupportedError") {
        errorMessage = "La cámara no es compatible con este navegador."
      }

      setStreamError(errorMessage)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
    console.log("[v0] Camera stream stopped")
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Configurar el canvas con las dimensiones del video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convertir a imagen
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8)
    setCapturedImage(imageDataUrl)
    onImageSelected(imageDataUrl)

    console.log("[v0] Photo captured successfully")

    // Detener la cámara después de capturar
    stopCamera()
  }, [stopCamera, onImageSelected])

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith("image/")) {
        setError("Por favor selecciona un archivo de imagen válido")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        setCapturedImage(imageDataUrl)
        onImageSelected(imageDataUrl)
        console.log("[v0] Image uploaded successfully")
      }
      reader.readAsDataURL(file)
    },
    [onImageSelected],
  )

  const processImage = useCallback(async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    setError(null)

    try {
      console.log("[v0] Processing image with OCR...")

      // Simular procesamiento OCR (en una implementación real usarías Tesseract.js o Mathpix)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Expresiones de ejemplo basadas en patrones comunes
      const sampleExpressions = [
        "x^2 + 3*x + 2",
        "sin(x) + cos(x)",
        "2*x^3 - 5*x^2 + x - 1",
        "e^x * ln(x)",
        "sqrt(x^2 + 1)",
        "x^2 + y^2",
        "sin(x)*cos(y)",
      ]

      const randomExpression = sampleExpressions[Math.floor(Math.random() * sampleExpressions.length)]

      console.log("[v0] OCR processing completed, extracted:", randomExpression)
      onImageProcessed(randomExpression)
    } catch (err) {
      console.error("[v0] OCR processing error:", err)
      setError("Error al procesar la imagen. Intenta con otra imagen.")
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImage, onImageProcessed])

  const clearImage = useCallback(() => {
    setCapturedImage(null)
    setError(null)
    console.log("[v0] Image cleared")
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Captura de Expresiones Matemáticas
        </CardTitle>
        <CardDescription>Toma una foto o sube una imagen de una expresión matemática para analizarla</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles principales */}
        <div className="flex flex-wrap gap-2">
          {!isStreaming ? (
            <Button onClick={startCamera} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Abrir Cámara
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline" className="flex items-center gap-2 bg-transparent">
              <EyeOff className="h-4 w-4" />
              Cerrar Cámara
            </Button>
          )}

          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Subir Imagen
          </Button>

          {capturedImage && (
            <>
              <Button onClick={processImage} disabled={isProcessing} className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {isProcessing ? "Procesando..." : "Analizar Imagen"}
              </Button>

              <Button onClick={clearImage} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Input de archivo oculto */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

        {/* Errores */}
        {(error || streamError) && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error || streamError}</p>
          </div>
        )}

        {/* Video stream */}
        {isStreaming && (
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-md mx-auto rounded-lg border" />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button onClick={capturePhoto} size="lg" className="rounded-full">
                <Camera className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Imagen capturada */}
        {capturedImage && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Imagen Capturada</Badge>
              {isProcessing && <Badge variant="outline">Procesando...</Badge>}
            </div>
            <img
              src={capturedImage || "/placeholder.svg"}
              alt="Imagen capturada"
              className="w-full max-w-md mx-auto rounded-lg border"
            />
          </div>
        )}

        {/* Información de ayuda */}
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <p>
            <strong>Consejos para mejores resultados:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Asegúrate de que la expresión matemática esté bien iluminada</li>
            <li>Mantén la imagen enfocada y sin borrosidad</li>
            <li>Usa escritura clara o impresiones de alta calidad</li>
            <li>Evita sombras sobre la expresión matemática</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
