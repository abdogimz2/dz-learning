// src/components/simple-theme-toggle.jsx
"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function SimpleThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // قراءة الثيم المحفوظ عند التحميل
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved === "dark" || (!saved && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}