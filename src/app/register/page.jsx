// src/app/register/page.js
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Phone, MapPin, GraduationCap, ArrowRight, Lock, 
  Eye, EyeOff, ShieldCheck, Mail, AlertCircle, Loader2, 
  CheckCircle, Key, BookOpen, Info, Check, X, Home, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase/config";
import { sendEmailVerification } from "firebase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: "", surname: "", email: "", phone: "", wilaya: "",
    password: "", confirmPassword: "",
    level: "", year: "", branchType: "",
    specialty: "", subSpecialty: "", thirdLanguage: "",
  });

  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);

  const { 
    loading, 
    error, 
    success, 
    register, 
    clearError, 
    clearSuccess 
  } = useAuthStore();

  const algerianWilayas = [
    "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار",
    "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر",
    "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة",
    "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة", "وهران", "البيض",
    "اليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي",
    "خنشلة", "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت",
    "غرداية", "غليزان"
  ];

  const checkPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    
    let score = 0;
    if (checks.length) score += 25;
    if (checks.uppercase) score += 25;
    if (checks.number) score += 25;
    if (checks.special) score += 25;
    
    setPasswordChecks(checks);
    setPasswordStrength(score);
    
    return { checks, score };
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(05|06|07)[0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (error) {
      clearError();
    }
    
    if (name === "password") {
      checkPasswordStrength(value);
      
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setFormErrors(prev => ({ 
          ...prev, 
          confirmPassword: "كلمتا المرور غير متطابقتين" 
        }));
      } else if (formErrors.confirmPassword) {
        setFormErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }
    
    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setFormErrors(prev => ({ 
          ...prev, 
          confirmPassword: "كلمتا المرور غير متطابقتين" 
        }));
      } else {
        setFormErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }
    
    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setFormErrors(prev => ({ 
          ...prev, 
          email: "البريد الإلكتروني غير صالح" 
        }));
      }
    }
    
    if (name === "phone" && value) {
      if (!validatePhoneNumber(value)) {
        setFormErrors(prev => ({ 
          ...prev, 
          phone: "رقم الهاتف غير صالح. يجب أن يبدأ بـ 05، 06، أو 07 ويتكون من 10 أرقام" 
        }));
      }
    }

    if (name === "level") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value, 
        year: "", 
        branchType: "", 
        specialty: "", 
        subSpecialty: "", 
        thirdLanguage: "" 
      }));
    } else if (name === "year") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value, 
        branchType: "", 
        specialty: "", 
        subSpecialty: "", 
        thirdLanguage: "" 
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    const requiredFields = ['name', 'surname', 'email', 'phone', 'wilaya', 'password', 'confirmPassword', 'level'];
    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        const fieldNames = {
          'name': 'الاسم',
          'surname': 'اللقب',
          'email': 'البريد الإلكتروني',
          'phone': 'رقم الهاتف',
          'wilaya': 'الولاية',
          'password': 'كلمة المرور',
          'confirmPassword': 'تأكيد كلمة المرور',
          'level': 'المستوى الدراسي'
        };
        errors[field] = `حقل ${fieldNames[field]} مطلوب`;
      }
    });
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = "البريد الإلكتروني غير صالح";
    }
    
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      errors.phone = "رقم الهاتف غير صالح. يجب أن يبدأ بـ 05، 06، أو 07 ويتكون من 10 أرقام";
    }
    
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "كلمتا المرور غير متطابقتين";
    }
    
    if (formData.password && passwordStrength < 75) {
      errors.password = "كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، رقم ورمز";
    }
    
    if (formData.level === "secondary") {
      if (!formData.year) errors.year = "السنة الدراسية مطلوبة";
      if (!formData.branchType) errors.branchType = "الشعبة مطلوبة";
      if (formData.branchType === "science_main" && !formData.specialty) errors.specialty = "التخصص مطلوب";
      if (formData.specialty === "tech" && !formData.subSpecialty) errors.subSpecialty = "فرع الهندسة مطلوب";
      if (formData.specialty === "lang" && !formData.thirdLanguage) errors.thirdLanguage = "اللغة الثالثة مطلوبة";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── إعادة إرسال بريد التحقق ─────────────────────────────────────────────
  const handleResendEmail = async () => {
    setResending(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser, {
          url: window.location.origin + "/login",
        });
        useAuthStore.setState({ success: "تم إرسال رابط التحقق مرة أخرى!" });
        setTimeout(() => clearSuccess(), 4000);
      }
    } catch {
      useAuthStore.setState({ error: "فشل إرسال الإيميل، حاول بعد دقيقة" });
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      useAuthStore.setState({ error: "يرجى تصحيح الأخطاء في النموذج" });
      return;
    }
    
    clearError();
    clearSuccess();

    try {

      
      const result = await register(formData);
      
      if (!result.success) {
        throw new Error(result.error || "فشل في إنشاء الحساب");
      }

      // ✅ إرسال بريد التحقق من الإيميل
      try {
        const currentUser = auth.currentUser;
        if (currentUser && !currentUser.emailVerified) {
          await sendEmailVerification(currentUser, {
            url: window.location.origin + "/login",
          });
        }
      } catch (verErr) {
        // لا نوقف العملية إذا فشل إرسال الإيميل
      }

      setEmailSent(true);
      
    } catch (err) {

    }
  };

  const inputStyle = "w-full pr-12 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const labelStyle = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 mr-1";
  const errorStyle = "text-red-500 text-xs mt-1 mr-1 flex items-center gap-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 md:p-12"
      >
        {/* زر العودة */}
        <div className="flex justify-end mb-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-400 hover:text-primary text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-primary/10 dark:hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-all"
          >
            <Home size={15} />
            الرئيسية
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-blue-600 rounded-2xl shadow-lg mb-4">
            <GraduationCap className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2">
            انضم إلى رحلتنا التعليمية
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            سجل الآن وابدأ رحلة التفوق الدراسي
          </p>
        </div>

        {/* ─── شاشة التحقق من الإيميل ─── */}
        {emailSent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl text-center space-y-4"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto">
              <Mail size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-lg text-blue-800 dark:text-blue-300">
                تحقق من بريدك الإلكتروني 📧
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 leading-relaxed">
                أرسلنا رابط تفعيل إلى
                <span className="font-bold block mt-1">{formData.email}</span>
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-500 mt-2">
                افتح بريدك وانقر على الرابط لتفعيل حسابك، ثم ادخل لصفحة الدفع
              </p>
            </div>

            {/* زر إعادة الإرسال */}
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resending}
              className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {resending
                ? <><Loader2 size={15} className="animate-spin" /> جاري الإرسال...</>
                : <><RefreshCw size={15} /> إعادة إرسال الرابط</>
              }
            </button>

            {/* زر الانتقال للدفع */}
            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-500 mb-2">فعّلت إيميلك بالفعل؟</p>
              <button
                type="button"
                onClick={() => router.push('/payment')}
                className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-hover transition-all"
              >
                <ArrowRight size={15} className="rotate-180" />
                المتابعة لصفحة الدفع
              </button>
            </div>
          </motion.div>
        )}

        {/* رسالة النجاح العادية — تظهر فقط إذا لم يُرسل إيميل */}
        {success && !emailSent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={24} />
              <div>
                <h3 className="font-bold">✅ تم إنشاء الحساب بنجاح!</h3>
                <p className="text-sm mt-1">جاري التوجيه لصفحة الدفع...</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* رسالة الخطأ العامة */}
        {error && !success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold">❌ حدث خطأ</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* معلومات الأمان */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">أمان متقدم</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            🔐 كلمة المرور مشفرة ولا يتم تخزينها في قاعدة البيانات<br/>
            ☁️ بياناتك محفوظة في سحابة Google الآمنة<br/>
            🔒 تحقق مزدوج من جميع البيانات
          </p>
        </div>

        {!emailSent && <form onSubmit={handleSubmit} className="space-y-6">
          {/* الاسم واللقب */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className={labelStyle}>
                الاسم <span className="text-red-500">*</span>
              </label>
              <User className="absolute right-4 top-[46px] text-gray-400" size={20} />
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                required 
                onChange={handleChange}
                className={`${inputStyle} ${formErrors.name ? 'border-red-500' : ''}`}
                placeholder="اسمك"
                disabled={loading || success}
              />
              {formErrors.name && (
                <p className={errorStyle}><AlertCircle size={12} />{formErrors.name}</p>
              )}
            </div>
            <div className="relative">
              <label className={labelStyle}>
                اللقب <span className="text-red-500">*</span>
              </label>
              <User className="absolute right-4 top-[46px] text-gray-400" size={20} />
              <input 
                type="text" 
                name="surname" 
                value={formData.surname} 
                required 
                onChange={handleChange}
                className={`${inputStyle} ${formErrors.surname ? 'border-red-500' : ''}`}
                placeholder="لقبك"
                disabled={loading || success}
              />
              {formErrors.surname && (
                <p className={errorStyle}><AlertCircle size={12} />{formErrors.surname}</p>
              )}
            </div>
          </div>

          {/* البريد الإلكتروني والهاتف */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className={labelStyle}>
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
              <Mail className="absolute right-4 top-[46px] text-gray-400" size={20} />
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                required 
                onChange={handleChange}
                className={`${inputStyle} ${formErrors.email ? 'border-red-500' : ''}`}
                placeholder="example@email.com"
                disabled={loading || success}
              />
              {formErrors.email && (
                <p className={errorStyle}><AlertCircle size={12} />{formErrors.email}</p>
              )}
            </div>
            <div className="relative">
              <label className={labelStyle}>
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <Phone className="absolute right-4 top-[46px] text-gray-400" size={20} />
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                required 
                onChange={handleChange}
                className={`${inputStyle} ${formErrors.phone ? 'border-red-500' : ''}`}
                placeholder="05XX XX XX XX"
                disabled={loading || success}
              />
              {formErrors.phone && (
                <p className={errorStyle}><AlertCircle size={12} />{formErrors.phone}</p>
              )}
              <p className="text-xs text-gray-500 mt-1 mr-1">
                مثال: 05XX XX XX XX أو 06XX XX XX XX أو 07XX XX XX XX
              </p>
            </div>
          </div>

          {/* الولاية */}
          <div className="relative">
            <label className={labelStyle}>
              الولاية <span className="text-red-500">*</span>
            </label>
            <MapPin className="absolute right-4 top-[46px] text-gray-400" size={20} />
            <select 
              name="wilaya" 
              value={formData.wilaya} 
              required 
              onChange={handleChange}
              className={`${inputStyle} ${formErrors.wilaya ? 'border-red-500' : ''} appearance-none`}
              disabled={loading || success}
            >
              <option value="">اختر ولايتك</option>
              {algerianWilayas.sort().map((wilaya) => (
                <option key={wilaya} value={wilaya}>{wilaya}</option>
              ))}
            </select>
            {formErrors.wilaya && (
              <p className={errorStyle}><AlertCircle size={12} />{formErrors.wilaya}</p>
            )}
          </div>

          {/* كلمة المرور */}
          <div className="relative">
            <label className={labelStyle}>
              كلمة المرور <span className="text-red-500">*</span>
            </label>
            <Lock className="absolute right-4 top-[46px] text-gray-400" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              value={formData.password}
              required 
              onChange={handleChange}
              className={`${inputStyle} ${formErrors.password ? 'border-red-500' : ''}`}
              placeholder="••••••••"
              disabled={loading || success}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute left-4 top-[46px] text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading || success}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {formErrors.password && (
              <p className={errorStyle}><AlertCircle size={12} />{formErrors.password}</p>
            )}
          </div>

          {/* تأكيد كلمة المرور */}
          <div className="relative">
            <label className={labelStyle}>
              تأكيد كلمة المرور <span className="text-red-500">*</span>
            </label>
            <Key className="absolute right-4 top-[46px] text-gray-400" size={20} />
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              name="confirmPassword" 
              value={formData.confirmPassword}
              required 
              onChange={handleChange}
              className={`${inputStyle} ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="••••••••"
              disabled={loading || success}
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
              className="absolute left-4 top-[46px] text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading || success}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {formErrors.confirmPassword && (
              <p className={errorStyle}><AlertCircle size={12} />{formErrors.confirmPassword}</p>
            )}
          </div>

          {/* شريط قوة كلمة المرور */}
          <div className="mt-2 px-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-gray-400">قوة كلمة المرور</span>
              <span className="text-[10px] font-bold" style={{ 
                color: passwordStrength <= 25 ? '#ef4444' : 
                       passwordStrength <= 75 ? '#f59e0b' : '#10b981' 
              }}>
                {passwordStrength <= 25 ? 'ضعيفة جداً' : 
                 passwordStrength <= 50 ? 'ضعيفة' :
                 passwordStrength <= 75 ? 'متوسطة' : 'قوية جداً'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${passwordStrength}%` }}
                className="h-full"
                style={{ 
                  backgroundColor: passwordStrength <= 25 ? '#ef4444' : 
                                 passwordStrength <= 50 ? '#f59e0b' :
                                 passwordStrength <= 75 ? '#fbbf24' : '#10b981' 
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordChecks.length ? <Check size={12} /> : <X size={12} />}
                <span className="text-xs">8 أحرف على الأقل</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordChecks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordChecks.uppercase ? <Check size={12} /> : <X size={12} />}
                <span className="text-xs">حرف كبير (A-Z)</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordChecks.number ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordChecks.number ? <Check size={12} /> : <X size={12} />}
                <span className="text-xs">رقم واحد على الأقل</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordChecks.special ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordChecks.special ? <Check size={12} /> : <X size={12} />}
                <span className="text-xs">رمز خاص (@#$%...)</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* المستوى الدراسي */}
          <div className="space-y-6">
            <div className="relative">
              <label className={labelStyle}>
                المستوى الدراسي <span className="text-red-500">*</span>
              </label>
              <GraduationCap className="absolute right-4 top-[46px] text-gray-400" size={20} />
              <select 
                name="level" 
                value={formData.level} 
                required 
                onChange={handleChange}
                className={`${inputStyle} ${formErrors.level ? 'border-red-500' : ''} appearance-none`}
                disabled={loading || success}
              >
                <option value="">اختر المستوى الدراسي</option>
                <option value="middle">الطور المتوسط</option>
                <option value="secondary">الطور الثانوي</option>
              </select>
              {formErrors.level && (
                <p className={errorStyle}><AlertCircle size={12} />{formErrors.level}</p>
              )}
            </div>

            <AnimatePresence>
              {formData.level === "secondary" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="space-y-6 overflow-hidden"
                >
                  <div>
                    <label className={labelStyle}>
                      السنة الدراسية <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="year" 
                      value={formData.year} 
                      required 
                      onChange={handleChange}
                      className={`${inputStyle} ${formErrors.year ? 'border-red-500' : ''}`}
                      disabled={loading || success}
                    >
                      <option value="">اختر السنة الدراسية</option>
                      <option value="1sec">السنة الأولى ثانوي</option>
                      <option value="2sec">السنة الثانية ثانوي</option>
                      <option value="3sec">السنة الثالثة ثانوي</option>
                    </select>
                    {formErrors.year && (
                      <p className={errorStyle}><AlertCircle size={12} />{formErrors.year}</p>
                    )}
                  </div>

                  {formData.year && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className={labelStyle}>
                          الشعبة / التخصص <span className="text-red-500">*</span>
                        </label>
                        <select 
                          name="branchType" 
                          value={formData.branchType} 
                          required 
                          onChange={handleChange}
                          className={`${inputStyle} ${formErrors.branchType ? 'border-red-500' : ''}`}
                          disabled={loading || success}
                        >
                          <option value="">اختر الشعبة</option>
                          {formData.year === "1sec" ? (
                            <>
                              <option value="science">جذع مشترك علوم وتكنولوجيا</option>
                              <option value="arts">جذع مشترك آداب</option>
                            </>
                          ) : (
                            <>
                              <option value="science_main">الشعب العلمية</option>
                              <option value="arts_main">الشعب الأدبية</option>
                            </>
                          )}
                        </select>
                        {formErrors.branchType && (
                          <p className={errorStyle}><AlertCircle size={12} />{formErrors.branchType}</p>
                        )}
                      </div>

                      {formData.branchType === "science_main" && (
                        <div>
                          <label className={labelStyle}>
                            التخصص <span className="text-red-500">*</span>
                          </label>
                          <select 
                            name="specialty" 
                            value={formData.specialty} 
                            required 
                            onChange={handleChange}
                            className={`${inputStyle} ${formErrors.specialty ? 'border-red-500' : ''}`}
                            disabled={loading || success}
                          >
                            <option value="">حدد التخصص</option>
                            <option value="علوم تجريبية">علوم تجريبية</option>
                            <option value="رياضيات">رياضيات</option>
                            <option value="tech">تقني رياضي</option>
                            <option value="تسيير واقتصاد">تسيير واقتصاد</option>
                          </select>
                          {formErrors.specialty && (
                            <p className={errorStyle}><AlertCircle size={12} />{formErrors.specialty}</p>
                          )}
                        </div>
                      )}

                      {formData.specialty === "tech" && (
                        <div>
                          <label className={labelStyle}>
                            فرع الهندسة <span className="text-red-500">*</span>
                          </label>
                          <select 
                            name="subSpecialty" 
                            value={formData.subSpecialty} 
                            required 
                            onChange={handleChange}
                            className={`${inputStyle} ${formErrors.subSpecialty ? 'border-red-500' : ''}`}
                            disabled={loading || success}
                          >
                            <option value="">حدد فرع الهندسة</option>
                            <option value="هندسة كهربائية">هندسة كهربائية</option>
                            <option value="هندسة ميكانيكية">هندسة ميكانيكية</option>
                            <option value="هندسة مدنية">هندسة مدنية</option>
                            <option value="هندسة الطرائق">هندسة الطرائق</option>
                          </select>
                          {formErrors.subSpecialty && (
                            <p className={errorStyle}><AlertCircle size={12} />{formErrors.subSpecialty}</p>
                          )}
                        </div>
                      )}

                      {formData.branchType === "arts_main" && (
                        <div>
                          <label className={labelStyle}>
                            التخصص <span className="text-red-500">*</span>
                          </label>
                          <select 
                            name="specialty" 
                            value={formData.specialty} 
                            required 
                            onChange={handleChange}
                            className={`${inputStyle} ${formErrors.specialty ? 'border-red-500' : ''}`}
                            disabled={loading || success}
                          >
                            <option value="">حدد التخصص</option>
                            <option value="آداب وفلسفة">آداب وفلسفة</option>
                            <option value="lang">لغات أجنبية</option>
                          </select>
                          {formErrors.specialty && (
                            <p className={errorStyle}><AlertCircle size={12} />{formErrors.specialty}</p>
                          )}
                        </div>
                      )}

                      {formData.specialty === "lang" && (
                        <div>
                          <label className={labelStyle}>
                            اللغة الثالثة <span className="text-red-500">*</span>
                          </label>
                          <select 
                            name="thirdLanguage" 
                            value={formData.thirdLanguage} 
                            required 
                            onChange={handleChange}
                            className={`${inputStyle} ${formErrors.thirdLanguage ? 'border-red-500' : ''}`}
                            disabled={loading || success}
                          >
                            <option value="">اختر اللغة الثالثة</option>
                            <option value="ألمانية">ألمانية</option>
                            <option value="إسبانية">إسبانية</option>
                            <option value="إيطالية">إيطالية</option>
                            <option value="فرنسية">فرنسية</option>
                          </select>
                          {formErrors.thirdLanguage && (
                            <p className={errorStyle}><AlertCircle size={12} />{formErrors.thirdLanguage}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {formData.level === "middle" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-green-600" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      تم تحديدك كطالب في الطور المتوسط. ستحصل على جميع المواد المناسبة لمستواك الدراسي.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* معلومات الدفع */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Info size={18} className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">معلومة مهمة</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              💰 بعد إنشاء الحساب، ستتوجه مباشرة إلى صفحة الدفع لدفع رسوم الاشتراك (5000 د.ج)<br/>
              ⏳ سيتم تفعيل حسابك خلال 24 ساعة بعد التحقق من الدفع<br/>
              📚 بمجرد التفعيل، ستحصل على كامل المحتوى الدراسي المناسب لمستواك
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                جاري إنشاء الحساب...
              </>
            ) : success ? (
              <>
                <CheckCircle size={20} />
                تم إنشاء الحساب بنجاح
              </>
            ) : (
              <>
                إنشاء الحساب والمتابعة للدفع
                <ArrowRight size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />
              </>
            )}
            <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          </button>

          {/* رابط تسجيل الدخول */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              لديك حساب بالفعل؟{" "}
              <Link 
                href="/login" 
                className="text-primary font-semibold hover:underline transition-colors"
              >
                تسجيل الدخول
              </Link>
            </p>
          </div>

          {/* سياسة الخصوصية */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              بمجرد التسجيل، فإنك توافق على{" "}
              <Link href="/terms" className="text-primary hover:underline">شروط الخدمة</Link>
              {" "}و{" "}
              <Link href="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>
            </p>
          </div>
        </form>}
      </motion.div>
    </div>
  );
}