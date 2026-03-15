// src/app/payment/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload, Shield, AlertCircle, CheckCircle, ArrowLeft,
  FileText, X, Receipt, Info, Loader2, LogOut,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase/config";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "dm2hx997l";
const CLOUDINARY_UPLOAD_PRESET = "dz_learning";

export default function PaymentPage() {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [resending, setResending] = useState(false);

  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  // ─── حماية الصفحة ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/register");
      return;
    }
    if (user.status === "active") {
      router.replace("/dashboard");
      return;
    }
    if (user.paymentStatus === "submitted") {
      router.replace("/waiting-verification");
    }
  }, [isAuthenticated, user, router]);

  // ─── التحقق من تفعيل الإيميل ─────────────────────────────────────────────
  useEffect(() => {
    const checkEmail = async () => {
      setCheckingVerification(true);
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // reload لجلب أحدث حالة من Firebase
          await currentUser.reload();
          setEmailVerified(currentUser.emailVerified);
        }
      } catch {
        setEmailVerified(false);
      } finally {
        setCheckingVerification(false);
      }
    };
    if (isAuthenticated) checkEmail();
  }, [isAuthenticated]);

  // ─── إعادة إرسال بريد التحقق ─────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const { sendEmailVerification } = await import("firebase/auth");
        await sendEmailVerification(currentUser, {
          url: window.location.origin + "/payment",
        });
        setError("");
        alert("تم إرسال رابط التحقق! تحقق من بريدك ثم اضغط 'لقد فعّلت إيميلي'");
      }
    } catch {
      setError("فشل إرسال الإيميل، حاول بعد دقيقة");
    } finally {
      setResending(false);
    }
  };

  // ─── التحقق اليدوي بعد ضغط الزر ────────────────────────────────────────
  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        const verified = currentUser.emailVerified;
        setEmailVerified(verified);
        if (!verified) setError("لم يتم تفعيل الإيميل بعد، تحقق من بريدك وانقر الرابط");
        else setError("");
      }
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setCheckingVerification(false);
    }
  };

  // ─── حساب المبلغ ─────────────────────────────────────────────────────────
  const amount = user?.level === "middle" ? "4000" : "5000";
  const levelLabel = user?.level === "middle" ? "التعليم المتوسط" : "التعليم الثانوي";
  const reference = `PAY-${user?.id?.slice(-6) || Date.now().toString().slice(-6)}`;

  // ─── File handlers ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(selected.type)) {
      setError("يرجى رفع صورة (JPG, PNG) أو ملف PDF فقط");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("حجم الملف كبير جداً، الحد الأقصى 5MB");
      return;
    }

    setFile(selected);
    setError("");

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setError("");
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("يرجى رفع إيصال الدفع"); return; }
    if (!user?.id) { setError("حدث خطأ في بيانات المستخدم. يرجى تسجيل الدخول مجدداً"); return; }

    setUploading(true);
    setError("");

    try {
      // 1. رفع الملف لـ Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const cloudData = await cloudRes.json();

      if (!cloudData.secure_url) {
        throw new Error("فشل رفع الصورة. تأكد من اتصال الإنترنت وحاول مجدداً");
      }

      // 2. حفظ طلب الدفع في Firestore
      await addDoc(collection(db, "payments"), {
        userId: user.id,
        userEmail: user.email,
        userName: `${user.name} ${user.surname}`,
        receiptUrl: cloudData.secure_url,
        amount,
        reference,
        level: user.level,
        specialty: user.specialty || user.branchType || "",
        year: user.year || "",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // 3. تحديث حالة المستخدم في Firestore
      await updateDoc(doc(db, "users", user.id), {
        paymentStatus: "submitted",
        paymentReference: reference,
        paymentSubmittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4. تحديث Zustand
      useAuthStore.setState((state) => ({
        user: {
          ...state.user,
          paymentStatus: "submitted",
          status: "waiting_verification",
        },
      }));

      setSubmitted(true);
      setTimeout(() => router.push("/waiting-verification"), 2000);
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "حدث خطأ. حاول مرة أخرى");
    } finally {
      setUploading(false);
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── شاشة التحميل ──────────────────────────────────────────────────────
  if (checkingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── شاشة حجب الدفع — الإيميل غير مفعّل ──────────────────────────────────
  if (!emailVerified) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <Receipt size={36} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">
              أكمل تفعيل إيميلك أولاً
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              أرسلنا رابط تفعيل إلى بريدك الإلكتروني. افتح الإيميل وانقر على الرابط قبل المتابعة للدفع.
            </p>
            {user?.email && (
              <p className="font-bold text-primary mt-2 text-sm">{user.email}</p>
            )}
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={checkingVerification}
              className="w-full py-3.5 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checkingVerification
                ? <><Loader2 size={18} className="animate-spin" /> جاري التحقق...</>
                : <><CheckCircle size={18} /> لقد فعّلت إيميلي</>
              }
            </button>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {resending
                ? <><Loader2 size={15} className="animate-spin" /> جاري الإرسال...</>
                : "لم يصلني الإيميل — أعد الإرسال"
              }
            </button>

            {/* زر تسجيل الخروج */}
            <button
              onClick={handleLogout}
              className="w-full py-3 border-2 border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 font-bold rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <LogOut size={15} /> تسجيل الخروج
            </button>
          </div>
          <p className="text-xs text-gray-400">
            تحقق من مجلد Spam إذا لم يصلك الإيميل
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 md:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/register"
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">رجوع</span>
              </Link>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Shield size={32} className="text-white" />
              </div>
              <div className="w-16" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black mb-2">إكمال عملية التسجيل</h1>
              <p className="text-white/80">رفع إيصال الدفع لتفعيل حسابك</p>
              <p className="text-white/60 text-sm mt-1">
                {user.name} {user.surname} • {levelLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {submitted ? (
            // ─── نجاح ───
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-primary" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-gray-200 mb-3">
                تم إرسال طلب التفعيل بنجاح!
              </h2>
              <p className="text-gray-500 mb-6">
                سيتم مراجعة إيصال الدفع وتفعيل حسابك خلال 24 ساعة.
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-primary font-bold animate-pulse">جاري التوجيه...</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-2xl flex items-center gap-3"
                >
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}

              {/* معلومات الدفع */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={20} className="text-secondary" />
                  <h3 className="font-bold text-blue-800 dark:text-blue-300 text-lg">
                    معلومات الدفع
                  </h3>
                </div>
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: "المبلغ المطلوب", value: `${amount} د.ج`, highlight: true },
                    { label: "المستوى", value: levelLabel },
                    { label: "رقم الحساب الجاري", value: "123 456 789 00", mono: true },
                    { label: "الرقم المرجعي", value: reference, mono: true, primary: true },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-1.5 border-b border-blue-100 dark:border-blue-900 last:border-0"
                    >
                      <span className="text-gray-600 dark:text-gray-400">{row.label}:</span>
                      <span
                        className={`font-bold ${
                          row.highlight
                            ? "text-red-600 dark:text-red-400 text-base"
                            : row.primary
                            ? "text-primary"
                            : "text-gray-800 dark:text-gray-200"
                        } ${row.mono ? "font-mono" : ""}`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                  💡 اكتب الرقم المرجعي في ملاحظة التحويل لتسهيل المطابقة.
                </p>
              </div>

              {/* Upload Box */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  file
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-gray-300 dark:border-gray-700 hover:border-primary bg-gray-50 dark:bg-gray-800/50"
                }`}
              >
                {file ? (
                  <div className="space-y-4">
                    {/* File info */}
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="text-primary flex-shrink-0" size={20} />
                        <span className="text-sm font-bold truncate max-w-[200px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 hover:scale-110 transition-transform p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    {/* Preview */}
                    {filePreview && (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={filePreview}
                        alt="معاينة الوصل"
                        className="max-h-48 mx-auto rounded-xl border-2 border-white shadow-lg"
                      />
                    )}
                  </div>
                ) : (
                  <label htmlFor="receipt" className="cursor-pointer group block">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="text-gray-400 group-hover:text-primary" size={28} />
                    </div>
                    <span className="bg-primary text-white px-7 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 inline-block hover:bg-primary-hover transition-all">
                      اختيار صورة الوصل
                    </span>
                    <input
                      type="file"
                      id="receipt"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                    />
                    <p className="text-gray-400 text-xs mt-3">
                      PNG, JPG أو PDF — الحد الأقصى 5MB
                    </p>
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !file}
                className={`w-full py-4 text-white font-black text-lg rounded-2xl flex justify-center items-center gap-3 transition-all shadow-lg ${
                  uploading || !file
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary to-secondary hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={22} />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Receipt size={22} />
                    إرسال طلب التفعيل
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                بالضغط على إرسال، أنت تؤكد صحة عملية الدفع المرفقة.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}