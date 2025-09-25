/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Mejorar carga de variables de entorno en el cliente
  env: {
    NEXT_PUBLIC_GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
    NEXT_PUBLIC_HUGGINGFACE_API_KEY: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY,
    NEXT_PUBLIC_OCR_SPACE_API_KEY: process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY,
  },
}

export default nextConfig
