import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Clock, Activity, Plus, ChevronLeft, ChevronRight } from "lucide-react";

export default function History() {
  const { t, isRTL } = useLanguage();
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.analysis.myHistory.useQuery({ page, limit: 15 });

  const analyses = data?.analyses || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);

  const statusClass: Record<string, string> = {
    completed: "status-completed",
    processing: "status-processing",
    failed: "status-failed",
    rejected: "status-rejected",
    pending: "status-pending",
  };

  const imageTypeLabel: Record<string, string> = {
    CT_SCAN: "CT",
    MRI: "MRI",
    XRAY: "XR",
    UNKNOWN: "?",
  };

  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={`flex items-center justify-between mb-8 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div>
            <div className="text-blue-400/60 font-mono text-xs uppercase tracking-widest mb-1">// HISTORY</div>
            <h1 className="text-3xl font-black text-white">{t.history.title}</h1>
            <p className="text-blue-300/50 text-sm mt-1 font-mono">{total} {isRTL ? "تحلیل" : "analyses"}</p>
          </div>
          <Button onClick={() => navigate("/analysis/new")} className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50">
            <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.nav.newAnalysis}
          </Button>
        </div>

        {/* Table */}
        <div className="cad-frame rounded-xl bg-blue-950/30 overflow-hidden animate-fade-in-up">
          {/* Table Header */}
          <div className={`grid grid-cols-12 gap-4 px-5 py-3 border-b border-blue-800/30 text-blue-400/60 text-xs font-mono uppercase tracking-wider ${isRTL ? "text-right" : ""}`}>
            <div className="col-span-5">{t.history.filename}</div>
            <div className="col-span-2 hidden md:block">{t.history.type}</div>
            <div className="col-span-3 hidden md:block">{t.history.date}</div>
            <div className="col-span-2">{t.history.status}</div>
            <div className="col-span-1 hidden md:block"></div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="w-10 h-10 text-blue-500/30 mx-auto mb-3" />
              <p className="text-blue-300/50 text-sm">{t.history.noHistory}</p>
              <Button onClick={() => navigate("/analysis/new")} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-sm">
                {t.analysis.analyzeBtn}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-blue-800/20">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className={`grid grid-cols-12 gap-4 px-5 py-4 hover:bg-blue-900/20 transition-colors cursor-pointer items-center ${isRTL ? "text-right" : ""}`}
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <div className={`col-span-5 flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="w-8 h-8 rounded border border-blue-700/40 flex items-center justify-center bg-blue-900/30 shrink-0">
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-white text-sm truncate">{analysis.originalFilename || "Medical Image"}</span>
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <span className="text-blue-400/70 font-mono text-xs border border-blue-700/30 px-2 py-0.5 rounded">
                      {imageTypeLabel[analysis.imageType || "UNKNOWN"]}
                    </span>
                  </div>
                  <div className="col-span-3 hidden md:block text-blue-300/50 text-xs font-mono">
                    {new Date(analysis.createdAt).toLocaleDateString()} {new Date(analysis.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="col-span-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${statusClass[analysis.status] || ""}`}>
                      {(t.results.status as Record<string, string>)[analysis.status] || analysis.status}
                    </span>
                  </div>
                  <div className="col-span-1 hidden md:block text-right">
                    <button className="text-blue-400/40 hover:text-blue-300 transition-colors">
                      {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-5 py-3 border-t border-blue-800/30 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-blue-400/50 text-xs font-mono">
                {isRTL ? `صفحه ${page} از ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-blue-700/40 text-blue-300 hover:bg-blue-900/30 text-xs">
                  {isRTL ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="border-blue-700/40 text-blue-300 hover:bg-blue-900/30 text-xs">
                  {isRTL ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
