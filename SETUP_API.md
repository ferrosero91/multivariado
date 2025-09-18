# 🚀 Configuración de APIs para EasyCal Pro

## 📋 Opciones de IA Disponibles

### 1. 🟢 Groq (Recomendado - Gratuito)

**Ventajas:**
- ✅ Completamente gratuito
- ✅ Muy rápido (inferencia ultra-rápida)
- ✅ Modelos potentes (Llama 3, Mixtral)
- ✅ Límite generoso: 6,000 tokens/minuto

**Pasos para configurar:**

1. **Crear cuenta:**
   - Ve a [console.groq.com](https://console.groq.com)
   - Regístrate con email o Google/GitHub
   - No requiere tarjeta de crédito

2. **Obtener API Key:**
   - En el dashboard, ve a "API Keys"
   - Clic en "Create API Key"
   - Nombra tu key: "EasyCal-Pro"
   - Copia el token (empieza con `gsk_...`)

3. **Configurar en la app:**
   - Abre el archivo `.env.local` en la raíz del proyecto
   - Reemplaza `tu_token_aqui` con tu token real:
   ```
   NEXT_PUBLIC_GROQ_API_KEY=gsk_tu_token_real_aqui
   ```

### 2. 🟡 OpenRouter (Alternativa gratuita)

**Ventajas:**
- ✅ Modelos gratuitos disponibles
- ✅ No requiere API key para modelos gratuitos
- ✅ Acceso a múltiples modelos

**Configuración:**
- No requiere configuración adicional
- Se usa automáticamente como fallback

### 3. 🟡 Hugging Face (Backup)

**Ventajas:**
- ✅ Completamente gratuito
- ✅ No requiere API key
- ⚠️ Más lento que Groq

**Configuración:**
- No requiere configuración
- Se usa como último recurso

## 🛠️ Configuración Paso a Paso

### Opción A: Con Groq (Recomendado)

1. **Crear cuenta en Groq:**
   ```bash
   # 1. Ve a: https://console.groq.com
   # 2. Regístrate gratis
   # 3. Ve a "API Keys" → "Create API Key"
   # 4. Copia tu token
   ```

2. **Configurar token:**
   ```bash
   # Edita .env.local
   NEXT_PUBLIC_GROQ_API_KEY=gsk_tu_token_aqui
   ```

3. **Reiniciar la aplicación:**
   ```bash
   # Detén el servidor (Ctrl+C)
   # Reinicia:
   pnpm dev
   ```

### Opción B: Solo APIs gratuitas (Sin registro)

1. **No hacer nada:**
   - La app funcionará automáticamente
   - Usará OpenRouter y Hugging Face
   - Menor calidad pero funcional

## 🔍 Verificar Configuración

1. **Abrir la consola del navegador** (F12)
2. **Buscar estos mensajes al cargar:**
   ```
   🤖 AI Math Solver initialized
   📡 Groq API: ✅ Configured  (si configuraste Groq)
   📡 Groq API: ❌ Not configured  (si no configuraste)
   ```

3. **Probar resolver un problema:**
   - Escribe: `x^2 + 2x + 1 = 0`
   - Clic en "Resolver Paso a Paso"
   - Verifica en consola:
     ```
     🚀 Using Groq API  (si tienes Groq)
     🔄 Using fallback methods  (si no tienes Groq)
     ```

## 🚨 Solución de Problemas

### Error: "Groq API error: 401"
- ❌ Token incorrecto o expirado
- ✅ Verifica que copiaste el token completo
- ✅ Regenera el token en Groq console

### Error: "Network error"
- ❌ Problema de conexión
- ✅ Verifica tu conexión a internet
- ✅ La app usará métodos de fallback automáticamente

### No se resuelven problemas
- ❌ Todas las APIs fallaron
- ✅ Verifica la consola del navegador
- ✅ La app mostrará soluciones básicas como fallback

## 📊 Límites de las APIs

| API | Límite | Costo | Calidad |
|-----|--------|-------|---------|
| Groq | 6K tokens/min | Gratis | ⭐⭐⭐⭐⭐ |
| OpenRouter | Varía | Gratis | ⭐⭐⭐⭐ |
| Hugging Face | Lento | Gratis | ⭐⭐⭐ |
| Fallback Local | Ilimitado | Gratis | ⭐⭐ |

## 🎯 Recomendación

**Para mejor experiencia:**
1. Configura Groq (5 minutos, gratis)
2. Disfruta de soluciones de alta calidad
3. Las otras APIs funcionan como backup automático

**Para uso básico:**
1. No configures nada
2. La app funcionará con APIs gratuitas
3. Calidad menor pero funcional