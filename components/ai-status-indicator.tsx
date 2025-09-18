"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Zap, AlertCircle } from "lucide-react"

export default function AIStatusIndicator() {
  const [groqConfigured, setGroqConfigured] = useState(false)

  useEffect(() => {
    // Verificar si Groq está configurado
    const hasGroqKey = !!process.env.NEXT_PUBLIC_GROQ_API_KEY
    setGroqConfigured(hasGroqKey)
  }, [])

  if (groqConfigured) {
    return (
      <Badge className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
        <CheckCircle className="h-3 w-3" />
        IA Activada
      </Badge>
    )
  }

  return (
    <Badge className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
      <AlertCircle className="h-3 w-3" />
      IA Básica
    </Badge>
  )
}