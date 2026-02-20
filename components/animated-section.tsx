"use client"

import type React from "react"
import { useEffect, useRef } from "react"

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  stagger?: boolean
  delay?: number
}

export function AnimatedSection({
  children,
  className = "",
  stagger = false,
  delay = 0,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (delay) el.style.transitionDelay = `${delay}ms`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view")
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`animate-on-scroll ${stagger ? "stagger-children" : ""} ${className}`}
    >
      {children}
    </div>
  )
}
