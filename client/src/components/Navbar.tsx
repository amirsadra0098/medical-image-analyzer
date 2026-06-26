import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Activity, LogOut, LayoutDashboard, Plus, Clock, Shield, Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Navbar() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return (
    <nav
      className="sticky top-0 z-50 border-b border-blue-800/40 backdrop-blur-md"
      style={{ background: "oklch(0.12 0.04 255 / 0.95)" }}
    >
      {/* Top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between h-16 ${isRTL ? "flex-row-reverse" : ""}`}>
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 group ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded border border-blue-500/60 flex items-center justify-center bg-blue-900/30 group-hover:bg-blue-800/40 transition-colors">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-blue-400/80" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-blue-400/80" />
            </div>
            <span className="font-bold text-white tracking-wider text-sm">
              MEDISCAN<span className="text-blue-400"> AI</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <div className={`hidden md:flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            {isAuthenticated && (
              <>
                <NavBtn icon={<LayoutDashboard className="w-3.5 h-3.5" />} label={t.nav.dashboard} onClick={() => navigate("/dashboard")} isRTL={isRTL} />
                <NavBtn icon={<Plus className="w-3.5 h-3.5" />} label={t.nav.newAnalysis} onClick={() => navigate("/analysis/new")} isRTL={isRTL} />
                <NavBtn icon={<Clock className="w-3.5 h-3.5" />} label={t.nav.history} onClick={() => navigate("/history")} isRTL={isRTL} />
                {user?.role === "admin" && (
                  <NavBtn icon={<Shield className="w-3.5 h-3.5" />} label={t.nav.admin} onClick={() => navigate("/admin")} isRTL={isRTL} />
                )}
              </>
            )}
          </div>

          {/* Right Controls */}
          <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "fa" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-blue-700/40 text-blue-300 hover:border-blue-500/60 hover:text-blue-200 transition-all text-xs font-medium"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === "en" ? "فارسی" : "EN"}</span>
            </button>

            {isAuthenticated ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => logoutMutation.mutate()}
                className="text-blue-300 hover:text-white hover:bg-blue-900/40 border border-transparent hover:border-blue-700/40 text-xs"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                {t.nav.logout}
              </Button>
            ) : (
              <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-blue-300 hover:text-white text-xs"
                >
                  {t.nav.login}
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs border border-blue-500/50"
                >
                  {t.nav.register}
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <button
              className="md:hidden text-blue-300 hover:text-white p-1"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && isAuthenticated && (
          <div className="md:hidden border-t border-blue-800/40 py-3 space-y-1">
            <MobileNavBtn label={t.nav.dashboard} onClick={() => { navigate("/dashboard"); setMenuOpen(false); }} />
            <MobileNavBtn label={t.nav.newAnalysis} onClick={() => { navigate("/analysis/new"); setMenuOpen(false); }} />
            <MobileNavBtn label={t.nav.history} onClick={() => { navigate("/history"); setMenuOpen(false); }} />
            {user?.role === "admin" && (
              <MobileNavBtn label={t.nav.admin} onClick={() => { navigate("/admin"); setMenuOpen(false); }} />
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavBtn({ icon, label, onClick, isRTL }: { icon: React.ReactNode; label: string; onClick: () => void; isRTL: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-blue-300/80 hover:text-white hover:bg-blue-900/30 transition-all text-xs font-medium ${isRTL ? "flex-row-reverse" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-blue-300 hover:text-white hover:bg-blue-900/30 rounded text-sm transition-colors"
    >
      {label}
    </button>
  );
}
