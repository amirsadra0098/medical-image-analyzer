import { invokeLLM } from "./_core/llm";

// ─── BUILT-IN MEDICAL REFERENCES ─────────────────────────────────────────────

export const MEDICAL_REFERENCES = {
  CT_SCAN: [
    {
      id: "ct-001",
      title: "Hounsfield Units Reference",
      source: "Radiological Society of North America (RSNA)",
      description: "Standard HU values: Air (-1000), Fat (-100 to -50), Water (0), Soft tissue (20-80), Bone (400-1000)",
    },
    {
      id: "ct-002",
      title: "CT Pulmonary Findings Classification",
      source: "Fleischner Society Guidelines 2017",
      description: "Ground-glass opacity, consolidation, nodule characterization, and interstitial patterns",
    },
    {
      id: "ct-003",
      title: "CT Abdominal Organ Assessment",
      source: "American College of Radiology (ACR) Appropriateness Criteria",
      description: "Liver, spleen, kidney, pancreas normal ranges and pathological indicators",
    },
    {
      id: "ct-004",
      title: "CT Brain Hemorrhage Classification",
      source: "Stroke Journal, AHA/ASA Guidelines",
      description: "Epidural, subdural, subarachnoid, intracerebral hemorrhage patterns and density values",
    },
    {
      id: "ct-005",
      title: "CT Musculoskeletal Trauma Protocol",
      source: "Orthopaedic Trauma Association (OTA)",
      description: "Fracture classification, joint assessment, soft tissue injury indicators",
    },
  ],
  MRI: [
    {
      id: "mri-001",
      title: "MRI Signal Intensity Reference",
      source: "International Society for Magnetic Resonance in Medicine (ISMRM)",
      description: "T1/T2 signal characteristics for normal tissues and pathological conditions",
    },
    {
      id: "mri-002",
      title: "Brain MRI Lesion Classification",
      source: "MAGNIMS Consensus Guidelines",
      description: "White matter lesions, demyelination patterns, tumor characterization on MRI",
    },
    {
      id: "mri-003",
      title: "Spine MRI Grading Systems",
      source: "North American Spine Society (NASS)",
      description: "Disc herniation classification, spinal stenosis grading, cord signal changes",
    },
    {
      id: "mri-004",
      title: "Cardiac MRI Assessment",
      source: "Society for Cardiovascular Magnetic Resonance (SCMR)",
      description: "Myocardial viability, cardiomyopathy patterns, valve assessment",
    },
    {
      id: "mri-005",
      title: "Musculoskeletal MRI Protocol",
      source: "European Society of Musculoskeletal Radiology (ESSR)",
      description: "Ligament, tendon, cartilage, and bone marrow signal interpretation",
    },
  ],
  XRAY: [
    {
      id: "xr-001",
      title: "Chest X-Ray Systematic Review",
      source: "British Thoracic Society (BTS) Guidelines",
      description: "ABCDE approach: Airway, Breathing, Cardiac, Diaphragm, Everything else",
    },
    {
      id: "xr-002",
      title: "Pneumonia Radiographic Patterns",
      source: "American Thoracic Society (ATS) / IDSA Guidelines",
      description: "Lobar, bronchopneumonia, interstitial, and atypical pneumonia patterns",
    },
    {
      id: "xr-003",
      title: "Fracture Classification System",
      source: "AO Foundation Fracture Classification",
      description: "Long bone fractures, joint involvement, displacement and angulation assessment",
    },
    {
      id: "xr-004",
      title: "Cardiac Silhouette Assessment",
      source: "European Society of Cardiology (ESC)",
      description: "Cardiothoracic ratio, chamber enlargement, vascular pedicle width",
    },
    {
      id: "xr-005",
      title: "Pediatric Bone Age Assessment",
      source: "Greulich and Pyle Atlas",
      description: "Skeletal maturity assessment based on ossification centers and bone morphology",
    },
  ],
};

// ─── ANALYSIS PROMPT BUILDER ─────────────────────────────────────────────────

