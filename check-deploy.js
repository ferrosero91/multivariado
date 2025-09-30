#!/usr/bin/env node

/**
 * Script de verificación para despliegue en Render
 * Verifica que todos los archivos necesarios estén presentes y configurados correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para despliegue en Render...\n');

const checks = [
  {
    name: 'Dockerfile',
    path: './Dockerfile',
    required: true,
    description: 'Configuración de contenedor Docker'
  },
  {
    name: 'render.yaml',
    path: './render.yaml',
    required: true,
    description: 'Configuración de Render'
  },
  {
    name: 'next.config.mjs',
    path: './next.config.mjs',
    required: true,
    description: 'Configuración de Next.js',
    validate: (content) => {
      return content.includes("output: 'standalone'");
    },
    validationMessage: 'Debe contener output: "standalone"'
  },
  {
    name: 'package.json',
    path: './package.json',
    required: true,
    description: 'Dependencias del proyecto',
    validate: (content) => {
      const pkg = JSON.parse(content);
      return pkg.scripts && pkg.scripts.build && pkg.scripts.start;
    },
    validationMessage: 'Debe contener scripts "build" y "start"'
  },
  {
    name: '.dockerignore',
    path: './.dockerignore',
    required: true,
    description: 'Archivos ignorados por Docker'
  },
  {
    name: '.env.example',
    path: './.env.example',
    required: false,
    description: 'Ejemplo de variables de entorno'
  },
  {
    name: 'deploy-render.md',
    path: './deploy-render.md',
    required: false,
    description: 'Guía de despliegue'
  }
];

let allPassed = true;
let warnings = [];

console.log('📋 Verificando archivos necesarios:\n');

checks.forEach(check => {
  const exists = fs.existsSync(check.path);
  const status = exists ? '✅' : (check.required ? '❌' : '⚠️');
  
  console.log(`${status} ${check.name} - ${check.description}`);
  
  if (!exists && check.required) {
    allPassed = false;
    console.log(`   ❌ FALTA: ${check.path}`);
  } else if (!exists && !check.required) {
    warnings.push(`Archivo opcional faltante: ${check.path}`);
  } else if (exists && check.validate) {
    try {
      const content = fs.readFileSync(check.path, 'utf8');
      if (!check.validate(content)) {
        allPassed = false;
        console.log(`   ❌ VALIDACIÓN FALLÓ: ${check.validationMessage}`);
      } else {
        console.log(`   ✅ Validación pasada`);
      }
    } catch (error) {
      allPassed = false;
      console.log(`   ❌ ERROR leyendo archivo: ${error.message}`);
    }
  }
});

console.log('\n🔧 Verificando configuración de Next.js:\n');

// Verificar next.config.mjs específicamente
try {
  const nextConfigPath = './next.config.mjs';
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (content.includes("output: 'standalone'")) {
      console.log('✅ Output standalone configurado');
    } else {
      console.log('❌ Output standalone NO configurado');
      allPassed = false;
    }
    
    if (content.includes('env:')) {
      console.log('✅ Variables de entorno configuradas');
    } else {
      console.log('⚠️ Variables de entorno no encontradas en next.config.mjs');
      warnings.push('Considera agregar variables de entorno en next.config.mjs');
    }
  }
} catch (error) {
  console.log(`❌ Error verificando next.config.mjs: ${error.message}`);
  allPassed = false;
}

console.log('\n📦 Verificando package.json:\n');

try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  // Verificar scripts necesarios
  const requiredScripts = ['build', 'start', 'dev'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ Script "${script}" encontrado`);
    } else {
      console.log(`❌ Script "${script}" faltante`);
      allPassed = false;
    }
  });
  
  // Verificar dependencias críticas
  const criticalDeps = ['next', 'react', 'react-dom'];
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ Dependencia "${dep}" encontrada`);
    } else {
      console.log(`❌ Dependencia crítica "${dep}" faltante`);
      allPassed = false;
    }
  });
  
} catch (error) {
  console.log(`❌ Error leyendo package.json: ${error.message}`);
  allPassed = false;
}

console.log('\n🐳 Verificando configuración de Docker:\n');

try {
  const dockerfilePath = './Dockerfile';
  if (fs.existsSync(dockerfilePath)) {
    const content = fs.readFileSync(dockerfilePath, 'utf8');
    
    if (content.includes('FROM node:')) {
      console.log('✅ Imagen base de Node.js configurada');
    } else {
      console.log('❌ Imagen base de Node.js no encontrada');
      allPassed = false;
    }
    
    if (content.includes('EXPOSE 3000')) {
      console.log('✅ Puerto 3000 expuesto');
    } else {
      console.log('⚠️ Puerto 3000 no explícitamente expuesto');
      warnings.push('Considera agregar EXPOSE 3000 en Dockerfile');
    }
    
    if (content.includes('multi-stage') || content.includes('AS deps')) {
      console.log('✅ Build multi-stage detectado');
    } else {
      console.log('⚠️ Build multi-stage no detectado');
      warnings.push('Considera usar multi-stage build para optimizar imagen');
    }
  }
} catch (error) {
  console.log(`❌ Error verificando Dockerfile: ${error.message}`);
  allPassed = false;
}

// Resumen final
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(50));

if (allPassed) {
  console.log('🎉 ¡TODAS LAS VERIFICACIONES PASARON!');
  console.log('✅ Tu proyecto está listo para desplegar en Render');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Sube tu código a GitHub/GitLab');
  console.log('2. Conecta el repositorio a Render');
  console.log('3. Configura las variables de entorno en Render');
  console.log('4. ¡Despliega!');
} else {
  console.log('❌ ALGUNAS VERIFICACIONES FALLARON');
  console.log('🔧 Corrige los errores antes de desplegar');
}

if (warnings.length > 0) {
  console.log('\n⚠️ ADVERTENCIAS:');
  warnings.forEach(warning => {
    console.log(`   • ${warning}`);
  });
}

console.log('\n📚 Para más información, consulta: deploy-render.md');
console.log('🌐 Dashboard de Render: https://dashboard.render.com');

process.exit(allPassed ? 0 : 1);