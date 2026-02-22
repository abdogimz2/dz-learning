// src/app/admin/payments/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, CheckCircle, XCircle, Clock,
  Loader2, Eye, Filter, RefreshCw,
  AlertCircle, X, MessageSquare,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  collection, getDocs, doc, updateDoc,
  serverTimestamp, query, orderBy,
} from "firebase/firestore";

const STATUS_CONFIG = {
  pending:  { label: "معلق",   color: "orange", icon: Clock },
  approved: { label: "مقبول",  color: "emerald", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "red",     icon: XCircle },
};

// ─── Modal سبب الرفض ─────────────────────────────────────────────────────────
function RejectModal({ payment, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");

  const REASONS = [
    "الوصل غير واضح أو غير مقروء",
    "المبلغ غير مطابق",
    "الوصل مزور أو غير صحيح",
    "الرقم المرجعي غير مطابق",
    "تم استخدام هذا الوصل مسبقاً",
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800"
        dir="rtl"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-black text-gray-900 dark:text-white text-lg">سبب الرفض</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            سيتم إشعار <span className="font-bold text-gray-700 dark:text-gray-300">{payment.userName}</span> بسبب الرفض.
          </p>

          {/* أسباب جاهزة */}
          <div className="space-y-2">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  reason === r
                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* سبب مخصص */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">أو اكتب سبباً مخصصاً:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="اكتب سبب الرفض..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all text-sm resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            تأكيد الرفض
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── بطاقة طلب الدفع ─────────────────────────────────────────────────────────
function PaymentCard({ payment, onApprove, onReject, updating }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const colorMap = {
    orange:  "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    red:     "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
    >
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* معلومات الطالب */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {payment.userName?.[0] || "؟"}
          </div>
          <div className="min-w-0">
            <p className="font-black text-gray-800 dark:text-white">{payment.userName}</p>
            <p className="text-sm text-gray-500 truncate">{payment.userEmail}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorMap[status.color]} flex items-center gap-1`}>
                <StatusIcon size={11} /> {status.label}
              </span>
              <span className="text-xs text-gray-400">{payment.amount} د.ج</span>
              {payment.level && (
                <span className="text-xs text-gray-400">{payment.level}</span>
              )}
            </div>
          </div>
        </div>

        {/* أزرار */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* عرض الوصل */}
          {payment.receiptUrl && (
            <button
              onClick={() => setShowReceipt(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 transition-all text-sm border border-blue-200 dark:border-blue-800"
            >
              <Eye size={15} /> الوصل
            </button>
          )}

          {/* أزرار الموافقة/الرفض — فقط للطلبات المعلقة */}
          {payment.status === "pending" && (
            <>
              <button
                disabled={updating === payment.id}
                onClick={() => onApprove(payment.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 text-sm shadow-sm"
              >
                {updating === payment.id
                  ? <Loader2 size={15} className="animate-spin" />
                  : <CheckCircle size={15} />
                }
                قبول
              </button>
              <button
                disabled={updating === payment.id}
                onClick={() => onReject(payment)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 transition-all disabled:opacity-50 text-sm border border-red-200 dark:border-red-800"
              >
                <XCircle size={15} /> رفض
              </button>
            </>
          )}

          {/* سبب الرفض */}
          {payment.status === "rejected" && payment.rejectReason && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-xs border border-red-200 dark:border-red-800">
              <MessageSquare size={13} />
              <span className="max-w-[150px] truncate">{payment.rejectReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal صورة الوصل */}
      <AnimatePresence>
        {showReceipt && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <p className="font-bold text-gray-800 dark:text-white">وصل دفع — {payment.userName}</p>
                <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                <img
                  src={payment.receiptUrl}
                  alt="وصل الدفع"
                  className="w-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function AdminPaymentsPage() {
  const [payments,     setPayments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejecting,    setRejecting]    = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const q    = query(collection(db, "payments"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  // قبول الطلب
  const handleApprove = async (paymentId) => {
    setUpdating(paymentId);
    try {
      const payment = payments.find((p) => p.id === paymentId);

      // تحديث الدفع
      await updateDoc(doc(db, "payments", paymentId), {
        status:     "approved",
        reviewedAt: serverTimestamp(),
      });

      // تفعيل حساب المستخدم
      if (payment?.userId) {
        await updateDoc(doc(db, "users", payment.userId), {
          status:        "active",
          isActive:      true,
          paymentStatus: "paid",
          updatedAt:     serverTimestamp(),
        });
      }

      setPayments((prev) =>
        prev.map((p) => p.id === paymentId ? { ...p, status: "approved" } : p)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  // رفض الطلب
  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await updateDoc(doc(db, "payments", rejectTarget.id), {
        status:       "rejected",
        rejectReason: reason,
        reviewedAt:   serverTimestamp(),
      });

      // إعادة حالة المستخدم لـ pending
      if (rejectTarget.userId) {
        await updateDoc(doc(db, "users", rejectTarget.userId), {
          paymentStatus: "rejected",
          updatedAt:     serverTimestamp(),
        });
      }

      setPayments((prev) =>
        prev.map((p) =>
          p.id === rejectTarget.id ? { ...p, status: "rejected", rejectReason: reason } : p
        )
      );
      setRejectTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setRejecting(false);
    }
  };

  const filtered = payments.filter((p) =>
    filterStatus === "all" ? true : p.status === filterStatus
  );

  const stats = {
    pending:  payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="space-y-8" dir="rtl">

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            payment={rejectTarget}
            onConfirm={handleReject}
            onClose={() => setRejectTarget(null)}
            loading={rejecting}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">طلبات التفعيل</h1>
          <p className="text-gray-500 mt-1">مراجعة وإدارة طلبات دفع الطلاب</p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all text-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "معلقة",  value: stats.pending,  color: "orange",  icon: Clock },
          { label: "مقبولة", value: stats.approved, color: "emerald", icon: CheckCircle },
          { label: "مرفوضة",value: stats.rejected, color: "red",     icon: XCircle },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
            <div className={`w-10 h-10 bg-${s.color}-50 dark:bg-${s.color}-900/20 rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <s.icon className={`text-${s.color}-500`} size={20} />
            </div>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* فلتر */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all",      label: `الكل (${payments.length})` },
          { value: "pending",  label: `معلق (${stats.pending})` },
          { value: "approved", label: `مقبول (${stats.approved})` },
          { value: "rejected", label: `مرفوض (${stats.rejected})` },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filterStatus === f.value
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold">لا توجد طلبات في هذه الفئة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onApprove={handleApprove}
              onReject={(p) => setRejectTarget(p)}
              updating={updating}
            />
          ))}
        </div>
      )}
    </div>
  );
}