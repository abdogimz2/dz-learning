// src/app/dashboard/profile/page.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, GraduationCap,
  Edit3, Save, X, Camera, CheckCircle,
  AlertCircle, Loader2, Lock,
  Crown, Calendar, AlertTriangle, Clock,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase/config";
import { updateProfile, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const CLOUDINARY_CLOUD_NAME   = "dm2hx997l";
const CLOUDINARY_UPLOAD_PRESET = "dz_learning";

const WILAYA_LIST = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار",
  "البليدة","البويرة","تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر",
  "الجلفة","جيجل","سطيف","سعيدة","سكيكدة","سيدي بلعباس","عنابة","قالمة",
  "قسنطينة","المدية","مستغانم","المسيلة","معسكر","ورقلة","وهران","البيض",
  "إليزي","برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت","الوادي",
  "خنشلة","سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تيموشنت",
  "غرداية","غليزان",
];

// ─── حساب معلومات الاشتراك ────────────────────────────────────────────────────
function getSubscriptionInfo(subscriptionEnd) {
  if (!subscriptionEnd) return null;
  const end  = new Date(subscriptionEnd);
  const now  = new Date();
  const diff = end - now;
  if (diff <= 0) return { expired: true, daysLeft: 0, percent: 100 };
  const daysLeft  = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const totalDays = 274; // سبتمبر → جوان ≈ 9 أشهر
  const percent   = Math.max(0, Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)));
  const endDate   = end.toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
  const urgency   = daysLeft <= 30 ? "critical" : daysLeft <= 60 ? "warning" : "safe";
  return { expired: false, daysLeft, percent, endDate, urgency };
}

