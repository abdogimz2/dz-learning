// src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ metadataBase: يخلي كل الروابط النسبية (og:image إلخ) تتحول لروابط كاملة بدومينك الحقيقي
export const metadata = {
  metadataBase: new URL("https://darsnadz.com"),
  title: {
    default: "Darsna | درسنا — منصة تعليمية جزائرية",
    template: "%s | Darsna درسنا",
  },
  description: "درسنا (Darsna) منصة تعليمية جزائرية لتلاميذ البكالوريا: دروس، تمارين، بطاقات مراجعة (Flashcards)، مهام يومية، ولوحة متصدرين.",
  // كلمات مفتاحية تساعد Google يربط اسم موقعك بالمحتوى تاعك
  keywords: ["Darsna", "درسنا", "darsnadz", "منصة تعليمية جزائرية", "بكالوريا الجزائر", "مراجعة البكالوريا"],
  applicationName: "Darsna",
  authors: [{ name: "Darsna" }],
  // ⚠️ رابط بديل: إذا كان موقعك يفتح أيضاً على www.darsnadz.com أو Vercel URL، حدد النسخة الأساسية هنا
  alternates: {
    canonical: "https://darsnadz.com",
  },
  // Open Graph: يتحكم كيف يظهر رابط موقعك عند مشاركته في فيسبوك/واتساب/تويتر
  openGraph: {
    type: "website",
    locale: "ar_DZ",
    url: "https://darsnadz.com",
    siteName: "Darsna | درسنا",
    title: "Darsna | درسنا — منصة تعليمية جزائرية",
    description: "دروس، تمارين، بطاقات مراجعة، ومهام يومية لتلاميذ البكالوريا في الجزائر.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Darsna" }],
  },
  twitter: {
    card: "summary",
    title: "Darsna | درسنا",
    description: "منصة تعليمية جزائرية لتلاميذ البكالوريا.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  // ⚠️ بعد ما تربط الموقع بـ Google Search Console (طريقة HTML tag)، حط الكود اللي يعطيك هنا
  // verification: { google: "ضع-الكود-هنا" },
};

// ✅ Structured Data (JSON-LD): يساعد Google يفهم أن "Darsna" هو اسم كيان/علامة معينة
// وهذا اللي يخلي نتيجة البحث تطلع بشكل غني (Sitelinks) متل المثال اللي بعثتلي بيه
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Darsna",
  alternateName: "درسنا",
  url: "https://darsnadz.com",
  logo: "https://darsnadz.com/logo.png",
  // ⚠️ ضروري: ضيف هنا روابط صفحات التواصل الاجتماعي تاع Darsna (فيسبوك، إنستغرام، تيك توك...)
  // هذا أهم عامل يخلي Google يربط بين اسم "Darsna" ودومينك بسرعة
  sameAs: [
    // "https://www.facebook.com/darsnadz",
    // "https://www.instagram.com/darsnadz",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Darsna | درسنا",
  url: "https://darsnadz.com",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <head>
        {/* ✅ script يُشغَّل قبل الرندر لتفادي الـ flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (theme === 'dark' || (!theme && prefersDark)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch(e) {}
          })();
        `}} />
        {/* ✅ Structured Data لمحركات البحث */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}