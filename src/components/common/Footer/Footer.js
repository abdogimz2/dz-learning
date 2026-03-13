import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  School,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t-4 border-primary">
      <div className="container mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1 - About & Logo */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 rounded-lg">
                <School className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  منصة مايندلي التعليمية
                </h3>
                <p className="text-secondary text-sm mt-1">
                  معا للتحقيق التطور التعليمي
                </p>
              </div>
            </div>

            <p className="text-gray-400 mb-6 leading-relaxed">
              منصة تعليمية رائدة تهدف إلى تطوير المستوى التعليمي للطلاب
              الجزائريين عبر تقديم محتوى تعليمي متميز وحديث، نقدم حلولاً متكاملة
              للتعلم الإلكتروني.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="#"
                className="bg-gray-800 hover:bg-primary p-2.5 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
                aria-label="Facebook"
              >
                <Facebook
                  size={20}
                  className="text-gray-400 hover:text-white"
                />
              </a>
              <a
                href="#"
                className="bg-gray-800 hover:bg-primary p-2.5 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
                aria-label="Twitter"
              >
                <Twitter size={20} className="text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="bg-gray-800 hover:bg-primary p-2.5 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
                aria-label="Instagram"
              >
                <Instagram
                  size={20}
                  className="text-gray-400 hover:text-white"
                />
              </a>
              <a
                href="#"
                className="bg-gray-800 hover:bg-secondary p-2.5 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
                aria-label="YouTube"
              >
                <Youtube size={20} className="text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6 pb-3 border-b border-gray-800">
              روابط سريعة
            </h4>
            <ul className="space-y-3">
              {[
                { label: "الرئيسية", href: "/", icon: "🏠" },
                { label: "جميع المواد", href: "/subjects", icon: "📚" },
                { label: "الاختبارات", href: "/exams", icon: "📝" },
                
                { label: "المدونة", href: "/blog", icon: "✍️" },
                { label: "من نحن", href: "/about", icon: "ℹ️" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 text-gray-400 hover:text-primary transition-colors group py-2"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Levels & Programs */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6 pb-3 border-b border-gray-800">
              المستويات والتخصصات
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-secondary font-medium mb-2">
                  التعليم المتوسط
                </h5>
                <div className="flex flex-wrap gap-2">
                  {[
                    "السنة الأولى",
                    "السنة الثانية",
                    "السنة الثالثة",
                    "السنة الرابعة",
                  ].map((level) => (
                    <Link
                      key={level}
                      href={`/level/${level}`}
                      className="text-xs bg-gray-800 hover:bg-primary hover:text-white px-3 py-1.5 rounded-full transition-colors"
                    >
                      {level}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-secondary font-medium mb-2">
                  التعليم الثانوي
                </h5>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "شعبة علوم", color: "hover:bg-primary" },
                    { label: "شعبة آداب", color: "hover:bg-secondary" },
                    { label: "شعبة تسيير", color: "hover:bg-primary" },
                    { label: "شعبة تقني", color: "hover:bg-secondary" },
                  ].map((spec) => (
                    <Link
                      key={spec.label}
                      href={`/specialty/${spec.label}`}
                      className={`text-xs bg-gray-800 hover:text-white px-3 py-1.5 rounded-full transition-colors ${spec.color}`}
                    >
                      {spec.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 4 - Contact & Newsletter */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6 pb-3 border-b border-gray-800">
              تواصل معنا
            </h4>
            <div className="space-y-4 text-gray-400">
              <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Phone
                  size={18}
                  className="text-secondary mt-1 flex-shrink-0"
                />
                <div>
                  <p className="font-medium text-white">الدعم الفني</p>
                  <p className="text-sm">0550-123-456</p>
                  <p className="text-xs text-gray-500 mt-1">
                    من السبت إلى الخميس، 8 صباحاً - 5 مساءً
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Mail size={18} className="text-secondary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">البريد الإلكتروني</p>
                  <a
                    href="mailto:contact@dz-learning.dz"
                    className="text-sm hover:text-secondary transition-colors"
                  >
                    contact@dz-learning.dz
                  </a>
                  <p className="text-xs text-gray-500 mt-1">نرد خلال 24 ساعة</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                <MapPin
                  size={18}
                  className="text-secondary mt-1 flex-shrink-0"
                />
                <div>
                  <p className="font-medium text-white">العنوان</p>
                  <p className="text-sm">الجزائر العاصمة، حي القبة</p>
                  <p className="text-xs text-gray-500 mt-1">
                    مبنى التعليم الرقمي، الطابق الثالث
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-right">
              <p className="text-gray-400">
                © {currentYear} المنصة التعليمية الجزائرية. جميع الحقوق محفوظة.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                ⚡ تم التطوير مع الحب للجزائر
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                سياسة الخصوصية
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                شروط الاستخدام
              </Link>
              <Link
                href="/sitemap"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                خريطة الموقع
              </Link>
              <Link
                href="/accessibility"
                className="text-gray-400 hover:text-secondary transition-colors"
              >
                إمكانية الوصول
              </Link>
            </div>
          </div>

          {/* Certification Badges */}
          <div className="flex justify-center items-center gap-6 mt-8 pt-6 border-t border-gray-800">
            <div className="text-center">
              <div className="bg-gray-800 rounded-lg px-4 py-2 inline-block">
                <span className="text-primary font-bold">ISO 27001</span>
                <p className="text-xs text-gray-500 mt-1">أمن المعلومات</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 rounded-lg px-4 py-2 inline-block">
                <span className="text-secondary font-bold">معتمد</span>
                <p className="text-xs text-gray-500 mt-1">وزارة التعليم</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 rounded-lg px-4 py-2 inline-block">
                <span className="text-primary font-bold">SSL</span>
                <p dir="rtl" className="text-xs text-gray-500 mt-1">
                  آمن 100%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top button for mobile */}
      <div className="md:hidden bg-gray-800 py-3 text-center">
        <Link
          href="#top"
          className="text-primary hover:text-secondary transition-colors font-medium inline-flex items-center gap-2"
        >
          <span>العودة للأعلى</span>
          <span>↑</span>
        </Link>
      </div>
    </footer>
  );
}
