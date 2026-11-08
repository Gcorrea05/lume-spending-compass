import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/state/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
      title={isDark ? "Usar tema claro" : "Usar tema escuro"}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
