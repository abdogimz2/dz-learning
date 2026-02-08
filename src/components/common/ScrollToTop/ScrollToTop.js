"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="التمرير إلى الأعلى"
      className="
        fixed bottom-6 right-6 z-50
        bg-primary hover:bg-primary-hover
        text-white rounded-full
        w-12 h-12 flex items-center justify-center
        shadow-lg hover:shadow-xl
        transition-all duration-300
        scale-100 hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      "
    >
      <ArrowUp size={24} strokeWidth={2.5} />
    </button>
  );
}