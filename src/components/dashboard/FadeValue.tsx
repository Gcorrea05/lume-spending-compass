import { AnimatePresence, motion } from "motion/react";

/** Soft cross-fade when a value changes. No counting animation. */
export function FadeValue({ value }: { value: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="inline-block"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}
