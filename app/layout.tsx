import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Montserrat } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import Loading from "./loading"
import { dynamic } from './config';

// Define fonts with preload
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
})

const montserrat = Montserrat({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  preload: true,
  weight: ["500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
})

export const viewport: Viewport = {
  themeColor: "#6355E5",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "GymXam | Book Fitness Classes with Ease",
  description:
    "Book fitness classes with ease. Manage your schedule, get reminders, and never miss a class again.",
  keywords: ["fitness", "gym", "booking", "class", "schedule", "workout"],
  authors: [{ name: "GymXam Team" }],
  creator: "GymXam",
  publisher: "GymXam",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://gymxam.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gymxam.com",
    title: "GymXam | Book Fitness Classes with Ease",
    description: "Book fitness classes with ease. Manage your schedule, get reminders, and never miss a class again.",
    siteName: "GymXam",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GymXam",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GymXam | Book Fitness Classes with Ease",
    description: "Book fitness classes with ease. Manage your schedule, get reminders, and never miss a class again.",
    images: ["/og-image.jpg"],
    creator: "@gymxam",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense fallback={<Loading />}>
              <div className="flex flex-col min-h-screen">
                {children}
                <footer className="mt-auto bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4">
                  <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Designed by{" "}
                      <a 
                        href="https://codewithenea.it" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        codewithenea.it
                      </a>
                    </p>
                  </div>
                </footer>
              </div>
            </Suspense>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
