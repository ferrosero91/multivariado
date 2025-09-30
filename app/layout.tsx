import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import RuntimeEnvInjectorClient from "@/components/runtime-env-injector-client"
import { createRuntimeEnvProps } from "@/components/runtime-env-injector"
import { EnvScriptInjector } from "@/components/env-script-injector"
import { RenderEnvFix } from "@/components/render-env-fix"
import "./globals.css"

export const metadata: Metadata = {
  title: "EasyCal 3D - Calculadora de Cálculo Avanzado",
  description: "Resuelve problemas de cálculo diferencial, integral y multivariable con visualizaciones interactivas",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const runtimeEnvProps = createRuntimeEnvProps()
  
  return (
    <html lang="en">
      <head>
        <EnvScriptInjector env={runtimeEnvProps.env} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('🏗️ Inyectando variables de entorno desde el servidor...');
              window.__RUNTIME_ENV__ = ${JSON.stringify(runtimeEnvProps.env)};
              console.log('📦 Variables inyectadas:', Object.keys(window.__RUNTIME_ENV__));
              console.log('🔢 Total de variables:', Object.keys(window.__RUNTIME_ENV__).length);
              
              // Inyectar en process.env para compatibilidad
              if (!window.process) window.process = { env: {} };
              Object.assign(window.process.env, window.__RUNTIME_ENV__);
              
              // Inyectar en globalThis
              if (!globalThis.process) globalThis.process = { env: {} };
              Object.assign(globalThis.process.env, window.__RUNTIME_ENV__);
              
              console.log('✅ Variables de entorno inyectadas correctamente');
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <RenderEnvFix />
        <RuntimeEnvInjectorClient />
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
