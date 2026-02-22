// src/data/subjects.js

// قاموس المواد بالعربية
/*export const subjectNames = {
  // المواد الأساسية
  arabic: "اللغة العربية",
  french: "الفرنسية",
  english: "الإنجليزية",
  math: "الرياضيات",
  history: "التاريخ",
  geography: "الجغرافيا",
  islamic: "التربية الإسلامية",
  physics: "الفيزياء",
  science: "العلوم الطبيعية",
  
  // مواد أدبية
  philosophy: "الفلسفة",
  
  // مواد تقنية
  civil_engineering: "هندسة مدنية",
  electrical_engineering: "هندسة كهربائية",
  mechanical_engineering: "هندسة ميكانيكية",
  process_engineering: "هندسة الطرائق",
  
  // مواد تسيير واقتصاد
  accounting: "محاسبة",
  economics: "اقتصاد",
  law: "قانون",
  
  // مواد إضافية
  civics: "التربية المدنية",
  it: "الإعلام الآلي",
  
  // لغات ثالثة
  german: "الألمانية",
  spanish: "الإسبانية",
  italian: "الإيطالية",
};

// دالة لجلب المواد حسب مستوى وتخصص الطالب
export const getSubjectsByStudentLevel = (user) => {
  // التحقق من وجود بيانات المستخدم
  if (!user) return [];

  const { level, year, branchType, specialty, subSpecialty, thirdLanguage } = user;

  // ============ 1. الطور المتوسط ============
  if (level === "middle") {
    return [
      subjectNames.math,
      subjectNames.arabic,
      subjectNames.physics,
      subjectNames.science,
      subjectNames.french,
      subjectNames.english,
      subjectNames.history,
      subjectNames.geography,
      subjectNames.islamic,
      subjectNames.civics,
    ];
  }

  // ============ 2. الطور الثانوي ============
  if (level === "secondary") {
    
    // ---------- السنة الأولى ثانوي ----------
    if (year === "1sec") {
      // جذع مشترك - كلهم نفس المواد
      return [
        subjectNames.arabic,
        subjectNames.french,
        subjectNames.english,
        subjectNames.math,
        subjectNames.history,
        subjectNames.geography,
        subjectNames.islamic,
        subjectNames.physics,
        subjectNames.science,
        subjectNames.it,
      ];
    }

    // ---------- السنة الثانية ثانوي ----------
    if (year === "2sec") {
      
      // ---- الشعب العلمية ----
      if (branchType === "science_main") {
        
        // علوم تجريبية
        if (specialty === "علوم تجريبية") {
          return [
            subjectNames.arabic,
            subjectNames.french,
            subjectNames.english,
            subjectNames.math,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
            subjectNames.physics,
            subjectNames.science,
          ];
        }
        
        // رياضيات
        if (specialty === "رياضيات") {
          return [
            subjectNames.arabic,
            subjectNames.french,
            subjectNames.english,
            subjectNames.math,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
            subjectNames.physics,
            subjectNames.science,
          ];
        }
        
        // تقني رياضي
        if (specialty === "tech") {
          // اختيار مادة الهندسة حسب الفرع
          let engineeringSubject = "";
          
          if (subSpecialty === "هندسة كهربائية") {
            engineeringSubject = subjectNames.electrical_engineering;
          } else if (subSpecialty === "هندسة ميكانيكية") {
            engineeringSubject = subjectNames.mechanical_engineering;
          } else if (subSpecialty === "هندسة مدنية") {
            engineeringSubject = subjectNames.civil_engineering;
          } else if (subSpecialty === "هندسة الطرائق") {
            engineeringSubject = subjectNames.process_engineering;
          } else {
            engineeringSubject = "هندسة"; // افتراضي
          }
          
          return [
            subjectNames.arabic,
            subjectNames.french,
            subjectNames.english,
            subjectNames.math,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
            subjectNames.physics,
            engineeringSubject,
          ];
        }
        
        // تسيير واقتصاد
        if (specialty === "تسيير واقتصاد") {
          return [
            subjectNames.arabic,
            subjectNames.french,
            subjectNames.english,
            subjectNames.math,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
            subjectNames.accounting,
            subjectNames.economics,
            subjectNames.law,
          ];
        }
      }
      
      // ---- الشعب الأدبية ----
      if (branchType === "arts_main") {
        
        // آداب وفلسفة
        if (specialty === "آداب وفلسفة") {
          return [
            subjectNames.math,
            subjectNames.arabic,
            subjectNames.english,
            subjectNames.french,
            subjectNames.philosophy,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
          ];
        }
        
        // لغات أجنبية
        if (specialty === "lang") {
          const subjects = [
            subjectNames.math,
            subjectNames.arabic,
            subjectNames.english,
            subjectNames.french,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
          ];
          
          // إضافة اللغة الثالثة إذا وجدت
          if (thirdLanguage) {
            subjects.push(thirdLanguage);
          }
          
          return subjects;
        }
      }
    }

    // ---------- السنة الثالثة ثانوي ----------
    if (year === "3sec") {
      
      // ---- الشعب العلمية ----
      if (branchType === "science_main") {
        
        // علوم تجريبية
        if (specialty === "علوم تجريبية") {
          return [
            subjectNames.arabic,
            subjectNames.french,
            subjectNames.english,
            subjectNames.math,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
            subjectNames.physics,
            subjectNames.science,
            subjectNames.philosophy,
          ];
        }
        
        // رياضيات
        if (specialty === "رياضيات") {
          return [
            subjectNames.arabic,
            subjectNames.french,
            subjectNames.english,
            subjectNames.math,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
            subjectNames.physics,
            subjectNames.science,
            subjectNames.philosophy,
          ];
        }
        
        // تقني رياضي
        if (specialty === "tech") {
          // اختيار مادة الهندسة حسب الفرع
          let engineeringSubject = "";
          
          if (subSpecialty === "هندسة كهربائية") {
            engineeringSubject = subjectNames.electrical_engineering;
          } else if (subSpecialty === "هندسة ميكانيكية") {
            engineeringSubject = subjectNames.mechanical_engineering;
          } else if (subSpecialty === "هندسة مدنية") {
            engineeringSubject = subjectNames.civil_engineering;
          } else if (subSpecialty === "هندسة الطرائق") {
            engineeringSubject = subjectNames.process_engineering;
          } else {
            engineeringSubject = "هندسة";
          }
          
          return [
            subjectNames.arabic,
            subjectNames.french,
            subjectNames.english,
            subjectNames.math,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
            subjectNames.physics,
            engineeringSubject,
            subjectNames.philosophy,
          ];
        }
        
        // تسيير واقتصاد
        if (specialty === "تسيير واقتصاد") {
          return [
            subjectNames.arabic,
            subjectNames.french,
            subjectNames.english,
            subjectNames.math,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
            subjectNames.accounting,
            subjectNames.economics,
            subjectNames.law,
            subjectNames.philosophy,
          ];
        }
      }
      
      // ---- الشعب الأدبية ----
      if (branchType === "arts_main") {
        
        // آداب وفلسفة
        if (specialty === "آداب وفلسفة") {
          return [
            subjectNames.math,
            subjectNames.arabic,
            subjectNames.english,
            subjectNames.french,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
          ];
        }
        
        // لغات أجنبية
        if (specialty === "lang") {
          const subjects = [
            subjectNames.math,
            subjectNames.arabic,
            subjectNames.english,
            subjectNames.french,
            subjectNames.history,
            subjectNames.geography,
            subjectNames.islamic,
          ];
          
          // إضافة اللغة الثالثة
          if (thirdLanguage) {
            subjects.push(thirdLanguage);
          }
          
          return subjects;
        }
      }
    }
  }

  // إذا لم يطابق أي شرط، أرجع مصفوفة فارغة
  return [];
};*/