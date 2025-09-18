"use client"

import { create, all } from "mathjs"

// Crear instancia de mathjs con todas las funciones
const math = create(all)

export class AdvancedMathEngine {
  static evaluateExpression(expression: string, variables: Record<string, number> = {}): number {
    try {
      // Reemplazar variables en la expresión
      let processedExpr = expression
      Object.entries(variables).forEach(([variable, value]) => {
        const regex = new RegExp(`\\b${variable}\\b`, "g")
        processedExpr = processedExpr.replace(regex, value.toString())
      })

      // Evaluar usando mathjs
      const result = math.evaluate(processedExpr)
      return typeof result === "number" ? result : Number.NaN
    } catch (error) {
      console.error("[v0] Error evaluating expression:", error)
      return Number.NaN
    }
  }

  static derivative(expression: string, variable = "x"): string {
    try {
      const expr = math.parse(expression)
      const derivative = math.derivative(expr, variable)
      return derivative.toString()
    } catch (error) {
      console.error("[v0] Error calculating derivative:", error)
      return "Error en derivada"
    }
  }

  static integral(expression: string, variable = "x"): string {
    try {
      // Integrales básicas usando patrones conocidos
      const patterns = [
        {
          pattern: /^x\^(\d+)$/,
          integral: (match: RegExpMatchArray) => `x^${Number.parseInt(match[1]) + 1}/${Number.parseInt(match[1]) + 1}`,
        },
        {
          pattern: /^(\d+)\*x\^(\d+)$/,
          integral: (match: RegExpMatchArray) =>
            `${match[1]}*x^${Number.parseInt(match[2]) + 1}/${Number.parseInt(match[2]) + 1}`,
        },
        { pattern: /^sin$$x$$$/, integral: () => "-cos(x)" },
        { pattern: /^cos$$x$$$/, integral: () => "sin(x)" },
        { pattern: /^e\^x$/, integral: () => "e^x" },
        { pattern: /^1\/x$/, integral: () => "ln(|x|)" },
      ]

      for (const { pattern, integral } of patterns) {
        const match = expression.match(pattern)
        if (match) {
          return integral(match) + " + C"
        }
      }

      return `∫(${expression}) dx`
    } catch (error) {
      console.error("[v0] Error calculating integral:", error)
      return "Error en integral"
    }
  }

  static generatePlotData(
    expression: string,
    xRange: [number, number],
    numPoints = 400,
  ): Array<{ x: number; y: number }> {
    const data: Array<{ x: number; y: number }> = []
    const step = (xRange[1] - xRange[0]) / (numPoints - 1)

    console.log("[v0] Generating plot data for expression:", expression)

    for (let i = 0; i < numPoints; i++) {
      const x = xRange[0] + i * step
      const y = this.evaluateExpression(expression, { x })

      if (isFinite(y) && Math.abs(y) < 1000) {
        data.push({ x, y })
      }
    }

    console.log("[v0] Generated", data.length, "plot points")
    return data
  }

  static generate3DPlotData(
    expression: string,
    xRange: [number, number],
    yRange: [number, number],
    resolution = 30,
  ): Array<Array<number>> {
    const data: Array<Array<number>> = []
    const xStep = (xRange[1] - xRange[0]) / (resolution - 1)
    const yStep = (yRange[1] - yRange[0]) / (resolution - 1)

    console.log("[v0] Generating 3D plot data for expression:", expression)

    for (let i = 0; i < resolution; i++) {
      const row: Array<number> = []
      for (let j = 0; j < resolution; j++) {
        const x = xRange[0] + i * xStep
        const y = yRange[0] + j * yStep
        const z = this.evaluateExpression(expression, { x, y })

        row.push(isFinite(z) ? z : 0)
      }
      data.push(row)
    }

    console.log("[v0] Generated 3D surface with", resolution, "x", resolution, "points")
    return data
  }

  static findCriticalPoints(
    expression: string,
    xRange: [number, number],
  ): Array<{ x: number; y: number; type: string }> {
    const criticalPoints: Array<{ x: number; y: number; type: string }> = []
    const derivative = this.derivative(expression)

    // Buscar puntos donde la derivada es aproximadamente cero
    const step = (xRange[1] - xRange[0]) / 1000
    for (let x = xRange[0]; x <= xRange[1]; x += step) {
      const derivValue = this.evaluateExpression(derivative, { x })
      if (Math.abs(derivValue) < 0.01) {
        const y = this.evaluateExpression(expression, { x })
        if (isFinite(y)) {
          criticalPoints.push({ x, y, type: "critical" })
        }
      }
    }

    return criticalPoints
  }
}
