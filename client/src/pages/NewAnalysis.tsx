import { useState, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Upload, Scan, Brain, Activity, AlertTriangle, CheckCircle, X } from "lucide-react";

type ImageType = "CT_SCAN" | "MRI" | "XRAY";

export default function NewAnalysis() {
  const { t, language, isRTL } = useLanguage();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageType, setImageType] = useState<ImageType>("CT_SCAN");
  const [step, setStep] = useState<"upload" | "analyzing" | "done" | "rejected">("upload");
  const [rejectionReason, setRejectionReason] = useState("");

  const uploadMutation = trpc.analysis.upload.useMutation();
  const analyzeMutation = trpc.analysis.analyze.useMutation();

  const handleFile = useCallback((file: File) => {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) { toast.error(isRTL ? "حجم فایل بیش از ۲۰ مگابایت است." : "File size exceeds 20MB."); return; }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/dicom"];
    if (!allowed.some((t) => file.type.startsWith("image/") || file.type === "application/dicom")) {
      // allow all image types
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [isRTL]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl) return;
    setStep("analyzing");

    try {
      const base64 = previewUrl.split(",")[1];
      const uploadResult = await uploadMutation.mutateAsync({
        filename: selectedFile.name,
        contentType: selectedFile.type || "image/jpeg",
        base64Data: base64,
        imageType,
        language,
      });

      const analyzeResult = await analyzeMutation.mutateAsync({
        analysisId: uploadResult.analysisId,
        language,
      });

      if (!analyzeResult.isMedical) {
        setRejectionReason(analyzeResult.rejectionReason || t.analysis.notMedical);
        setStep("rejected");
      } else {
        setStep("done");
        setTimeout(() => navigate(`/analysis/${uploadResult.analysisId}`), 1500);
      }
    } catch (err) {
      setStep("upload");
      toast.error(t.analysis.analysisError);
    }
  };

  const imageTypes = [
    { value: "CT_SCAN" as ImageType, label: t.analysis.ctScan, icon: Scan },
    { value: "MRI" as ImageType, label: t.analysis.mri, icon: Brain },
    { value: "XRAY" as ImageType, label: t.analysis.xray, icon: Activity },
  ];

  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 animate-fade-in-up">
          <div className="text-blue-400/60 font-mono text-xs uppercase tracking-widest mb-1">// NEW ANALYSIS</div>
          <h1 className="text-3xl font-black text-white">{t.analysis.uploadTitle}</h1>
          <p className="text-blue-300/60 text-sm mt-1">{t.analysis.uploadSub}</p>
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Image Type Selector */}
            <div>
              <label className="text-blue-200/80 text-xs font-mono uppercase tracking-wider mb-3 block">{t.analysis.imageType}</label>
              <div className="grid grid-cols-3 gap-3">
                {imageTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setImageType(value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                      imageType === value
                        ? "border-blue-500 bg-blue-900/40 text-white"
                        : "border-blue-700/30 bg-blue-950/30 text-blue-400/60 hover:border-blue-600/50 hover:text-blue-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Zone */}
            <div
              className={`upload-zone rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.dcm"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />

              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg border border-blue-700/40 object-contain" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-900/80 flex items-center justify-center text-red-300 hover:bg-red-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-blue-300/60 text-xs mt-3 font-mono">{selectedFile?.name}</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full border-2 border-blue-600/40 flex items-center justify-center mx-auto mb-4 bg-blue-900/20">
                    <Upload className="w-7 h-7 text-blue-400" />
                  </div>
                  <p className="text-blue-200/80 font-semibold mb-1">{t.analysis.dragDrop}</p>
                  <p className="text-blue-400/50 text-sm">{t.analysis.orBrowse}</p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-blue-400/40 text-xs font-mono">
                    <span>{t.analysis.supportedFormats}</span>
                    <span>•</span>
                    <span>{t.analysis.maxSize}</span>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!selectedFile || uploadMutation.isPending || analyzeMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 py-3 font-semibold glow-blue text-base"
            >
              <Scan className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.analysis.analyzeBtn}
            </Button>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === "analyzing" && (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-spin" style={{ borderTopColor: "oklch(0.55 0.18 255)" }} />
              <div className="absolute inset-3 rounded-full border border-blue-400/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s", borderTopColor: "oklch(0.55 0.18 255 / 0.5)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{t.analysis.analyzing}</h2>
            <p className="text-blue-300/60 text-sm font-mono">
              {isRTL ? "در حال بررسی با مراجع پزشکی استاندارد..." : "Cross-referencing with standard medical references..."}
            </p>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {/* Step: Rejected */}
        {step === "rejected" && (
          <div className="animate-fade-in-up">
            <div className="cad-frame rounded-xl p-8 bg-orange-950/30 border-orange-700/40 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-orange-500/40 flex items-center justify-center mx-auto mb-4 bg-orange-900/20">
                <AlertTriangle className="w-7 h-7 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">{t.analysis.notMedicalTitle}</h2>
              <p className="text-orange-200/70 text-sm leading-relaxed mb-6">{rejectionReason}</p>
              <Button
                onClick={() => { setStep("upload"); setSelectedFile(null); setPreviewUrl(null); }}
                className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50"
              >
                {isRTL ? "آپلود تصویر جدید" : "Upload New Image"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="w-20 h-20 rounded-full border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6 bg-green-900/20">
              <CheckCircle className="w-9 h-9 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {isRTL ? "تحلیل تکمیل شد!" : "Analysis Complete!"}
            </h2>
            <p className="text-blue-300/60 text-sm">
              {isRTL ? "در حال انتقال به صفحه نتایج..." : "Redirecting to results..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
