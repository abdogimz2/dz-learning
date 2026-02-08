// src/app/waiting-verification/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Mail, CheckCircle, Home, Shield, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function WaitingVerificationPage() {
  const [countdown, setCountdown] = useState(24 * 60 * 60); // 24 hours in seconds
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const userData = useAuthStore((state)=>state.user)

  useEffect(() => {
    // Get payment info from localStorage
    const paymentInfo = localStorage.getItem('payment_info');
    if (!paymentInfo) {
      router.push('/register');
      return;
    }
    
    
    // Calculate initial progress based on time
    const calculateProgress = () => {
      const elapsed = 24 * 60 * 60 - countdown;
      const percentage = Math.min((elapsed / (24 * 60 * 60)) * 100, 100);
      setProgress(percentage);
    };

    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          calculateProgress();
          return 0;
        }
        calculateProgress();
        return prev - 1;
      });
    }, 1000);

    calculateProgress(); // Initial calculation

    return () => clearInterval(timer);
  }, [router, countdown]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-secondary"></div>
          <div className="absolute top-0 left-0 w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative p-8 md:p-10 text-white text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm mb-6">
              <Shield size={48} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">طلبك قيد المراجعة</h1>
            <p className="text-white/90 text-lg md:text-xl opacity-90">
              نحن نعمل على تفعيل حسابك بأسرع وقت ممكن
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          <div className="text-center space-y-8">
            {/* Progress Bar and Timer */}
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-6 md:p-8"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <Clock className="text-primary dark:text-primary/80" size={28} />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">تتبع حالة الطلب</h3>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>تم بدء المراجعة</span>
                  <span>{Math.round(progress)}%</span>
                  <span>جاهز للتفعيل</span>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                  />
                </div>
              </div>
              
              {/* Timer */}
              <div className="space-y-3">
                <p className="text-gray-600 dark:text-gray-400 font-medium">الوقت المتبقي للتفعيل</p>
                <div className="text-5xl md:text-6xl font-mono font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  {formatTime(countdown)}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">سيتم تفعيل حسابك خلال 24 ساعة كحد أقصى</p>
              </div>
            </motion.div>

            {/* User Info Card */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
                معلومات حسابك
              </h3>
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">الاسم الكامل:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{userData.name} {userData.surname}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">البريد الإلكتروني:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{userData.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">المستوى الدراسي:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {userData.level === 'middle' ? 'التعليم المتوسط' : 'التعليم الثانوي'}
                  </span>
                </div>
                {userData.specialty && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">التخصص:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{userData.specialty}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">حالة الطلب:</span>
                  <span className="font-bold text-secondary dark:text-secondary/80 flex items-center gap-2">
                    <Clock size={16} />
                    قيد المراجعة
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Instructions */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-primary/10 dark:from-blue-900/20 dark:to-primary/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <Mail className="text-secondary dark:text-secondary/80" size={24} />
                  </div>
                  <div className="text-right flex-1">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3">تأكيد عبر البريد الإلكتروني</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      ستصلك رسالة تأكيد على بريدك الإلكتروني 
                      <span className="font-bold text-secondary dark:text-secondary/80 mx-1">{userData.email}</span>
                      عند اكتمال تفعيل حسابك.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-green-50 to-secondary/10 dark:from-green-900/20 dark:to-secondary/20 border border-green-200 dark:border-green-800 rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                    <CheckCircle className="text-primary dark:text-primary/80" size={24} />
                  </div>
                  <div className="text-right flex-1">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3">ماذا بعد التفعيل؟</h4>
                    <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-2 pr-5">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        الوصول الكامل لجميع المواد والدروس
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        المشاركة في الاختبارات والتقييمات
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        كسب النقاط والمنافسة في لوحة المتصدرين
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        التسوق في متجر النقاط
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Important Note */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-500" size={24} />
                </div>
                <div className="text-right flex-1">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">ملاحظة هامة</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    قد يستغرق تفعيل حسابك وقتاً أقل من 24 ساعة. سيتم إشعارك عبر البريد الإلكتروني فور اكتمال العملية.
                    في حال عدم وصول رسالة التأكيد، يرجى التحقق من مجلد البريد العشوائي (Spam).
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-6"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/" className="block w-full sm:w-auto">
                  <button className="w-full px-8 py-3.5 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-gray-950 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] focus:ring-2 focus:ring-gray-400 focus:outline-none">
                    <Home size={20} />
                    العودة للرئيسية
                  </button>
                </Link>
                
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto px-8 py-3.5 border-2 border-secondary text-secondary hover:bg-secondary/5 dark:hover:bg-secondary/10 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] focus:ring-2 focus:ring-secondary focus:outline-none"
                >
                  <RefreshCw size={20} />
                  تحديث الصفحة
                </button>
                
                <Link href="/contact" className="block w-full sm:w-auto">
                  <button className="w-full px-8 py-3.5 border-2 border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10 font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] focus:ring-2 focus:ring-primary focus:outline-none">
                    اتصل بالدعم
                  </button>
                </Link>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-gray-500 dark:text-gray-400">
                  للاستفسار: 
                  <a 
                    href="mailto:support@dz-learning.dz" 
                    className="text-secondary hover:text-secondary/80 hover:underline mx-2 transition-colors"
                  >
                    support@dz-learning.dz
                  </a>
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  فريق الدعم يعمل من السبت إلى الخميس، 8 صباحاً - 5 مساءً
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}