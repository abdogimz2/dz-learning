// src/app/admin/managers/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldOff, Plus, Trash2, Loader2,
  CheckCircle, AlertCircle, X, Eye, EyeOff, UserCog,
  Mail, Lock, Crown,
} from "lucide-react";
import { db, auth } from "@/lib/firebase/config";
import {
  collection, getDocs, doc, updateDoc, query,
  where, serverTimestamp, setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuthStore } from "@/store/authStore";

// الصلاحيات المتاحة للأدمن الفرعي
const SUB_ADMIN_PERMISSIONS = [
  "إضافة وتعديل المحتوى",
  "إدارة متجر النقاط",
  "إدارة المهام اليومية",
  "عرض المستخدمين",
  "عرض الإحصائيات",
];

export default function AdminManagersPage() {
  const currentUser = useAuthStore(s => s.user);

  // حماية — الأدمن الفرعي لا يمكنه الوصول لهذه الصفحة
  if (currentUser?.role === "sub_admin") {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center" dir="rtl">
        <ShieldOff size={52} className="text-red-400"/>
        <p className="font-black text-2xl text-gray-800 dark:text-white">غير مصرح</p>
        <p className="text-gray-500">هذه الصفحة متاحة للأدمن الرئيسي فقط</p>
      </div>
    );
  }

  const [admins,    setAdmins]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [removing,  setRemoving]  = useState(null);
  const [confirmRM, setConfirmRM] = useState(null); // { id, isMain }
  const [toast,     setToast]     = useState(null);

  // فورم
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [name,      setName]      = useState("");

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── جلب الأدمنية ─────────────────────────────────────────────────────────
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const q    = query(collection(db, "users"), where("role", "in", ["admin", "sub_admin"]));
      const snap = await getDocs(q);
      setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { showToast("error", "فشل تحميل الأدمنية"); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchAdmins(); }, []);

  // ─── إضافة أدمن فرعي ──────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      showToast("error", "أدخل الاسم والإيميل وكلمة المرور"); return;
    }
    if (password.length < 6) {
      showToast("error", "كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return;
    }
    setSaving(true);
    try {
      // ✅ إنشاء حساب Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid  = cred.user.uid;

      // ✅ إنشاء مستند في Firestore بـ role: "sub_admin"
      await setDoc(doc(db, "users", uid), {
        name:        name.trim(),
        surname:     "",
        email:       email.trim(),
        role:        "sub_admin",
        status:      "active",
        points:      0,
        createdAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
      });

      showToast("success", "تم إضافة الأدمن الفرعي ✅");
      setEmail(""); setPassword(""); setName(""); setShowForm(false);
      fetchAdmins();
    } catch (e) {
      const msg =
        e.code === "auth/email-already-in-use" ? "هذا الإيميل مستخدم بالفعل" :
        e.code === "auth/invalid-email"         ? "الإيميل غير صحيح" :
        e.code === "auth/weak-password"         ? "كلمة المرور ضعيفة جداً" :
        e.message || "حدث خطأ";
      showToast("error", msg);
    }
    finally { setSaving(false); }
  };

  // ─── إزالة صلاحية الأدمن الفرعي أو حذف أدمن رئيسي ──────────────────────
  const handleRemove = async (adminId, isMainAdmin) => {
    setRemoving(adminId);
    try {
      await updateDoc(doc(db, "users", adminId), {
        role: "student", updatedAt: serverTimestamp(),
      });
      setAdmins(prev => prev.filter(a => a.id !== adminId));
      showToast("success", isMainAdmin ? "تم تخفيض الصلاحيات ✅" : "تم إزالة الصلاحيات ✅");
    } catch { showToast("error", "فشل إزالة الصلاحيات"); }
    finally { setRemoving(null); setConfirmRM(null); }
  };

  const mainAdmin = admins.filter(a => a.role === "admin");
  const subAdmins = admins.filter(a => a.role === "sub_admin");

  return (
    <div className="space-y-6" dir="rtl">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white ${
              toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
            }`}>
            {toast.type === "success" ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* تأكيد الإزالة */}
      <AnimatePresence>
        {confirmRM && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.9}} animate={{scale:1}}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-5" dir="rtl">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <ShieldOff className="text-red-500" size={26}/>
              </div>
              <p className="font-black text-xl text-gray-800 dark:text-white">
                {confirmRM.isMain ? "إزالة صلاحيات الأدمن الرئيسي" : "إزالة صلاحيات الأدمن الفرعي"}
              </p>
              <p className="text-gray-500 text-sm">سيتم تحويل هذا الحساب لمستخدم عادي وفقدان كل صلاحيات الأدمن</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmRM(null)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300">
                  إلغاء
                </button>
                <button onClick={() => handleRemove(confirmRM.id, confirmRM.isMain)} disabled={!!removing}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                  {removing ? <Loader2 size={16} className="animate-spin"/> : <ShieldOff size={16}/>}
                  إزالة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* فورم إضافة أدمن */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md space-y-5" dir="rtl">

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xl text-gray-800 dark:text-white">إضافة أدمن فرعي</h3>
                  <p className="text-xs text-gray-400 mt-0.5">لن يتمكن من إدارة الأدمنية</p>
                </div>
                <button onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X size={20}/>
                </button>
              </div>

              {/* الاسم */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الاسم *</label>
                <div className="relative">
                  <UserCog size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم الأدمن"
                    className="w-full pr-9 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200"/>
                </div>
              </div>

              {/* الإيميل */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الإيميل *</label>
                <div className="relative">
                  <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pr-9 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200"
                    dir="ltr"/>
                </div>
              </div>

              {/* كلمة المرور */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور *</label>
                <div className="relative">
                  <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="6 أحرف على الأقل"
                    className="w-full pr-9 pl-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200"
                    dir="ltr"/>
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              {/* الصلاحيات */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
                <p className="text-xs font-black text-blue-700 dark:text-blue-300 mb-2">✅ صلاحيات الأدمن الفرعي:</p>
                <ul className="space-y-1">
                  {SUB_ADMIN_PERMISSIONS.map(p => (
                    <li key={p} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                      <CheckCircle size={12}/> {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-black text-red-500">❌ لا يمكنه: إضافة أو حذف أدمن</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300">
                  إلغاء
                </button>
                <button onClick={handleAdd} disabled={saving}
                  className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                  {saving ? "جاري الإنشاء..." : "إضافة"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">إدارة الأدمنية</h1>
          <p className="text-gray-500 mt-1">إضافة وإدارة أدمنية فرعيين</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
          <Plus size={18}/> إضافة أدمن
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={32}/>
        </div>
      ) : (
        <div className="space-y-6">

          {/* الأدمن الرئيسي */}
          <div>
            <h2 className="font-black text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Crown size={18} className="text-yellow-500"/> الأدمن الرئيسي
            </h2>
            <div className="space-y-2">
              {mainAdmin.map(a => (
                <div key={a.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-yellow-200 dark:border-yellow-800/40 p-4 flex items-center gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                    {a.name?.[0] || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 dark:text-white">{a.name} {a.surname}</p>
                    <p className="text-xs text-gray-400">{a.email}</p>
                  </div>
                  <span className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-black px-3 py-1.5 rounded-xl">
                    <Crown size={12}/> رئيسي
                  </span>
                  {a.id === currentUser?.id ? (
                    <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded-lg">أنت</span>
                  ) : (
                    <button onClick={() => setConfirmRM({ id: a.id, isMain: true })}
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 transition-all flex-shrink-0">
                      <ShieldOff size={16}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* الأدمنية الفرعيين */}
          <div>
            <h2 className="font-black text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-500"/>
              الأدمنية الفرعيون
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-black px-2 py-0.5 rounded-lg">
                {subAdmins.length}
              </span>
            </h2>

            {subAdmins.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                <ShieldCheck size={40} className="mx-auto text-gray-300 mb-3"/>
                <p className="font-bold text-gray-500">لا يوجد أدمنية فرعيون بعد</p>
                <p className="text-xs text-gray-400 mt-1">اضغط "إضافة أدمن" لإضافة أول أدمن فرعي</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subAdmins.map(a => (
                  <motion.div key={a.id} layout
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {a.name?.[0] || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 dark:text-white">{a.name} {a.surname}</p>
                      <p className="text-xs text-gray-400">{a.email}</p>
                    </div>
                    <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black px-3 py-1.5 rounded-xl flex-shrink-0">
                      <ShieldCheck size={12}/> فرعي
                    </span>
                    <button onClick={() => setConfirmRM({ id: a.id, isMain: false })}
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 transition-all flex-shrink-0">
                      <ShieldOff size={16}/>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}