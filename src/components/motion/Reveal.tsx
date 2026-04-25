// Lightweight scroll/mount reveal primitives built on framer-motion.
// Respects prefers-reduced-motion automatically (framer-motion handles it).
// Designed to match the existing dark, magenta-accent design system —
// motion is subtle (fade + small translate), never flashy.

import { motion, useReducedMotion as useOsReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { useReducedMotionPrefValue } from "@/hooks/use-reduced-motion-pref";

// Combine OS preference with user-toggled preference from Settings.
function useReducedMotion() {
  const os = useOsReducedMotion();
  const user = useReducedMotionPrefValue();
  return os || user;
}

type RevealProps = {
  children: ReactNode;
  /** Delay in seconds */
  delay?: number;
  /** Translate distance in px (default 16) */
  y?: number;
  /** className passes through to the motion wrapper */
  className?: string;
  /** Set false to animate every time it enters viewport (default: once) */
  once?: boolean;
  /** Render as a different element (default 'div') */
  as?: "div" | "section" | "article" | "li" | "span";
};

/**
 * Fades + slides children up when they enter the viewport.
 * Use as a drop-in wrapper around existing JSX. Keeps layout flow.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  once = true,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1], // expo out — matches design system feel
      }}
      className={className}
    >
      {children}
    </Component>
  );
}

/**
 * Stagger children — wrap a list and each immediate child fades in sequentially.
 * Children should be wrapped in <RevealItem> to participate in the stagger.
 */
export function RevealStagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
}) {
  const variants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.15 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  y = 16,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: "div" | "li" | "article" | "section";
}) {
  const reduce = useReducedMotion();
  const Component = motion[as];

  const itemVariants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y },
    show: reduce
      ? { opacity: 1, transition: { duration: 0.4 } }
      : {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
  };

  return (
    <Component variants={itemVariants} className={className}>
      {children}
    </Component>
  );
}
