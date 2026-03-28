// src/app/admin/users/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Filter, CheckCircle, XCircle,
  Clock, Loader2, ChevronDown, Shield,
  GraduationCap, Mail, Phone, AlertTriangle, X, Trash2,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy, where,
} from "firebase/firestore";

const STATUS_CONFIG = {
  active:               { label: "مفعّل",         color: "emerald", icon: CheckCircle },
  pending:              { label: "قيد الانتظار",   color: "orange",  icon: Clock },
  waiting_verification: { label: "بانتظار التحقق", color: "yellow",  icon: Clock },
  suspended:            { label: "موقوف",          color: "red",     icon: XCircle },
};

function getUserFullLabel(user) {
  if (!user) return "—";
  if (user.level === "middle") return "التعليم المتوسط";
  if (user.level === "secondary") {
    const year      = user.year       || "";
    const branch    = user.branchType || "";
    const specialty = user.specialty  || "";
    if (year === "1sec")
      return branch === "arts" ? "السنة الأولى ثانوي — آداب" : "السنة الأولى ثانوي — علوم وتكنولوجيا";
    const specMap = {
      tech:             "تقني رياضي",
      "تسيير واقتصاد": "تسيير واقتصاد",
      "رياضيات":        "رياضيات",
      lang:             "لغات أجنبية",
    };
    const specLabel = specMap[specialty];
    const artsLabel = (branch === "arts_main" || branch === "arts") ? "آداب وفلسفة" : "علوم تجريبية";
    const finalSpec = specLabel || artsLabel;
    if (year === "2sec") return `السنة الثانية — ${finalSpec}`;
    return `السنة الثالثة — ${finalSpec}`;
  }
  return user.level || "—";
}

