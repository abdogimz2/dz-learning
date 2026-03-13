// src/app/admin/shop/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Plus, Trash2, Pencil, X, CheckCircle,
  AlertCircle, Loader2, Package, Star, Clock, ChevronDown,
  Eye, MailCheck, XCircle,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  collection, addDoc, getDocs, deleteDoc, updateDoc,
  doc, serverTimestamp, orderBy, query,
} from "firebase/firestore";

const TABS = [
  { id: "products", label: "المنتجات",  icon: Package },
  { id: "orders",   label: "الطلبات",   icon: ShoppingBag },
];

const STATUS_MAP = {
  pending:   { label: "قيد الانتظار", color: "yellow" },
  confirmed: { label: "تم التأكيد",   color: "emerald" },
  rejected:  { label: "مرفوض",        color: "red"     },
};

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white ${
            toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}>
          {toast.type === "success" ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── رفع الصورة إلى Cloudinary ───────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME    = "dm2hx997l";
const CLOUDINARY_UPLOAD_PRESET = "dz_learning";

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file",          file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res  = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || "فشل رفع الصورة");
  return data.secure_url;
}

export default function AdminShopPage() {
  const [activeTab, setActiveTab]   = useState("products");
  const [toast,     setToast]       = useState(null);

  // ─── منتجات ───────────────────────────────────────────────────────────────
  const [products,  setProducts]    = useState([]);
  const [loadingP,  setLoadingP]    = useState(false);
  const [showForm,  setShowForm]    = useState(false);
  const [editProd,  setEditProd]    = useState(null);
  const [saving,    setSaving]      = useState(false);
  const [deleting,  setDeleting]    = useState(null);
  const [confirmDel,setConfirmDel]  = useState(null);

  // فورم المنتج
  const [name,      setName]        = useState("");
  const [desc,      setDesc]        = useState("");
  const [price,     setPrice]       = useState("");
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading]   = useState(false);

  // ─── طلبات ────────────────────────────────────────────────────────────────
  const [orders,    setOrders]      = useState([]);
  const [loadingO,  setLoadingO]    = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── جلب المنتجات ─────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoadingP(true);
    try {
      const snap = await getDocs(query(collection(db, "shopProducts"), orderBy("createdAt","desc")));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { showToast("error", "فشل تحميل المنتجات"); }
    finally  { setLoadingP(false); }
  };

  // ─── جلب الطلبات ──────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setLoadingO(true);
    try {
      const snap = await getDocs(query(collection(db, "shopOrders"), orderBy("createdAt","desc")));
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { showToast("error", "فشل تحميل الطلبات"); }
    finally  { setLoadingO(false); }
  };

  useEffect(() => { fetchProducts(); fetchOrders(); }, []);

  // ─── فتح فورم التعديل ─────────────────────────────────────────────────────
  const openEdit = (p) => {
    setEditProd(p);
    setName(p.name); setDesc(p.desc); setPrice(String(p.price));
    setImagePreview(p.imageUrl); setImageFile(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setEditProd(null); setName(""); setDesc(""); setPrice("");
    setImageFile(null); setImagePreview(null); setShowForm(false);
  };

  // ─── حفظ المنتج (إضافة أو تعديل) ─────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim() || !price || (!imageFile && !editProd?.imageUrl)) {
      showToast("error", "أدخل الاسم والسعر والصورة"); return;
    }
    setSaving(true);
    try {
      let imageUrl = editProd?.imageUrl || "";
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadToCloudinary(imageFile);
        setUploading(false);
      }
      const data = {
        name: name.trim(), desc: desc.trim(),
        price: Number(price), imageUrl: imageUrl || "",
        updatedAt: serverTimestamp(),
      };
      if (editProd) {
        await updateDoc(doc(db, "shopProducts", editProd.id), data);
        setProducts(prev => prev.map(p => p.id === editProd.id ? { ...p, ...data } : p));
        showToast("success", "تم التعديل ✅");
      } else {
        const ref = await addDoc(collection(db, "shopProducts"), { ...data, createdAt: serverTimestamp() });
        setProducts(prev => [{ id: ref.id, ...data }, ...prev]);
        showToast("success", "تمت الإضافة ✅");
      }
      resetForm();
    } catch (e) { showToast("error", e.message || "حدث خطأ"); }
    finally { setSaving(false); setUploading(false); }
  };

  // ─── حذف منتج أو طلب ─────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      // تحقق هل هو طلب أم منتج
      const isOrder = orders.some(o => o.id === id);
      if (isOrder) {
        await deleteDoc(doc(db, "shopOrders", id));
        setOrders(prev => prev.filter(o => o.id !== id));
      } else {
        await deleteDoc(doc(db, "shopProducts", id));
        setProducts(prev => prev.filter(p => p.id !== id));
      }
      showToast("success", "تم الحذف ✅");
    } catch { showToast("error", "فشل الحذف"); }
    finally { setDeleting(null); setConfirmDel(null); }
  };

  // ─── تحديث حالة طلب ───────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrder(orderId);
    try {
      await updateDoc(doc(db, "shopOrders", orderId), { status, updatedAt: serverTimestamp() });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      showToast("success", status === "confirmed" ? "تم تأكيد الطلب ✅" : "تم رفض الطلب");
    } catch { showToast("error", "فشل التحديث"); }
    finally { setUpdatingOrder(null); }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Toast toast={toast}/>

      {/* ─── تأكيد حذف ─── */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.9}} animate={{scale:1}}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-5" dir="rtl">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="text-red-500" size={26}/>
              </div>
              <p className="font-black text-xl text-gray-800 dark:text-white">تأكيد الحذف</p>
              <p className="text-gray-500 text-sm">هذا الإجراء لا يمكن التراجع عنه</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDel(null)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300">
                  إلغاء
                </button>
                <button onClick={() => handleDelete(confirmDel)} disabled={!!deleting}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                  {deleting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── فورم المنتج ─── */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-lg space-y-5 my-4" dir="rtl">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-gray-800 dark:text-white">
                  {editProd ? "تعديل المنتج" : "إضافة منتج جديد"}
                </h3>
                <button onClick={resetForm} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X size={20}/>
                </button>
              </div>

              {/* صورة المنتج */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">صورة المنتج</label>
                <label className="cursor-pointer block">
                  <div className={`border-2 border-dashed rounded-2xl overflow-hidden transition-all ${
                    imagePreview ? "border-primary/30" : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                  }`}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="w-full h-48 object-cover"/>
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Package size={36}/>
                        <p className="text-sm font-bold">اضغط لرفع صورة المنتج</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setImageFile(f);
                      setImagePreview(URL.createObjectURL(f));
                    }}/>
                </label>
              </div>

              {/* الاسم */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">اسم المنتج *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: كتاب رياضيات"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200"/>
              </div>

              {/* الوصف */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف المنتج..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200 resize-none"/>
              </div>

              {/* السعر */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">السعر (بالنقاط) *</label>
                <div className="relative">
                  <Star size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500"/>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="500"
                    className="w-full pr-9 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200"/>
                </div>
              </div>

              {/* أزرار */}
              <div className="flex gap-3 pt-2">
                <button onClick={resetForm}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300">
                  إلغاء
                </button>
                <button onClick={handleSave} disabled={saving || uploading}
                  className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                  {(saving || uploading) ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
                  {uploading ? "جاري الرفع..." : saving ? "جاري الحفظ..." : editProd ? "حفظ التعديلات" : "إضافة المنتج"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">متجر النقاط</h1>
          <p className="text-gray-500 mt-1">إدارة المنتجات والطلبات</p>
        </div>
        {activeTab === "products" && (
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <Plus size={18}/> إضافة منتج
          </button>
        )}
      </div>

      {/* ─── تبويبان ─── */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            <tab.icon size={16}/> {tab.label}
            {tab.id === "orders" && orders.filter(o => o.status === "pending").length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {orders.filter(o => o.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── المنتجات ─── */}
      {activeTab === "products" && (
        <div>
          {loadingP ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={32}/></div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
              <Package size={48} className="mx-auto text-gray-300 mb-3"/>
              <p className="font-bold text-gray-500">لا توجد منتجات بعد</p>
              <p className="text-sm text-gray-400 mt-1">أضف أول منتج للمتجر</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <motion.div key={p.id} layout
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all">
                  <div className="relative">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-44 object-cover"/>
                    <div className="absolute top-3 left-3 flex gap-2">
                      <button onClick={() => openEdit(p)}
                        className="p-2 bg-white/90 backdrop-blur rounded-xl text-blue-500 hover:bg-white shadow-md transition-all">
                        <Pencil size={14}/>
                      </button>
                      <button onClick={() => setConfirmDel(p.id)}
                        className="p-2 bg-white/90 backdrop-blur rounded-xl text-red-500 hover:bg-white shadow-md transition-all">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-black text-gray-800 dark:text-white">{p.name}</p>
                    {p.desc && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.desc}</p>}
                    <div className="flex items-center gap-1 mt-3">
                      <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                      <span className="font-black text-yellow-600 dark:text-yellow-400">{p.price.toLocaleString("ar")}</span>
                      <span className="text-xs text-gray-400">نقطة</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── الطلبات ─── */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          {loadingO ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={32}/></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
              <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3"/>
              <p className="font-bold text-gray-500">لا توجد طلبات بعد</p>
            </div>
          ) : (
            orders.map(order => {
              const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const colorCls = {
                yellow:  "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
                emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                red:     "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
              }[st.color];

              return (
                <motion.div key={order.id} layout
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                  <div className="flex items-start gap-4">
                    {/* صورة المنتج */}
                    {order.productImage && (
                      <img src={order.productImage} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0"/>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-black text-gray-800 dark:text-white">{order.productName}</p>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${colorCls}`}>
                          {st.label}
                        </span>
                      </div>

                      {/* ─── معلومات التواصل ─── */}
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          👤 {order.userName}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            📧 <span className="font-medium text-primary">{order.userEmail}</span>
                          </p>
                          {order.userPhone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              📞 <span className="font-medium text-gray-700 dark:text-gray-300">{order.userPhone}</span>
                            </p>
                          )}
                          {order.userWilaya && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              📍 <span className="font-medium text-gray-700 dark:text-gray-300">{order.userWilaya}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-2">
                        <Star size={13} className="text-yellow-500 fill-yellow-500"/>
                        <span className="text-sm font-bold text-yellow-600">{order.price?.toLocaleString("ar")}</span>
                        <span className="text-xs text-gray-400">نقطة</span>
                        <span className="text-gray-300 mx-1">·</span>
                        <Clock size={12} className="text-gray-400"/>
                        <span className="text-xs text-gray-400">
                          {order.createdAt?.toDate?.()?.toLocaleDateString("ar") || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* أزرار التأكيد/الرفض */}
                  {order.status === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => updateOrderStatus(order.id, "rejected")}
                        disabled={updatingOrder === order.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all disabled:opacity-50">
                        <XCircle size={15}/> رفض
                      </button>
                      <button onClick={() => updateOrderStatus(order.id, "confirmed")}
                        disabled={updatingOrder === order.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-md">
                        {updatingOrder === order.id
                          ? <Loader2 size={15} className="animate-spin"/>
                          : <MailCheck size={15}/>
                        }
                        تأكيد وإرسال
                      </button>
                    </div>
                  )}

                  {/* زر حذف الطلب بعد التأكيد أو الرفض */}
                  {order.status !== "pending" && (
                    <div className="flex justify-end mt-4">
                      <button onClick={() => setConfirmDel(order.id)}
                        disabled={deleting === order.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 font-bold text-sm hover:bg-red-100 transition-all disabled:opacity-50">
                        {deleting === order.id
                          ? <Loader2 size={14} className="animate-spin"/>
                          : <Trash2 size={14}/>
                        }
                        حذف الطلب
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}