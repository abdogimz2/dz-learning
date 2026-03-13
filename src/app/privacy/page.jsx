// src/app/privacy/page.jsx
"use client";

import { motion } from "framer-motion";
import { Shield, Eye, Lock, Trash2, Bell, Mail } from "lucide-react";
import Navbar from "@/components/common/Navbar/Navbar";
import Footer from "@/components/common/Footer/Footer";
import ScrollToTop from "@/components/common/ScrollToTop/ScrollToTop";

const SECTIONS = [
  {
    icon: Eye,
    title: "1. المعلومات التي نجمعها",
    content: [
      "معلومات التسجيل: الاسم، البريد الإلكتروني، رقم الهاتف، المستوى الدراسي.",
      "بيانات الاستخدام: الدروس المشاهدة، الاختبارات المجراة، النقاط المكتسبة.",
      "المعلومات التقنية: عنوان IP، نوع المتصفح، الجهاز المستخدم.",
      "الرسائل التي ترسلها إلى فريق الدعم.",
    ],
  },
  {
    icon: Lock,
    title: "2. كيف نستخدم معلوماتك",
    content: [
      "تقديم الخدمات التعليمية وتخصيص تجربة التعلم.",
      "إرسال تنبيهات تعليمية وإشعارات المراجعة.",
      "تحسين المنصة وتطوير محتوى جديد.",
      "الرد على استفساراتك ودعمك تقنياً.",
      "لن نبيع بياناتك لأي طرف ثالث أبداً.",
    ],
  },
  {
    icon: Shield,
    title: "3. حماية بياناتك",
    content: [
      "نستخدم تشفير SSL لحماية جميع الاتصالات.",
      "يُخزَّن كلمة المرور بصيغة مشفرة ولا يمكن الاطلاع عليها.",
      "وصول محدود للبيانات: فقط الموظفون المعتمدون يمكنهم الوصول.",
      "نراجع سياساتنا الأمنية بانتظام ونحدّثها.",
    ],
  },
  {
    icon: Bell,
    title: "4. الكوكيز وتقنيات التتبع",
    content: [
      "نستخدم كوكيز ضرورية لتشغيل المنصة.",
      "كوكيز تحليلية لفهم كيفية استخدامك للمنصة (مجهولة الهوية).",
      "يمكنك تعطيل الكوكيز من إعدادات متصفحك في أي وقت.",
    ],
  },
  {
    icon: Trash2,
    title: "5. حقوقك",
    content: [
      "حق الوصول: يمكنك طلب نسخة من بياناتك الشخصية.",
      "حق التصحيح: يمكنك تعديل معلوماتك من صفحة الملف الشخصي.",
      "حق الحذف: يمكنك طلب حذف حسابك وبياناتك نهائياً.",
      "حق الاعتراض: يمكنك رفض معالجة بياناتك لأغراض التسويق.",
    ],
  },
  {
    icon: Mail,
    title: "6. تواصل معنا",
    content: [
      "إذا كان لديك أي استفسار حول سياسة الخصوصية، تواصل معنا على:",
      "البريد الإلكتروني: contact@mindly.dz",
      "سنرد على طلبك خلال 48 ساعة عمل.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}}>
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="text-primary" size={32}/>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
              سياسة الخصوصية
            </h1>
            <p className="text-gray-500">آخر تحديث: مارس 2026</p>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
              نحن في Mindly نأخذ خصوصيتك بجدية تامة. توضح هذه السياسة كيف نجمع بياناتك ونستخدمها ونحميها.
            </p>
          </motion.div>
        </div>
      </section>

      {/* المحتوى */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="space-y-6">
            {SECTIONS.map((sec, i) => (
              <motion.div key={i}
                initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
                transition={{delay:i*0.05}}
                className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <sec.icon className="text-primary" size={20}/>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{sec.title}</h3>
                </div>
                <ul className="space-y-3">
                  {sec.content.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"/>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </main>
  );
}