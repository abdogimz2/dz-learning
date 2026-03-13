// src/app/dashboard/shop/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, ShoppingBag, Package, CheckCircle,
  AlertCircle, Loader2, X, Lock, Sparkles,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  collection, getDocs, addDoc, doc, updateDoc,
  serverTimestamp, orderBy, query, increment,
} from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";

export default function ShopPage() {
  const user       = useAuthStore(s => s.user);
  const setUser    = useAuthStore(s => s.setUser);

  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [buying,    setBuying]    = useState(null);
  const [modal,     setModal]     = useState(null); // { type: "confirm"|"success"|"insufficient", product }
  const [toast,     setToast]     = useState(null);

  const userPoints = user?.points || 0;

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(query(collection(db, "shopProducts"), orderBy("createdAt","desc")));
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { showToast("error", "فشل تحميل المتجر"); }
      finally  { setLoading(false); }
    };
    fetchProducts();
  }, []);

  // ─── شراء المنتج ───────────────────────────────────────────────────────────
  const handleBuy = (product) => {
    if (userPoints < product.price) {
      setModal({ type: "insufficient", product });
    } else {
      setModal({ type: "confirm", product });
    }
  };

  const confirmPurchase = async () => {
    const product = modal?.product;
    if (!product || !user?.id) return;
    setBuying(product.id);
    try {
      // ✅ 1. إنشاء طلب الشراء مع معلومات التواصل
      await addDoc(collection(db, "shopOrders"), {
        productId:    product.id,
        productName:  product.name,
        productImage: product.imageUrl,
        price:        product.price,
        userId:       user.id,
        userName:     `${user.name} ${user.surname}`,
        userEmail:    user.email,
        userPhone:    user.phone    || "",
        userWilaya:   user.wilaya   || "",
        status:       "pending",
        createdAt:    serverTimestamp(),
        updatedAt:    serverTimestamp(),
      });

      // ✅ 2. خصم النقاط من Firestore
      await updateDoc(doc(db, "users", user.id), {
        points: increment(-product.price),
      });

      // ✅ 3. تحديث الـ authStore محلياً
      useAuthStore.setState(s => ({
        user: { ...s.user, points: (s.user.points || 0) - product.price }
      }));

      setModal({ type: "success", product });
    } catch (e) {
      showToast("error", "حدث خطأ أثناء الشراء");
      setModal(null);
    } finally {
      setBuying(null);
    }
  };

  const canAfford = (price) => userPoints >= price;

  return (
    <div className="space-y-8" dir="rtl">

      {/* ─── Toast ─── */}
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

      {/* ─── Modal ─── */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,opacity:0}}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl w-full max-w-sm">

              {/* ─── تأكيد الشراء ─── */}
              {modal.type === "confirm" && (
                <div className="space-y-5 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                    <ShoppingBag className="text-primary" size={28}/>
                  </div>
                  <div>
                    <p className="font-black text-xl text-gray-800 dark:text-white">تأكيد الشراء</p>
                    <p className="text-gray-500 text-sm mt-1">{modal.product.name}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">رصيدك الحالي</span>
                      <span className="font-bold flex items-center gap-1">
                        <Star size={13} className="text-yellow-500 fill-yellow-500"/>
                        {userPoints.toLocaleString("ar")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">سعر المنتج</span>
                      <span className="font-bold text-red-500 flex items-center gap-1">
                        <Star size={13} className="text-red-400 fill-red-400"/>
                        -{modal.product.price.toLocaleString("ar")}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                      <span className="text-gray-500">الرصيد بعد الشراء</span>
                      <span className="font-black text-primary flex items-center gap-1">
                        <Star size={13} className="text-primary fill-primary"/>
                        {(userPoints - modal.product.price).toLocaleString("ar")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setModal(null)}
                      className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300">
                      إلغاء
                    </button>
                    <button onClick={confirmPurchase} disabled={!!buying}
                      className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2">
                      {buying ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
                      {buying ? "جاري..." : "تأكيد"}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── نجاح الشراء ─── */}
              {modal.type === "success" && (
                <div className="space-y-5 text-center">
                  <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:0.1}}
                    className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="text-emerald-500" size={36}/>
                  </motion.div>
                  <div>
                    <p className="font-black text-xl text-gray-800 dark:text-white">تم إرسال الطلب! 🎉</p>
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                      سيتم مراسلتك على بريدك الإلكتروني
                      <span className="font-bold text-primary"> {user?.email} </span>
                      لمتابعة طلب شرائك
                    </p>
                  </div>
                  <button onClick={() => setModal(null)}
                    className="w-full py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20">
                    حسناً
                  </button>
                </div>
              )}

              {/* ─── نقاط غير كافية ─── */}
              {modal.type === "insufficient" && (
                <div className="space-y-5 text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="text-red-500" size={28}/>
                  </div>
                  <div>
                    <p className="font-black text-xl text-gray-800 dark:text-white">نقاط غير كافية</p>
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                      تحتاج إلى {modal.product.price.toLocaleString("ar")} نقطة لشراء هذا المنتج
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">رصيدك الحالي</span>
                      <span className="font-bold flex items-center gap-1 text-red-500">
                        <Star size={13} className="text-red-400 fill-red-400"/>
                        {userPoints.toLocaleString("ar")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">تحتاج إضافة</span>
                      <span className="font-bold text-red-600">
                        {(modal.product.price - userPoints).toLocaleString("ar")} نقطة
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">أكمل مهامك اليومية لكسب المزيد من النقاط ⭐</p>
                  <button onClick={() => setModal(null)}
                    className="w-full py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300">
                    حسناً
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingBag className="text-primary" size={32}/> متجر النقاط
          </h1>
          <p className="text-gray-500 mt-1">استبدل نقاطك بمكافآت حقيقية</p>
        </div>
        {/* رصيد النقاط */}
        <div className="flex items-center gap-2 bg-gradient-to-l from-yellow-400 to-orange-400 text-white px-5 py-3 rounded-2xl shadow-lg font-black">
          <Star size={20} className="fill-white"/>
          <span className="text-xl">{userPoints.toLocaleString("ar")}</span>
          <span className="text-sm font-bold opacity-90">نقطة</span>
        </div>
      </div>

      {/* ─── المنتجات ─── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={36}/>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <Sparkles size={52} className="mx-auto text-gray-300 mb-4"/>
          <p className="font-black text-xl text-gray-500">المتجر فارغ حالياً</p>
          <p className="text-gray-400 mt-1">ترقّب المكافآت قريباً!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => {
            const affordable = canAfford(product.price);
            return (
              <motion.div key={product.id}
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0  }}
                transition={{ delay: i * 0.07 }}
                className={`bg-white dark:bg-gray-900 rounded-3xl border overflow-hidden transition-all hover:shadow-xl ${
                  affordable
                    ? "border-gray-100 dark:border-gray-800 hover:-translate-y-1"
                    : "border-gray-100 dark:border-gray-800 opacity-80"
                }`}>

                {/* صورة */}
                <div className="relative overflow-hidden">
                  <img src={product.imageUrl} alt={product.name}
                    className={`w-full h-48 object-cover transition-all ${!affordable ? "grayscale-[30%]" : ""}`}/>
                  {/* شارة السعر */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-md">
                    <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                    <span className="font-black text-sm text-gray-800 dark:text-white">
                      {product.price.toLocaleString("ar")}
                    </span>
                  </div>
                  {/* شارة "لا تكفي" */}
                  {!affordable && (
                    <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-4">
                      <div className="flex items-center gap-1.5 bg-red-500/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold">
                        <Lock size={12}/> تحتاج {(product.price - userPoints).toLocaleString("ar")} نقطة إضافية
                      </div>
                    </div>
                  )}
                </div>

                {/* معلومات */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-black text-lg text-gray-800 dark:text-white">{product.name}</h3>
                    {product.desc && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{product.desc}</p>
                    )}
                  </div>

                  {/* زر الشراء */}
                  <button
                    onClick={() => handleBuy(product)}
                    disabled={!!buying}
                    className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      affordable
                        ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                    }`}>
                    {buying === product.id
                      ? <Loader2 size={16} className="animate-spin"/>
                      : affordable
                        ? <><ShoppingBag size={16}/> شراء الآن</>
                        : <><Lock size={14}/> نقاط غير كافية</>
                    }
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}