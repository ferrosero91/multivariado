"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calculator,
  FunctionSquare,
  Instagram as Integral,
  Zap,
  TrendingUp,
  BookOpen,
  Shapes,
  BarChart3,
  User,
  Settings,
  X,
} from "lucide-react"
import DifferentialCalculus from "@/components/differential-calculus"
import IntegralCalculus from "@/components/integral-calculus"
import MultivariableCalculus from "@/components/multivariable-calculus"
import DifferentialEquations from "@/components/differential-equations"
import GeometryCalculator from "@/components/geometry-calculator"
import StatisticsCalculator from "@/components/statistics-calculator"
import AdvancedMathSearch from "@/components/advanced-math-search"
import StepByStepper from "@/components/step-by-step-solver"
import ApiStatus from "@/components/api-status"
import AIStatusIndicator from "@/components/ai-status-indicator"
import EnhancedMathOCR from "@/components/enhanced-math-ocr"
import AIEnhancedOCR from "@/components/ai-enhanced-ocr"
import SmartPatternOCR from "@/components/smart-pattern-ocr"
import GroqVisionOCR from "@/components/groq-vision-ocr"
import GroqVisionSolution from "@/components/groq-vision-solution"


export default function SymbolabInspiredApp() {
  const [activeSection, setActiveSection] = useState("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [showStepSolver, setShowStepSolver] = useState(false)
  const [showEnhancedOCR, setShowEnhancedOCR] = useState(false)
  const [showAIEnhancedOCR, setShowAIEnhancedOCR] = useState(false)
  const [showSmartPatternOCR, setShowSmartPatternOCR] = useState(false)
  const [showGroqVisionOCR, setShowGroqVisionOCR] = useState(false)
  const [showGroqVisionSolution, setShowGroqVisionSolution] = useState(false)
  const [groqVisionSolution, setGroqVisionSolution] = useState<{equation: string, steps: string[], answer: string} | null>(null)
  const [currentProblem, setCurrentProblem] = useState("")

  const calculatorSections = [
    {
      id: "differential",
      title: "Cálculo Diferencial",
      description: "Derivadas, límites y análisis de funciones",
      icon: FunctionSquare,
      color: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      component: DifferentialCalculus,
    },
    {
      id: "integral",
      title: "Cálculo Integral",
      description: "Integrales definidas e indefinidas",
      icon: Integral,
      color: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      component: IntegralCalculus,
    },
    {
      id: "multivariable",
      title: "Cálculo Multivariable",
      description: "Funciones de varias variables y superficies 3D",
      icon: Calculator,
      color: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      component: MultivariableCalculus,
    },
    {
      id: "differential-equations",
      title: "Ecuaciones Diferenciales",
      description: "Solución de ecuaciones diferenciales ordinarias",
      icon: TrendingUp,
      color: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      component: DifferentialEquations,
    },
    {
      id: "geometry",
      title: "Geometría",
      description: "Cálculos geométricos y trigonométricos",
      icon: Shapes,
      color: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      component: GeometryCalculator,
    },
    {
      id: "statistics",
      title: "Estadística",
      description: "Análisis estadístico y probabilidad",
      icon: BarChart3,
      color: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      component: StatisticsCalculator,
    },
  ]

  const renderActiveComponent = () => {
    const section = calculatorSections.find((s) => s.id === activeSection)
    if (section?.component) {
      const Component = section.component
      return <Component />
    }
    return null
  }

  const handleSearch = (query: string, type: "text" | "image" | "voice") => {
    setSearchQuery(query)
    console.log(`[v0] Search initiated: ${query} (${type})`)
  }

  const handleSolveProblem = (problem: string) => {
    setCurrentProblem(problem)
    setShowStepSolver(true)
    console.log(`[v0] Solving problem: ${problem}`)
  }

  const handleGroqVisionSolution = (steps: string[], answer: string, equation?: string) => {
    setGroqVisionSolution({
      equation: equation || "",
      steps,
      answer
    })
    setShowGroqVisionSolution(true)
    setShowGroqVisionOCR(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white dark:bg-slate-900 border-b border-border shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="flex items-center justify-between">
              {/* Logo y título móvil */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary rounded-lg">
                  <Calculator className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">EasyCal Pro</h1>
                  <p className="text-xs text-muted-foreground">Calculadora profesional</p>
                </div>
              </div>
              
              {/* Botones de usuario móvil */}
              <div className="flex items-center gap-1">
                <AIStatusIndicator />
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent p-2">
                  <User className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent p-2">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Barra de búsqueda móvil */}
            <div className="w-full">
              <AdvancedMathSearch onSearch={handleSearch} onSolve={handleSolveProblem} />
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Calculator className="h-6 w-6 lg:h-7 lg:w-7 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                    EasyCal Pro
                  </h1>
                  <AIStatusIndicator />
                </div>
                <p className="text-sm text-muted-foreground hidden md:block">Calculadora matemática profesional</p>
              </div>
            </div>

            {/* Barra de búsqueda central */}
            <div className="flex-1 max-w-xl lg:max-w-2xl mx-4 lg:mx-8">
              <AdvancedMathSearch onSearch={handleSearch} onSolve={handleSolveProblem} />
            </div>

            {/* Botones de usuario */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showStepSolver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
            <div className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-2xl font-bold">Solución Paso a Paso</h2>
                <Button variant="ghost" onClick={() => setShowStepSolver(false)} size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <StepByStepper expression={currentProblem} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showEnhancedOCR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
            <EnhancedMathOCR 
              onEquationDetected={(equation, confidence) => {
                setCurrentProblem(equation)
                setShowEnhancedOCR(false)
                setShowStepSolver(true)
              }}
              onClose={() => setShowEnhancedOCR(false)}
            />
          </div>
        </div>
      )}

      {showAIEnhancedOCR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
            <AIEnhancedOCR 
              onEquationDetected={(equation, confidence) => {
                setCurrentProblem(equation)
                setShowAIEnhancedOCR(false)
                setShowStepSolver(true)
              }}
              onClose={() => setShowAIEnhancedOCR(false)}
            />
          </div>
        </div>
      )}

      {activeSection === "home" ? (
        <main className="container mx-auto px-3 sm:px-6 py-6 sm:py-12">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Calculadora Matemática Profesional
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2">
              Herramientas avanzadas de cálculo con soluciones paso a paso y visualizaciones interactivas para estudiantes y profesionales.
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              <Badge className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-primary text-primary-foreground border-0 text-xs sm:text-sm">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                Soluciones Precisas
              </Badge>
              <Badge className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-secondary text-secondary-foreground border border-border text-xs sm:text-sm">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                Explicaciones Detalladas
              </Badge>
              <Badge className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-accent text-accent-foreground border border-border text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                Visualizaciones Avanzadas
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-16">
            {calculatorSections.map((section, index) => (
              <Card
                key={section.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-border bg-card hover:border-primary/20 overflow-hidden"
                onClick={() => setActiveSection(section.id)}
              >
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div
                      className={`p-2 sm:p-3 rounded-lg ${section.color} ${section.hoverColor} text-primary-foreground transition-all duration-300`}
                    >
                      <section.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground mb-1 sm:mb-2 leading-tight">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 font-medium text-sm"
                    size="sm"
                  >
                    <span className="hidden sm:inline">Abrir Calculadora</span>
                    <span className="sm:hidden">Abrir</span>
                    <section.icon className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-card rounded-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-16 border border-border">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-6 sm:mb-8 text-card-foreground">
              Herramientas Profesionales de Cálculo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-primary rounded-lg flex-shrink-0">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-base sm:text-lg mb-2 text-card-foreground">Soluciones Detalladas</h4>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Obtén explicaciones paso a paso para cada problema, con metodología clara y fundamentación matemática rigurosa.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-primary rounded-lg flex-shrink-0">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-base sm:text-lg mb-2 text-card-foreground">Visualización Avanzada</h4>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Gráficos interactivos y representaciones 3D que facilitan la comprensión de conceptos matemáticos complejos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado de APIs */}
          <div className="mb-16">
            <ApiStatus />
          </div>



          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-foreground">Herramientas Más Utilizadas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <Button variant="ghost" className="h-auto p-3 sm:p-4 text-left hover:bg-accent border border-border rounded-lg transition-all duration-200">
                <div>
                  <div className="font-medium text-foreground text-xs sm:text-sm">Calculadora de Álgebra</div>
                  <div className="text-xs text-muted-foreground mt-1">Ecuaciones y sistemas</div>
                </div>
              </Button>
              <Button variant="ghost" className="h-auto p-3 sm:p-4 text-left hover:bg-accent border border-border rounded-lg transition-all duration-200">
                <div>
                  <div className="font-medium text-foreground text-xs sm:text-sm">Calculadora de Derivadas</div>
                  <div className="text-xs text-muted-foreground mt-1">Derivación paso a paso</div>
                </div>
              </Button>
              <Button variant="ghost" className="h-auto p-3 sm:p-4 text-left hover:bg-accent border border-border rounded-lg transition-all duration-200">
                <div>
                  <div className="font-medium text-foreground text-xs sm:text-sm">Calculadora de Integrales</div>
                  <div className="text-xs text-muted-foreground mt-1">Integración definida</div>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="h-auto p-3 sm:p-4 text-left hover:bg-accent border border-border rounded-lg transition-all duration-200"
                onClick={() => setShowGroqVisionOCR(true)}
              >
                <div>
                  <div className="font-medium text-foreground text-xs sm:text-sm flex items-center gap-1">
                    Reconocer Ejercicios
                    <span className="text-purple-600">🤖</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Groq Vision IA Avanzada</div>
                </div>
              </Button>
            </div>
          </div>
        </main>
      ) : (
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="mb-4 sm:mb-6">
            <Button variant="outline" onClick={() => setActiveSection("home")} className="mb-3 sm:mb-4 border-border hover:bg-accent text-sm">
              ← Volver al inicio
            </Button>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">{calculatorSections.find((s) => s.id === activeSection)?.title}</h2>
          </div>
          <div className="overflow-x-auto">
            {renderActiveComponent()}
          </div>
        </main>
      )}

      {/* Modal de Groq Vision OCR */}
      {showGroqVisionOCR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
            <GroqVisionOCR
              onEquationDetected={(equation, confidence) => {
                setSearchQuery(equation)
                setShowGroqVisionOCR(false)
              }}
              onSolutionFound={handleGroqVisionSolution}
              onClose={() => setShowGroqVisionOCR(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de Solución Groq Vision */}
      {showGroqVisionSolution && groqVisionSolution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
            <GroqVisionSolution
              equation={groqVisionSolution.equation}
              steps={groqVisionSolution.steps}
              answer={groqVisionSolution.answer}
              onClose={() => setShowGroqVisionSolution(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}