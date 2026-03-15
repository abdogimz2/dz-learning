"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { TypeAnimation } from "react-type-animation";
import { useState, useEffect } from "react";
import Navbar from "@/components/common/Navbar/Navbar";
import Footer from "@/components/common/Footer/Footer";
import ScrollToTop from "@/components/common/ScrollToTop/ScrollToTop";
import ParticleBackground from "@/components/common/Particles/ParticleBackground";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <ParticleBackground />

        <div className="relative z-10 container mx-auto px-6 py-24 md:py-32 text-center">
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.9 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="inline-block mr-3">🎓</span>
              <TypeAnimation
                sequence={[
                  "منصة مايندلي التعليمية",
                  1200,
                  "بوابتك للتميز الدراسي",
                  1200,
                  "بوابتك للتميز الدراسي",
                  1200,
                ]}
                wrapper="span"
                speed={45}
                repeat={Infinity}
                className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              />
            </h1>
          </motion.div>

          <motion.p
            className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.9 }}
          >
            منصة متكاملة للتعلم والاختبارات لجميع المستويات الدراسية
          </motion.p>

          <motion.p
            className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.9 }}
          >
            نوفر لك بيئة تعليمية تفاعلية تحتوي على دروس مفصلة، اختبارات تقييمية، ونظام تحفيزي لتحقيق أفضل النتائج.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.9 }}
          >
            <Link href="/register">
              <AnimatedButton type="primary">
                <span className="text-xl">🚀</span>
                ابدأ التعلم الآن
              </AnimatedButton>
            </Link>

            <Link href="/register">
              <AnimatedButton type="secondary">
                <span className="text-xl">📚</span>
                تصفح المواد
              </AnimatedButton>
            </Link>
          </motion.div>

          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-10 md:gap-16"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.9 }}
          >
            <StatItem number="500+" label="درس تعليمي" delay={1.2} />
            <StatItem number="1000+" label="سؤال اختباري" delay={1.4} />
            <StatItem number="24/7" label="دعم متواصل" delay={1.6} />
          </motion.div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            لماذا تختار منصتنا؟
          </h2>
          <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-16 max-w-3xl mx-auto">
            نقدم حلولاً تعليمية مبتكرة تناسب جميع الاحتياجات
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.7 }}
                className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-primary/20 dark:hover:border-primary/40"
              >
                <div className="text-5xl mb-6 text-primary">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="py-20 md:py-28  from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900 dark:text-white">
            المستويات المتاحة
          </h2>

          <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
            {/* التعليم المتوسط */}
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-primary/20 dark:border-primary/40"
            >
              <div className="bg-primary text-white p-8">
                <h3 className="text-3xl font-bold">التعليم المتوسط</h3>
                <p className="text-lg opacity-90 mt-1">السنة 1–4</p>
              </div>
              <div className="p-8 flex flex-col flex-1">
                <ul className="grid grid-cols-2 gap-3 text-gray-700 dark:text-gray-300">
                  {MIDDLE_SCHOOL_SUBJECTS.map((sub) => (
                    <li key={sub} className="flex items-center gap-2">
                      <span className="text-primary">•</span> {sub}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-auto">
                  <button className="mt-10 w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-8 rounded-xl transition-colors duration-300">
                    تصفح المواد
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* التعليم الثانوي */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-secondary/20 dark:border-secondary/40"
            >
              <div className="bg-secondary text-white p-8">
                <h3 className="text-3xl font-bold">التعليم الثانوي</h3>
                <p className="text-lg opacity-90 mt-1">السنة 1–3</p>
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="space-y-8">
                  {HIGH_SCHOOL_SPECIALTIES.map((spec) => (
                    <div key={spec.title}>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {spec.title}
                      </h4>
                      <ul className="grid grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
                        {spec.subjects.map((s) => (
                          <li key={s} className="flex items-center gap-2">
                            <span className="text-secondary">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <Link href="/register" className="mt-auto">
                  <button className="mt-10 w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-4 px-8 rounded-xl transition-colors duration-300">
                    تصفح التخصصات
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-linear-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            جاهز لبدء رحلتك التعليمية؟
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-3xl mx-auto">
            انضم إلى آلاف الطلاب الذين يستفيدون من منصتنا يومياً
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <button className="bg-white text-primary hover:bg-gray-100 font-bold text-lg py-5 px-12 rounded-xl shadow-lg transition-all hover:scale-105 duration-300">
                سجل حساباً جديداً
              </button>
            </Link>

            <Link href="/register">
              <button className="border-2 border-white text-white hover:bg-white/10 font-bold text-lg py-5 px-12 rounded-xl transition-all duration-300">
                تعرف على العروض
              </button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
      <ScrollToTop />
    </main>
  );
}

// ────────────────────────────────────────────────
// Reusable Components
// ────────────────────────────────────────────────

function AnimatedButton({ children, type }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        font-bold text-lg px-10 py-5 rounded-xl transition-all duration-300 flex items-center gap-3 shadow-lg
        ${
          type === "primary"
            ? "bg-primary hover:bg-primary-hover text-white scale-100 hover:scale-105"
            : "border-2 border-secondary text-secondary hover:bg-secondary/10 dark:hover:bg-secondary/20 scale-100 hover:scale-105"
        }
      `}
    >
      {children}
    </button>
  );
}

function StatItem({ number, label, delay }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const target = parseInt(number) || 0;
    if (target === 0) { setCount(0); return; }

    let start = 0;
    const duration = 1200;
    const step = 16;
    const increment = target / (duration / step);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, step);

    return () => clearInterval(timer);
  }, [inView, number, delay]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl md:text-6xl font-extrabold text-primary dark:text-primary/90 mb-2">
        {count}
        {(number.includes("+") || number.includes("/")) && number.slice(-1)}
      </div>
      <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
        {label}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "📚",
    title: "مواد شاملة",
    description:
      "جميع المواد الدراسية للمرحلة المتوسطة والثانوية مع تحديث مستمر للمحتوى",
  },
  {
    icon: "🎯",
    title: "اختبارات تفاعلية",
    description: "آلاف الأسئلة مع التصحيح التلقائي والتقييم الفوري لأداء الطالب",
  },
  {
    icon: "🏆",
    title: "نظام تحفيزي",
    description: "كسب النقاط، المنافسة على الصدارة، ومكافآت لتحفيز الاستمرارية",
  },
  {
    icon: "👨‍🏫",
    title: "محتوى مميز",
    description: "دروس فيديو عالية الجودة، نصوص ميسرة، وأمثلة تطبيقية",
  },
  {
    icon: "📱",
    title: "منصات متعددة",
    description: "وصول سهل من الحاسوب، اللوحي، أو الهاتف الذكي في أي وقت",
  },
  {
    icon: "💼",
    title: "مهني ومعتمد",
    description: "محتوى معتمد من مختصين تربويين ومتوافق مع المناهج الرسمية",
  },
];

const MIDDLE_SCHOOL_SUBJECTS = [
  "الرياضيات",
  "اللغة العربية",
  "اللغة الفرنسية",
  "اللغة الإنجليزية",
  "العلوم الطبيعية",
  "الفيزياء",
  "التاريخ والجغرافيا",
  "التربية الإسلامية",
  "التربية المدنية",
  "التربية الفنية",
  "الإعلام الآلي",
];

const HIGH_SCHOOL_SPECIALTIES = [
  {
    title: "شعبة علوم",
    subjects: ["الرياضيات", "الفيزياء", "العلوم الطبيعية"],
  },
  {
    title: "شعبة آداب",
    subjects: ["الفلسفة", "التاريخ والجغرافيا", "اللغات الأجنبية"],
  },
  {
    title: "شعبة تسيير",
    subjects: ["الاقتصاد", "التسيير", "المحاسبة"],
  },
];