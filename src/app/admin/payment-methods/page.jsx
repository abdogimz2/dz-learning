// src/app/admin/payment-methods/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Plus, Pencil, Trash2, X, CheckCircle,
  AlertCircle, Loader2, CreditCard, Smartphone,
  Building2, DollarSign, ToggleLeft, ToggleRight,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  collection, addDoc, getDocs, deleteDoc, updateDoc,
  doc, serverTimestamp, orderBy, query,
} from "firebase/firestore";

// ─── أيقونات طرق الدفع ────────────────────────────────────────────────────────
const PAYMENT_ICONS = [
  { value: "bank",   label: "تحويل بنكي",    icon: Building2    },
  { value: "mobile", label: "دفع موبايل",     icon: Smartphone   },
  { value: "card",   label: "بطاقة ائتمان",  icon: CreditCard   },
  { value: "cash",   label: "دفع نقدي",       icon: DollarSign   },
  { value: "wallet", label: "محفظة إلكترونية",icon: Wallet       },
];

const LEVELS = [
  { value: "middle",    label: "التعليم المتوسط", price: 4000 },
  { value: "secondary", label: "التعليم الثانوي", price: 5000 },
  { value: "all",       label: "جميع المستويات",  price: null },
];

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white ${
            toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── مودال الإضافة / التعديل ──────────────────────────────────────────────────
function PaymentMethodModal({ editItem, onClose, onSave, saving }) {
  const isEdit = !!editItem?.id;

  const [form, setForm] = useState({
    name:        editItem?.name        || "",
    description: editItem?.description || "",
    iconType:    editItem?.iconType    || "bank",
    accountName: editItem?.accountName || "",
    accountNumber:editItem?.accountNumber || "",
    bankName:    editItem?.bankName    || "",
    extraInfo:   editItem?.extraInfo   || "",
    isActive:    editItem?.isActive    ?? true,
    prices: {
      middle:    editItem?.prices?.middle    ?? 4000,
      secondary: editItem?.prices?.secondary ?? 5000,
    },
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const setPrice = (level, val) => setForm(p => ({
    ...p,
    prices: { ...p.prices, [level]: Number(val) || 0 },
  }));

  const IconComp = PAYMENT_ICONS.find(i => i.value === form.iconType)?.icon || Wallet;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      dir="rtl"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg my-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <IconComp className="text-primary" size={20} />
            </div>
            <h2 className="font-black text-xl text-gray-800 dark:text-white">
              {isEdit ? "تعديل طريقة الدفع" : "إضافة طريقة دفع جديدة"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* اسم طريقة الدفع */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              اسم طريقة الدفع <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="مثال: CCP بريد الجزائر"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200"
            />
          </div>

          {/* الأيقونة */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              نوع الأيقونة
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PAYMENT_ICONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("iconType", value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    form.iconType === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-primary/40"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* الوصف */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              وصف مختصر
            </label>
            <input
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="مثال: الدفع عبر حساب بريد الجزائر"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200"
            />
          </div>

          {/* معلومات الحساب */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4">
            <p className="text-sm font-black text-gray-700 dark:text-gray-300">معلومات الحساب</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">اسم صاحب الحساب</label>
                <input
                  value={form.accountName}
                  onChange={e => set("accountName", e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">رقم الحساب / RIP</label>
                <input
                  value={form.accountNumber}
                  onChange={e => set("accountNumber", e.target.value)}
                  placeholder="0000000000"
                  dir="ltr"
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">اسم البنك / المؤسسة</label>
              <input
                value={form.bankName}
                onChange={e => set("bankName", e.target.value)}
                placeholder="مثال: بريد الجزائر، BNA، BEA..."
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm text-gray-800 dark:text-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">معلومات إضافية (اختياري)</label>
              <textarea
                rows={2}
                value={form.extraInfo}
                onChange={e => set("extraInfo", e.target.value)}
                placeholder="مثال: اكتب الرقم المرجعي في خانة الملاحظات..."
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm text-gray-800 dark:text-gray-200 resize-none"
              />
            </div>
          </div>

          {/* الأسعار */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-black text-blue-700 dark:text-blue-400">
              💰 الأسعار حسب المستوى (بالدينار الجزائري)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  التعليم المتوسط (د.ج)
                </label>
                <input
                  type="number"
                  value={form.prices.middle}
                  onChange={e => setPrice("middle", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-center text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  التعليم الثانوي (د.ج)
                </label>
                <input
                  type="number"
                  value={form.prices.secondary}
                  onChange={e => setPrice("secondary", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-center text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
          </div>

          {/* حالة التفعيل */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div>
              <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">حالة طريقة الدفع</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {form.isActive ? "مفعلة — تظهر للطلاب" : "معطلة — لا تظهر للطلاب"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                form.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
                form.isActive ? "right-1" : "left-1"
              }`} />
            </button>
          </div>
        </div>

        {/* أزرار */}
        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {saving ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة طريقة الدفع"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── بطاقة طريقة الدفع ───────────────────────────────────────────────────────
function PaymentMethodCard({ method, onEdit, onDelete, onToggle, deleting, toggling }) {
  const IconComp = PAYMENT_ICONS.find(i => i.value === method.iconType)?.icon || Wallet;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`bg-white dark:bg-gray-900 rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
        method.isActive
          ? "border-gray-100 dark:border-gray-800"
          : "border-dashed border-gray-300 dark:border-gray-700 opacity-70"
      }`}
    >
      {/* Header البطاقة */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            method.isActive
              ? "bg-primary/10 text-primary"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400"
          }`}>
            <IconComp size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-gray-800 dark:text-white">{method.name}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                method.isActive
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
              }`}>
                {method.isActive ? "مفعلة" : "معطلة"}
              </span>
            </div>
            {method.description && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{method.description}</p>
            )}
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle(method)}
            disabled={toggling === method.id}
            className={`p-2 rounded-xl transition-all disabled:opacity-50 ${
              method.isActive
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 hover:bg-emerald-100"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200"
            }`}
            title={method.isActive ? "تعطيل" : "تفعيل"}
          >
            {toggling === method.id
              ? <Loader2 size={16} className="animate-spin" />
              : method.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />
            }
          </button>
          <button
            onClick={() => onEdit(method)}
            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 transition-all"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(method.id)}
            disabled={deleting === method.id}
            className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
          >
            {deleting === method.id
              ? <Loader2 size={16} className="animate-spin" />
              : <Trash2 size={16} />
            }
          </button>
        </div>
      </div>

      {/* تفاصيل الحساب */}
      {(method.accountName || method.accountNumber || method.bankName) && (
        <div className="mx-5 mb-4 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2">
          {method.bankName && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">البنك / المؤسسة</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{method.bankName}</span>
            </div>
          )}
          {method.accountName && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">اسم صاحب الحساب</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{method.accountName}</span>
            </div>
          )}
          {method.accountNumber && (
            <div className="flex items-center justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <span className="text-gray-400">رقم الحساب / RIP</span>
              <span className="font-bold text-primary font-mono tracking-wide" dir="ltr">
                {method.accountNumber}
              </span>
            </div>
          )}
          {method.extraInfo && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <p className="text-xs text-gray-400">ملاحظة: <span className="text-gray-600 dark:text-gray-300">{method.extraInfo}</span></p>
            </div>
          )}
        </div>
      )}

      {/* الأسعار */}
      {method.prices && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">التعليم المتوسط</p>
              <p className="font-black text-primary text-lg">
                {method.prices.middle?.toLocaleString("ar") || "—"}
              </p>
              <p className="text-xs text-gray-400">د.ج</p>
            </div>
            <div className="bg-secondary/5 border border-secondary/10 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">التعليم الثانوي</p>
              <p className="font-black text-secondary text-lg">
                {method.prices.secondary?.toLocaleString("ar") || "—"}
              </p>
              <p className="text-xs text-gray-400">د.ج</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function PaymentMethodsPage() {
  const [methods,   setMethods]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [toggling,  setToggling]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [confirmDel,setConfirmDel]= useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── جلب طرق الدفع ──────────────────────────────────────────────────────────
  const fetchMethods = async () => {
    setLoading(true);
    try {
      const q    = query(collection(db, "paymentMethods"), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      setMethods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      showToast("error", "فشل تحميل طرق الدفع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMethods(); }, []);

  // ─── حفظ (إضافة أو تعديل) ────────────────────────────────────────────────────
  const handleSave = async (form) => {
    if (!form.name.trim()) { showToast("error", "اسم طريقة الدفع مطلوب"); return; }
    setSaving(true);
    try {
      const data = {
        name:          form.name.trim(),
        description:   form.description.trim(),
        iconType:      form.iconType,
        accountName:   form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
        bankName:      form.bankName.trim(),
        extraInfo:     form.extraInfo.trim(),
        isActive:      form.isActive,
        prices: {
          middle:    form.prices.middle,
          secondary: form.prices.secondary,
        },
        updatedAt: serverTimestamp(),
      };

      if (editItem?.id) {
        await updateDoc(doc(db, "paymentMethods", editItem.id), data);
        setMethods(prev => prev.map(m => m.id === editItem.id ? { ...m, ...data } : m));
        showToast("success", "تم تعديل طريقة الدفع ✅");
      } else {
        const ref = await addDoc(collection(db, "paymentMethods"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        setMethods(prev => [...prev, { id: ref.id, ...data }]);
        showToast("success", "تمت إضافة طريقة الدفع ✅");
      }

      setShowModal(false);
      setEditItem(null);
    } catch {
      showToast("error", "حدث خطأ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  // ─── حذف ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "paymentMethods", id));
      setMethods(prev => prev.filter(m => m.id !== id));
      showToast("success", "تم الحذف ✅");
    } catch {
      showToast("error", "فشل الحذف");
    } finally {
      setDeleting(null);
      setConfirmDel(null);
    }
  };

  // ─── تفعيل / تعطيل ──────────────────────────────────────────────────────────
  const handleToggle = async (method) => {
    setToggling(method.id);
    try {
      const newStatus = !method.isActive;
      await updateDoc(doc(db, "paymentMethods", method.id), {
        isActive:  newStatus,
        updatedAt: serverTimestamp(),
      });
      setMethods(prev => prev.map(m =>
        m.id === method.id ? { ...m, isActive: newStatus } : m
      ));
      showToast("success", newStatus ? "تم تفعيل طريقة الدفع ✅" : "تم تعطيل طريقة الدفع");
    } catch {
      showToast("error", "فشل التحديث");
    } finally {
      setToggling(null);
    }
  };

  const openAdd  = () => { setEditItem(null); setShowModal(true); };
  const openEdit = (m)  => { setEditItem(m);    setShowModal(true); };

  const activeCount   = methods.filter(m => m.isActive).length;
  const inactiveCount = methods.filter(m => !m.isActive).length;

  return (
    <div className="space-y-8" dir="rtl">
      <Toast toast={toast} />

      {/* ─── تأكيد الحذف ─── */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-5"
              dir="rtl"
            >
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="text-red-500" size={26} />
              </div>
              <p className="font-black text-xl text-gray-800 dark:text-white">تأكيد الحذف</p>
              <p className="text-gray-500 text-sm">هذا الإجراء لا يمكن التراجع عنه</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDel(null)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleDelete(confirmDel)}
                  disabled={!!deleting}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── مودال الإضافة / التعديل ─── */}
      <AnimatePresence>
        {showModal && (
          <PaymentMethodModal
            editItem={editItem}
            onClose={() => { setShowModal(false); setEditItem(null); }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">طرق الدفع</h1>
          <p className="text-gray-500 mt-1">إدارة طرق الدفع وأسعار الاشتراك</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <Plus size={18} /> إضافة طريقة دفع
        </button>
      </div>

      {/* ─── إحصائيات سريعة ─── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي طرق الدفع", value: methods.length,  color: "blue",    icon: Wallet      },
          { label: "مفعلة",             value: activeCount,     color: "emerald", icon: ToggleRight },
          { label: "معطلة",             value: inactiveCount,   color: "gray",    icon: ToggleLeft  },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className={`w-10 h-10 bg-${s.color}-50 dark:bg-${s.color}-900/20 rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`text-${s.color}-500`} size={20} />
            </div>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── ملاحظة ─── */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400">ملاحظة مهمة</p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1 leading-relaxed">
            طرق الدفع المفعلة تظهر للطلاب في صفحة الدفع. تأكد من صحة أرقام الحسابات قبل التفعيل. يمكنك تعطيل أي طريقة مؤقتاً دون حذفها.
          </p>
        </div>
      </div>

      {/* ─── القائمة ─── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Wallet className="mx-auto text-gray-300 mb-4" size={52} />
          <p className="font-black text-xl text-gray-500">لا توجد طرق دفع بعد</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">أضف أول طريقة دفع للطلاب</p>
          <button
            onClick={openAdd}
            className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <span className="flex items-center gap-2"><Plus size={18} /> إضافة طريقة دفع</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {methods.map(method => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onEdit={openEdit}
                onDelete={(id) => setConfirmDel(id)}
                onToggle={handleToggle}
                deleting={deleting}
                toggling={toggling}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}