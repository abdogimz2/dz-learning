// src/app/payment/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, CreditCard, AlertCircle, CheckCircle, ArrowLeft, FileText, X, Shield, Receipt, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

// استيراد خدمات Firebase
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";

export default function PaymentPage() {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const router = useRouter();
  
  // Get user from Zustand store
  const user = useAuthStore((state)=>state.user);

  // معلومات Cloudinary الخاصة بك
  const CLOUDINARY_CLOUD_NAME = "dm2hx997l";
  const CLOUDINARY_UPLOAD_PRESET = "dz_learning";


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      if (!validTypes.includes(selectedFile.type)) {
        setError("يرجى رفع صورة (JPG, PNG) أو ملف PDF فقط");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("حجم الملف كبير جداً، الحد الأقصى 5MB");
        return;
      }
      setFile(selectedFile);
      setError("");
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError("يرجى رفع إيصال الدفع");
      return;
    }

    if (!paymentDetails) {
      setError("لم يتم تحميل بيانات الدفع. يرجى إعادة تحميل الصفحة");
      return;
    }

    if (!paymentDetails.userId) {
      setError("معرف المستخدم غير موجود. يرجى إعادة التسجيل");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Validate user ID
      if (!user) {
        throw new Error("لم يتم العثور على  المستخدم ");
      }

      // 1. الرفع إلى Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      console.log("📤 Uploading file to Cloudinary...");
      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const cloudinaryData = await cloudinaryRes.json();
      
      if (!cloudinaryData.secure_url) {
        throw new Error("فشل رفع الصورة. تأكد من اتصال الإنترنت");
      }

      console.log("✅ File uploaded to Cloudinary:", cloudinaryData.secure_url);

      // 2. تجهيز بيانات الطلب لـ Firebase
      const paymentInfo = {
        userId: user.id,
        userEmail: user.email || user.userEmail || "no-email",
        userName: `${user.name} ${user.surname}`,
        receiptUrl: cloudinaryData.secure_url,
        amount: paymentDetails.amount,
        status: 'pending',
        reference: paymentDetails.reference,
        level: user.level,
        specialty: user.specialty || user.branchType,
        createdAt: serverTimestamp(),
      };

      console.log("📤 Submitting payment to Firebase:", paymentInfo);

      // Save to Firestore
      const paymentRef = await addDoc(collection(db, "payments"), paymentInfo);
      console.log("✅ Payment document created with ID:", paymentRef.id);

      // Update user document in Firestore
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        paymentStatus: "submitted",
        paymentReference: paymentDetails.reference,
        paymentSubmittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log("✅ User document updated with payment status");

      
      // Update Zustand store if user exists
      if (user) {
        useAuthStore.setState(state => ({
          user: {
            ...state.user,
            paymentStatus: "submitted",
            status: "pending_verification",
            paymentReference: paymentDetails.reference
          }
        }));
      }



      // 3. تفعيل واجهة النجاح والتحويل
      setSubmitted(true);
      
      setTimeout(() => {
        router.push('/waiting-verification');
      }, 2000);

    } catch (err) {
      console.error("❌ Payment submission error:", err);
      setError(`حدث خطأ: ${err.message || "فشل الاتصال بالخادم"}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if(!user) return

    const amount = user.level === 'middle' ? '4000' : '5000';
    const levelDisplay = user.level === 'middle' ? 'التعليم المتوسط' : 'التعليم الثانوي';
    setPaymentDetails({
      amount,
      accountNumber: '123 456 789 00',
      accountName: 'منصة التعليم الجزائرية',
      bankName: 'البنك الجزائري',
      level: levelDisplay,
      specialty: user.specialty || user.branchType || 'غير محدد',
      reference: `PAY-${Date.now().toString().slice(-8)}`,
      userId: user.id,
      userName: `${user.name} ${user.surname}`,
      userEmail: user.email
    });
  }, [user]);
console.log("user",user)
  // Show loading state while fetching payment details
  if (!paymentDetails && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-bold">جاري تحميل بيانات الدفع...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            {user ? "✅ استخدام بيانات من متجر الحالة" : "ℹ️ جارٍ تحميل البيانات المحفوظة"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        {/* Header - التصميم المتناسق الأصلي */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-secondary"></div>
          <div className="absolute top-0 left-0 w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative p-8 md:p-10 text-white text-center">
            <div className="flex items-center justify-between mb-8">
              <Link href="/register" className="flex items-center gap-2 text-white/90 hover:text-white transition-all duration-300 hover:scale-105">
                <ArrowLeft size={24} />
                <span className="hidden md:inline font-bold">رجوع</span>
              </Link>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm shadow-inner">
                <Shield size={40} className="text-white" />
              </div>
              <div className="w-10"></div> 
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-4">إكمال عملية التسجيل</h1>
            <p className="text-white/90 text-lg md:text-xl font-medium">رفع إيصال الدفع لتفعيل حسابك</p>
            {paymentDetails && (
              <div className="mt-4 text-white/70 text-sm">
                <p>المستخدم: {paymentDetails.userName}</p>
                <p>المستوى: {paymentDetails.level}</p>
                <p className="text-xs mt-1">ID: {paymentDetails.userId}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          {error && !paymentDetails ? (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-black text-red-700 dark:text-red-300 mb-4">خطأ في تحميل البيانات</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => router.push('/register')}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                العودة للتسجيل
              </button>
            </motion.div>
          ) : submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 md:py-12">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
                <CheckCircle size={50} className="text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-200 mb-4 md:mb-5">تم إرسال طلب التفعيل بنجاح</h2>
              <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mb-6 md:mb-8 leading-relaxed max-w-2xl mx-auto">سيتم مراجعة إيصال الدفع من قبل الإدارة وسيتم تفعيل حسابك خلال 24 ساعة كحد أقصى</p>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-primary font-bold animate-pulse">الانتقال إلى صفحة الانتظار...</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-800 dark:text-red-300 p-4 rounded-2xl flex items-center gap-2 font-bold shadow-sm">
                  <AlertCircle size={20} /> {error}
                </motion.div>
              )}

              {/* معلومات الدفع الكارد المتناسق */}
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-blue-50 to-secondary/10 dark:from-blue-900/20 dark:to-secondary/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <h3 className="text-xl font-black text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg"><Info className="text-secondary" size={24} /></div>
                  معلومات الدفع
                </h3>
                <div className="space-y-3 text-right text-gray-700 dark:text-gray-300 text-sm md:text-base">
                  <p className="flex justify-between items-center border-b border-blue-100 dark:border-blue-900 pb-2">المبلغ المطلوب: <span className="font-black text-red-600 dark:text-red-400">{paymentDetails?.amount} د.ج</span></p>
                  <p className="flex justify-between items-center border-b border-blue-100 dark:border-blue-900 pb-2">المستوى: <span className="font-semibold">{paymentDetails?.level}</span></p>
                  <p className="flex justify-between items-center border-b border-blue-100 dark:border-blue-900 pb-2">رقم الحساب الجاري: <span className="font-mono font-black bg-white dark:bg-gray-800 px-2 rounded shadow-sm">{paymentDetails?.accountNumber}</span></p>
                  <p className="flex justify-between items-center">الرقم المرجعي: <span className="font-mono text-primary font-black">{paymentDetails?.reference}</span></p>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    💡 <strong>ملاحظة:</strong> الرجاء كتابة الرقم المرجعي في ملاحظة التحويل أو على الإيصال لتسهيل عملية المطابقة.
                  </p>
                </div>
              </motion.div>

              {/* صندوق الرفع (Upload Box) المفضل لديك */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className={`border-3 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${file ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary bg-gray-50 dark:bg-gray-800/50'}`}>
                  {file ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="text-primary flex-shrink-0" />
                          <span className="text-sm font-bold truncate max-w-[150px] md:max-w-[300px]">{file.name}</span>
                        </div>
                        <X className="text-red-500 cursor-pointer hover:scale-110 transition-transform" onClick={removeFile} />
                      </div>
                      {filePreview && (
                        <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-xl border-2 border-white shadow-xl" />
                      )}
                    </div>
                  ) : (
                    <label htmlFor="receipt" className="cursor-pointer group">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner">
                        <Upload className="text-gray-400 group-hover:text-primary" size={32} />
                      </div>
                      <span className="bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 inline-block hover:bg-primary-hover transition-all">اختيار صورة الوصل</span>
                      <input type="file" id="receipt" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                      <p className="text-gray-400 text-xs mt-4 font-medium">PNG, JPG أو PDF (بحد أقصى 5 ميجابايت)</p>
                    </label>
                  )}
                </div>
              </motion.div>

              {/* زر الإرسال المتناسق */}
              <motion.button 
                type="submit" 
                disabled={loading || !file || !paymentDetails}
                className={`w-full py-5 text-white font-black text-xl rounded-2xl transition-all duration-300 flex justify-center items-center gap-3 shadow-2xl ${loading || !file || !paymentDetails ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-secondary hover:translate-y-[-4px] active:translate-y-[0px] shadow-primary/30 hover:shadow-primary/50'}`}
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={24} /> <span>جاري المعالجة...</span></>
                ) : (
                  <><CheckCircle size={24} /> <span>إرسال طلب التفعيل</span></>
                )}
              </motion.button>

              <div className="text-center">
                <p className="text-xs text-gray-500 font-bold">من خلال الضغط على إرسال، أنت تؤكد صحة عملية الدفع المرفقة.</p>
                <p className="text-xs text-gray-400 mt-1">
                  {user ? "✅ البيانات مأخوذة من حسابك المسجل" : "ℹ️ استخدام البيانات المحفوظة مؤقتاً"}
                </p>
                {paymentDetails?.userId && (
                  <p className="text-xs text-gray-400 mt-1">User ID: {paymentDetails.userId}</p>
                )}
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}