import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Activity, Eye, EyeOff, Globe } from "lucide-react";

export default function Register() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success(t.auth.registerSuccess);
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      if (err.message === "EMAIL_EXISTS") toast.error(t.auth.emailExists);
      else toast.error(t.common.error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error(t.auth.passwordMismatch); return; }
    if (password.length < 8) { toast.error(t.auth.weakPassword); return; }
    registerMutation.mutate({ name, email, password });
  };

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <div className="p-4 flex items-center justify-between border-b border-blue-800/30">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded border border-blue-500/60 flex items-center justify-center bg-blue-900/30">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="font-bold text-white text-sm">MEDISCAN<span className="text-blue-400"> AI</span></span>
        </button>
        <button
          onClick={() => setLanguage(language === "en" ? "fa" : "en")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-blue-700/40 text-blue-300 text-xs"
        >
          <Globe className="w-3.5 h-3.5" />
          {language === "en" ? "فارسی" : "EN"}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="cad-frame rounded-xl p-8 bg-blue-950/40 backdrop-blur-sm">
            <div className="absolute top-3 left-3 text-blue-500/30 font-mono text-[9px]">AUTH:REGISTER</div>
            <div className="absolute top-3 right-3 text-blue-500/30 font-mono text-[9px]">ENC:AES256</div>

            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full border-2 border-blue-500/40 flex items-center justify-center bg-blue-900/30">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-white text-center mb-1">{t.auth.registerTitle}</h1>
            <p className="text-blue-300/60 text-sm text-center mb-8">{t.auth.registerSub}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-blue-200/80 text-xs font-mono uppercase tracking-wider mb-1.5 block">{t.auth.fullName}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.auth.namePlaceholder}
                  required
                  className="bg-blue-950/50 border-blue-700/50 text-white placeholder:text-blue-400/30 focus:border-blue-500"
                />
              </div>

              <div>
                <Label className="text-blue-200/80 text-xs font-mono uppercase tracking-wider mb-1.5 block">{t.auth.email}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  required
                  className="bg-blue-950/50 border-blue-700/50 text-white placeholder:text-blue-400/30 focus:border-blue-500"
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="text-blue-200/80 text-xs font-mono uppercase tracking-wider mb-1.5 block">{t.auth.password}</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.passwordPlaceholder}
                    required
                    className="bg-blue-950/50 border-blue-700/50 text-white placeholder:text-blue-400/30 focus:border-blue-500 pr-10"
                    dir="ltr"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-blue-200/80 text-xs font-mono uppercase tracking-wider mb-1.5 block">{t.auth.confirmPassword}</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.auth.passwordPlaceholder}
                  required
                  className="bg-blue-950/50 border-blue-700/50 text-white placeholder:text-blue-400/30 focus:border-blue-500"
                  dir="ltr"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 font-semibold py-2.5 glow-blue mt-2"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.common.loading}
                  </span>
                ) : t.auth.registerBtn}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-blue-300/60 text-sm">{t.auth.hasAccount} </span>
              <button onClick={() => navigate("/login")} className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                {t.auth.signIn}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
