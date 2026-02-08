"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  User, 
  Clock, 
  CreditCard,
  Loader2,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // جلب الطلبات التي حالتها "pending" (قيد الانتظار) فقط
  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "payments"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  // وظيفة تفعيل الحساب (الموافقة)
  const handleApprove = async (paymentId, userId) => {
    setProcessingId(paymentId);
    try {
      // 1. تحديث حالة طلب الدفع
      await updateDoc(doc(db, "payments", paymentId), {
        status: "approved",
        reviewedAt: serverTimestamp(),
      });

      // 2. تفعيل المستخدم وتغيير رتبته ليصبح مشتركاً نشطاً
      await updateDoc(doc(db, "users", userId), {
        status: "active",
        isActive: true,
        paymentStatus: "paid",
        updatedAt: serverTimestamp()
      });

      alert("✅ تم تفعيل حساب الطالب بنجاح!");
      // تحديث القائمة لإزالة الطلب الذي تمت الموافقة عليه
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (error) {
      alert("❌ حدث خطأ أثناء التفعيل");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div dir="rtl" className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">طلبات التفعيل المعلقة</h1>
        <p className="text-gray-500 mt-2 text-lg">تحقق من وصولات الدفع وقم بتنشيط حسابات الطلاب.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-gray-500 font-bold">جاري جلب البيانات من الخادم...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {payments.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 text-center"
              >
                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">لا توجد طلبات جديدة</h3>
                <p className="text-gray-500 mt-2">كل الطلاب مفعلون حالياً. عمل ممتاز!</p>
              </motion.div>
            ) : (
              payments.map((payment) => (
                <motion.div
                  key={payment.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-5 w-full">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                      <User size={30} />
                    </div>
                    <div className="text-right">
                      <h3 className="font-black text-xl text-gray-800 dark:text-white">{payment.userName}</h3>
                      <p className="text-gray-500 text-sm">{payment.userEmail}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-md flex items-center gap-1">
                          <Clock size={12} /> قيد المراجعة
                        </span>
                        <span className="text-primary font-black text-sm">
                           المبلغ: {payment.amount} د.ج
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                    {/* زر معاينة الوصل */}
                    <a 
                      href={payment.receiptUrl} 
                      target="_blank" 
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-5 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
                    >
                      <ExternalLink size={18} /> معاينة الوصل
                    </a>

                    {/* زر التفعيل */}
                    <button
                      disabled={processingId === payment.id}
                      onClick={() => handleApprove(payment.id, payment.userId)}
                      className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 text-sm"
                    >
                      {processingId === payment.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      تفعيل الطالب
                    </button>

                    {/* زر الرفض */}
                    <button className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-3 rounded-xl font-bold hover:bg-red-100 transition-all text-sm">
                      <XCircle size={18} /> رفض
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}