import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Activity, Scan, Brain, Zap, BookOpen, ChevronRight, ArrowRight } from "lucide-react";

export default function Home() {
  const { t, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Blueprint grid overlay */}
        <div className="absolute inset-0 blueprint-grid opacity-60" />

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-blue-500/40" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-blue-500/40" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-blue-500/40" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-blue-500/40" />

        {/* Dimension markers */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center gap-1 opacity-30">
          <div className="w-px h-24 bg-blue-400" />
          <div className="text-blue-400 text-[9px] font-mono rotate-90 whitespace-nowrap">SCAN FIELD</div>
          <div className="w-px h-24 bg-blue-400" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-900/20 mb-8 animate-fade-in-up">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-xs font-mono tracking-widest uppercase">
                AI-POWERED DIAGNOSTICS v2.0
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: "60ms" }}>
              {isRTL ? (
                <>
                  <span className="text-blue-400 glow-blue-text">هوش مصنوعی</span>
                  <br />
                  <span>تحلیل تصاویر پزشکی</span>
                </>
              ) : (
                <>
                  <span className="text-blue-400 glow-blue-text">AI-Powered</span>
                  <br />
                  <span>Medical Analysis</span>
                </>
              )}
            </h1>

            <p className="text-blue-200/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "120ms" }}>
              {t.landing.heroSub}
            </p>

            {/* CTA Buttons */}
            <div className={`flex items-center justify-center gap-4 flex-wrap animate-fade-in-up ${isRTL ? "flex-row-reverse" : ""}`} style={{ animationDelay: "180ms" }}>
              <Button
                size="lg"
                onClick={() => navigate(isAuthenticated ? "/analysis/new" : "/register")}
                className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 px-8 py-3 font-semibold glow-blue transition-all duration-200 group"
              >
                <span>{t.landing.getStarted}</span>
                <ArrowRight className={`w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 mr-2 ml-0" : ""}`} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="border-blue-700/60 text-blue-300 hover:text-white hover:bg-blue-900/30 px-8 py-3"
              >
                {t.landing.learnMore}
              </Button>
            </div>
          </div>

          {/* Animated scan visualization */}
          <div className="mt-20 max-w-2xl mx-auto relative animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <div className="cad-frame rounded-lg p-6 bg-blue-950/30 backdrop-blur-sm relative overflow-hidden">
              {/* Scan line animation */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent animate-scan" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Scan, label: "CT SCAN", value: "512×512", color: "text-blue-400" },
                  { icon: Brain, label: "MRI", value: "256×256", color: "text-cyan-400" },
                  { icon: Activity, label: "X-RAY", value: "2048×2048", color: "text-indigo-400" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="text-center p-4 rounded border border-blue-700/30 bg-blue-900/20">
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
                    <div className="text-white font-mono text-xs font-bold">{label}</div>
                    <div className="text-blue-400/60 font-mono text-[10px] mt-1">{value}px</div>
                  </div>
                ))}
              </div>

              {/* Corner labels */}
              <div className="absolute top-2 left-2 text-blue-500/40 font-mono text-[9px]">SYS:READY</div>
              <div className="absolute top-2 right-2 text-blue-500/40 font-mono text-[9px]">AI:ACTIVE</div>
              <div className="absolute bottom-2 left-2 text-blue-500/40 font-mono text-[9px]">REF:LOADED</div>
              <div className="absolute bottom-2 right-2 text-blue-500/40 font-mono text-[9px]">VER:2.0</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-blue-800/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 stagger-children">
            {[
              { value: "10K+", label: t.landing.statsAnalyses },
              { value: "98.5%", label: t.landing.statsAccuracy },
              { value: "3", label: t.landing.statsTypes },
              { value: "15+", label: t.landing.statsRefs },
            ].map(({ value, label }) => (
              <div key={label} className="text-center animate-fade-in-up">
                <div className="text-3xl md:text-4xl font-black text-blue-400 glow-blue-text mb-1">{value}</div>
                <div className="text-blue-300/60 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block text-blue-400/60 font-mono text-xs tracking-widest uppercase mb-3">// CAPABILITIES</div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {isRTL ? "قابلیت‌های پلتفرم" : "Platform Capabilities"}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {[
              { icon: Scan, title: t.landing.feature1Title, desc: t.landing.feature1Desc, tag: "CT" },
              { icon: Brain, title: t.landing.feature2Title, desc: t.landing.feature2Desc, tag: "MRI" },
              { icon: Activity, title: t.landing.feature3Title, desc: t.landing.feature3Desc, tag: "XR" },
              { icon: BookOpen, title: t.landing.feature4Title, desc: t.landing.feature4Desc, tag: "REF" },
            ].map(({ icon: Icon, title, desc, tag }) => (
              <div
                key={tag}
                className="cad-frame rounded-lg p-6 bg-blue-950/30 hover:bg-blue-900/30 transition-all duration-200 group animate-fade-in-up"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded border border-blue-600/40 flex items-center justify-center bg-blue-900/40 group-hover:bg-blue-800/50 transition-colors">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-blue-500/60 font-mono text-[10px] border border-blue-700/30 px-2 py-0.5 rounded">{tag}</span>
                </div>
                <h3 className="text-white font-bold mb-2 text-sm">{title}</h3>
                <p className="text-blue-300/60 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-blue-800/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto cad-frame rounded-xl p-12 bg-blue-950/40">
            <h2 className="text-3xl font-black text-white mb-4">
              {isRTL ? "همین حالا شروع کنید" : "Start Analyzing Now"}
            </h2>
            <p className="text-blue-300/60 mb-8">
              {isRTL
                ? "به پلتفرم تحلیل تصاویر پزشکی هوشمند بپیوندید"
                : "Join the intelligent medical image analysis platform"}
            </p>
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? "/analysis/new" : "/register")}
              className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 px-10 glow-blue"
            >
              {t.landing.getStarted}
              <ChevronRight className={`w-4 h-4 ml-1 ${isRTL ? "rotate-180 mr-1 ml-0" : ""}`} />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-800/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-white font-bold text-sm">MEDISCAN AI</span>
          </div>
          <p className="text-blue-400/40 text-xs font-mono">
            {isRTL ? "پلتفرم تحلیل تصاویر پزشکی — مراجع استاندارد بالینی" : "Medical Image Analysis Platform — Standard Clinical References"}
          </p>
        </div>
      </footer>
    </div>
  );
}