// ─── دالة تحسب المستوى الكامل ────────────────────────────────────────────────
function getUserFullLabel(user) {
  if (!user) return "—";
  if (user.level === "middle") return "التعليم المتوسط";
  if (user.level === "secondary") {
    const year      = user.year       || "";
    const branch    = user.branchType || "";
    const specialty = user.specialty  || "";
    if (year === "1sec") {
      return branch === "arts"
        ? "السنة الأولى ثانوي — آداب"
        : "السنة الأولى ثانوي — علوم وتكنولوجيا";
    }
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

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();

  const [editing, setEditing]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [reauth, setReauth]       = useState(false);
  const [password, setPassword]   = useState("");
  const [subInfo, setSubInfo]     = useState(null);

  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name:    user?.name    || "",
    surname: user?.surname || "",
    phone:   user?.phone   || "",
    email:   user?.email   || "",
    wilaya:  user?.wilaya  || "",
    photoURL:user?.photoURL|| "",
  });

  // ─── جلب subscriptionEnd من Firestore مباشرة ────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const fetchSubscription = async () => {
      try {
        // أولاً جرب من authStore
        if (user.subscriptionEnd) {
          setSubInfo(getSubscriptionInfo(user.subscriptionEnd));
          return;
        }
        // إذا لم يكن موجوداً في authStore — اجلبه من Firestore
        const snap = await getDoc(doc(db, "users", user.id));
        if (snap.exists()) {
          const data = snap.data();
          if (data.subscriptionEnd) {
            setSubInfo(getSubscriptionInfo(data.subscriptionEnd));
          }
        }
      } catch {
        // تجاهل الخطأ
      }
    };

    fetchSubscription();
  }, [user?.id]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("error", "حجم الصورة كبير جداً، الحد الأقصى 3MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!data.secure_url) throw new Error("فشل رفع الصورة");
      setForm((p) => ({ ...p, photoURL: data.secure_url }));
      showToast("success", "تم رفع الصورة، اضغط حفظ لتأكيد التغييرات");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.surname.trim()) {
      showToast("error", "الاسم واللقب مطلوبان");
      return;
    }
    const emailChanged = form.email !== user.email;
    if (emailChanged && !reauth) { setReauth(true); return; }
    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (emailChanged && password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        await updateEmail(currentUser, form.email);
      }
      await updateProfile(currentUser, {
        displayName: `${form.name} ${form.surname}`,
        photoURL: form.photoURL || null,
      });
      await updateDoc(doc(db, "users", user.id), {
        name:     form.name,
        surname:  form.surname,
        phone:    form.phone,
        email:    form.email,
        wilaya:   form.wilaya,
        photoURL: form.photoURL,
        updatedAt: new Date().toISOString(),
      });
      setUser({ ...user, name: form.name, surname: form.surname, phone: form.phone, email: form.email, wilaya: form.wilaya, photoURL: form.photoURL });
      setEditing(false); setReauth(false); setPassword("");
      showToast("success", "تم حفظ التعديلات بنجاح!");
    } catch (err) {
      if (err.code === "auth/wrong-password")        showToast("error", "كلمة المرور غير صحيحة");
      else if (err.code === "auth/email-already-in-use") showToast("error", "البريد الإلكتروني مستخدم بالفعل");
      else showToast("error", err.message || "حدث خطأ، حاول مرة أخرى");
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setForm({ name: user?.name||"", surname: user?.surname||"", phone: user?.phone||"", email: user?.email||"", wilaya: user?.wilaya||"", photoURL: user?.photoURL||"" });
    setEditing(false); setReauth(false); setPassword("");
  };

  if (!user) return null;

  const levelLabel     = getUserFullLabel(user);
  const specialtyLabel = user?.subSpecialty || "—";

  const urgencyStyle = {
    safe:     { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-500" },
    warning:  { bar: "bg-yellow-500",  text: "text-yellow-600 dark:text-yellow-400",  bg: "bg-yellow-50 dark:bg-yellow-900/20",  border: "border-yellow-200 dark:border-yellow-800",  badge: "bg-yellow-500"  },
    critical: { bar: "bg-red-500",     text: "text-red-600 dark:text-red-400",        bg: "bg-red-50 dark:bg-red-900/20",        border: "border-red-200 dark:border-red-800",        badge: "bg-red-500"     },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
            {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">الملف الشخصي</h1>
        <p className="text-gray-500 mt-1">عرض وتعديل معلوماتك الشخصية</p>
      </div>

      {/* ─── بطاقة الاشتراك ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl border-2 p-6 space-y-4 ${
          !subInfo
            ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
            : subInfo.expired
              ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
              : urgencyStyle[subInfo.urgency].bg + " " + urgencyStyle[subInfo.urgency].border
        }`}
      >
        {/* رأس البطاقة */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={20} className={!subInfo ? "text-gray-400" : subInfo.expired ? "text-red-500" : urgencyStyle[subInfo.urgency].text} />
            <h2 className="font-black text-gray-800 dark:text-white text-lg">الاشتراك</h2>
          </div>
          {!subInfo ? (
            <span className="text-xs font-bold bg-gray-400 text-white px-3 py-1 rounded-full">غير محدد</span>
          ) : subInfo.expired ? (
            <span className="text-xs font-bold bg-red-500 text-white px-3 py-1 rounded-full">منتهي</span>
          ) : subInfo.urgency === "critical" ? (
            <span className="text-xs font-bold bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle size={11} /> ينتهي قريباً
            </span>
          ) : (
            <span className="text-xs font-bold bg-emerald-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle size={11} /> ساري
            </span>
          )}
        </div>

        {/* لا يوجد اشتراك محدد */}
        {!subInfo && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
            لم يتم تحديد تاريخ انتهاء الاشتراك بعد.
            <br />
            <span className="text-xs text-gray-400">سيظهر هنا بعد تفعيل حسابك من الإدارة.</span>
          </p>
        )}

        {subInfo && !subInfo.expired && (
          <>
            {/* الأيام + تاريخ الانتهاء */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700">
                <p className={`text-4xl font-black ${urgencyStyle[subInfo.urgency].text}`}>
                  {subInfo.daysLeft}
                </p>
                <p className="text-xs text-gray-500 mt-1">يوم متبقي</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar size={13} className="text-gray-400" />
                  <p className="text-xs text-gray-400">ينتهي في</p>
                </div>
                <p className="font-black text-gray-800 dark:text-white text-sm leading-tight">
                  {subInfo.endDate}
                </p>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>مدة الموسم المستهلكة</span>
                <span className={urgencyStyle[subInfo.urgency].text + " font-bold"}>{subInfo.percent}%</span>
              </div>
              <div className="h-3 bg-white dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subInfo.percent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${urgencyStyle[subInfo.urgency].bar}`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>سبتمبر</span>
                <span>جوان</span>
              </div>
            </div>

            {/* تحذير */}
            {subInfo.urgency === "critical" && (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 rounded-xl p-3">
                <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">اشتراكك ينتهي خلال أقل من شهر!</p>
              </div>
            )}
            {subInfo.urgency === "warning" && (
              <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl p-3">
                <Clock size={15} className="text-yellow-500 flex-shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">تبقى أقل من شهرين على نهاية الموسم الدراسي.</p>
              </div>
            )}
          </>
        )}

        {subInfo?.expired && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
            انتهى اشتراكك. يرجى إنشاء حساب جديد للموسم القادم.
          </p>
        )}
      </motion.div>

            {/* بطاقة الملف الشخصي — كما هي بدون تغيير */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

        <div className="relative bg-gradient-to-r from-primary to-secondary h-28">
          <div className="absolute -bottom-14 right-8">
            <div className="relative">
              {form.photoURL ? (
                <img src={form.photoURL} alt={form.name}
                  className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-900 object-cover shadow-xl" />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-4xl shadow-xl">
                  {user.name?.[0] || "؟"}
                </div>
              )}
              {editing && (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="absolute bottom-0 left-0 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover transition-all border-2 border-white">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
          </div>
        </div>

        <div className="pt-16 p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">{user.name} {user.surname}</h2>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                {levelLabel}
              </span>
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-sm">
                <Edit3 size={16} /> تعديل
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all">
                  <X size={16} /> إلغاء
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  حفظ
                </button>
              </div>
            )}
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="الاسم" icon={User} editing={editing} value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
            <Field label="اللقب" icon={User} editing={editing} value={form.surname} onChange={(v) => setForm((p) => ({ ...p, surname: v }))} />
            <Field label="البريد الإلكتروني" icon={Mail} editing={editing} value={form.email} type="email" onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
            <Field label="رقم الهاتف" icon={Phone} editing={editing} value={form.phone} type="tel" onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />

            {editing ? (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                  <MapPin size={13} /> الولاية
                </label>
                <select value={form.wilaya} onChange={(e) => setForm((p) => ({ ...p, wilaya: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-gray-800 dark:text-gray-200">
                  <option value="">اختر الولاية</option>
                  {WILAYA_LIST.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            ) : (
              <Field label="الولاية" icon={MapPin} editing={false} value={form.wilaya || "—"} />
            )}

            <LockedField label="المستوى الدراسي" icon={GraduationCap} value={levelLabel} />
            {specialtyLabel !== "—" && (
              <LockedField label="التخصص" icon={GraduationCap} value={specialtyLabel} />
            )}
          </div>

          <AnimatePresence>
            {reauth && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5">
                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
                  <Lock size={16} /> أدخل كلمة المرور لتأكيد تغيير البريد الإلكتروني
                </p>
                <div className="flex gap-3">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة المرور الحالية"
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                  <button onClick={handleSave} disabled={saving || !password}
                    className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl disabled:opacity-50 hover:bg-primary-hover transition-all text-sm">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "تأكيد"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, editing, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
        <Icon size={13} /> {label}
      </label>
      {editing ? (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-gray-800 dark:text-gray-200" />
      ) : (
        <p className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-200 font-medium">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function LockedField({ label, icon: Icon, value }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
        <Icon size={13} /> {label}
        <span className="mr-auto flex items-center gap-1 text-gray-400 text-[10px]">
          <Lock size={10} /> غير قابل للتعديل
        </span>
      </label>
      <p className="px-4 py-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl text-sm text-gray-500 dark:text-gray-400 font-medium border border-dashed border-gray-200 dark:border-gray-700">
        {value || "—"}
      </p>
    </div>
  );
}