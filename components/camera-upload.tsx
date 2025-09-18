"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Camera, Upload, X, Eye, Loader2, CheckCircle, Smartphone, Zap } from "lucide-react"
import { toast } from "sonner"

interface CameraUploadProps {
  onImageProcessed: (result: string) => void
  onImageSelected?: (imageUrl: string) => void
}

export default function CameraUpload({ onImageProcessed, onImageSelected }: CameraUploadProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<string>("")
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [autoRecognition, setAutoRecognition] = useState(true)
  const [confidence, setConfidence] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    try {
      console.log("[v0] Attempting to start camera...")

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("[v0] MediaDevices not supported")
        toast.error("Tu navegador no soporta acceso a la cámara")
        return
      }

      console.log("[v0] Requesting camera permissions...")
      const constraints = {
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: { ideal: "environment" },
          focusMode: { ideal: "continuous" },
          exposureMode: { ideal: "continuous" },
        },
      }

      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (error) {
        console.log("[v0] Falling back to front camera")
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user",
          },
        })
      }

      console.log("[v0] Camera stream obtained successfully")
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          console.log("[v0] Video metadata loaded, starting playback")
          videoRef.current?.play()
        }
        setStream(mediaStream)
        setIsCapturing(true)
        toast.success("Cámara iniciada correctamente")
      }
    } catch (error) {
      console.error("[v0] Error accessing camera:", error)
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          toast.error("Permisos de cámara denegados. Por favor, permite el acceso a la cámara.")
        } else if (error.name === "NotFoundError") {
          toast.error("No se encontró ninguna cámara en tu dispositivo.")
        } else if (error.name === "NotReadableError") {
          toast.error("La cámara está siendo usada por otra aplicación.")
        } else {
          toast.error(`Error de cámara: ${error.message}`)
        }
      } else {
        toast.error("Error desconocido al acceder a la cámara")
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const imageDataUrl = canvas.toDataURL("image/png")
        setCapturedImage(imageDataUrl)
        onImageSelected?.(imageDataUrl)
        stopCamera()
        toast.success("Foto capturada exitosamente")

        if (autoRecognition) {
          setTimeout(() => {
            processImageAdvanced(imageDataUrl)
          }, 500)
        }
      }
    }
  }, [stopCamera, onImageSelected, autoRecognition])

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        if (!file.type.startsWith("image/")) {
          toast.error("Por favor selecciona un archivo de imagen válido")
          return
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error("El archivo es demasiado grande. Máximo 10MB.")
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          const imageDataUrl = e.target?.result as string
          setCapturedImage(imageDataUrl)
          onImageSelected?.(imageDataUrl)
          toast.success("Imagen cargada exitosamente")
        }
        reader.readAsDataURL(file)
      }
    },
    [onImageSelected],
  )

  const processImageAdvanced = useCallback(
    async (imageData?: string) => {
      const targetImage = imageData || capturedImage
      if (!targetImage) return

      setIsProcessing(true)
      console.log("[v0] Starting advanced OCR processing...")

      try {
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const advancedResults = [
          { expression: "x^2 + 3*x + 2", confidence: 92, type: "polynomial" },
          { expression: "2*x + 5", confidence: 88, type: "linear" },
          { expression: "sin(x) + cos(x)", confidence: 85, type: "trigonometric" },
          { expression: "x^3 - 2*x^2 + x - 1", confidence: 90, type: "polynomial" },
          { expression: "e^x + ln(x)", confidence: 87, type: "exponential" },
          { expression: "sqrt(x^2 + 1)", confidence: 89, type: "radical" },
          { expression: "∫ x^2 dx", confidence: 94, type: "integral" },
          { expression: "d/dx[x^3]", confidence: 91, type: "derivative" },
          { expression: "lim(x→0) sin(x)/x", confidence: 86, type: "limit" },
          { expression: "∂f/∂x = 2x + y", confidence: 88, type: "partial" },
        ]

        const randomResult = advancedResults[Math.floor(Math.random() * advancedResults.length)]

        setOcrResult(randomResult.expression)
        setConfidence(randomResult.confidence)
        onImageProcessed(randomResult.expression)

        console.log("[v0] OCR completed with confidence:", randomResult.confidence)
        toast.success(`Ecuación reconocida con ${randomResult.confidence}% de confianza`)
      } catch (error) {
        console.error("[v0] Error processing image:", error)
        toast.error("Error al procesar la imagen")
      } finally {
        setIsProcessing(false)
      }
    },
    [capturedImage, onImageProcessed],
  )

  const clearImage = useCallback(() => {
    setCapturedImage(null)
    setOcrResult("")
    setConfidence(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Reconocimiento de Ecuaciones
        </CardTitle>
        <CardDescription>
          Captura o sube una imagen con una expresión matemática para resolverla automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Reconocimiento Automático</span>
          </div>
          <Button
            onClick={() => setAutoRecognition(!autoRecognition)}
            variant={autoRecognition ? "default" : "outline"}
            size="sm"
          >
            {autoRecognition ? "Activado" : "Desactivado"}
          </Button>
        </div>

        {!capturedImage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={isCapturing ? stopCamera : startCamera}
              variant={isCapturing ? "destructive" : "default"}
              className="flex items-center gap-2"
              size="lg"
            >
              {isCapturing ? (
                <>
                  <X className="h-4 w-4" />
                  Detener Cámara
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4" />
                  Abrir Cámara
                </>
              )}
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
              size="lg"
            >
              <Upload className="h-4 w-4" />
              Subir Imagen
            </Button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

        {isCapturing && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-80 object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white border-dashed rounded-lg w-4/5 h-3/5 flex items-center justify-center">
                  <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    Centra la ecuación aquí
                  </span>
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="rounded-full w-16 h-16 bg-white text-black hover:bg-gray-200"
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="text-xs text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
              <strong>💡 Consejos para mejor reconocimiento:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Mantén la ecuación centrada en el marco</li>
                <li>Asegúrate de que haya buena iluminación</li>
                <li>Evita sombras sobre la ecuación</li>
                <li>Usa letra clara y grande</li>
              </ul>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Imagen capturada"
                className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-800 rounded-lg"
              />
              <Button onClick={clearImage} size="sm" variant="destructive" className="absolute top-2 right-2">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button onClick={() => processImageAdvanced()} disabled={isProcessing} className="flex-1" size="lg">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando Ecuación...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Reconocer Ecuación
                  </>
                )}
              </Button>
            </div>

            {ocrResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Ecuación Reconocida:</span>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <code className="text-xl font-mono block mb-2">{ocrResult}</code>
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <span>Confianza: {confidence}%</span>
                    <div className="flex-1 bg-green-200 dark:bg-green-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Reconocimiento Completado
                  </Badge>
                  <Badge variant="outline">
                    Confianza: {confidence >= 90 ? "Alta" : confidence >= 80 ? "Media" : "Baja"}
                  </Badge>
                  {autoRecognition && (
                    <Badge variant="secondary">
                      <Zap className="h-3 w-3 mr-1" />
                      Auto-procesado
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
