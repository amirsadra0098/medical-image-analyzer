import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import Navbar from "@/components/Navbar";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, AlertTriangle, Activity, Scan, Brain, Plus } from "lucide-react";
import { Streamdown } from "streamdown";

export default function AnalysisResult() {
  const { t, isRTL } = useLanguage();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");

  const { data: analysis, isLoading } = trpc.analysis.getById.useQuery({ id }, { enabled: !!id });

  const statusClass: Record<string, string> = {
    completed: "status-completed",
    processing: "status-processing",
    failed: "status-failed",
    rejected: "status-rejected",
    pending: "status-pending",
  };

  const imageTypeIcon: Record<string, React.ReactNode> = {
    CT_SCAN: <Scan className="w-4 h-4" />,
    MRI: <Brain className="w-4 h-4" />,
    XRAY: <Activity className="w-4 h-4" />,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-blue-300/60">{t.common.noData}</p>
        </div>
      </div>
    );
  }

  const findings = (analysis.findings as string[]) || [];
  const similarityScores = (analysis.similarityScores as Array<{ condition: string; score: number; evidence: string }>) || [];
  const medicalRefs = (analysis.medicalReferences as Array<{ id: string; title: string; source: string; description: string }>) || [];

  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className={`flex items-center justify-between mb-8 flex-wrap gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div>
            <div className="text-blue-400/60 font-mono text-xs uppercase tracking-widest mb-1">// ANALYSIS RESULTS</div>
            <h1 className="text-3xl font-black text-white">{t.results.title}</h1>
          </div>
          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button variant="outline" size="sm" onClick={() => navigate("/history")} className="border-blue-700/50 text-blue-300 hover:text-white hover:bg-blue-900/30">
              {isRTL ? <ArrowRight className="w-4 h-4 mr-1" /> : <ArrowLeft className="w-4 h-4 mr-1" />}
              {t.results.backToHistory}
            </Button>
            <Button size="sm" onClick={() => navigate("/analysis/new")} className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50">
              <Plus className="w-4 h-4 mr-1" />
              {t.results.newAnalysis}
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        {analysis.status === "rejected" && (
          <div className="cad-frame rounded-xl p-6 bg-orange-950/30 border-orange-700/40 mb-6 animate-fade-in-up">
            <div className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-orange-300 font-bold mb-1">{t.analysis.notMedicalTitle}</h3>
                <p className="text-orange-200/70 text-sm">{analysis.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {analysis.status === "completed" && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="cad-frame rounded-xl p-6 bg-blue-950/30 animate-fade-in-up">
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isRTL ? "text-right" : ""}`}>
                <div>
                  <div className="text-blue-400/60 text-xs font-mono uppercase mb-1">{t.results.imageType}</div>
                  <div className={`flex items-center gap-1.5 text-white font-bold ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                    {imageTypeIcon[analysis.imageType || "CT_SCAN"]}
                    {analysis.imageType?.replace("_", " ")}
                  </div>
                </div>
                <div>
                  <div className="text-blue-400/60 text-xs font-mono uppercase mb-1">{t.results.status.completed}</div>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${statusClass[analysis.status]}`}>
                    {(t.results.status as Record<string, string>)[analysis.status]}
                  </span>
                </div>
                <div>
                  <div className="text-blue-400/60 text-xs font-mono uppercase mb-1">{t.results.confidence}</div>
                  <div className="text-white font-bold">{Math.round((analysis.confidenceScore || 0) * 100)}%</div>
                </div>
                <div>
                  <div className="text-blue-400/60 text-xs font-mono uppercase mb-1">{t.results.date}</div>
                  <div className="text-white text-sm">{new Date(analysis.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-blue-400/60 mb-1">
                  <span>{t.results.confidence}</span>
                  <span>{Math.round((analysis.confidenceScore || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
                  <div
                    className="confidence-bar"
                    style={{ width: `${Math.round((analysis.confidenceScore || 0) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            {analysis.diagnosis && (
              <div className="cad-frame rounded-xl p-6 bg-blue-950/30 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
                <div className={`flex items-center gap-2 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">{t.results.diagnosis}</h3>
                </div>
                <p className="text-blue-100 text-base leading-relaxed font-medium">{analysis.diagnosis}</p>
              </div>
            )}

            {/* Findings */}
            {findings.length > 0 && (
              <div className="cad-frame rounded-xl p-6 bg-blue-950/30 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{t.results.findings}</h3>
                <ul className="space-y-2">
                  {findings.map((finding, i) => (
                    <li key={i} className={`flex items-start gap-2.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                      <span className="text-blue-100 text-sm leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Similarity Scores */}
            {similarityScores.length > 0 && (
              <div className="cad-frame rounded-xl p-6 bg-blue-950/30 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{t.results.similarityScores}</h3>
                <div className="space-y-4">
                  {similarityScores.map((item, i) => (
                    <div key={i}>
                      <div className={`flex items-center justify-between mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <span className="text-blue-200 text-sm font-medium">{item.condition}</span>
                        <span className="text-blue-400 font-mono text-sm">{Math.round(item.score * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
                        <div
                          className="confidence-bar"
                          style={{ width: `${Math.round(item.score * 100)}%` }}
                        />
                      </div>
                      {item.evidence && (
                        <p className="text-blue-400/50 text-xs mt-1">{item.evidence}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical References */}
            {medicalRefs.length > 0 && (
              <div className="cad-frame rounded-xl p-6 bg-blue-950/30 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
                <div className={`flex items-center gap-2 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">{t.results.references}</h3>
                </div>
                <div className="space-y-3">
                  {medicalRefs.map((ref, i) => (
                    <div key={i} className="border border-blue-700/30 rounded-lg p-4 bg-blue-900/10">
                      <div className="text-white font-medium text-sm mb-0.5">{ref.title}</div>
                      <div className="text-blue-400/70 text-xs mb-1 font-mono">{ref.source}</div>
                      <div className="text-blue-300/60 text-xs">{ref.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            {analysis.rawAnalysis && (
              <div className="cad-frame rounded-xl p-6 bg-blue-950/30 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{t.results.rawAnalysis}</h3>
                <div className="prose prose-invert prose-sm max-w-none text-blue-100/80">
                  <Streamdown>{analysis.rawAnalysis}</Streamdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Preview */}
        {analysis.imageUrl && (
          <div className="mt-6 cad-frame rounded-xl overflow-hidden animate-fade-in-up">
            <div className="p-3 border-b border-blue-800/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-blue-400/60 font-mono text-xs">{analysis.originalFilename}</span>
            </div>
            <img
              src={analysis.imageUrl}
              alt="Medical scan"
              className="w-full max-h-96 object-contain bg-black/50"
            />
          </div>
        )}
      </div>
    </div>
  );
}
