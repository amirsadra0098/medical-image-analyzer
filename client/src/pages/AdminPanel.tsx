import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import {
  Users, Activity, BarChart3, Shield, Search, CheckCircle, XCircle,
  RefreshCw, TrendingUp, AlertTriangle, Clock
} from "lucide-react";

type Tab = "monitoring" | "users" | "analyses";

export default function AdminPanel() {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("monitoring");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [analysisPage, setAnalysisPage] = useState(1);

  const utils = trpc.useUtils();

  const { data: stats, refetch: refetchStats } = trpc.admin.getStats.useQuery();
  const { data: usersData, isLoading: usersLoading } = trpc.admin.getUsers.useQuery({ search: userSearch || undefined, page: userPage });
  const { data: analysesData, isLoading: analysesLoading } = trpc.admin.getAllAnalyses.useQuery({ page: analysisPage });

  const updateStatusMutation = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => { toast.success(isRTL ? "وضعیت کاربر بروزرسانی شد" : "User status updated"); utils.admin.getUsers.invalidate(); },
  });

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success(isRTL ? "نقش کاربر بروزرسانی شد" : "User role updated"); utils.admin.getUsers.invalidate(); },
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "monitoring", label: t.admin.monitoring, icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users", label: t.admin.users, icon: <Users className="w-4 h-4" /> },
    { id: "analyses", label: t.admin.analyses, icon: <Activity className="w-4 h-4" /> },
  ];

  const statusClass: Record<string, string> = {
    completed: "status-completed",
    processing: "status-processing",
    failed: "status-failed",
    rejected: "status-rejected",
    pending: "status-pending",
  };

  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={`flex items-center gap-3 mb-8 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-10 h-10 rounded border border-blue-500/40 flex items-center justify-center bg-blue-900/30">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-blue-400/60 font-mono text-xs uppercase tracking-widest">{isRTL ? "// پنل ادمین" : "// ADMIN PANEL"}</div>
            <h1 className="text-3xl font-black text-white">{t.admin.title}</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-6 border-b border-blue-800/30 ${isRTL ? "flex-row-reverse" : ""}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-300"
                  : "border-transparent text-blue-400/50 hover:text-blue-300"
              } ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MONITORING TAB ── */}
        {activeTab === "monitoring" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
              <h2 className="text-white font-bold">{t.admin.monitoring}</h2>
              <Button size="sm" variant="outline" onClick={() => refetchStats()} className="border-blue-700/40 text-blue-300 hover:bg-blue-900/30 text-xs">
                <RefreshCw className={`w-3.5 h-3.5 ${isRTL ? "ml-1.5" : "mr-1.5"}`} />
                {t.common.refresh}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
              {[
                { label: t.admin.totalUsers, value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-400" },
                { label: t.admin.totalAnalyses, value: stats?.totalAnalyses ?? 0, icon: Activity, color: "text-cyan-400" },
                { label: t.admin.activeToday, value: stats?.todayAnalyses ?? 0, icon: TrendingUp, color: "text-green-400" },
                { label: t.admin.rejectedImages, value: stats?.rejectedAnalyses ?? 0, icon: AlertTriangle, color: "text-orange-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="cad-frame rounded-xl p-5 bg-blue-950/30 animate-fade-in-up">
                  <div className={`flex items-center gap-2 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-blue-300/60 text-xs">{label}</span>
                  </div>
                  <div className={`text-3xl font-black ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            {/* Analysis breakdown */}
            {stats && (
              <div className="cad-frame rounded-xl p-6 bg-blue-950/30">
                <h3 className="text-white font-bold text-sm mb-4">{isRTL ? "توزیع وضعیت تحلیل‌ها" : "Analysis Status Distribution"}</h3>
                <div className="space-y-3">
                  {[
                    { label: isRTL ? "تکمیل‌شده" : "Completed", value: stats.completedAnalyses, total: stats.totalAnalyses, color: "bg-green-500" },
                    { label: isRTL ? "رد شده" : "Rejected", value: stats.rejectedAnalyses, total: stats.totalAnalyses, color: "bg-orange-500" },
                  ].map(({ label, value, total, color }) => (
                    <div key={label}>
                      <div className={`flex justify-between text-xs mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <span className="text-blue-300/70">{label}</span>
                        <span className="text-blue-400 font-mono">{value} / {total}</span>
                      </div>
                      <div className="h-2 bg-blue-900/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all duration-1000`}
                          style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/50 ${isRTL ? "right-3" : "left-3"}`} />
              <Input
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                placeholder={t.admin.searchUsers}
                className={`bg-blue-950/50 border-blue-700/50 text-white placeholder:text-blue-400/30 ${isRTL ? "pr-9" : "pl-9"}`}
              />
            </div>

            <div className="cad-frame rounded-xl bg-blue-950/30 overflow-hidden">
              <div className={`grid grid-cols-12 gap-2 px-5 py-3 border-b border-blue-800/30 text-blue-400/60 text-xs font-mono uppercase tracking-wider ${isRTL ? "text-right" : ""}`}>
                <div className="col-span-3">{t.admin.userName}</div>
                <div className="col-span-4">{t.admin.userEmail}</div>
                <div className="col-span-2">{t.admin.userRole}</div>
                <div className="col-span-1">{t.admin.userStatus}</div>
                <div className="col-span-2 text-center">{t.admin.actions}</div>
              </div>

              {usersLoading ? (
                <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" /></div>
              ) : (usersData?.users || []).length === 0 ? (
                <div className="py-12 text-center text-blue-300/50 text-sm">{t.common.noData}</div>
              ) : (
                <div className="divide-y divide-blue-800/20">
                  {(usersData?.users || []).map((user) => (
                    <div key={user.id} className={`grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-blue-900/10 ${isRTL ? "text-right" : ""}`}>
                      <div className="col-span-3 text-white text-sm truncate">{user.name || "—"}</div>
                      <div className="col-span-4 text-blue-300/70 text-xs truncate font-mono">{user.email}</div>
                      <div className="col-span-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${user.role === "admin" ? "bg-purple-900/30 text-purple-400 border border-purple-700/50" : "bg-blue-900/30 text-blue-400 border border-blue-700/50"}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${user.isActive ? "text-green-400" : "text-red-400"}`}>
                          {user.isActive ? "●" : "○"}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateStatusMutation.mutate({ userId: user.id, isActive: !user.isActive })}
                          className={`p-1.5 rounded border transition-colors text-xs ${user.isActive ? "border-red-700/40 text-red-400 hover:bg-red-900/20" : "border-green-700/40 text-green-400 hover:bg-green-900/20"}`}
                          title={user.isActive ? t.admin.disable : t.admin.enable}
                        >
                          {user.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => updateRoleMutation.mutate({ userId: user.id, role: user.role === "admin" ? "user" : "admin" })}
                          className="p-1.5 rounded border border-purple-700/40 text-purple-400 hover:bg-purple-900/20 transition-colors"
                          title={user.role === "admin" ? t.admin.removeAdmin : t.admin.makeAdmin}
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {(usersData?.total || 0) > 20 && (
              <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-blue-400/50 text-xs font-mono">{usersData?.total} {isRTL ? "کاربر" : "users"}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="border-blue-700/40 text-blue-300 text-xs">
                    {isRTL ? "بعدی" : "Prev"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setUserPage(p => p + 1)} disabled={(usersData?.users.length || 0) < 20} className="border-blue-700/40 text-blue-300 text-xs">
                    {isRTL ? "قبلی" : "Next"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSES TAB ── */}
        {activeTab === "analyses" && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="cad-frame rounded-xl bg-blue-950/30 overflow-hidden">
              <div className={`grid grid-cols-12 gap-2 px-5 py-3 border-b border-blue-800/30 text-blue-400/60 text-xs font-mono uppercase tracking-wider ${isRTL ? "text-right" : ""}`}>
                <div className="col-span-3">{t.history.filename}</div>
                <div className="col-span-3">{t.admin.userEmail}</div>
                <div className="col-span-2">{t.history.type}</div>
                <div className="col-span-2">{t.history.status}</div>
                <div className="col-span-2">{t.history.date}</div>
              </div>

              {analysesLoading ? (
                <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" /></div>
              ) : (analysesData?.analyses || []).length === 0 ? (
                <div className="py-12 text-center text-blue-300/50 text-sm">{t.common.noData}</div>
              ) : (
                <div className="divide-y divide-blue-800/20">
                  {(analysesData?.analyses || []).map((row) => {
                    const analysis = row.analysis;
                    return (
                      <div key={analysis.id} className={`grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-blue-900/10 ${isRTL ? "text-right" : ""}`}>
                        <div className="col-span-3 text-white text-xs truncate">{analysis.originalFilename || "—"}</div>
                        <div className="col-span-3 text-blue-300/60 text-xs truncate font-mono">{row.userEmail || "—"}</div>
                        <div className="col-span-2">
                          <span className="text-blue-400/70 font-mono text-xs border border-blue-700/30 px-1.5 py-0.5 rounded">
                            {analysis.imageType?.replace("_", " ") || "?"}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-mono ${statusClass[analysis.status] || ""}`}>
                            {(t.results.status as Record<string, string>)[analysis.status] || analysis.status}
                          </span>
                        </div>
                        <div className="col-span-2 text-blue-300/50 text-xs font-mono">
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {(analysesData?.total || 0) > 20 && (
              <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-blue-400/50 text-xs font-mono">{analysesData?.total} {isRTL ? "تحلیل" : "analyses"}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAnalysisPage(p => Math.max(1, p - 1))} disabled={analysisPage === 1} className="border-blue-700/40 text-blue-300 text-xs">
                    {isRTL ? "بعدی" : "Prev"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAnalysisPage(p => p + 1)} disabled={(analysesData?.analyses.length || 0) < 20} className="border-blue-700/40 text-blue-300 text-xs">
                    {isRTL ? "قبلی" : "Next"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