function buildAnalysisPrompt(imageType: string, language: "en" | "fa"): string {
  const refs = MEDICAL_REFERENCES[imageType as keyof typeof MEDICAL_REFERENCES] || MEDICAL_REFERENCES.CT_SCAN;
  const refText = refs.map((r) => `- ${r.title} (${r.source}): ${r.description}`).join("\n");

  if (language === "fa") {
    return `شما یک رادیولوژیست متخصص هستید که تصاویر پزشکی را تحلیل می‌کنید.

**مراجع پزشکی استاندارد برای این تحلیل:**
${refText}

**دستورالعمل:**
1. ابتدا تأیید کنید که آیا این تصویر یک تصویر پزشکی معتبر (${imageType === "CT_SCAN" ? "سی‌تی اسکن" : imageType === "MRI" ? "MRI" : "رادیوگرافی"}) است.
2. اگر تصویر پزشکی نیست، پاسخ دهید: {"isMedical": false, "reason": "توضیح دلیل"}
3. اگر تصویر پزشکی است، تحلیل کامل را ارائه دهید.

**خروجی JSON مورد انتظار:**
{
  "isMedical": true/false,
  "imageType": "CT_SCAN|MRI|XRAY|UNKNOWN",
  "findings": ["یافته ۱", "یافته ۲", ...],
  "diagnosis": "تشخیص احتمالی اصلی",
  "confidenceScore": 0.0-1.0,
  "similarityScores": [
    {"condition": "نام بیماری", "score": 0.0-1.0, "evidence": "شواهد"}
  ],
  "medicalReferences": ["شناسه مرجع ۱", "شناسه مرجع ۲"],
  "detailedAnalysis": "تحلیل تفصیلی کامل",
  "recommendations": "توصیه‌های بالینی",
  "urgency": "routine|urgent|emergent"
}`;
  }

  return `You are an expert radiologist analyzing medical images.

**Standard Medical References for this analysis:**
${refText}

**Instructions:**
1. First verify whether this is a valid medical image (${imageType === "CT_SCAN" ? "CT Scan" : imageType === "MRI" ? "MRI" : "X-Ray"}).
2. If NOT a medical image, respond: {"isMedical": false, "reason": "explanation"}
3. If it IS a medical image, provide complete analysis.

**Expected JSON output:**
{
  "isMedical": true/false,
  "imageType": "CT_SCAN|MRI|XRAY|UNKNOWN",
  "findings": ["finding 1", "finding 2", ...],
  "diagnosis": "primary probable diagnosis",
  "confidenceScore": 0.0-1.0,
  "similarityScores": [
    {"condition": "condition name", "score": 0.0-1.0, "evidence": "supporting evidence"}
  ],
  "medicalReferences": ["ref-id-1", "ref-id-2"],
  "detailedAnalysis": "comprehensive detailed analysis",
  "recommendations": "clinical recommendations",
  "urgency": "routine|urgent|emergent"
}`;
}

// ─── MAIN ANALYSIS FUNCTION ───────────────────────────────────────────────────

export interface AnalysisResult {
  isMedical: boolean;
  rejectionReason?: string;
  imageType?: string;
  findings?: string[];
  diagnosis?: string;
  confidenceScore?: number;
  similarityScores?: Array<{ condition: string; score: number; evidence: string }>;
  medicalReferences?: string[];
  detailedAnalysis?: string;
  recommendations?: string;
  urgency?: string;
}

export async function analyzeMedicalImage(
  imageUrl: string,
  imageType: string,
  language: "en" | "fa" = "en"
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(imageType, language);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
          {
            type: "text",
            text: language === "fa"
              ? `لطفاً این تصویر پزشکی را تحلیل کنید. نوع تصویر انتخاب‌شده: ${imageType}. پاسخ را فقط به صورت JSON خالص بدون markdown ارائه دهید.`
              : `Please analyze this medical image. Selected image type: ${imageType}. Respond with pure JSON only, no markdown.`,
          },
        ],
      },
    ],
    response_format: { type: "json_object" } as { type: "json_object" },
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) throw new Error("No response from AI");
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

  let parsed: Record<string, unknown>;
  try {
    // Strip markdown code blocks if present
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI response");
  }

  if (!parsed.isMedical) {
    return {
      isMedical: false,
      rejectionReason: (parsed.reason as string) || (language === "fa"
        ? "این تصویر یک تصویر پزشکی معتبر نیست."
        : "This image does not appear to be a valid medical scan."),
    };
  }

  // Enrich references with full data
  const allRefs = Object.values(MEDICAL_REFERENCES).flat();
  const enrichedRefs = ((parsed.medicalReferences as string[]) || []).map((refId) => {
    const ref = allRefs.find((r) => r.id === refId);
    return ref || { id: refId, title: refId, source: "", description: "" };
  });

  return {
    isMedical: true,
    imageType: (parsed.imageType as string) || imageType,
    findings: (parsed.findings as string[]) || [],
    diagnosis: (parsed.diagnosis as string) || "",
    confidenceScore: (parsed.confidenceScore as number) || 0,
    similarityScores: (parsed.similarityScores as AnalysisResult["similarityScores"]) || [],
    medicalReferences: enrichedRefs as unknown as string[],
    detailedAnalysis: (parsed.detailedAnalysis as string) || "",
    recommendations: (parsed.recommendations as string) || "",
    urgency: (parsed.urgency as string) || "routine",
  };
}

export { MEDICAL_REFERENCES as medicalRefs };