// ─── Modal تأكيد الإيقاف ─────────────────────────────────────────────────────
function SuspendConfirmModal({ user, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800"
        dir="rtl"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <h3 className="font-black text-gray-900 dark:text-white text-lg">تأكيد الإيقاف</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              {user.name?.[0] || "؟"}
            </div>
            <div>
              <p className="font-black text-gray-800 dark:text-white">{user.name} {user.surname}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">سيتم تنفيذ الآتي فوراً:</p>
            <ul className="space-y-1.5">
              {[
                { icon: "🚫", text: "حظر الحساب وتعليق الوصول" },
                { icon: "🔒", text: "تسجيل خروج إجباري من جميع الأجهزة" },
                { icon: "🗑️", text: "إخفاء الحساب من قائمة المستخدمين" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
            ⚠️ يمكنك إعادة تفعيل الحساب لاحقاً من خلال فلتر "موقوفة"
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all">
            إلغاء
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            إيقاف وطرد
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── بطاقة مستخدم ────────────────────────────────────────────────────────────
function UserCard({ user, onSuspend, onActivate, updating }) {
  const [expanded, setExpanded] = useState(false);
  const status     = STATUS_CONFIG[user.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    orange:  "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    yellow:  "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    red:     "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
    >
      <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {user.name?.[0] || "؟"}
          </div>
          <div className="min-w-0">
            <p className="font-black text-gray-800 dark:text-white text-base">
              {user.name} {user.surname}
            </p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorMap[status.color]} flex items-center gap-1`}>
                <StatusIcon size={11} /> {status.label}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <GraduationCap size={12} /> {getUserFullLabel(user)}
              </span>
              {user.role === "admin" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  <Shield size={11} /> أدمين
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setExpanded(!expanded)}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            <ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          {user.status !== "active" && (
            <button disabled={updating === user.id} onClick={() => onActivate(user.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 text-sm shadow-sm">
              {updating === user.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              تفعيل
            </button>
          )}
          {user.status === "active" && (
            <button disabled={updating === user.id} onClick={() => onSuspend(user)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 transition-all disabled:opacity-50 text-sm border border-red-200 dark:border-red-800">
              {updating === user.id ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
              إيقاف
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {[
                { icon: Mail,          label: "البريد",       value: user.email },
                { icon: Phone,         label: "الهاتف",       value: user.phone || "—" },
                { icon: GraduationCap, label: "المستوى",      value: getUserFullLabel(user) },
                { icon: GraduationCap, label: "التخصص",       value: user.subSpecialty || "—" },
                { icon: Clock,         label: "تاريخ التسجيل", value: user.createdAt ? new Date(user.createdAt?.seconds ? user.createdAt.seconds * 1000 : user.createdAt).toLocaleDateString("ar-DZ") : "—" },
                { icon: Shield,        label: "الدور",        value: user.role === "admin" ? "مسؤول" : "طالب" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <item.icon size={15} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400">{item.label}:</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [suspendTarget,setSuspendTarget]= useState(null);
  const [suspending,   setSuspending]   = useState(false);
  const [deletingAll,  setDeletingAll]  = useState(false);

  // جلب المستخدمين — الأصلي
  const fetchUsers = async (inclueSuspended = false) => {
    setLoading(true);
    try {
      const q = inclueSuspended
        ? query(collection(db, "users"), orderBy("createdAt", "desc"))
        : query(collection(db, "users"), where("status", "!=", "suspended"), orderBy("status", "desc"));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(false); }, []);

  // ── تفعيل ────────────────────────────────────────────────────────────────
  const handleActivate = async (userId) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        status:       "active",
        isActive:     true,
        paymentStatus:"paid",
        forcedLogout: false,
        updatedAt:    serverTimestamp(),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: "active", isActive: true, forcedLogout: false } : u
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  // ── إيقاف + طرد + حذف payments + إخفاء ─────────────────────────────────
  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      await updateDoc(doc(db, "users", suspendTarget.id), {
        status:       "suspended",
        isActive:     false,
        forcedLogout: true,
        suspendedAt:  serverTimestamp(),
        updatedAt:    serverTimestamp(),
      });
      const paymentsSnap = await getDocs(
        query(collection(db, "payments"), where("userId", "==", suspendTarget.id))
      );
      await Promise.all(paymentsSnap.docs.map((d) => deleteDoc(d.ref)));
      setUsers((prev) => prev.filter((u) => u.id !== suspendTarget.id));
      setSuspendTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSuspending(false);
    }
  };

  // ── حذف جميع الموقوفين ───────────────────────────────────────────────────
  const handleDeleteAllSuspended = async () => {
    setDeletingAll(true);
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("status", "==", "suspended"))
      );
      await Promise.all(
        snap.docs.map(async (userDoc) => {
          const paymentsSnap = await getDocs(
            query(collection(db, "payments"), where("userId", "==", userDoc.id))
          );
          await Promise.all(paymentsSnap.docs.map((p) => deleteDoc(p.ref)));
          await deleteDoc(userDoc.ref);
        })
      );
      setUsers((prev) => prev.filter((u) => u.status !== "suspended"));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingAll(false);
    }
  };

  const filtered = users.filter((u) => {
    // ✅ التغيير الوحيد: نخفي الحسابات غير المفعّلة من كل الفلاتر
    if (u.status !== "active" && u.status !== "suspended") return false;
    const matchSearch =
      !search ||
      `${u.name} ${u.surname} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     users.length,
    active:    users.filter((u) => u.status === "active").length,
    pending:   users.filter((u) => ["pending","waiting_verification"].includes(u.status)).length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  return (
    <div className="space-y-8" dir="rtl">

      {/* Modal تأكيد الإيقاف */}
      <AnimatePresence>
        {suspendTarget && (
          <SuspendConfirmModal
            user={suspendTarget}
            onConfirm={handleSuspendConfirm}
            onClose={() => setSuspendTarget(null)}
            loading={suspending}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">إدارة المستخدمين</h1>
          <p className="text-gray-500 mt-1">عرض وإدارة جميع حسابات الطلاب</p>
        </div>
        <button
          onClick={() => fetchUsers(filterStatus === "suspended")}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all text-sm"
        >
          <Loader2 size={16} className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلاب",  value: stats.total,     color: "blue",    icon: Users },
          { label: "حسابات مفعّلة",   value: stats.active,    color: "emerald", icon: CheckCircle },
          { label: "قيد الانتظار",    value: stats.pending,   color: "orange",  icon: Clock },
          { label: "حسابات موقوفة",   value: stats.suspended, color: "red",     icon: XCircle },
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

      {/* بحث وفلتر */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البريد..."
            className="w-full pr-10 pl-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          <select
            value={filterStatus}
            onChange={(e) => {
              const val = e.target.value;
              setFilterStatus(val);
              fetchUsers(val === "suspended");
            }}
            className="pr-10 pl-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none font-bold text-gray-700 dark:text-gray-300"
          >
            <option value="all">جميع الحسابات المفعلة </option>
            
            
            
            <option value="suspended">موقوفة</option>
          </select>
        </div>
      </div>

      {/* تنبيه: كيفية رؤية الموقوفين + زر حذف الكل */}
      {filterStatus !== "suspended" && stats.suspended > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <XCircle size={15} />
            <span>
              يوجد <strong>{stats.suspended}</strong> حساب موقوف — اختر فلتر "موقوفة" لإعادة تفعيلهم
            </span>
          </div>
          <button
            onClick={handleDeleteAllSuspended}
            disabled={deletingAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex-shrink-0"
          >
            {deletingAll ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            حذف الكل
          </button>
        </div>
      )}

      {/* قائمة المستخدمين */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-gray-500 font-bold">جاري تحميل المستخدمين...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold">
            {search || filterStatus !== "all" ? "لا توجد نتائج مطابقة" : "لا يوجد مستخدمون حتى الآن"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 font-medium">
            عرض <span className="font-black text-gray-700 dark:text-gray-300">{filtered.length}</span> من {users.length} مستخدم
          </p>
          <AnimatePresence mode="popLayout">
            {filtered.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onSuspend={(u) => setSuspendTarget(u)}
                onActivate={handleActivate}
                updating={updating}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}