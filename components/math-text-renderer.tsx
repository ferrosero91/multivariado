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
        // Reemplazar símbolos matemáticos comunes
        .replace(/\*\*/g, '^')  // ** → ^
        .replace(/sqrt\(([^)]+)\)/g, '√($1)')  // sqrt(x) → √(x)
        .replace(/\^(\d+)/g, '⁽$1⁾')  // ^2 → ⁽²⁾
        .replace(/\^2/g, '²')   // ^2 → ²
        .replace(/\^3/g, '³')   // ^3 → ³
        .replace(/\^4/g, '⁴')   // ^4 → ⁴
        .replace(/\^5/g, '⁵')   // ^5 → ⁵
        .replace(/\+-/g, '±')   // +- → ±
        .replace(/->/g, '→')    // -> → →
        .replace(/lim/g, 'lím')  // lim → lím
        .replace(/integral/gi, '∫')  // integral → ∫
        .replace(/infinity/gi, '∞')  // infinity → ∞
        .replace(/alpha/gi, 'α')     // alpha → α
        .replace(/beta/gi, 'β')      // beta → β
        .replace(/gamma/gi, 'γ')     // gamma → γ
        .replace(/delta/gi, 'δ')     // delta → δ
        .replace(/theta/gi, 'θ')     // theta → θ
        .replace(/pi/gi, 'π')        // pi → π
        .replace(/lambda/gi, 'λ')    // lambda → λ
        .replace(/mu/gi, 'μ')        // mu → μ
        .replace(/sigma/gi, 'σ')     // sigma → σ
        // Mejorar notación de límites multivariados
        .replace(/\(x,y\)\s*→\s*\(0,0\)/g, '(x,y) → (0,0)')
        .replace(/\(x,y\)\s*->\s*\(0,0\)/g, '(x,y) → (0,0)')
        .replace(/\s+/g, ' ')  // Limpiar espacios múltiples
        .trim()
      
      // Detectar si es una expresión matemática (contiene símbolos matemáticos)
      const isMathExpression = /[∫√∞αβγδθπλμσ²³⁴⁵±→]|[\^\/\(\)\+\-\*=]|lím|límite/.test(processedLine)
      
      if (isMathExpression) {
        return (
          <div key={lineIndex} className="my-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
            <div className="font-mono text-lg text-blue-800 dark:text-blue-200 font-semibold">
              {processedLine}
            </div>
          </div>
        )
      } else {
        return (
          <div key={lineIndex} className="my-2 text-gray-700 dark:text-gray-300 leading-relaxed">
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
