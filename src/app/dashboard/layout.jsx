"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Search,
  User
} from "lucide-react";
import { SimpleThemeToggle } from "@/components/simple-theme-toggle";

const sidebarItems = [
  { icon: LayoutDashboard, label: "الرئيسية", href: "/dashboard" },
  { icon: BookOpen, label: "موادي الدراسية", href: "/dashboard/courses" },
  { icon: Trophy, label: "لوحة المتصدرين", href: "/dashboard/leaderboard" },
  { icon: ShoppingBag, label: "متجر النقاط", href: "/dashboard/shop" },
  { icon: Settings, label: "الإعدادات", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState({ name: "طالب", surname: "", level: "", specialty: "" });
  const pathname = usePathname();

  useEffect(() => {
    const savedData = localStorage.getItem('payment_info');
    if (savedData) {
      setUserData(JSON.parse(savedData));
    }
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-950 flex font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
              DZ
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              منصة التميز
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${
                pathname === item.href 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}>
                <item.icon size={22} />
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-medium transition-colors">
            <LogOut size={22} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <button className="lg:hidden p-2 text-gray-600" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={28} />
          </button>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="ابحث عن درس..." className="w-full pr-10 pl-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl outline-none text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full relative">
              <Bell size={22} />
              <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
            </button>
            <SimpleThemeToggle/>
            
            <div className="flex items-center gap-3 border-r pr-4 border-gray-200 dark:border-gray-800">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{userData.name} {userData.surname}</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                   {userData.level === 'middle' ? 'التعليم المتوسط' : 'التعليم الثانوي'} - {userData.specialty}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center text-white font-bold">
                {userData.name ? userData.name[0] : "S"}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay (Simplified) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </div>
  );
}