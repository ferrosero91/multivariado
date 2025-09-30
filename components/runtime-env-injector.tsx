// Función del servidor para crear las props
export function createRuntimeEnvProps() {
  console.log('🏗️ Creando props de runtime env en el servidor...')
  console.log('🌍 Entorno:', process.env.NODE_ENV)
  
  // Verificar todas las fuentes posibles
  const allEnvVars = {
    NEXT_PUBLIC_GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY,
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
    NEXT_PUBLIC_HUGGINGFACE_API_KEY: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY,
    NEXT_PUBLIC_OCR_SPACE_API_KEY: process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY || process.env.OCR_SPACE_API_KEY,
  }

  // Log detallado de cada variable
  Object.entries(allEnvVars).forEach(([key, value]) => {
    const publicKey = key
    const privateKey = key.replace('NEXT_PUBLIC_', '')
    
    console.log(`🔍 ${key}:`)
    console.log(`  - ${publicKey}: ${process.env[publicKey] ? '✅ Disponible' : '❌ No disponible'}`)
    console.log(`  - ${privateKey}: ${process.env[privateKey] ? '✅ Disponible' : '❌ No disponible'}`)
    console.log(`  - Valor final: ${value ? '✅ Disponible' : '❌ No disponible'}`)
  })

  // Filtrar solo las variables que tienen valores
  const envVars = Object.fromEntries(
    Object.entries(allEnvVars).filter(([key, value]) => value !== undefined && value !== '')
  )

  console.log('📦 Variables que se enviarán al cliente:', Object.keys(envVars))
  console.log('🔢 Total de variables:', Object.keys(envVars).length)

  return {
    env: envVars
  }
}