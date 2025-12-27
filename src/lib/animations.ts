// Shared animation variants for Framer Motion
import type { Variants } from "framer-motion";

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
};

export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Hover states for buttons
export const buttonHoverState = {
  color: "rgba(255,255,255,1)",
  backgroundColor: "rgba(255,255,255,0.15)",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.3), inset 0 0px 0px rgba(0,0,0,0), inset 0 1px 0 rgba(255,255,255,0.1)",
};

export const iconButtonHoverState = {
  color: "rgba(255,255,255,1)",
  backgroundColor: "rgba(255,255,255,0.1)",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.3), inset 0 0px 0px rgba(0,0,0,0), inset 0 1px 0 rgba(255,255,255,0.1)",
};

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};
