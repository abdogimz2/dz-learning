// src/app/contact/page.jsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/common/Navbar/Navbar";
import Footer from "@/components/common/Footer/Footer";
import { Mail, Phone, MapPin, Send, CheckCircle, Clock } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ⚙️ غيّرها إلى true بعد ضبط إرسال البريد (GMAIL_USER / GMAIL_APP_PASSWORD) في الاستضافة
const CONTACT_FORM_ENABLED = false;

export default function ContactPage() {
  const [form, setForm]     = useState({ name:"", email:"", subject:"", message:"", website:"" });
  const [error, setError]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!CONTACT_FORM_ENABLED) return;
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setLoading(true);
    setError("");

    const payload = {
      name:    form.name.trim(),
      email:   form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    };

    // 1) إرسال بريد إلكتروني إليك   2) حفظ نسخة في Firestore (تظهر في لوحة الأدمن)
    // النجاح = نجاح أحدهما على الأقل؛ الفشل الكامل يُعرض للمستخدم بدل إخفائه
    const [mailRes, saveRes] = await Promise.allSettled([
      fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...payload, website: form.website }),
      }).then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.ok) throw new Error(data.error || "send_failed");
      }),
      addDoc(collection(db, "contactMessages"), {
        ...payload,
        createdAt: serverTimestamp(),
        status:    "unread",
      }),
    ]);

    const mailOk = mailRes.status === "fulfilled";
    const saveOk = saveRes.status === "fulfilled";

    if (mailOk || saveOk) {
      setSent(true);
    } else {
      const code = mailRes.reason?.message;
      setError(
        code === "rate_limited"
          ? "أرسلت عدة رسائل خلال وقت قصير، حاول بعد قليل."
          : code === "invalid_email"
          ? "البريد الإلكتروني غير صحيح."
          : "تعذّر إرسال الرسالة. حاول مرة أخرى أو راسلنا مباشرة على بريدنا."
      );
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      <Navbar />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none"/>
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8}}>
            <span className="inline-block bg-primary/10 text-primary font-bold text-sm px-4 py-2 rounded-full mb-6">اتصل بنا</span>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
              نحن هنا <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">لمساعدتك</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              هل لديك سؤال أو اقتراح؟ فريقنا متاح دائماً للرد عليك
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.8}} className="space-y-6">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">تواصل معنا</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                سواء كان لديك استفسار عن المحتوى، مشكلة تقنية، أو فكرة لتحسين المنصة — نحن نسمعك ونرد خلال 24 ساعة.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Mail,   title: "البريد الإلكتروني", value: "Darsnadz1@gmail.com",        href: "mailto:Darsnadz1@gmail.com" },
                  { icon: Mail,   title: "البريد الإلكتروني (دعم)", value: "Darsnadz2@gmail.com",  href: "mailto:Darsnadz2@gmail.com" },
                  { icon: MapPin, title: "العنوان",           value: "الجزائر العاصمة",          href: null                       },
                  { icon: Clock,  title: "ساعات العمل",       value: "الأحد – الخميس، 8ص – 6م", href: null                       },
                ].map((item, i) => (
                  <motion.div key={i} initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                    className="flex items-start gap-4 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon size={20} className="text-primary"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{item.title}</p>
                      {item.href
                        ? <a href={item.href} className="font-bold text-gray-800 dark:text-white hover:text-primary transition-colors">{item.value}</a>
                        : <p className="font-bold text-gray-800 dark:text-white">{item.value}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.8}}>
              {sent ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-10 text-center h-full flex flex-col items-center justify-center gap-4">
                  <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring"}}>
                    <CheckCircle size={64} className="text-emerald-500 mx-auto"/>
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">تم الإرسال! 🎉</h3>
                  <p className="text-gray-500">سنرد عليك خلال 24 ساعة على بريدك الإلكتروني</p>
                  <button onClick={() => { setSent(false); setForm({name:"",email:"",subject:"",message:"",website:""}); }}
                    className="mt-4 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all">
                    إرسال رسالة أخرى
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 space-y-5">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">أرسل رسالة</h3>
                  {!CONTACT_FORM_ENABLED && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                      <p className="font-black mb-1">⚠️ نموذج الإرسال لا يعمل حالياً</p>
                      <p>
                        نعتذر عن ذلك، ونعمل على إصلاحه. يرجى إرسال رسالتك مباشرة عبر Gmail إلى:
                      </p>
                      <p className="mt-2 font-bold" dir="ltr">
                        <a href="mailto:Darsnadz1@gmail.com" className="underline hover:opacity-80">Darsnadz1@gmail.com</a>
                        <span className="mx-2">/</span>
                        <a href="mailto:Darsnadz2@gmail.com" className="underline hover:opacity-80">Darsnadz2@gmail.com</a>
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الاسم *</label>
                      <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="اسمك الكامل" maxLength={300}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200"/>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">البريد *</label>
                      <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com" maxLength={300}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200" dir="ltr"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الموضوع</label>
                    <input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="موضوع رسالتك" maxLength={500}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الرسالة *</label>
                    <textarea rows={5} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="اكتب رسالتك هنا..." maxLength={5000}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200 resize-none"/>
                  </div>
                  {/* حقل مصيدة للبوتات — مخفي عن المستخدمين */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
                    value={form.website} onChange={e=>setForm({...form,website:e.target.value})}
                    style={{ position:"absolute", left:"-9999px", width:1, height:1, opacity:0 }}/>
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-bold">
                      {error}
                    </div>
                  )}
                  <button type="submit" disabled={loading || !CONTACT_FORM_ENABLED}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-black rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 text-lg">
                    {loading ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"/> : <Send size={20}/>}
                    {loading ? "جاري الإرسال..." : CONTACT_FORM_ENABLED ? "إرسال الرسالة" : "الإرسال غير متاح حالياً"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}