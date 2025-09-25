"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calculator, 
  FunctionSquare, 
  Sigma, 
  Pi, 
  Infinity,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface MathKeyboardProps {
  onSymbolClick: (symbol: string) => void
  isVisible: boolean
  onToggle: () => void
}

interface MathSymbol {
  symbol: string
  label: string
  description?: string
}

const mathCategories = {
  basic: {
    name: "Básicos",
    icon: Calculator,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
    symbols: [
      { symbol: "²", label: "x²" },
      { symbol: "³", label: "x³" },
      { symbol: "^", label: "^" },
      { symbol: "√", label: "√" },
      { symbol: "∛", label: "∛" },
      { symbol: "±", label: "±" },
      { symbol: "÷", label: "÷" },
      { symbol: "×", label: "×" },
      { symbol: "≠", label: "≠" },
      { symbol: "≈", label: "≈" },
      { symbol: "≤", label: "≤" },
      { symbol: "≥", label: "≥" }
    ]
  },
  functions: {
    name: "Funciones",
    icon: FunctionSquare,
    color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
    symbols: [
      { symbol: "sin", label: "sin" },
      { symbol: "cos", label: "cos" },
      { symbol: "tan", label: "tan" },
      { symbol: "cot", label: "cot" },
      { symbol: "sec", label: "sec" },
      { symbol: "csc", label: "csc" },
      { symbol: "arcsin", label: "arcsin" },
      { symbol: "arccos", label: "arccos" },
      { symbol: "arctan", label: "arctan" },
      { symbol: "sinh", label: "sinh" },
      { symbol: "cosh", label: "cosh" },
      { symbol: "tanh", label: "tanh" },
      { symbol: "ln", label: "ln" },
      { symbol: "log", label: "log" },
      { symbol: "exp", label: "exp" },
      { symbol: "abs", label: "|x|" }
    ]
  },
  calculus: {
    name: "Cálculo",
    icon: Sigma,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
    symbols: [
      { symbol: "∫", label: "∫", description: "Integral" },
      { symbol: "∬", label: "∬", description: "Integral doble" },
      { symbol: "∭", label: "∭", description: "Integral triple" },
      { symbol: "∮", label: "∮", description: "Integral de línea" },
      { symbol: "d/dx", label: "d/dx", description: "Derivada" },
      { symbol: "∂/∂x", label: "∂/∂x", description: "Derivada parcial" },
      { symbol: "∇", label: "∇", description: "Gradiente" },
      { symbol: "Σ", label: "Σ", description: "Sumatoria" },
      { symbol: "∏", label: "∏", description: "Productoria" },
      { symbol: "lim", label: "lim", description: "Límite" },
      { symbol: "→", label: "→", description: "Tiende a" },
      { symbol: "∞", label: "∞", description: "Infinito" }
    ]
  },
  greek: {
    name: "Griegas",
    icon: Pi,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
    symbols: [
      { symbol: "α", label: "α" },
      { symbol: "β", label: "β" },
      { symbol: "γ", label: "γ" },
      { symbol: "δ", label: "δ" },
      { symbol: "ε", label: "ε" },
      { symbol: "θ", label: "θ" },
      { symbol: "λ", label: "λ" },
      { symbol: "μ", label: "μ" },
      { symbol: "π", label: "π" },
      { symbol: "σ", label: "σ" },
      { symbol: "τ", label: "τ" },
      { symbol: "φ", label: "φ" },
      { symbol: "ψ", label: "ψ" },
      { symbol: "ω", label: "ω" },
      { symbol: "Δ", label: "Δ" },
      { symbol: "Θ", label: "Θ" },
      { symbol: "Λ", label: "Λ" },
      { symbol: "Σ", label: "Σ" },
      { symbol: "Φ", label: "Φ" },
      { symbol: "Ω", label: "Ω" }
    ]
  },
  sets: {
    name: "Conjuntos",
    icon: Infinity,
    color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
    symbols: [
      { symbol: "∈", label: "∈", description: "Pertenece" },
      { symbol: "∉", label: "∉", description: "No pertenece" },
      { symbol: "⊂", label: "⊂", description: "Subconjunto" },
      { symbol: "⊆", label: "⊆", description: "Subconjunto o igual" },
      { symbol: "∪", label: "∪", description: "Unión" },
      { symbol: "∩", label: "∩", description: "Intersección" },
      { symbol: "∅", label: "∅", description: "Conjunto vacío" },
      { symbol: "ℝ", label: "ℝ", description: "Números reales" },
      { symbol: "ℕ", label: "ℕ", description: "Números naturales" },
      { symbol: "ℤ", label: "ℤ", description: "Números enteros" },
      { symbol: "ℚ", label: "ℚ", description: "Números racionales" },
      { symbol: "ℂ", label: "ℂ", description: "Números complejos" }
    ]
  }
}

export default function MathKeyboard({ onSymbolClick, isVisible, onToggle }: MathKeyboardProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof mathCategories>('basic')

  const handleSymbolClick = (symbol: string) => {
    onSymbolClick(symbol)
  }

  if (!isVisible) {
    return (
      <div className="flex justify-center mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggle}
          className="flex items-center gap-2 text-sm"
        >
          <Calculator className="h-4 w-4" />
          Mostrar Teclado Matemático
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  const currentCategory = mathCategories[activeCategory]

  return (
    <Card className="mt-4 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Teclado Matemático
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="flex items-center gap-1"
          >
            Ocultar
            <ChevronUp className="h-3 w-3" />
          </Button>
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(mathCategories).map(([key, category]) => {
            const IconComponent = category.icon
            const isActive = activeCategory === key
            return (
              <Badge
                key={key}
                variant={isActive ? "default" : "secondary"}
                className={`cursor-pointer px-3 py-2 flex items-center gap-2 ${
                  isActive ? "bg-blue-600 text-white" : category.color
                }`}
                onClick={() => setActiveCategory(key as keyof typeof mathCategories)}
              >
                <IconComponent className="h-4 w-4" />
                {category.name}
              </Badge>
            )
          })}
        </div>

        {/* Símbolos */}
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {currentCategory.symbols.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="h-12 w-12 text-lg font-mono hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 transition-colors"
              onClick={() => handleSymbolClick(item.symbol)}
              title={item.description || item.label}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {/* Instrucciones */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <strong>Tip:</strong> Haz clic en cualquier símbolo para agregarlo a tu ecuación. 
            Puedes combinar símbolos para crear expresiones complejas como límites multivariados.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
