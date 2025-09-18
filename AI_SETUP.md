# 🤖 Configuración del Sistema Multi-IA

EasyCal Pro utiliza un sistema inteligente de múltiples IAs con fallback automático para resolver problemas matemáticos. Si una IA falla, el sistema automáticamente prueba la siguiente.

## 🚀 Proveedores de IA Disponibles

### 1. **Groq** (Recomendado) ⚡
- **Velocidad**: Ultra-rápido (< 1 segundo)
- **Precisión**: Muy alta
- **Modelos**: Llama 3.1, Llama 3.2, Gemma 2
- **Costo**: Gratuito con límites generosos
- **Setup**: Requiere API key

**Cómo obtener API key:**
1. Ve a [console.groq.com](https://console.groq.com/)
2. Crea una cuenta gratuita
3. Ve a "API Keys" y crea una nueva key
4. Agrega `NEXT_PUBLIC_GROQ_API_KEY=gsk_tu_key_aqui` a tu `.env.local`

### 2. **OpenRouter** 🌐
- **Velocidad**: Rápido
- **Precisión**: Alta
- **Modelos**: Llama 3.2, Phi-3, Gemma 2, Qwen 2
- **Costo**: Modelos gratuitos disponibles
- **Setup**: Opcional (funciona sin API key)

**Cómo obtener API key (opcional):**
1. Ve a [openrouter.ai](https://openrouter.ai/)
2. Crea una cuenta
3. Ve a "Keys" y crea una nueva key
4. Agrega `NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-tu_key_aqui` a tu `.env.local`

### 3. **Hugging Face** 🤗
- **Velocidad**: Moderado
- **Precisión**: Buena
- **Modelos**: DialoGPT, BlenderBot, FLAN-T5
- **Costo**: Gratuito
- **Setup**: Opcional (funciona sin API key)

**Cómo obtener token (opcional):**
1. Ve a [huggingface.co](https://huggingface.co/)
2. Crea una cuenta
3. Ve a Settings > Access Tokens
4. Crea un token de lectura
5. Agrega `NEXT_PUBLIC_HUGGINGFACE_API_KEY=hf_tu_token_aqui` a tu `.env.local`

### 4. **Cohere** 🔮
- **Velocidad**: Rápido
- **Precisión**: Buena
- **Modelos**: Command Light
- **Costo**: Tier gratuito disponible
- **Setup**: Automático (usa demo key)

### 5. **Ollama Local** 🏠
- **Velocidad**: Depende del hardware
- **Precisión**: Alta
- **Modelos**: Llama 3.2, Mistral, CodeLlama
- **Costo**: Completamente gratuito
- **Setup**: Requiere instalación local

**Cómo instalar Ollama:**
1. Ve a [ollama.ai](https://ollama.ai/)
2. Descarga e instala Ollama
3. Ejecuta: `ollama pull llama3.2:3b`
4. Inicia el servidor: `ollama serve`

### 6. **Local Fallback** 🛠️
- **Velocidad**: Instantáneo
- **Precisión**: Básica
- **Modelos**: Lógica matemática integrada
- **Costo**: Gratuito
- **Setup**: Siempre disponible

## ⚙️ Configuración Rápida

### Opción 1: Solo Groq (Recomendado)
```bash
# .env.local
NEXT_PUBLIC_GROQ_API_KEY=gsk_tu_groq_key_aqui
```

### Opción 2: Configuración Completa
```bash
# .env.local
NEXT_PUBLIC_GROQ_API_KEY=gsk_tu_groq_key_aqui
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-tu_openrouter_key_aqui
NEXT_PUBLIC_HUGGINGFACE_API_KEY=hf_tu_huggingface_token_aqui
```

### Opción 3: Sin API Keys (Solo gratuito)
No necesitas configurar nada. El sistema usará:
- OpenRouter (modelos gratuitos)
- Hugging Face (API gratuita)
- Cohere (demo key)
- Local Fallback

## 🔄 Cómo Funciona el Sistema de Fallback

1. **Prioridad 1**: Groq (si está configurado)
2. **Prioridad 2**: OpenRouter (modelos gratuitos)
3. **Prioridad 3**: Hugging Face (API gratuita)
4. **Prioridad 4**: Cohere (demo key)
5. **Prioridad 5**: Ollama Local (si está instalado)
6. **Prioridad 6**: Local Fallback (siempre disponible)

Si una IA falla por cualquier motivo (límite de rate, servidor caído, etc.), el sistema automáticamente prueba la siguiente en 15 segundos o menos.

## 📊 Monitoreo del Estado

La aplicación incluye un indicador de estado que muestra:
- ✅ Qué proveedores están disponibles
- ❌ Qué proveedores están caídos
- 🔄 Verificación automática cada 5 minutos
- 📈 Prioridad de cada proveedor

## 🚨 Solución de Problemas

### "Todas las IAs fallaron"
- Verifica tu conexión a internet
- Revisa que las API keys sean correctas
- El sistema siempre tiene Local Fallback como respaldo

### "Respuestas de baja calidad"
- Groq generalmente da las mejores respuestas
- OpenRouter es buena alternativa
- Local Fallback es básico pero siempre funciona

### "Muy lento"
- Groq es el más rápido (< 1 segundo)
- Hugging Face puede ser lento en primera carga
- Ollama Local depende de tu hardware

## 💡 Consejos

1. **Para mejor rendimiento**: Configura Groq
2. **Para máxima disponibilidad**: Configura múltiples proveedores
3. **Para uso offline**: Instala Ollama Local
4. **Para desarrollo**: OpenRouter funciona sin API key

## 🔧 Desarrollo

Para agregar un nuevo proveedor de IA:

1. Agrega el proveedor en `lib/ai-solver.ts`
2. Implementa el método `solveWith[Provider]`
3. Agrega el proveedor al array en `initializeProviders()`
4. Actualiza el componente `AIStatusIndicator`

¡El sistema automáticamente lo incluirá en el fallback!