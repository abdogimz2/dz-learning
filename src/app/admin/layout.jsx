"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, ShieldCheck, Home, LayoutDashboard, CreditCard, BookOpen } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // جلب مستند المستخدم من Firestore للتأكد من حقل role
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists() && userSnap.data().role === "admin") {
            setIsAuthorized(true);
          } else {
            // إذا لم يكن أدمين، وجهه للـ Dashboard مع رسالة خطأ
            router.push("/dashboard?message=غير مصرح لك بدخول منطقة الإدارة");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          router.push("/login");
        }
      } else {
        // إذا لم يسجل دخول، وجهه لصفحة الدخول
        router.push("/login?redirect=/admin");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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
      {/* Sidebar - جانبية لوحة التحكم */}
      <aside className="w-full lg:w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-8 shadow-sm z-20">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ShieldCheck size={24} />
          </div>
          <span className="font-black text-xl dark:text-white">لوحة الإدارة</span>
        </div>

        <nav className="flex flex-col gap-2">
          <Link href="/admin">
            <span className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-primary/10 text-primary shadow-sm">
              <LayoutDashboard size={20} /> الرئيسية
            </span>
          </Link>
          <Link href="/admin/payments">
            <span className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <CreditCard size={20} /> طلبات التفعيل
            </span>
          </Link>
          <Link href="/admin/courses">
            <span className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <BookOpen size={20} /> إدارة المحتوى
            </span>
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-3 text-gray-500 hover:text-primary transition-colors text-sm font-bold">
            <Home size={18} /> العودة للموقع الرئيسي
          </Link>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-8 justify-between sticky top-0 z-10 backdrop-blur-md">
          <p className="text-sm font-medium text-gray-500">نظام إدارة المنصة الجزائرية للتعليم</p>
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">AD</div>
        </header>
        <div className="p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}