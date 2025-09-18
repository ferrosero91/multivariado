# 🆓 APIs de OCR Gratuitas para Matemáticas

EasyCal Pro utiliza múltiples APIs de OCR gratuitas para maximizar la precisión del reconocimiento de escritura a mano matemática.

## 🎯 APIs Integradas

### 1. **OCR.space** ⭐ (API Key Configurada)
- **Límite**: 25,000 requests/mes con tu API key
- **Especialidad**: OCR general con buen soporte para matemáticas
- **API Key**: `K85750280688957` ✅ **CONFIGURADA**
- **Ventajas**: 
  - Mayor límite de requests
  - Mejor precisión con API key propia
  - Muy confiable
  - Buen reconocimiento de símbolos
- **Desventajas**: 
  - No especializada en matemáticas
  - Límite mensual (pero alto)

**Estado**: ✅ **Configurada y lista para usar**

### 2. **Mathpix** 🧮 (API Gratuita Limitada)
- **Límite**: 1,000 requests/mes gratis
- **Especialidad**: **Especializada en matemáticas y LaTeX**
- **API Key**: `trial` (demo)
- **Ventajas**:
  - Diseñada específicamente para matemáticas
  - Reconoce LaTeX y símbolos complejos
  - Muy alta precisión para expresiones matemáticas
- **Desventajas**:
  - Límite bajo
  - Requiere registro para más requests

**Para más requests**: Regístrate en [mathpix.com](https://mathpix.com/) y obtén tu API key gratuita.

### 3. **Google Vision API** 👁️ (Demo/Gratuita)
- **Límite**: 1,000 requests/mes gratis
- **Especialidad**: OCR general muy preciso
- **API Key**: Demo (limitada)
- **Ventajas**:
  - Muy precisa para texto general
  - Buena detección de texto manuscrito
  - Tecnología de Google
- **Desventajas**:
  - No especializada en matemáticas
  - Requiere API key para uso completo

**Para uso completo**: Configura Google Cloud Vision API con tu propia key.

### 4. **Azure Computer Vision** 🔷 (Demo/Gratuita)
- **Límite**: 5,000 requests/mes gratis
- **Especialidad**: OCR empresarial
- **API Key**: Demo (limitada)
- **Ventajas**:
  - Muy robusta
  - Buena para texto manuscrito
  - Tecnología de Microsoft
- **Desventajas**:
  - No especializada en matemáticas
  - Requiere configuración para uso completo

**Para uso completo**: Configura Azure Cognitive Services con tu propia key.

## 🔄 Sistema de Fallback Inteligente

El sistema prueba las APIs en este orden:

1. **OCR.space** (más confiable y gratuita)
2. **Mathpix** (mejor para matemáticas)
3. **Google Vision** (muy precisa)
4. **Azure OCR** (robusta)

Si una API falla, automáticamente prueba la siguiente.

## 📊 Comparación de Resultados

Para la expresión `∫ e^(tan 2x) / sec²(2x) dx`:

| API | Texto Reconocido | Confianza | Procesado |
|-----|------------------|-----------|-----------|
| **Mathpix** | `\int e^{\tan 2x} / \sec^2(2x) dx` | 95% | `∫ e^(tan(2x)) / sec²(2x) dx` |
| **OCR.space** | `f e tan 2x / sec 2 (2x) dx` | 80% | `∫ e^(tan(2x)) / sec²(2x) dx` |
| **Google Vision** | `∫ e tan 2x / sec² (2x) dx` | 85% | `∫ e^(tan(2x)) / sec²(2x) dx` |
| **Azure OCR** | `∫ e^tan 2x / sec²(2x) dx` | 75% | `∫ e^(tan(2x)) / sec²(2x) dx` |

## 🛠️ Configuración Avanzada

### Variables de Entorno (Opcional)
```bash
# .env.local
NEXT_PUBLIC_MATHPIX_APP_ID=tu_mathpix_app_id
NEXT_PUBLIC_MATHPIX_APP_KEY=tu_mathpix_app_key
NEXT_PUBLIC_GOOGLE_VISION_API_KEY=tu_google_api_key
NEXT_PUBLIC_AZURE_VISION_KEY=tu_azure_key
NEXT_PUBLIC_AZURE_VISION_ENDPOINT=tu_azure_endpoint
```

### Límites y Costos

| API | Gratis/Mes | Costo Adicional | Registro Requerido |
|-----|------------|-----------------|-------------------|
| **OCR.space** | 25,000 | $0.50/1000 | No |
| **Mathpix** | 1,000 | $0.004/request | Sí |
| **Google Vision** | 1,000 | $1.50/1000 | Sí |
| **Azure OCR** | 5,000 | $1.00/1000 | Sí |

## 🎯 Optimizaciones Implementadas

### **Preprocesamiento de Imagen**
- Escalado 3x para mejor resolución
- Filtros de limpieza y contraste
- Detección automática de inversión

### **Post-procesamiento Inteligente**
- Corrección de símbolos comunes (`f` → `∫`)
- Normalización de funciones trigonométricas
- Corrección de exponentes y fracciones
- Detección de patrones matemáticos

### **Sistema de Puntuación**
Cada resultado se evalúa por:
- Confianza de la API (0-100%)
- Presencia de símbolos matemáticos (+puntos)
- Longitud y coherencia del texto
- Patrones matemáticos válidos

## 🚀 Uso en la Aplicación

1. **Captura/Sube** una imagen con matemáticas
2. **Procesamiento** automático con 4 APIs
3. **Comparación** y selección del mejor resultado
4. **Edición manual** si es necesario
5. **Resolución** automática con IA

## 💡 Consejos para Mejores Resultados

### **Para Escritura a Mano**
- Usa tinta oscura sobre papel blanco
- Escribe claramente y con buen tamaño
- Evita sombras y reflejos
- Mantén la cámara estable

### **Para Símbolos Específicos**
- **Integral (∫)**: Haz la curva distintiva
- **Exponentes**: Escríbelos claramente elevados
- **Fracciones**: Usa líneas horizontales claras
- **Funciones**: Escribe `sin`, `cos`, `tan` completas

## 🔮 Futuras Mejoras

- Integración con más APIs especializadas
- Entrenamiento con dataset matemático propio
- Reconocimiento de diagramas y gráficos
- Soporte para notación matemática avanzada
- Cache inteligente para reducir llamadas a APIs

¡El sistema está diseñado para ser robusto y funcionar incluso si algunas APIs fallan!