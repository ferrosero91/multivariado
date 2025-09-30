// Componente para inyectar variables de entorno en el HTML
// Específicamente diseñado para resolver problemas en Render

interface EnvScriptInjectorProps {
  env?: Record<string, string | undefined>
}

export function EnvScriptInjector({ env }: EnvScriptInjectorProps) {
  // Solo renderizar en el servidor
  if (typeof window !== 'undefined') {
    return null
  }

  // Obtener variables de entorno del servidor
  const serverEnv = {
    NEXT_PUBLIC_GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY,
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
    NEXT_PUBLIC_HUGGINGFACE_API_KEY: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY,
    NEXT_PUBLIC_OCR_SPACE_API_KEY: process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY || process.env.OCR_SPACE_API_KEY,
    ...env
  }

  // Filtrar solo las variables que tienen valores
  const validEnv = Object.fromEntries(
    Object.entries(serverEnv).filter(([key, value]) => value && value.trim())
  )

  console.log('🏗️ [Env Script Injector] Inyectando variables en HTML:', Object.keys(validEnv))

  // Crear script que inyecte las variables inmediatamente
  const scriptContent = `
    (function() {
      console.log('🚀 [Env Script] Ejecutando inyección de variables...');
      
      // Crear objetos process.env si no existen
      if (!window.process) window.process = { env: {} };
      if (!globalThis.process) globalThis.process = { env: {} };
      
      // Variables de entorno
      const envVars = ${JSON.stringify(validEnv)};
      
      // Inyectar en todas las ubicaciones posibles
      Object.entries(envVars).forEach(([key, value]) => {
        window.process.env[key] = value;
        globalThis.process.env[key] = value;
        window[key] = value;
        console.log('✅ [Env Script] ' + key + ' inyectada');
      });
      
      console.log('🎉 [Env Script] Inyección completada. Variables disponibles:', Object.keys(envVars));
      
      // Marcar que las variables están listas
      window.__ENV_VARS_READY__ = true;
      
      // Disparar evento para notificar a los servicios
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('env-vars-ready', {
          detail: { source: 'script-injector', vars: Object.keys(envVars) }
        }));
      }
    })();
  `

  return (
    <script
      data-env-vars="true"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  )
}