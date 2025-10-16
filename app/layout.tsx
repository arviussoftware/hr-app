import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "./providers"
import { LayoutClient } from "./LayoutClient"
import { LoadingProvider } from "@/context/LoadingContext"
import LoadingOverlay from "@/components/LoadingOverlay"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "Arvius Software Pvt Ltd",
  description: "HR Portal for Arvius Software PVT LTD",
  icons: {
    icon: "/ArviusLogo.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1976d2" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <LoadingProvider>
            <LoadingOverlay />
            <LayoutClient>{children}</LayoutClient>
          </LoadingProvider>
        </Providers>
      </body>
    </html>
  )
}
