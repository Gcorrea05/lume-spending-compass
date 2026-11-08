import { useCallback, useEffect, useState } from "react";

/** Only the visual theme preference is persisted locally. */
export const THEME_STORAGE_KEY = "lume-theme";
export type Theme = "dark" | "light";

/** Runs before paint (inlined in <head>) to avoid a flash of the wrong theme. */
export const themeInitScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light"){document.documentElement.classList.remove("dark")}}catch(e){}`;

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
    setThemeState(next);
  }, []);

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
