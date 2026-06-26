import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Plus, Clock, CheckCircle, XCircle, Activity, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: stats } = trpc.analysis.myStats.useQuery();
  const { data: historyData } = trpc.analysis.myHistory.useQuery({ page: 1, limit: 5 });

  const recentAnalyses = historyData?.analyses || [];

  const statusClass: Record<string, string> = {
    completed: "status-completed",
    processing: "status-processing",
    failed: "status-failed",
    rejected: "status-rejected",
    pending: "status-pending",
  };

  const statusLabel = (s: string) => (t.results.status as Record<string, string>)[s] || s;

  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="text-blue-400/60 font-mono text-xs uppercase tracking-widest mb-1">// DASHBOARD</div>
          <h1 className="text-3xl font-black text-white">
            {t.dashboard.welcome}, <span className="text-blue-400">{user?.name || "Doctor"}</span>
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
          {[
            { label: t.dashboard.totalAnalyses, value: stats?.total ?? 0, icon: Activity, color: "text-blue-400" },
            { label: t.results.status.completed, value: stats?.completed ?? 0, icon: CheckCircle, color: "text-green-400" },
            { label: t.results.status.rejected, value: stats?.rejected ?? 0, icon: XCircle, color: "text-orange-400" },
            { label: t.results.status.failed, value: stats?.failed ?? 0, icon: XCircle, color: "text-red-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="cad-frame rounded-lg p-5 bg-blue-950/30 animate-fade-in-up">
              <div className={`flex items-center gap-2 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-blue-300/60 text-xs">{label}</span>
              </div>
              <div className={`text-3xl font-black ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className={`flex gap-3 mb-8 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button
            onClick={() => navigate("/analysis/new")}
            className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 glow-blue"
          >
            <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.dashboard.quickAnalysis}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/history")}
            className="border-blue-700/50 text-blue-300 hover:text-white hover:bg-blue-900/30"
          >
            <Clock className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.dashboard.viewHistory}
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="cad-frame rounded-xl bg-blue-950/30 overflow-hidden animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className={`flex items-center justify-between p-5 border-b border-blue-800/30 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-white font-bold text-sm">{t.dashboard.recentActivity}</h2>
            </div>
            <button
              onClick={() => navigate("/history")}
              className={`text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {t.dashboard.viewHistory}
              <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
            </button>
          </div>

          {recentAnalyses.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-10 h-10 text-blue-500/30 mx-auto mb-3" />
              <p className="text-blue-300/50 text-sm">{t.dashboard.noAnalyses}</p>
              <Button
                onClick={() => navigate("/analysis/new")}
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {t.analysis.analyzeBtn}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-blue-800/20">
              {recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className={`flex items-center justify-between p-4 hover:bg-blue-900/20 transition-colors cursor-pointer ${isRTL ? "flex-row-reverse" : ""}`}
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="w-8 h-8 rounded border border-blue-700/40 flex items-center justify-center bg-blue-900/30">
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{analysis.originalFilename || "Medical Image"}</div>
                      <div className="text-blue-400/50 text-xs font-mono">{analysis.imageType} • {new Date(analysis.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${statusClass[analysis.status] || ""}`}>
                    {statusLabel(analysis.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
