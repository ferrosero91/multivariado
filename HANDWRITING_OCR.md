# 📝 Reconocimiento de Escritura a Mano Matemática

EasyCal Pro incluye un sistema avanzado de OCR (Reconocimiento Óptico de Caracteres) específicamente optimizado para reconocer expresiones matemáticas escritas a mano.

## 🎯 Características del Sistema OCR

### **Procesamiento de Imagen Avanzado**
- **Escalado 3x**: Aumenta la resolución para mejor reconocimiento
- **Filtro Gaussiano**: Suaviza la imagen para reducir ruido
- **Umbralización de Otsu**: Determina automáticamente el mejor threshold
- **Operaciones Morfológicas**: Limpia y conecta líneas rotas
- **Detección de Inversión**: Identifica si necesita invertir colores

### **Múltiples Pasadas de OCR**
El sistema realiza 3 pasadas diferentes:
1. **Standard**: Configuración general para bloques de texto
2. **Single Line**: Optimizada para una sola línea de ecuación
3. **Single Word**: Para expresiones cortas o símbolos individuales

### **Sistema de Puntuación Inteligente**
Cada resultado se evalúa basándose en:
- **Confianza del OCR** (0-100%)
- **Longitud del texto** (más texto = mejor)
- **Símbolos matemáticos** (+5 puntos por símbolo)
- **Indicadores de integral** (+10 puntos por 'dx')
- **Funciones trigonométricas** (+8 puntos)
- **Caracteres extraños** (-2 puntos por carácter)

## 📋 Tipos de Expresiones Soportadas

### ✅ **Integrales**
- `∫ x^2 dx`
- `∫ e^(tan(2x)) / sec²(2x) dx`
- `∫ sin(x) cos(x) dx`

### ✅ **Derivadas**
- `d/dx (x^3 + 2x)`
- `∂f/∂x`
- `f'(x)`

### ✅ **Funciones Trigonométricas**
- `sin(2x)`, `cos(x)`, `tan(x)`
- `sec²(x)`, `csc(x)`, `cot(x)`

### ✅ **Exponentes y Potencias**
- `x^2`, `e^x`, `2^n`
- `x²`, `x³` (superíndices Unicode)

### ✅ **Fracciones**
- `1/2`, `(x+1)/(x-1)`
- Fracciones complejas con múltiples niveles

## 🔧 Correcciones Automáticas

### **Símbolos Comúnmente Confundidos**
- `f` → `∫` (integral)
- `J` → `∫` (integral)
- `|` → `∫` (integral)
- `O` → `0` (cero)
- `l` → `1` (uno)
- `S` → `5` (cinco)
- `Z` → `2` (dos)
- `g` → `9` (nueve)

### **Patrones Específicos**
- `e tan 2x` → `e^(tan(2x))`
- `sec 2 (2x)` → `sec²(2x)`
- `x ) /` → `x)/`
- `( tan` → `(tan`

### **Espaciado y Formato**
- Elimina espacios extra
- Corrige paréntesis mal espaciados
- Normaliza operadores matemáticos
- Ajusta formato de funciones

## 💡 Consejos para Mejor Reconocimiento

### **Escritura**
1. **Letra clara**: Escribe de forma legible y consistente
2. **Contraste alto**: Usa tinta oscura sobre papel blanco
3. **Tamaño adecuado**: No escribas demasiado pequeño
4. **Espaciado**: Deja espacio entre símbolos diferentes

### **Captura de Imagen**
1. **Buena iluminación**: Evita sombras y reflejos
2. **Imagen estable**: Mantén la cámara firme
3. **Ángulo recto**: Captura perpendicular al papel
4. **Enfoque nítido**: Asegúrate de que esté bien enfocado

### **Símbolos Específicos**
- **Integral (∫)**: Haz la curva distintiva, no como una 'f'
- **Exponentes**: Escríbelos claramente elevados
- **Fracciones**: Usa líneas horizontales claras
- **Paréntesis**: Hazlos bien redondeados y cerrados

## 🚀 Proceso de Reconocimiento

1. **Captura**: La imagen se escala 3x para mejor resolución
2. **Preprocesamiento**: Se aplican filtros para limpiar la imagen
3. **OCR Múltiple**: Se ejecutan 3 pasadas con diferentes configuraciones
4. **Evaluación**: Cada resultado se puntúa según criterios matemáticos
5. **Selección**: Se elige el resultado con mayor puntuación
6. **Corrección**: Se aplican patrones de corrección específicos
7. **Validación**: Se verifica que el resultado tenga sentido matemático

## 🔍 Debugging y Logs

El sistema proporciona logs detallados:
```
🔄 Pasada OCR: Standard
✅ Standard: "∫ e^(tan(2x)) / sec²(2x) dx" (87%)
🔄 Pasada OCR: Single Line  
✅ Single Line: "∫ e^(tan 2x) / sec 2x dx" (92%)
📊 Resultados OCR ordenados por score:
  Single Line: "∫ e^(tan 2x) / sec 2x dx" (confianza: 92%, score: 145.50)
  Standard: "∫ e^(tan(2x)) / sec²(2x) dx" (confianza: 87%, score: 142.30)
```

## ⚡ Optimizaciones Futuras

### **Posibles Mejoras**
- Entrenamiento con dataset matemático específico
- Integración con modelos de IA para post-procesamiento
- Reconocimiento de diagramas y gráficos
- Soporte para notación matemática más compleja

### **Limitaciones Actuales**
- Funciona mejor con escritura clara
- Puede tener dificultades con símbolos muy complejos
- Requiere buena iluminación y contraste
- No reconoce diagramas o gráficos

## 🎓 Ejemplos de Uso

### **Integral Compleja** (Como tu imagen)
**Entrada**: Imagen de "∫ e^(tan 2x) / sec²(2x) dx"
**Proceso**: 
1. OCR reconoce: "f e tan 2x / sec 2 (2x) dx"
2. Corrección: "∫ e^(tan(2x)) / sec²(2x) dx"
3. Resultado: Expresión matemática válida

### **Derivada Simple**
**Entrada**: "d/dx (x² + 3x + 1)"
**Proceso**:
1. OCR reconoce: "d/dx (x2 + 3x + 1)"
2. Corrección: "d/dx (x^2 + 3x + 1)"
3. Resultado: Expresión de derivada válida

¡El sistema está diseñado para manejar la variabilidad natural de la escritura a mano mientras mantiene alta precisión en el reconocimiento matemático!