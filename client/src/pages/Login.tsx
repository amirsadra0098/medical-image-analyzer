import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Activity, Eye, EyeOff, Globe } from "lucide-react";

export default function Login() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(t.auth.loginSuccess);
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      if (err.message === "INVALID_CREDENTIALS") toast.error(t.auth.invalidCredentials);
      else if (err.message === "ACCOUNT_DISABLED") toast.error(isRTL ? "حساب کاربری شما غیرفعال شده است." : "Your account has been disabled.");
      else toast.error(t.common.error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-blue-800/30">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded border border-blue-500/60 flex items-center justify-center bg-blue-900/30">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="font-bold text-white text-sm">MEDISCAN<span className="text-blue-400"> AI</span></span>
        </button>
        <button
          onClick={() => setLanguage(language === "en" ? "fa" : "en")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-blue-700/40 text-blue-300 hover:border-blue-500/60 text-xs"
        >
          <Globe className="w-3.5 h-3.5" />
          {language === "en" ? "فارسی" : "EN"}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Blueprint frame */}
          <div className="cad-frame rounded-xl p-8 bg-blue-950/40 backdrop-blur-sm">
            {/* Corner labels */}
            <div className="absolute top-3 left-3 text-blue-500/30 font-mono text-[9px]">AUTH:LOGIN</div>
            <div className="absolute top-3 right-3 text-blue-500/30 font-mono text-[9px]">SEC:TLS</div>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full border-2 border-blue-500/40 flex items-center justify-center bg-blue-900/30 animate-pulse-glow">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-white text-center mb-1">{t.auth.loginTitle}</h1>
            <p className="text-blue-300/60 text-sm text-center mb-8">{t.auth.loginSub}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-blue-200/80 text-xs font-mono uppercase tracking-wider mb-1.5 block">
                  {t.auth.email}
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  required
                  className="bg-blue-950/50 border-blue-700/50 text-white placeholder:text-blue-400/30 focus:border-blue-500 focus:ring-blue-500/20"
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="text-blue-200/80 text-xs font-mono uppercase tracking-wider mb-1.5 block">
                  {t.auth.password}
                </Label>
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
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60 hover:text-blue-300"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 font-semibold py-2.5 glow-blue"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.common.loading}
                  </span>
                ) : t.auth.loginBtn}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-blue-300/60 text-sm">{t.auth.noAccount} </span>
              <button
                onClick={() => navigate("/register")}
                className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
              >
                {t.auth.signUp}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
