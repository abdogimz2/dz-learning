"use client";

import Link from "next/link";
import { useState } from "react";
import { School, Menu, X } from "lucide-react";
import { SimpleThemeToggle } from "@/components/simple-theme-toggle";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "الرئيسية", href: "/" },
    { label: "من نحن", href: "/about" },
    { label: "المواد", href: "/#subjects" },
    { label: "اتصل بنا", href: "/contact" },
  ];

  return (
    <nav dir="rtl" className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <School className="h-7 w-7 text-primary" />
            <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              منصة مايندلي التعليمية 
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary/80
                  font-medium transition-colors duration-200
                  ${item.href === "/" ? "text-primary dark:text-primary font-semibold" : ""}
                `}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions (Theme Toggle + Auth Buttons) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <SimpleThemeToggle />

            {/* Auth Buttons */}
            <Link href="/login">
              <button className="px-6 py-2.5 text-secondary dark:text-secondary font-extrabold border border-secondary dark:border-secondary rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                تسجيل الدخول
              </button>
            </Link>

            <Link href="/register">
              <button className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors shadow-sm">
                إنشاء حساب
              </button>
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-gray-700 dark:text-gray-300 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`
          md:hidden fixed inset-y-0 right-0 z-50 w-4/5 max-w-xs bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <School className="h-7 w-7 text-primary" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                المنصة
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-700 dark:text-gray-300"
            >
              <X size={28} />
            </button>
          </div>

          {/* Links */}
          <div className="flex-1 px-5 py-8 space-y-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  block text-lg font-medium py-3 px-4 rounded-lg transition-colors
                  ${
                    item.href === "/"
                      ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Actions */}
          <div className="p-5 border-t border-gray-200 dark:border-gray-800 space-y-4">
            {/* Mobile Theme Toggle */}
            <div className="flex justify-center">
              <SimpleThemeToggle />
            </div>

            {/* Auth Buttons - Mobile */}
            <Link href="/login" className="block">
              <button 
                className="w-full py-3.5 text-primary dark:text-primary font-medium border border-primary dark:border-primary rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                تسجيل الدخول
              </button>
            </Link>

            <Link href="/register" className="block">
              <button 
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                إنشاء حساب
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overlay when menu is open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </nav>
  );
}