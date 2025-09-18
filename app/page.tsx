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


export default function SymbolabInspiredApp() {
  const [activeSection, setActiveSection] = useState("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [showStepSolver, setShowStepSolver] = useState(false)
  const [currentProblem, setCurrentProblem] = useState("")

  const calculatorSections = [
    {
      id: "differential",
      title: "Cálculo Diferencial",
      description: "Derivadas, límites y análisis de funciones",
      icon: FunctionSquare,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      component: DifferentialCalculus,
    },
    {
      id: "integral",
      title: "Cálculo Integral",
      description: "Integrales definidas e indefinidas",
      icon: Integral,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      hoverColor: "hover:from-emerald-600 hover:to-emerald-700",
      component: IntegralCalculus,
    },
    {
      id: "multivariable",
      title: "Cálculo Multivariable",
      description: "Funciones de varias variables y superficies 3D",
      icon: Calculator,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
      component: MultivariableCalculus,
    },
    {
      id: "differential-equations",
      title: "Ecuaciones Diferenciales",
      description: "Solución de ecuaciones diferenciales ordinarias",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
      component: DifferentialEquations,
    },
    {
      id: "geometry",
      title: "Geometría",
      description: "Cálculos geométricos y trigonométricos",
      icon: Shapes,
      color: "bg-gradient-to-br from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
      component: GeometryCalculator,
    },
    {
      id: "statistics",
      title: "Estadística",
      description: "Análisis estadístico y probabilidad",
      icon: BarChart3,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      hoverColor: "hover:from-indigo-600 hover:to-indigo-700",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900">
      <header className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                <Calculator className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">
                    EasyCal Pro
                  </h1>
                  <AIStatusIndicator />
                </div>
                <p className="text-sm text-blue-100">Calculadora matemática de IA</p>
              </div>
            </div>

            {/* Barra de búsqueda central */}
            <div className="flex-1 max-w-2xl mx-8">
              <AdvancedMathSearch onSearch={handleSearch} onSolve={handleSolveProblem} />
            </div>

            {/* Botones de usuario */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 border border-white/30 rounded-lg">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 border border-white/30 rounded-lg">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showStepSolver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Solución Paso a Paso</h2>
                <Button variant="ghost" onClick={() => setShowStepSolver(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <StepByStepper expression={currentProblem} />
            </div>
          </div>
        </div>
      )}

      {activeSection === "home" ? (
        <main className="container mx-auto px-6 py-12">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Resuelve matemáticas con IA
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Desde álgebra básica hasta cálculo multivariable, obtén soluciones paso a paso con visualizaciones 3D interactivas.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <Zap className="h-4 w-4" />
                Soluciones Instantáneas
              </Badge>
              <Badge className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <BookOpen className="h-4 w-4" />
                Pasos Detallados
              </Badge>
              <Badge className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
                <BarChart3 className="h-4 w-4" />
                Gráficas 3D Interactivas
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {calculatorSections.map((section, index) => (
              <Card
                key={section.id}
                className="group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 cursor-pointer border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:scale-105 overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setActiveSection(section.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/30 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="pb-6 relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`p-4 rounded-2xl ${section.color} ${section.hoverColor} text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
                    >
                      <section.icon className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 mb-2">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold py-3"
                  >
                    Abrir Calculadora
                    <section.icon className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-gradient-to-r from-white via-purple-50 to-blue-50 dark:from-slate-800 dark:via-purple-900/20 dark:to-blue-900/20 rounded-3xl p-12 mb-16 shadow-2xl border border-purple-100 dark:border-slate-600">
            <h3 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Potencia tu aprendizaje matemático
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-3 text-slate-800 dark:text-white">Practica Inteligente</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Ejercicios adaptativos con retroalimentación instantánea. Nuestro sistema de IA identifica tus áreas de mejora 
                    y personaliza el contenido para maximizar tu aprendizaje.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-3 text-slate-800 dark:text-white">Comprende Visualmente</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Visualizaciones 3D interactivas, gráficos dinámicos y explicaciones paso a paso que transforman 
                    conceptos abstractos en experiencias comprensibles.
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
            <h3 className="text-2xl font-bold mb-8 text-slate-800 dark:text-white">Calculadoras más populares</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="ghost" className="h-auto p-4 text-left hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-900/20 border border-transparent rounded-lg transition-all duration-200">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white">Calculadora de Álgebra</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ecuaciones y sistemas</div>
                </div>
              </Button>
              <Button variant="ghost" className="h-auto p-4 text-left hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 border border-transparent rounded-lg transition-all duration-200">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white">Calculadora de Derivadas</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Derivación paso a paso</div>
                </div>
              </Button>
              <Button variant="ghost" className="h-auto p-4 text-left hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 border border-transparent rounded-lg transition-all duration-200">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white">Calculadora de Integrales</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Integración definida</div>
                </div>
              </Button>
              <Button variant="ghost" className="h-auto p-4 text-left hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-900/20 border border-transparent rounded-lg transition-all duration-200">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white">Calculadora de Matrices</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Operaciones matriciales</div>
                </div>
              </Button>
            </div>
          </div>
        </main>
      ) : (
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setActiveSection("home")} className="mb-4">
              ← Volver al inicio
            </Button>
            <h2 className="text-3xl font-bold">{calculatorSections.find((s) => s.id === activeSection)?.title}</h2>
          </div>
          {renderActiveComponent()}
        </main>
      )}
    </div>
  )
}