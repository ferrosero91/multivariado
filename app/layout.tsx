import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import { RuntimeEnvInjectorClient } from "@/components/runtime-env-injector-client"
import { createRuntimeEnvProps } from "@/components/runtime-env-injector"
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
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <RuntimeEnvInjectorClient {...runtimeEnvProps} />
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
