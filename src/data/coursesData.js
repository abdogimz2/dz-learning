// src/data/coursesData.js
export const coursesDatabase = {
  1: {
    id: 1,
    title: "الفيزياء",
    fullTitle: "الفيزياء - 3 ثانوي",
    teacher: "د. علي أحمد",
    level: "3 ثانوي",
    color: "blue",
    description: "مادة الفيزياء للصف الثالث الثانوي تشمل الميكانيكا، الكهرباء، والموجات",
    stats: { 
      hours: 54, 
      progress: 45, 
      students: 1243, 
      difficulty: "متوسط",
      completedLessons: 8,
      totalLessons: 21
    }
  },
  2: {
    id: 2,
    title: "الهندسة المدنية",
    fullTitle: "الهندسة المدنية - تقني رياضي",
    teacher: "م. سميرة قاسم",
    level: "تقني رياضي",
    color: "indigo",
    description: "مبادئ الهندسة المدنية، تصميم المنشآت، والمواد الإنشائية",
    stats: { 
      hours: 48, 
      progress: 32, 
      students: 876, 
      difficulty: "صعب",
      completedLessons: 5,
      totalLessons: 18
    }
  },
  3: {
    id: 3,
    title: "الرياضيات",
    fullTitle: "الرياضيات - 3 ثانوي",
    teacher: "أ. محمد خالد",
    level: "3 ثانوي",
    color: "emerald",
    description: "الجبر، التفاضل، التكامل، والهندسة التحليلية",
    stats: { 
      hours: 72, 
      progress: 60, 
      students: 1543, 
      difficulty: "متقدم",
      completedLessons: 12,
      totalLessons: 24
    }
  },
  4: {
    id: 4,
    title: "علوم طبيعية",
    fullTitle: "علوم طبيعية - 3 ثانوي",
    teacher: "د. فاطمة زهراء",
    level: "3 ثانوي",
    color: "green",
    description: "الأحياء، الكيمياء، والعلوم الطبيعية المتكاملة",
    stats: { 
      hours: 42, 
      progress: 38, 
      students: 1120, 
      difficulty: "متوسط",
      completedLessons: 7,
      totalLessons: 19
    }
  },
  5: {
    id: 5,
    title: "اللغة العربية",
    fullTitle: "اللغة العربية - 3 ثانوي",
    teacher: "أ. أحمد محمود",
    level: "3 ثانوي",
    color: "yellow",
    description: "النحو، البلاغة، الأدب، والتعبير الكتابي",
    stats: { 
      hours: 36, 
      progress: 55, 
      students: 1320, 
      difficulty: "سهل",
      completedLessons: 10,
      totalLessons: 16
    }
  },
  6: {
    id: 6,
    title: "اللغة الفرنسية",
    fullTitle: "اللغة الفرنسية - 3 ثانوي",
    teacher: "م. سارة بنت علي",
    level: "3 ثانوي",
    color: "red",
    description: "قواعد اللغة الفرنسية، المحادثة، والقراءة",
    stats: { 
      hours: 40, 
      progress: 48, 
      students: 980, 
      difficulty: "متوسط",
      completedLessons: 9,
      totalLessons: 20
    }
  },
  7: {
    id: 7,
    title: "التاريخ",
    fullTitle: "التاريخ - 3 ثانوي",
    teacher: "د. خالد عمر",
    level: "3 ثانوي",
    color: "purple",
    description: "تاريخ الجزائر والعالم الحديث",
    stats: { 
      hours: 32, 
      progress: 65, 
      students: 890, 
      difficulty: "سهل",
      completedLessons: 11,
      totalLessons: 15
    }
  },
  8: {
    id: 8,
    title: "الجغرافيا",
    fullTitle: "الجغرافيا - 3 ثانوي",
    teacher: "أ. ليلى كريم",
    level: "3 ثانوي",
    color: "pink",
    description: "الجغرافيا الطبيعية والبشرية للجزائر والعالم",
    stats: { 
      hours: 34, 
      progress: 42, 
      students: 760, 
      difficulty: "متوسط",
      completedLessons: 8,
      totalLessons: 17
    }
  },
  9: {
    id: 9,
    title: "الفلسفة",
    fullTitle: "الفلسفة - 3 ثانوي",
    teacher: "د. عبد الرحمن",
    level: "3 ثانوي",
    color: "gray",
    description: "مبادئ الفلسفة، المنطق، والفكر النقدي",
    stats: { 
      hours: 28, 
      progress: 30, 
      students: 650, 
      difficulty: "صعب",
      completedLessons: 6,
      totalLessons: 14
    }
  },
  10: {
    id: 10,
    title: "اللغة الإنجليزية",
    fullTitle: "اللغة الإنجليزية - 3 ثانوي",
    teacher: "م. جون سميث",
    level: "3 ثانوي",
    color: "blue",
    description: "قواعد اللغة الإنجليزية، المحادثة، والكتابة",
    stats: { 
      hours: 38, 
      progress: 52, 
      students: 1200, 
      difficulty: "متوسط",
      completedLessons: 9,
      totalLessons: 18
    }
  },
};

// دالة مساعدة للحصول على معلومات المادة
export const getCourseInfo = (courseId) => {
  return coursesDatabase[courseId] || {
    id: courseId,
    title: `المادة ${courseId}`,
    fullTitle: `المادة ${courseId}`,
    teacher: "أستاذ المادة",
    level: "غير محدد",
    color: "gray",
    description: "وصف المادة",
    stats: { 
      hours: 0, 
      progress: 0, 
      students: 0, 
      difficulty: "غير محدد",
      completedLessons: 0,
      totalLessons: 0
    }
  };
};

// دالة للحصول على جميع المواد
export const getAllCourses = () => {
  return Object.values(coursesDatabase);
};