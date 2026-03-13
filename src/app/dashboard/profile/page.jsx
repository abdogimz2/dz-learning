// src/app/dashboard/profile/page.jsx
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, GraduationCap,
  Edit3, Save, X, Camera, CheckCircle,
  AlertCircle, Loader2, Lock,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
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

// ─── دالة تحسب المستوى الكامل من بيانات المستخدم ──────────────────────────
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

  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name:    user?.name    || "",
    surname: user?.surname || "",
    phone:   user?.phone   || "",
    email:   user?.email   || "",
    wilaya:  user?.wilaya  || "",
    photoURL:user?.photoURL|| "",
  });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // رفع صورة الملف الشخصي
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

  // حفظ التعديلات
  const handleSave = async () => {
    if (!form.name.trim() || !form.surname.trim()) {
      showToast("error", "الاسم واللقب مطلوبان");
      return;
    }

    // إذا غيّر الإيميل نحتاج إعادة المصادقة
    const emailChanged = form.email !== user.email;
    if (emailChanged && !reauth) {
      setReauth(true);
      return;
    }

    setSaving(true);
    try {
      const currentUser = auth.currentUser;

      // إعادة المصادقة إذا غيّر الإيميل
      if (emailChanged && password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        await updateEmail(currentUser, form.email);
      }

      // تحديث Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: `${form.name} ${form.surname}`,
        photoURL: form.photoURL || null,
      });

      // تحديث Firestore
      await updateDoc(doc(db, "users", user.id), {
        name:     form.name,
        surname:  form.surname,
        phone:    form.phone,
        email:    form.email,
        wilaya:   form.wilaya,
        photoURL: form.photoURL,
        updatedAt: new Date().toISOString(),
      });

      // تحديث Zustand
      setUser({
        ...user,
        name:     form.name,
        surname:  form.surname,
        phone:    form.phone,
        email:    form.email,
        wilaya:   form.wilaya,
        photoURL: form.photoURL,
      });

      setEditing(false);
      setReauth(false);
      setPassword("");
      showToast("success", "تم حفظ التعديلات بنجاح!");
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        showToast("error", "كلمة المرور غير صحيحة");
      } else if (err.code === "auth/email-already-in-use") {
        showToast("error", "البريد الإلكتروني مستخدم بالفعل");
      } else {
        showToast("error", err.message || "حدث خطأ، حاول مرة أخرى");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name:     user?.name    || "",
      surname:  user?.surname || "",
      phone:    user?.phone   || "",
      email:    user?.email   || "",
      wilaya:   user?.wilaya  || "",
      photoURL: user?.photoURL|| "",
    });
    setEditing(false);
    setReauth(false);
    setPassword("");
  };

  if (!user) return null;

  const levelLabel    = getUserFullLabel(user);
  const specialtyLabel = user?.subSpecialty || "—";

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">

      {/* Toast */}
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

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">الملف الشخصي</h1>
        <p className="text-gray-500 mt-1">عرض وتعديل معلوماتك الشخصية</p>
      </div>

      {/* بطاقة الملف الشخصي */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

        {/* Header الصورة */}
        <div className="relative bg-gradient-to-r from-primary to-secondary h-28">
          <div className="absolute -bottom-14 right-8">
            <div className="relative">
              {/* الصورة */}
              {form.photoURL ? (
                <img
                  src={form.photoURL}
                  alt={form.name}
                  className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-900 object-cover shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-4xl shadow-xl">
                  {user.name?.[0] || "؟"}
                </div>
              )}

              {/* زر تغيير الصورة */}
              {editing && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 left-0 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover transition-all border-2 border-white"
                >
                  {uploading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Camera size={16} />
                  }
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>
        </div>

        <div className="pt-16 p-8 space-y-6">
          {/* اسم المستخدم + زر التعديل */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">
                {user.name} {user.surname}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                {levelLabel}
              </span>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-sm"
              >
                <Edit3 size={16} /> تعديل
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  <X size={16} /> إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  حفظ
                </button>
              </div>
            )}
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* الحقول */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* الاسم */}
            <Field
              label="الاسم" icon={User} editing={editing}
              value={form.name}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
            />

            {/* اللقب */}
            <Field
              label="اللقب" icon={User} editing={editing}
              value={form.surname}
              onChange={(v) => setForm((p) => ({ ...p, surname: v }))}
            />

            {/* البريد */}
            <Field
              label="البريد الإلكتروني" icon={Mail} editing={editing}
              value={form.email} type="email"
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
            />

            {/* الهاتف */}
            <Field
              label="رقم الهاتف" icon={Phone} editing={editing}
              value={form.phone} type="tel"
              onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
            />

            {/* الولاية */}
            {editing ? (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                  <MapPin size={13} /> الولاية
                </label>
                <select
                  value={form.wilaya}
                  onChange={(e) => setForm((p) => ({ ...p, wilaya: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-gray-800 dark:text-gray-200"
                >
                  <option value="">اختر الولاية</option>
                  {WILAYA_LIST.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            ) : (
              <Field label="الولاية" icon={MapPin} editing={false} value={form.wilaya || "—"} />
            )}

            {/* المستوى — غير قابل للتعديل */}
            <LockedField label="المستوى الدراسي" icon={GraduationCap} value={levelLabel} />

            {/* التخصص — غير قابل للتعديل */}
            {specialtyLabel !== "—" && (
              <LockedField label="التخصص" icon={GraduationCap} value={specialtyLabel} />
            )}
          </div>

          {/* إعادة المصادقة للإيميل */}
          <AnimatePresence>
            {reauth && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5"
              >
                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
                  <Lock size={16} /> أدخل كلمة المرور لتأكيد تغيير البريد الإلكتروني
                </p>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة المرور الحالية"
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving || !password}
                    className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl disabled:opacity-50 hover:bg-primary-hover transition-all text-sm"
                  >
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

// ─── مكون حقل قابل للتعديل ───────────────────────────────────────────────────
function Field({ label, icon: Icon, editing, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
        <Icon size={13} /> {label}
      </label>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-gray-800 dark:text-gray-200"
        />
      ) : (
        <p className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-200 font-medium">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

// ─── مكون حقل مقفل ───────────────────────────────────────────────────────────
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