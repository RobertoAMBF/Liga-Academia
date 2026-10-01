"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle() {
    const nextDark = !dark;
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    setDark(nextDark);
    try {
      localStorage.setItem("liga-theme", nextDark ? "dark" : "light");
    } catch {
      // The theme still works when browser storage is unavailable.
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl justify-end px-4 pt-3 sm:px-6 lg:px-8">
      <button type="button" onClick={toggle} aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
        title={dark ? "Ativar modo claro" : "Ativar modo escuro"} aria-pressed={dark}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink/15 bg-white px-3 text-sm font-bold shadow-sm transition hover:border-grass">
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {dark ? "Modo claro" : "Modo escuro"}
      </button>
    </div>
  );
}
