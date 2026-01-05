"use client";

import { motion } from "framer-motion";
import {
  iconButtonHoverState,
  dangerIconButtonHoverState,
} from "@/lib/animations";

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  label: string;
  variant?: "default" | "danger";
  className?: string;
}

export function IconButton({
  icon,
  onClick,
  label,
  variant = "default",
  className = "",
}: IconButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative rounded-lg p-2 ${className}`}
      style={{
        color: "var(--text-secondary)",
        backgroundColor: "var(--bg-transparent)",
      }}
      whileHover={
        variant === "danger" ? dangerIconButtonHoverState : iconButtonHoverState
      }
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      title={label}
      aria-label={label}
    >
      {icon}
    </motion.button>
  );
}
