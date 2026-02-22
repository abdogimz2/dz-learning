"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Loader2, ShieldCheck, Home, LayoutDashboard,
  CreditCard, BookOpen, LogOut, Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { href: "/admin",          icon: LayoutDashboard, label: "الرئيسية" },
  { href: "/admin/payments", icon: CreditCard,       label: "طلبات التفعيل" },
  { href: "/admin/courses",  icon: BookOpen,         label: "إدارة المحتوى" },
  { href: "/admin/users",    icon: Users,            label: "المستخدمين" },
];

export default function AdminLayout({ children }) {
  const [loading, setLoading]       = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const logout   = useAuthStore((state) => state.logout);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists() && userSnap.data().role === "admin") {
            setIsAuthorized(true);
          } else {
            router.push("/dashboard");
          }
        } catch {
          router.push("/login");
        }
      } else {
        router.push("/login?redirect=/admin");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950" dir="rtl">
        <Loader2 className="animate-spin text-primary mb-4" size={50} />
        <p className="font-bold text-gray-600 dark:text-gray-400">جاري التحقق من صلاحيات المسؤول...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col lg:flex-row font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-full lg:w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-sm z-20 lg:sticky lg:top-0 lg:h-screen">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="font-black text-gray-800 dark:text-white text-base">لوحة الإدارة</p>
            <p className="text-xs text-gray-400">منصة التعليم الجزائرية</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 p-4 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                    active
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {/* رابط الموقع الرئيسي */}
          <Link href="/">
            <span className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-bold">
              <Home size={18} />
              الموقع الرئيسي
            </span>
          </Link>

          {/* ✅ زر تسجيل الخروج */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-bold"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-8 justify-between sticky top-0 z-10 backdrop-blur-md">
          <p className="text-sm font-medium text-gray-500">
            نظام إدارة المنصة الجزائرية للتعليم
          </p>
          {/* زر تسجيل خروج سريع في الهيدر */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-sm font-bold"
          >
            <LogOut size={16} />
            خروج
          </button>
        </header>

        <div className="p-6 md:p-10 flex-1">{children}</div>
      </main>
    </div>
  );
}