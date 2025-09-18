"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Zap,
  Globe,
  Home,
  Cpu
} from "lucide-react"
import { aiSolver } from "@/lib/ai-solver"

interface ProviderStatus {
  name: string
  isAvailable: boolean
  priority: number
  icon: React.ReactNode
  description: string
}

export default function AIStatusIndicator() {
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const getProviderIcon = (name: string) => {
    switch (name) {
      case 'Groq':
        return <Zap className="h-4 w-4" />
      case 'OpenRouter':
        return <Globe className="h-4 w-4" />
      case 'Hugging Face':
        return <Brain className="h-4 w-4" />
      case 'Cohere':
        return <Cpu className="h-4 w-4" />
      case 'Ollama Local':
        return <Home className="h-4 w-4" />
      case 'Local Fallback':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getProviderDescription = (name: string) => {
    switch (name) {
      case 'Groq':
        return 'IA ultra-rápida con modelos Llama'
      case 'OpenRouter':
        return 'Acceso a múltiples modelos gratuitos'
      case 'Hugging Face':
        return 'Modelos de código abierto'
      case 'Cohere':
        return 'IA conversacional avanzada'
      case 'Ollama Local':
        return 'Modelos locales (requiere instalación)'
      case 'Local Fallback':
        return 'Lógica matemática integrada'
      default:
        return 'Proveedor de IA'
    }
  }

  const checkProviders = async () => {
    setIsChecking(true)
    
    try {
      // Verificar disponibilidad de proveedores
      await (aiSolver as any).checkProviderAvailability()
      
      // Obtener estado actualizado de los proveedores
      const providerStates = (aiSolver as any).providers.map((provider: any) => ({
        name: provider.name,
        isAvailable: provider.isAvailable,
        priority: provider.priority,
        icon: getProviderIcon(provider.name),
        description: getProviderDescription(provider.name)
      }))
      
      setProviders(providerStates)
      setLastCheck(new Date())
    } catch (error) {
      console.error('Error checking providers:', error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    // Verificar proveedores al cargar
    checkProviders()
    
    // Verificar cada 5 minutos
    const interval = setInterval(checkProviders, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const availableCount = providers.filter(p => p.isAvailable).length
  const totalCount = providers.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <div className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            <Badge 
              variant={availableCount > 0 ? "default" : "destructive"}
              className="text-xs px-1 py-0 h-4"
            >
              {availableCount}/{totalCount}
            </Badge>
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Estado de las IAs</CardTitle>
                <CardDescription className="text-xs">
                  {availableCount} de {totalCount} proveedores disponibles
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkProviders}
                disabled={isChecking}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {providers.map((provider, index) => (
              <div
                key={provider.name}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {provider.icon}
                    <span className="text-sm font-medium">{provider.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                    #{provider.priority}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {provider.isAvailable ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
            
            {lastCheck && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                <Clock className="h-3 w-3" />
                <span>
                  Última verificación: {lastCheck.toLocaleTimeString()}
                </span>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p className="mb-1">
                <strong>Sistema de Fallback Automático:</strong>
              </p>
              <p>
                Si una IA falla, el sistema automáticamente prueba la siguiente en orden de prioridad.
              </p>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}