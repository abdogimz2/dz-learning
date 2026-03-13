// src/app/terms/page.jsx
"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import Navbar from "@/components/common/Navbar/Navbar";
import Footer from "@/components/common/Footer/Footer";
import ScrollToTop from "@/components/common/ScrollToTop/ScrollToTop";

const SECTIONS = [
  {
    title: "1. قبول الشروط",
    content: "باستخدامك منصة Mindly، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى التوقف عن استخدام المنصة.",
  },
  {
    title: "2. استخدام الحساب",
    content: "أنت مسؤول عن الحفاظ على سرية معلومات حسابك. يُمنع مشاركة حسابك مع الآخرين. يجب أن تكون المعلومات التي تقدمها دقيقة وحقيقية.",
  },
  {
    title: "3. حقوق الملكية الفكرية",
    content: "جميع المحتويات على المنصة (دروس، اختبارات، صور، نصوص) هي ملك حصري لـ Mindly ومحمية بموجب قوانين الملكية الفكرية. يُمنع نسخ أو توزيع أي محتوى دون إذن مسبق.",
  },
  {
    title: "4. الاشتراك والدفع",
    content: "بعض الميزات تتطلب اشتراكاً مدفوعاً. يتم دفع الرسوم مقدماً ولا تُرد إلا في حالات محددة. نحتفظ بحق تغيير أسعار الاشتراك مع إشعار مسبق.",
  },
  {
    title: "5. سلوك المستخدم",
    content: "يُمنع استخدام المنصة لأي أغراض غير قانونية. يُمنع نشر محتوى مسيء أو مخالف للآداب العامة. نحتفظ بحق تعليق أو حذف أي حساب يخالف هذه الشروط.",
  },
  {
    title: "6. إخلاء المسؤولية",
    content: "تُقدَّم المنصة 'كما هي' دون ضمانات. لن نكون مسؤولين عن أي خسائر مباشرة أو غير مباشرة ناتجة عن استخدام المنصة.",
  },
  {
    title: "7. تعديل الشروط",
    content: "نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة.",
  },
  {
    title: "8. القانون المُطبَّق",
    content: "تخضع هذه الشروط للقوانين الجزائرية النافذة. أي نزاع ينشأ عن هذه الشروط يخضع للاختصاص القضائي للمحاكم الجزائرية.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      <Navbar />

      <section className="pt-32 pb-12 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}}>
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="text-primary" size={32}/>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">شروط الاستخدام</h1>
            <p className="text-gray-500">آخر تحديث: مارس 2026</p>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
              يرجى قراءة هذه الشروط بعناية قبل استخدام منصة Mindly.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl space-y-5">
          {SECTIONS.map((sec, i) => (
            <motion.div key={i}
              initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
              transition={{delay:i*0.05}}
              className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3">{sec.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{sec.content}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </main>
  );
}