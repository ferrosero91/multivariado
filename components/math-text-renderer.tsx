"use client"

import React from "react"

interface MathTextRendererProps {
  text: string
  className?: string
}

export default function MathTextRenderer({ text, className = "" }: MathTextRendererProps) {
  // Función para procesar texto matemático y hacerlo más legible
  const processText = (text: string): JSX.Element[] => {
    const lines = text.split('\n')
    
    return lines.map((line, lineIndex) => {
      if (!line.trim()) return <br key={lineIndex} />
      
      // Procesar la línea para encontrar expresiones matemáticas
      let processedLine = line
        // Procesar LaTeX básico
        .replace(/\$([^$]+)\$/g, '$1')  // Remover $ de LaTeX para mostrar contenido
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')  // \frac{a}{b} → (a)/(b)
        .replace(/\\\{/g, '{')  // \{ → {
        .replace(/\\\}/g, '}')  // \} → }
        .replace(/\\,/g, ' ')   // \, → espacio
        .replace(/\\ /g, ' ')   // \ → espacio
        .replace(/\\cdot/g, '·')  // \cdot → ·
        .replace(/\\times/g, '×')  // \times → ×
        .replace(/\\div/g, '÷')    // \div → ÷
        .replace(/\\pm/g, '±')     // \pm → ±
        .replace(/\\mp/g, '∓')     // \mp → ∓
        .replace(/\\infty/g, '∞')  // \infty → ∞
        .replace(/\\int/g, '∫')    // \int → ∫
        .replace(/\\sum/g, '∑')    // \sum → ∑
        .replace(/\\prod/g, '∏')   // \prod → ∏
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')  // \sqrt{x} → √(x)
        .replace(/\\mu/g, 'μ')     // \mu → μ
        .replace(/\\alpha/g, 'α')  // \alpha → α
        .replace(/\\beta/g, 'β')   // \beta → β
        .replace(/\\gamma/g, 'γ')  // \gamma → γ
        .replace(/\\delta/g, 'δ')  // \delta → δ
        .replace(/\\theta/g, 'θ')  // \theta → θ
        .replace(/\\pi/g, 'π')     // \pi → π
        .replace(/\\lambda/g, 'λ') // \lambda → λ
        .replace(/\\sigma/g, 'σ')  // \sigma → σ
        // Procesar exponentes LaTeX
        .replace(/\^\{\\frac\{([^}]+)\}\{([^}]+)\}\}/g, '^(($1)/($2))')  // ^{\frac{a}{b}} → ^((a)/(b))
        .replace(/\^\{([^}]+)\}/g, '^($1)')  // ^{expr} → ^(expr)
        .replace(/_\{([^}]+)\}/g, '_($1)')   // _{expr} → _(expr)
        // Reemplazar símbolos matemáticos comunes
        .replace(/\*\*/g, '^')  // ** → ^
        .replace(/sqrt\(([^)]+)\)/g, '√($1)')  // sqrt(x) → √(x)
        .replace(/\^2/g, '²')   // ^2 → ²
        .replace(/\^3/g, '³')   // ^3 → ³
        .replace(/\^4/g, '⁴')   // ^4 → ⁴
        .replace(/\^5/g, '⁵')   // ^5 → ⁵
        .replace(/\+-/g, '±')   // +- → ±
        .replace(/->/g, '→')    // -> → →
        .replace(/lim/g, 'lím')  // lim → lím
        .replace(/integral/gi, '∫')  // integral → ∫
        .replace(/infinity/gi, '∞')  // infinity → ∞
        // Mejorar notación de límites multivariados
        .replace(/\(x,y\)\s*→\s*\(0,0\)/g, '(x,y) → (0,0)')
        .replace(/\(x,y\)\s*->\s*\(0,0\)/g, '(x,y) → (0,0)')
        .replace(/\s+/g, ' ')  // Limpiar espacios múltiples
        .trim()
      
      // Detectar si es una expresión matemática (contiene símbolos matemáticos)
      const isMathExpression = /[∫√∞αβγδθπλμσ²³⁴⁵±→∑∏×÷·]|[\^\/\(\)\+\-\*=]|lím|límite|frac|cdot/.test(processedLine)
      
      if (isMathExpression) {
        return (
          <div key={lineIndex} className="my-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="font-mono text-lg text-blue-900 dark:text-blue-100 font-semibold text-center">
              {processedLine}
            </div>
          </div>
        )
      } else {
        return (
          <div key={lineIndex} className="my-2 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
            {processedLine}
          </div>
        )
      }
    })
  }

  const processedContent = processText(text)

  return (
    <div className={`${className}`}>
      {processedContent}
    </div>
  )
}
