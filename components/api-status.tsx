"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, Settings, ExternalLink } from "lucide-react"

export default function ApiStatus() {
  const [groqConfigured, setGroqConfigured] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Verificar si Groq está configurado
    const hasGroqKey = !!process.env.NEXT_PUBLIC_GROQ_API_KEY
    setGroqConfigured(hasGroqKey)
  }, [])

  const apis = [
    {
      name: "Groq",
      status: groqConfigured ? "configured" : "not-configured",
      description: "IA ultra-rápida para resolución matemática",
      quality: 5,
      speed: 5,
      free: true,
      setupUrl: "https://console.groq.com"
    },
    {
      name: "OpenRouter",
      status: "available",
      description: "Modelos gratuitos como fallback",
      quality: 4,
      speed: 3,
      free: true,
      setupUrl: "https://openrouter.ai"
    },
    {
      name: "Hugging Face",
      status: "available",
      description: "Backup gratuito para casos básicos",
      quality: 3,
      speed: 2,
      free: true,
      setupUrl: "https://huggingface.co"
    },
    {
      name: "Fallback Local",
      status: "available",
      description: "Lógica matemática básica integrada",
      quality: 2,
      speed: 5,
      free: true,
      setupUrl: null
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "configured":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "available":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "not-configured":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "configured":
        return "Configurado"
      case "available":
        return "Disponible"
      case "not-configured":
        return "No configurado"
      default:
        return "Desconocido"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "configured":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "available":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "not-configured":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  const renderStars = (count: number) => {
    return "⭐".repeat(count) + "☆".repeat(5 - count)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Estado de APIs de IA
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Ocultar" : "Ver"} Detalles
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Resumen rápido */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {apis.map((api) => (
              <div key={api.name} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getStatusIcon(api.status)}
                </div>
                <div className="text-sm font-medium">{api.name}</div>
                <Badge className={`text-xs ${getStatusColor(api.status)}`}>
                  {getStatusText(api.status)}
                </Badge>
              </div>
            ))}
          </div>

          {/* Mensaje principal */}
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            {groqConfigured ? (
              <div>
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  ¡Configuración Óptima!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Groq está configurado. Tendrás la mejor experiencia de resolución matemática.
                </p>
              </div>
            ) : (
              <div>
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                  Configuración Básica
                </h3>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                  La app funciona con APIs gratuitas, pero puedes mejorar la calidad configurando Groq.
                </p>
                <Button
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => window.open("https://console.groq.com", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configurar Groq (Gratis)
                </Button>
              </div>
            )}
          </div>

          {/* Detalles expandidos */}
          {showDetails && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Detalles de APIs</h4>
              
              {apis.map((api) => (
                <div
                  key={api.name}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(api.status)}
                      <div>
                        <h5 className="font-semibold">{api.name}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {api.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={getStatusColor(api.status)}>
                        {getStatusText(api.status)}
                      </Badge>
                      {api.free && (
                        <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                          Gratis
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Calidad:</span>
                      <div>{renderStars(api.quality)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Velocidad:</span>
                      <div>{renderStars(api.speed)}</div>
                    </div>
                  </div>
                  
                  {api.setupUrl && api.status === "not-configured" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(api.setupUrl, "_blank")}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Configurar {api.name}
                    </Button>
                  )}
                </div>
              ))}
              
              {/* Instrucciones */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                <h5 className="font-semibold mb-2">📋 Instrucciones de Configuración</h5>
                <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600 dark:text-gray-400">
                  <li>Ve a <a href="https://console.groq.com" target="_blank" className="text-blue-600 hover:underline">console.groq.com</a></li>
                  <li>Regístrate gratis (no requiere tarjeta)</li>
                  <li>Ve a "API Keys" → "Create API Key"</li>
                  <li>Copia tu token (empieza con gsk_...)</li>
                  <li>Edita el archivo .env.local en tu proyecto</li>
                  <li>Pega: NEXT_PUBLIC_GROQ_API_KEY=tu_token</li>
                  <li>Reinicia la aplicación</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}