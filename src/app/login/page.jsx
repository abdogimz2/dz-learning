// src/app/login/page.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail, Lock, LogIn, Eye, EyeOff, AlertCircle,
  School, Shield, ArrowRight, Loader2,
  CheckCircle, RefreshCw, Home,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase/config";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [hydrated, setHydrated] = useState(false);

  const router = useRouter();
  const { isAuthenticated, user, loading, error, success, login, clearError, clearSuccess, logout } =
    useAuthStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user) return;

    if (user.role === "admin" || user.role === "sub_admin") {
      router.replace("/admin");
      return;
    }
    if (user.status === "pending" || user.paymentStatus === "pending") {
      router.replace("/payment");
      return;
    }
    if (user.status === "waiting_verification" || user.paymentStatus === "submitted") {
      router.replace("/waiting-verification");
      return;
    }
    if (user.status === "suspended") {
      logout();
      return;
    }
    if (user.status === "active") {
      router.replace("/dashboard");
    }
  }, [hydrated, isAuthenticated, user]);

  useEffect(() => {
    const saved = localStorage.getItem("remembered_email");
    if (saved) setFormData((p) => ({ ...p, email: saved }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: "" }));
    if (error) clearError();
    if (success) clearSuccess();
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = "البريد الإلكتروني غير صالح";
    if (!formData.password) errs.password = "كلمة المرور مطلوبة";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    clearSuccess();
    if (!validate()) return;

    const result = await login(formData.email, formData.password);
    if (!result.success) return;

    localStorage.setItem("remembered_email", formData.email);

    // ✅ تحقق من pendingDelete — حساب منتهي الاشتراك
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (userSnap.exists() && userSnap.data().pendingDelete) {
          // احذف الآن لأن الجلسة جديدة
          try {
            await deleteDoc(doc(db, "users", currentUser.uid));
            const { deleteUser } = await import("firebase/auth");
            await deleteUser(currentUser);
          } catch { /* تجاهل */ }
          await logout();
          router.replace("/subscription-expired");
          return;
        }
      }
    } catch { /* تجاهل */ }

    // ✅ تحقق من تفعيل الإيميل
    try {
      const currentUser = auth.currentUser;
      if (currentUser && !currentUser.emailVerified) {
        // الإيميل غير مفعّل — أرسل رابط تفعيل وأظهر رسالة
        const { sendEmailVerification } = await import("firebase/auth");
        await sendEmailVerification(currentUser, {
          url: window.location.origin + "/payment",
        }).catch(() => {}); // تجاهل خطأ الإرسال
        useAuthStore.setState({
          error: "⚠️ بريدك الإلكتروني غير مفعّل. تم إرسال رابط التفعيل — تحقق من بريدك أولاً.",
          loading: false,
        });
        // تسجيل خروج مؤقت حتى يفعّل
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
        useAuthStore.setState({ isAuthenticated: false, user: null });
        return;
      }
    } catch {
      // نكمل التوجيه الطبيعي إذا فشل التحقق
    }
    // التوجيه يتم في useEffect تلقائياً
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setFormErrors({ email: "أدخل البريد الإلكتروني أولاً" });
      return;
    }
    useAuthStore.setState({ loading: true });
    try {
      const { resetPassword } = await import("@/lib/firebase/auth");
      const res = await resetPassword(formData.email);
      useAuthStore.setState({
        loading: false,
        success: res.success ? "تم إرسال رابط إعادة التعيين لبريدك الإلكتروني" : null,
        error: res.success ? null : res.error,
      });
    } catch {
      useAuthStore.setState({ loading: false, error: "حدث خطأ. حاول مرة أخرى" });
    }
  };

  const handleClear = () => {
    setFormData({ email: "", password: "" });
    setFormErrors({});
    clearError();
    clearSuccess();
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hydrated && isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">
            مرحباً {user.name}! جاري التوجيه...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600" />
          {/* زر العودة */}
          <div className="relative flex justify-end pt-4 px-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition-all"
            >
              <Home size={15} />
              الرئيسية
            </Link>
          </div>
          <div className="relative px-8 pb-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm mb-5">
              <School size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">مرحباً بعودتك</h1>
            <p className="text-white/80">أكمل رحلتك التعليمية معنا</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Success */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl flex items-center gap-2"
              >
                <CheckCircle size={18} /> {success}
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl flex items-center gap-2"
                role="alert"
              >
                <AlertCircle size={18} /> {error}
              </motion.div>
            )}

            {/* Security note */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-2">
              <Shield size={16} className="text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                جلسة مشفرة ومحمية بواسطة Firebase Authentication
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium text-sm">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="example@email.com"
                  className={`w-full pr-10 pl-3 py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all ${
                    formErrors.email
                      ? "border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {formErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium text-sm">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="••••••••"
                  className={`w-full pr-10 pl-10 py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all ${
                    formErrors.password
                      ? "border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {formErrors.password}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white font-bold text-base rounded-xl flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600" />
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin relative z-10" />
                  <span className="relative z-10">جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} className="relative z-10" />
                  <span className="relative z-10">تسجيل الدخول</span>
                </>
              )}
            </button>

            {/* Clear + Register */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <RefreshCw size={15} /> مسح
              </button>
              <Link
                href="/register"
                className="py-2.5 px-4 border-2 border-primary text-primary rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                حساب جديد
              </Link>
            </div>

            {/* Register link */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                جديد على المنصة؟{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  أنشئ حساباً جديداً
                  <ArrowRight size={14} className="inline-block mr-1 rotate-180" />
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}