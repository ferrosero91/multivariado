# Guía de Despliegue en Render - EasyCalPRO

## 📋 Requisitos Previos

1. Cuenta en [Render.com](https://render.com)
2. Repositorio de código en GitHub/GitLab
3. API Keys para los servicios (opcional pero recomendado)

## 🚀 Pasos para Desplegar

### 1. Preparar el Repositorio

Asegúrate de que tu repositorio contenga estos archivos:
- ✅ `Dockerfile` - Configuración de contenedor
- ✅ `render.yaml` - Configuración de Render
- ✅ `next.config.mjs` - Con `output: 'standalone'`
- ✅ `.env.example` - Variables de entorno de ejemplo

### 2. Conectar Repositorio a Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en "New +" → "Blueprint"
3. Conecta tu repositorio de GitHub/GitLab
4. Selecciona el repositorio `easycalPRO`

### 3. Configurar Variables de Entorno

En el dashboard de Render, ve a tu servicio y configura estas variables:

#### Variables Obligatorias del Sistema:
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
```

#### Variables de API (Opcionales pero Recomendadas):
```
NEXT_PUBLIC_GROQ_API_KEY=tu_groq_api_key
NEXT_PUBLIC_OPENROUTER_API_KEY=tu_openrouter_api_key
NEXT_PUBLIC_HUGGINGFACE_API_KEY=tu_huggingface_api_key
NEXT_PUBLIC_OCR_SPACE_API_KEY=tu_ocr_space_api_key
```

### 4. Obtener API Keys (Opcional)

#### Groq API (Recomendado - Gratis):
1. Ve a [console.groq.com](https://console.groq.com/)
2. Crea una cuenta
3. Genera una API key
4. Copia la key que empieza con `gsk_`

#### OCR.space API (Para OCR):
1. Ve a [ocr.space/ocrapi](https://ocr.space/ocrapi)
2. Regístrate para obtener una API key gratuita
3. Usa la key en `NEXT_PUBLIC_OCR_SPACE_API_KEY`

#### OpenRouter API (Opcional):
1. Ve a [openrouter.ai](https://openrouter.ai/)
2. Crea una cuenta y genera una API key
3. Usa la key en `NEXT_PUBLIC_OPENROUTER_API_KEY`

#### Hugging Face API (Opcional):
1. Ve a [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Crea un token de acceso
3. Usa el token en `NEXT_PUBLIC_HUGGINGFACE_API_KEY`

### 5. Desplegar

1. Render detectará automáticamente el `render.yaml`
2. El build se iniciará automáticamente usando Docker
3. El proceso toma aproximadamente 5-10 minutos
4. Una vez completado, tendrás una URL como: `https://easycalpro.onrender.com`

## 🔧 Configuración Avanzada

### Dominio Personalizado
1. En el dashboard de Render, ve a "Settings"
2. Scroll hasta "Custom Domains"
3. Agrega tu dominio personalizado

### Monitoreo
- Render proporciona logs en tiempo real
- Métricas de rendimiento disponibles en el dashboard
- Alertas automáticas por email

### Escalabilidad
- Plan gratuito: 512MB RAM, 0.1 CPU
- Para mayor tráfico, considera upgrading al plan Starter ($7/mes)

## 🐛 Solución de Problemas

### Build Falla
1. Verifica que `package.json` tenga todos los scripts necesarios
2. Asegúrate de que `next.config.mjs` tenga `output: 'standalone'`
3. Revisa los logs de build en Render

### Aplicación No Carga
1. Verifica que el puerto 3000 esté configurado
2. Revisa las variables de entorno
3. Checa los logs de la aplicación

### APIs No Funcionan
1. Verifica que las API keys estén configuradas correctamente
2. Asegúrate de que las keys tengan el prefijo `NEXT_PUBLIC_`
3. Revisa los logs para errores de API

## 📊 Características del Despliegue

- ✅ **Docker Multi-stage**: Build optimizado y imagen ligera
- ✅ **Variables de Entorno**: Configuración segura de APIs
- ✅ **Headers de Seguridad**: Protección contra ataques comunes
- ✅ **Health Checks**: Monitoreo automático de salud
- ✅ **Auto-deploy**: Despliegue automático en cada push
- ✅ **SSL/HTTPS**: Certificados automáticos
- ✅ **CDN Global**: Distribución mundial de contenido

## 🎯 URLs Importantes

- **Aplicación**: `https://easycalpro.onrender.com`
- **Dashboard**: `https://dashboard.render.com`
- **Logs**: Disponibles en el dashboard de Render
- **Métricas**: Panel de control en Render

## 💡 Consejos

1. **Plan Gratuito**: La aplicación puede "dormir" después de 15 minutos de inactividad
2. **Primer Arranque**: Puede tomar 30-60 segundos en arrancar desde el estado dormido
3. **Monitoreo**: Configura alertas para estar al tanto del estado de la aplicación
4. **Backup**: Mantén tu código en un repositorio privado como respaldo

¡Tu calculadora multivariable estará disponible 24/7 en la web! 🎉