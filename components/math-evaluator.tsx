"use client"

export class MathEvaluator {
  private static instance: MathEvaluator

  public static getInstance(): MathEvaluator {
    if (!MathEvaluator.instance) {
      MathEvaluator.instance = new MathEvaluator()
    }
    return MathEvaluator.instance
  }

  public evaluate(expression: string, x: number): number {
    try {
      // Limpiar y preparar la expresión
      let expr = expression.toLowerCase().trim()

      // Reemplazar funciones matemáticas comunes
      const replacements = [
        [/\bx\b/g, `(${x})`],
        [/\^/g, "**"],
        [/sin\(/g, "Math.sin("],
        [/cos\(/g, "Math.cos("],
        [/tan\(/g, "Math.tan("],
        [/ln\(/g, "Math.log("],
        [/log\(/g, "Math.log10("],
        [/sqrt\(/g, "Math.sqrt("],
        [/abs\(/g, "Math.abs("],
        [/exp\(/g, "Math.exp("],
        [/\bpi\b/g, "Math.PI"],
        [/\be\b/g, "Math.E"],
        // Multiplicación implícita
        [/(\d)([a-zA-Z])/g, "$1*$2"],
        [/([a-zA-Z])(\d)/g, "$1*$2"],
        [/\)(\d)/g, ")*$1"],
        [/(\d)\(/g, "$1*("],
      ]

      for (const [pattern, replacement] of replacements) {
        expr = expr.replace(pattern as RegExp, replacement as string)
      }

      // Validar caracteres permitidos
      if (!/^[0-9+\-*/().Math\s\w]+$/.test(expr)) {
        throw new Error("Expresión contiene caracteres no válidos")
      }

      // Evaluar usando Function constructor (más seguro que eval)
      const result = new Function("Math", `"use strict"; return (${expr})`)(Math)

      if (typeof result !== "number") {
        throw new Error("El resultado no es un número")
      }

      return result
    } catch (error) {
      console.warn(`Error evaluating expression "${expression}" at x=${x}:`, error)
      return Number.NaN
    }
  }

  public derivative(expression: string, x: number, h = 0.0001): number {
    try {
      const f1 = this.evaluate(expression, x + h)
      const f2 = this.evaluate(expression, x - h)

      if (!isFinite(f1) || !isFinite(f2)) {
        return Number.NaN
      }

      return (f1 - f2) / (2 * h)
    } catch (error) {
      return Number.NaN
    }
  }

  public findCriticalPoints(
    expression: string,
    xRange: [number, number],
  ): Array<{ x: number; y: number; type: string }> {
    const points: Array<{ x: number; y: number; type: string }> = []
    const step = (xRange[1] - xRange[0]) / 1000

    for (let x = xRange[0]; x <= xRange[1]; x += step) {
      const derivative = this.derivative(expression, x)

      if (Math.abs(derivative) < 0.01) {
        // Cerca de cero
        const y = this.evaluate(expression, x)
        if (isFinite(y)) {
          // Determinar tipo de punto crítico
          const secondDerivative = this.derivative(expression, x + 0.001) - this.derivative(expression, x - 0.001)
          let type = "Crítico"
          if (secondDerivative > 0) type = "Mínimo"
          else if (secondDerivative < 0) type = "Máximo"

          points.push({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), type })
        }
      }
    }

    // Eliminar puntos duplicados
    return points.filter((point, index, arr) => index === arr.findIndex((p) => Math.abs(p.x - point.x) < 0.1))
  }
}

export default MathEvaluator
