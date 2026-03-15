// src/app/about/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/common/Navbar/Navbar";
import Footer from "@/components/common/Footer/Footer";
import { Brain, Target, Users, Award, BookOpen, Zap } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, getCountFromServer } from "firebase/firestore";

const TEAM = [
  { name: "فريق المحتوى",  role: "مختصون تربويون معتمدون",   emoji: "👨‍🏫" },
  { name: "فريق التطوير",  role: "مهندسو برمجيات متخصصون",   emoji: "💻"  },
  { name: "فريق الدعم",    role: "متاحون 24/7 لمساعدتك",     emoji: "🎧"  },
];

const VALUES = [
  { icon: Brain,    title: "الابتكار",  desc: "نطور باستمرار أدوات تعليمية ذكية تواكب متطلبات العصر"       },
  { icon: Target,   title: "الجودة",   desc: "محتوى معتمد من متخصصين تربويين ومتوافق مع المناهج الرسمية"  },
  { icon: Users,    title: "المجتمع",  desc: "بناء مجتمع طلابي تعاوني يدعم بعضه ويتنافس بشكل صحي"        },
  { icon: Award,    title: "التميز",   desc: "نسعى لأن يحقق كل طالب أعلى مستوياته الأكاديمية"             },
  { icon: BookOpen, title: "الشمولية", desc: "تغطية كاملة لجميع المستويات والتخصصات الدراسية"              },
  { icon: Zap,      title: "التحفيز",  desc: "نظام نقاط ومكافآت يجعل التعلم ممتعاً ومثمراً"               },
];

export default function AboutPage() {
  const [studentsCount, setStudentsCount] = useState("33+");

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const snap = await getCountFromServer(collection(db, "users"));
        const count = snap.data().count || 0;
        setStudentsCount(count > 0 ? `${count}+` : "33+");
      } catch {
        // نبقي الرقم الافتراضي
      }
    };
    fetchCount();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none"/>
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8}}>
            <span className="inline-block bg-primary/10 text-primary font-bold text-sm px-4 py-2 rounded-full mb-6">من نحن</span>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
              منصة <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Mindly</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              منصة تعليمية جزائرية تأسست بهدف توفير تجربة تعلم متكاملة وممتعة
              لطلاب التعليم المتوسط والثانوي عبر الجزائر
            </p>
          </motion.div>
        </div>
      </section>

      {/* رسالتنا */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.8}}>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6">رسالتنا</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                نؤمن بأن كل طالب جزائري يستحق الوصول إلى تعليم عالي الجودة بطريقة سهلة وممتعة.
                لذلك بنينا منصة Mindly لتكون رفيقه في رحلته الدراسية من المتوسط حتى البكالوريا.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                نجمع بين أفضل المحتوى التعليمي ونظام تحفيزي ذكي يجعل الطالب يستمتع بالتعلم
                ويرى تقدمه بشكل ملموس يوماً بعد يوم.
              </p>
            </motion.div>
            <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.8}}
              className="grid grid-cols-2 gap-4">
              {[{num:"500+",label:"درس تعليمي"},{num:"1000+",label:"سؤال اختباري"},{num:studentsCount,label:"طالب مسجّل"},{num:"24/7",label:"دعم متواصل"}].map((s,i)=>(
                <motion.div key={i} initial={{opacity:0,scale:0.9}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:i*0.1}}
                  className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-3xl font-black text-primary">{s.num}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* قيمنا */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-black text-center text-gray-900 dark:text-white mb-4">قيمنا</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-14 text-lg">المبادئ التي نبني عليها كل قرار</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {VALUES.map((v,i)=>(
              <motion.div key={i} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1,duration:0.6}}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary/30 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <v.icon size={22} className="text-primary"/>
                </div>
                <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* الفريق */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-black text-center text-gray-900 dark:text-white mb-4">فريقنا</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-14 text-lg">الأشخاص الذين يعملون من أجل نجاحك</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {TEAM.map((t,i)=>(
              <motion.div key={i} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.15,duration:0.6}}
                className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-8 text-center border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
                <div className="text-6xl mb-4">{t.emoji}</div>
                <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2">{t.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}