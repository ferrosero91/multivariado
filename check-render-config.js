#!/usr/bin/env node

/**
 * Script de verificación para configuración de Render
 * Ejecutar con: node check-render-config.js
 */

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN PARA RENDER\n')

// 1. Verificar variables de entorno
console.log('📋 1. VARIABLES DE ENTORNO:')
const requiredEnvVars = [
  'NODE_ENV',
  'NEXT_TELEMETRY_DISABLED',
  'PORT',
  'HOSTNAME'
]

const optionalEnvVars = [
  'NEXT_PUBLIC_GROQ_API_KEY',
  'NEXT_PUBLIC_OPENROUTER_API_KEY', 
  'NEXT_PUBLIC_HUGGINGFACE_API_KEY',
  'NEXT_PUBLIC_OCR_SPACE_API_KEY'
]

console.log('\n  Variables del sistema (obligatorias):')
requiredEnvVars.forEach(key => {
  const value = process.env[key]
  const status = value ? '✅' : '❌'
  console.log(`    ${status} ${key}: ${value || 'NO CONFIGURADA'}`)
})

console.log('\n  Variables de API (opcionales):')
optionalEnvVars.forEach(key => {
  const value = process.env[key]
  const status = value ? '✅' : '⚠️'
  console.log(`    ${status} ${key}: ${value ? 'CONFIGURADA' : 'NO CONFIGURADA'}`)
})

// 2. Verificar archivos de configuración
console.log('\n📁 2. ARCHIVOS DE CONFIGURACIÓN:')
const fs = require('fs')
const path = require('path')

const configFiles = [
  'Dockerfile',
  'render.yaml',
  'next.config.mjs',
  'package.json'
]

configFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file))
  const status = exists ? '✅' : '❌'
  console.log(`    ${status} ${file}`)
})

// 3. Verificar configuración de Next.js
console.log('\n⚙️ 3. CONFIGURACIÓN DE NEXT.JS:')
try {
  const nextConfigPath = path.join(process.cwd(), 'next.config.mjs')
  if (fs.existsSync(nextConfigPath)) {
    const configContent = fs.readFileSync(nextConfigPath, 'utf8')
    const hasStandalone = configContent.includes("output: 'standalone'")
    const hasEnvConfig = configContent.includes('env:')
    
    console.log(`    ${hasStandalone ? '✅' : '❌'} Output standalone configurado`)
    console.log(`    ${hasEnvConfig ? '✅' : '⚠️'} Variables env configuradas`)
  }
} catch (error) {
  console.log('    ❌ Error leyendo next.config.mjs')
}

// 4. Verificar package.json
console.log('\n📦 4. SCRIPTS DE PACKAGE.JSON:')
try {
  const packagePath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  const requiredScripts = ['build', 'start', 'dev']
  requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script]
    const status = exists ? '✅' : '❌'
    console.log(`    ${status} ${script}: ${exists || 'NO DEFINIDO'}`)
  })
} catch (error) {
  console.log('    ❌ Error leyendo package.json')
}

// 5. Verificar Dockerfile
console.log('\n🐳 5. CONFIGURACIÓN DE DOCKER:')
try {
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile')
  if (fs.existsSync(dockerfilePath)) {
    const dockerContent = fs.readFileSync(dockerfilePath, 'utf8')
    const hasMultiStage = dockerContent.includes('FROM node:18-alpine AS')
    const hasStandalone = dockerContent.includes('.next/standalone')
    const hasPort3000 = dockerContent.includes('EXPOSE 3000')
    const hasNodeCmd = dockerContent.includes('CMD ["node", "server.js"]')
    
    console.log(`    ${hasMultiStage ? '✅' : '❌'} Multi-stage build`)
    console.log(`    ${hasStandalone ? '✅' : '❌'} Standalone output`)
    console.log(`    ${hasPort3000 ? '✅' : '❌'} Puerto 3000 expuesto`)
    console.log(`    ${hasNodeCmd ? '✅' : '❌'} Comando de inicio correcto`)
  }
} catch (error) {
  console.log('    ❌ Error leyendo Dockerfile')
}

// 6. Recomendaciones para Render
console.log('\n💡 6. RECOMENDACIONES PARA RENDER:')
console.log('    📌 Configurar variables de entorno en Render Dashboard')
console.log('    📌 Usar plan Free o superior')
console.log('    📌 Verificar que el repositorio esté conectado')
console.log('    📌 Revisar logs de build en Render Dashboard')
console.log('    📌 Verificar que el dominio esté configurado correctamente')

console.log('\n🔗 ENLACES ÚTILES:')
console.log('    • Render Dashboard: https://dashboard.render.com')
console.log('    • Documentación: https://render.com/docs')
console.log('    • Logs de build: https://dashboard.render.com/web/[tu-servicio]/logs')

console.log('\n✨ Verificación completada!')