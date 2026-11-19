import { QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { createQueryClient } from '@/data/queries'

const loadMotion = () => import('@/lib/motionFeatures').then((m) => m.default)

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(createQueryClient)
  return (
    <QueryClientProvider client={qc}>
      {/* reduced motion → Motion drops transforms/layout animation, keeps opacity fades ·
          LazyMotion + `m.*` components: the animation engine loads as its own chunk after the first paint */}
      <LazyMotion features={loadMotion} strict>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </LazyMotion>
      <Toaster
        theme="light"
        position="top-center"
        offset="max(16px, env(safe-area-inset-top))"
        toastOptions={{
          // Paper like the menu library (PAPER / INK in LibraryDialog) — readable on every album color
          style: {
            background: '#F7F5F0',
            border: 0,
            color: '#17141C',
            boxShadow: '0 12px 32px rgba(10, 6, 20, 0.28)',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </QueryClientProvider>
  )
}
