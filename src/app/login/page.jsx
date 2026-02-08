// src/app/login/page.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  School,
  Shield,
  User,
  KeyRound,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isDemoMode, setIsDemoMode] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const message = searchParams.get("message");

  // Get Zustand store state and actions
  const {
    isAuthenticated,
    user,
    loading,
    error,
    success,
    login,
    clearError,
    clearSuccess,
    logout, // In case we need to logout for any reason
  } = useAuthStore();

  // تحميل البيانات المحفوظة عند التذكر
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_email");
    const rememberedMe = localStorage.getItem("remember_me") === "true";

    if (rememberedEmail && rememberedMe) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    console.log("isAuthenticated",isAuthenticated,user)
    if (isAuthenticated && user) {
      console.log("✅ User already authenticated, redirecting...");
      if (user.role ==="admin") {
        router.replace("/admin")
        return
      }
      // Check user status and redirect accordingly
      if (user.status === "pending") {
        router.push(
          "/payment?message=حسابك قيد الانتظار. يرجى إكمال عملية الدفع"
        );
        return;
      }

      if (user.status === "suspended") {
        useAuthStore.setState({
          error: "الحساب معطل. يرجى التواصل مع الدعم الفني",
        });
        logout();
        return;
      }

      if (user.status !== "active") {
        useAuthStore.setState({
          error: "الحساب غير مفعل. يرجى الانتظار أو التواصل مع الدعم",
        });
        return;
      }
      setTimeout(() => {
        router.replace("/dashboard")
      }, 500);
    }
  }, [isAuthenticated, user]);

  // عرض رسائل من URL
  useEffect(() => {
    if (message) {
      if (message.includes("نشط")) {
        useAuthStore.setState({ success: decodeURIComponent(message) });
      } else if (message.includes("معلق") || message.includes("رفض")) {
        useAuthStore.setState({ error: decodeURIComponent(message) });
      }
    }
  }, [message]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // مسح الأخطاء عند الكتابة
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) clearError();
    if (success) clearSuccess();
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = "البريد الإلكتروني مطلوب";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "البريد الإلكتروني غير صالح";
    }

    if (!formData.password) {
      errors.password = "كلمة المرور مطلوبة";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    clearSuccess();

    if (!validateForm()) {
      useAuthStore.setState({ error: "يرجى تصحيح الأخطاء في النموذج" });
      return;
    }

    try {
      console.log("🚀 محاولة تسجيل الدخول...");

      // Use Zustand login action
      const result = await login(formData.email, formData.password);

      if (!result.success) {
        throw new Error(result.error || "فشل في تسجيل الدخول");
      }

      console.log("✅ تم تسجيل الدخول:", result.user);

      const userData = result.user;
      // 2. حفظ تذكر البريد الإلكتروني إذا طلب المستخدم
      if (formData.rememberMe) {
        localStorage.setItem("remembered_email", formData.email);
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remembered_email");
        localStorage.removeItem("remember_me");
      }

      // 3. حفظ الجلسة في localStorage (Zustand already persists)
      localStorage.setItem("auth_token", userData.uid || userData.id);
      localStorage.setItem("user_role", userData.role || "student");
      localStorage.setItem("login_time", new Date().toISOString());

  
      if (userData.role === "admin") {
        router.replace("/admin")
        return
      }
      // 1. التحقق من حالة الحساب
      if (userData.status === "pending") {
        router.push(
          "/payment?message=حسابك قيد الانتظار. يرجى إكمال عملية الدفع"
        );
        return;
      }

      if (userData.status === "suspended") {
        throw new Error("الحساب معطل. يرجى التواصل مع الدعم الفني");
      }

      if (userData.status !== "active") {
        throw new Error("الحساب غير مفعل. يرجى الانتظار أو التواصل مع الدعم");
      }
      setTimeout(() => {
        router.replace("/dashboard")
      }, 500);

      
    } catch (err) {
      console.error("❌ خطأ في تسجيل الدخول:", err);

      // تحسين رسائل الخطأ
      let errorMessage =
        err.message || "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى";

      if (
        err.message.includes("المستخدم غير موجود") ||
        err.message.includes("user-not-found")
      ) {
        errorMessage = "البريد الإلكتروني غير مسجل. يرجى إنشاء حساب جديد";
      } else if (
        err.message.includes("كلمة المرور غير صحيحة") ||
        err.message.includes("wrong-password")
      ) {
        errorMessage = "كلمة المرور غير صحيحة. حاول مرة أخرى";
      } else if (
        err.message.includes("كثيراً") ||
        err.message.includes("too-many-requests")
      ) {
        errorMessage = "محاولات تسجيل دخول كثيرة. حاول لاحقاً";
      } else if (
        err.message.includes("معطل") ||
        err.message.includes("disabled")
      ) {
        errorMessage = "حسابك معطل. يرجى التواصل مع الدعم الفني";
      } else if (err.message.includes("البريد الإلكتروني غير مسجل")) {
        errorMessage = "البريد الإلكتروني غير مسجل. يرجى إنشاء حساب جديد";
      }

      useAuthStore.setState({ error: errorMessage });
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      useAuthStore.setState({
        error: "الرجاء إدخال البريد الإلكتروني لإعادة تعيين كلمة المرور",
      });
      return;
    }

    useAuthStore.setState({ loading: true });
    try {
      const { resetPassword } = await import("@/lib/firebase/auth");
      const result = await resetPassword(formData.email);

      if (result.success) {
        useAuthStore.setState({
          success: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
        });
      } else {
        useAuthStore.setState({
          error: result.error || "فشل في إرسال رابط إعادة التعيين",
        });
      }
    } catch (err) {
      useAuthStore.setState({
        error: "حدث خطأ أثناء إرسال رابط إعادة التعيين",
      });
    } finally {
      useAuthStore.setState({ loading: false });
    }
  };

  const handleDemoLogin = () => {
    setIsDemoMode(true);
    setFormData({
      email: "demo@student.com",
      password: "Demo@123456",
      rememberMe: false,
    });
    useAuthStore.setState({
      success: "تم تعيين بيانات تجريبية. اضغط على تسجيل الدخول للمتابعة",
    });
  };

  const handleClearForm = () => {
    setFormData({
      email: "",
      password: "",
      rememberMe: false,
    });
    setFormErrors({});
    clearError();
    clearSuccess();
    setIsDemoMode(false);
  };

  // If user is already authenticated, show loading while redirecting
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-bold">
            تم تسجيل الدخول بنجاح!
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            جاري التوجيه...
          </p>
          <p className="mt-2 text-xs text-gray-400">مرحباً {user.name}!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 md:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        {/* Header with brand colors */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-90"></div>
          <div className="absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative p-8 md:p-10 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm mb-6">
              <School size={40} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              مرحباً بعودتك
            </h1>
            <p className="text-white/90 text-lg">أكمل رحلتك التعليمية معنا</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* رسالة النجاح */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2"
                role="status"
              >
                <CheckCircle size={20} />
                {success}
              </motion.div>
            )}

            {/* رسالة الخطأ */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2"
                role="alert"
              >
                <AlertCircle size={20} />
                {error}
              </motion.div>
            )}

            {/* معلومات الأمان */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  جلسة آمنة
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                🔒 جلسة مشفرة
                <br />
                ☁️ محمية بواسطة Firebase Authentication
              </p>
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 dark:text-gray-300 mb-2 font-medium flex items-center gap-2"
              >
                <Mail size={16} />
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  size={20}
                  aria-hidden="true"
                />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pr-10 pl-3 py-3 border rounded-xl focus:outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                    formErrors.email
                      ? "border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
                  }`}
                  placeholder="example@email.com"
                  aria-invalid={!!formErrors.email}
                  aria-describedby={
                    formErrors.email ? "email-error" : undefined
                  }
                  disabled={loading}
                />
              </div>
              {formErrors.email && (
                <p
                  id="email-error"
                  className="text-red-600 dark:text-red-400 text-sm mt-1 pr-3 flex items-center gap-1"
                >
                  <AlertCircle size={12} />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-gray-700 dark:text-gray-300 mb-2 font-medium flex items-center gap-2"
              >
                <KeyRound size={16} />
                كلمة المرور
              </label>
              <div className="relative">
                <Lock
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  size={20}
                  aria-hidden="true"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pr-10 pl-10 py-3 border rounded-xl focus:outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                    formErrors.password
                      ? "border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
                  }`}
                  placeholder="••••••••"
                  aria-invalid={!!formErrors.password}
                  aria-describedby={
                    formErrors.password ? "password-error" : undefined
                  }
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors disabled:opacity-50"
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formErrors.password && (
                <p
                  id="password-error"
                  className="text-red-600 dark:text-red-400 text-sm mt-1 pr-3 flex items-center gap-1"
                >
                  <AlertCircle size={12} />
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-50"
                  disabled={loading}
                />
                <label
                  htmlFor="rememberMe"
                  className="mr-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  تذكرني على هذا الجهاز
                </label>
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded transition-colors disabled:opacity-50"
                disabled={loading}
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 md:py-4 text-white font-bold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 focus:ring-2 focus:ring-primary focus:outline-none relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={loading}
            >
              {/* Animated background effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600"></span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

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

            {/* أزرار إضافية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!isDemoMode ? (
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  disabled={loading}
                >
                  <User size={16} />
                  تجربة تجريبية
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="py-2 px-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2 text-sm"
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  مسح النموذج
                </button>
              )}

              <Link
                href="/register"
                className="py-2 px-4 border-2 border-primary text-primary dark:border-primary dark:text-primary rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <User size={16} />
                حساب جديد
              </Link>
            </div>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  أو
                </span>
              </div>
            </div>

            {/* مشكلات متوقعة */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  معلومات مهمة
                </span>
              </div>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                <li>• إذا كان حسابك قيد المراجعة، ستتوجه لصفحة الدفع</li>
                <li>
                  • في حالة نسيان كلمة المرور، اضغط على "نسيت كلمة المرور"
                </li>
                <li>
                  • للمساعدة الفورية، تواصل مع الدعم على support@example.com
                </li>
              </ul>
            </div>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-400">
                جديد على المنصة؟{" "}
                <Link
                  href="/register"
                  className="text-primary font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded transition-colors"
                >
                  أنشئ حساباً جديداً
                  <ArrowRight
                    size={16}
                    className="inline-block mr-1 rotate-180"
                  />
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
