// src/lib/getUserSubjects.js
// دالة مشتركة لجلب مواد المستخدم حسب بياناته الفعلية في Firestore

export const SUBJECTS_BY_LEVEL = {
  middle: [
    "رياضيات","لغة عربية","فيزياء","علوم طبيعية","فرنسية",
    "إنجليزية","تاريخ","جغرافيا","تربية إسلامية","تربية مدنية"
  ],
  "1sec_science": [
    "لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ",
    "جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"
  ],
  "1sec_arts": [
    "لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ",
    "جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"
  ],
  science_exp: [
    "لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ",
    "جغرافيا","تربية إسلامية","فيزياء","علوم طبيعية"
  ],
  science_math: [
    "لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ",
    "جغرافيا","تربية إسلامية","فيزياء","علوم طبيعية"
  ],
  science_tech: [
    "لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ",
    "جغرافيا","تربية إسلامية","فيزياء"
    // مادة الهندسة تُضاف من subSpecialty
  ],
  science_eco: [
    "لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ",
    "جغرافيا","تربية إسلامية","محاسبة","اقتصاد","قانون"
  ],
  arts_philo: [
    "لغة عربية","فرنسية","إنجليزية","رياضيات","فلسفة",
    "تاريخ","جغرافيا","تربية إسلامية"
  ],
  arts_lang: [
    "لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ",
    "جغرافيا","تربية إسلامية"
    // اللغة الثالثة تُضاف من thirdLanguage
  ],
};

// ─── تحديد userLevel من بيانات المستخدم الفعلية ──────────────────────────────
// البيانات المحفوظة في Firestore:
//   level: "middle" | "secondary"
//   year:  "1sec" | "2sec" | "3sec"
//   branchType: "science" | "arts" | "science_main" | "arts_main"
//   specialty: "علوم تجريبية" | "رياضيات" | "tech" | "تسيير واقتصاد" | "آداب وفلسفة" | "lang"
//   subSpecialty: "هندسة كهربائية" | "هندسة ميكانيكية" | "هندسة مدنية" | "هندسة الطرائق"
export function getUserLevel(user) {
  if (!user) return null;

  if (user.level === "middle") return "middle";

  if (user.level === "secondary") {
    const year      = user.year      || "";
    const branch    = user.branchType|| "";
    const specialty = user.specialty || "";

    // السنة الأولى
    if (year === "1sec") {
      return branch === "arts" ? "1sec_arts" : "1sec_science";
    }

    // السنة الثانية أو الثالثة — شعب علمية
    if (branch === "science_main") {
      if (specialty === "tech")           return "science_tech";
      if (specialty === "تسيير واقتصاد") return "science_eco";
      if (specialty === "رياضيات")        return "science_math";
      return "science_exp"; // علوم تجريبية
    }

    // السنة الثانية أو الثالثة — شعب أدبية
    if (branch === "arts_main") {
      if (specialty === "lang")           return "arts_lang";
      return "arts_philo"; // آداب وفلسفة
    }
  }

  return null;
}

// ─── جلب قائمة المواد الكاملة للمستخدم ──────────────────────────────────────
export function getUserSubjects(user) {
  const level = getUserLevel(user);
  if (!level) return [];

  const base = [...(SUBJECTS_BY_LEVEL[level] || [])];

  // تقني رياضي → أضف مادة الهندسة الخاصة
  if (level === "science_tech" && user?.subSpecialty) {
    base.push(user.subSpecialty);
  }

  // لغات أجنبية → أضف اللغة الثالثة
  if (level === "arts_lang" && user?.thirdLanguage) {
    base.push(`لغة ${user.thirdLanguage}`);
  }

  return base;
}