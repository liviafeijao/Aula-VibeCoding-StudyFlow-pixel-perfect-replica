import { useEffect, useState } from "react";
import { useStudyData } from "./use-study-data";
import { updateSettings } from "@/services/repository";
import type { ThemePref } from "@/models/types";

export function useTheme() {
  const { data, loaded } = useStudyData();
  const pref: ThemePref = data.settings.theme;
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const theme: "light" | "dark" = pref === "sistema" ? (systemDark ? "dark" : "light") : pref === "escuro" ? "dark" : "light";

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, loaded]);

  const setPref = (p: ThemePref) => updateSettings({ theme: p });
  const toggle = () => setPref(theme === "dark" ? "claro" : "escuro");

  return { theme, pref, setPref, toggle };
}
