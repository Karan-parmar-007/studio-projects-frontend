import { createContext, useContext, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const ease = [0.645, 0.045, 0.355, 1] as const
const StaggerActive = createContext(false)

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  if (reduced) {
    return (
      <StaggerActive.Provider value={false}>
        <div className={className}>{children}</div>
      </StaggerActive.Provider>
    )
  }
  return (
    <StaggerActive.Provider value>
      <motion.div
        className={className}
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: delay } },
        }}
      >
        {children}
      </motion.div>
    </StaggerActive.Provider>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const active = useContext(StaggerActive)
  if (!active) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
      }}
    >
      {children}
    </motion.div>
  )
}
