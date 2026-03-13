// src/app/admin/users/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Filter, CheckCircle, XCircle,
  Clock, Loader2, ChevronDown, Eye, Shield,
  GraduationCap, Mail, Phone,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  collection, getDocs, doc, updateDoc,
  serverTimestamp, query, orderBy,
} from "firebase/firestore";

const STATUS_CONFIG = {
  active:               { label: "مفعّل",        color: "emerald", icon: CheckCircle },
  pending:              { label: "قيد الانتظار",  color: "orange",  icon: Clock },
  waiting_verification: { label: "بانتظار التحقق",color: "yellow",  icon: Clock },
  suspended:            { label: "موقوف",         color: "red",     icon: XCircle },
};

// ─── دالة تحسب المستوى الكامل من بيانات المستخدم ──────────────────────────
function getUserFullLabel(user) {
  if (!user) return "—";

  if (user.level === "middle") return "التعليم المتوسط";

  if (user.level === "secondary") {
    const year      = user.year       || "";
    const branch    = user.branchType || "";
    const specialty = user.specialty  || "";

    // السنة الأولى
    if (year === "1sec") {
      return branch === "arts"
        ? "السنة الأولى ثانوي — آداب"
        : "السنة الأولى ثانوي — علوم وتكنولوجيا";
    }

    // السنة الثانية
    if (year === "2sec") {
      const label = {
        tech:               "السنة الثانية — تقني رياضي",
        "تسيير واقتصاد":   "السنة الثانية — تسيير واقتصاد",
        "رياضيات":          "السنة الثانية — رياضيات",
        lang:               "السنة الثانية — لغات أجنبية",
      }[specialty];
      if (label) return label;
      if (branch === "arts_main" || branch === "arts") return "السنة الثانية — آداب وفلسفة";
      return "السنة الثانية — علوم تجريبية";
    }

    // السنة الثالثة
    const label3 = {
      tech:               "السنة الثالثة — تقني رياضي",
      "تسيير واقتصاد":   "السنة الثالثة — تسيير واقتصاد",
      "رياضيات":          "السنة الثالثة — رياضيات",
      lang:               "السنة الثالثة — لغات أجنبية",
    }[specialty];
    if (label3) return label3;
    if (branch === "arts_main" || branch === "arts") return "السنة الثالثة — آداب وفلسفة";
    return "السنة الثالثة — علوم تجريبية";
  }

  return user.level || "—";
}

// ─── بطاقة مستخدم ────────────────────────────────────────────────────────────
function UserCard({ user, onStatusChange, updating }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[user.status] || STATUS_CONFIG.pending;
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
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
    >
      {/* Row رئيسي */}
      <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
        {/* معلومات المستخدم */}
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
                <StatusIcon size={11} />
                {status.label}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <GraduationCap size={12} />
                {getUserFullLabel(user)}
              </span>
              {user.role === "admin" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  <Shield size={11} /> أدمين
                </span>
              )}
            </div>
          </div>
        </div>

        {/* أزرار */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* تفاصيل */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            <ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          {/* تفعيل */}
          {user.status !== "active" && (
            <button
              disabled={updating === user.id}
              onClick={() => onStatusChange(user.id, "active")}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 text-sm shadow-sm"
            >
              {updating === user.id
                ? <Loader2 size={15} className="animate-spin" />
                : <CheckCircle size={15} />
              }
              تفعيل
            </button>
          )}

          {/* إيقاف */}
          {user.status === "active" && (
            <button
              disabled={updating === user.id}
              onClick={() => onStatusChange(user.id, "suspended")}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 transition-all disabled:opacity-50 text-sm border border-red-200 dark:border-red-800"
            >
              {updating === user.id
                ? <Loader2 size={15} className="animate-spin" />
                : <XCircle size={15} />
              }
              إيقاف
            </button>
          )}
        </div>
      </div>

      {/* تفاصيل مفصلة */}
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
                { icon: Mail,          label: "البريد",      value: user.email },
                { icon: Phone,         label: "الهاتف",      value: user.phone || "—" },
                { icon: GraduationCap, label: "المستوى",     value: getUserFullLabel(user) },
                { icon: GraduationCap, label: "التخصص",      value: user.subSpecialty || "—" },
                { icon: Clock,         label: "تاريخ التسجيل",value: user.createdAt ? new Date(user.createdAt?.seconds ? user.createdAt.seconds * 1000 : user.createdAt).toLocaleDateString("ar-DZ") : "—" },
                { icon: Shield,        label: "الدور",       value: user.role === "admin" ? "مسؤول" : "طالب" },
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
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [updating,    setUpdating]    = useState(null);
  const [search,      setSearch]      = useState("");
  const [filterStatus,setFilterStatus]= useState("all");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q    = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleStatusChange = async (userId, newStatus) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        status:    newStatus,
        isActive:  newStatus === "active",
        ...(newStatus === "active" && { paymentStatus: "paid" }),
        updatedAt: serverTimestamp(),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: newStatus, isActive: newStatus === "active" } : u
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  // تصفية المستخدمين
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      `${u.name} ${u.surname} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // إحصائيات سريعة
  const stats = {
    total:    users.length,
    active:   users.filter((u) => u.status === "active").length,
    pending:  users.filter((u) => ["pending","waiting_verification"].includes(u.status)).length,
    suspended:users.filter((u) => u.status === "suspended").length,
  };

  return (
    <div className="space-y-8" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">إدارة المستخدمين</h1>
          <p className="text-gray-500 mt-1">عرض وإدارة جميع حسابات الطلاب</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all text-sm"
        >
          <Loader2 size={16} className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلاب",   value: stats.total,    color: "blue",    icon: Users },
          { label: "حسابات مفعّلة",    value: stats.active,   color: "emerald", icon: CheckCircle },
          { label: "قيد الانتظار",     value: stats.pending,  color: "orange",  icon: Clock },
          { label: "حسابات موقوفة",    value: stats.suspended,color: "red",     icon: XCircle },
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
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pr-10 pl-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none font-bold text-gray-700 dark:text-gray-300"
          >
            <option value="all">جميع الحسابات</option>
            <option value="active">مفعّلة</option>
            <option value="pending">قيد الانتظار</option>
            <option value="waiting_verification">بانتظار التحقق</option>
            <option value="suspended">موقوفة</option>
          </select>
        </div>
      </div>

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
          {filtered.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onStatusChange={handleStatusChange}
              updating={updating}
            />
          ))}
        </div>
      )}
    </div>
  );
}