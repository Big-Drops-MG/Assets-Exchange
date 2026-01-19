"use client";

export interface ProofreadIssue {
  type: string;
  note?: string;
  original?: string;
  correction?: string;
}

export interface ProofreadSuggestion {
  icon: string;
  type: string;
  description: string;
}

export interface QualityScore {
  grammar: number;
  readability: number;
  conversion: number;
  brandAlignment: number;
}

export interface ProofreadCreativeResponse {
  success: boolean;
  issues: ProofreadIssue[];
  suggestions: ProofreadSuggestion[];
  qualityScore: QualityScore;
}

interface ProofreadCreativeParams {
  fileType: "html" | "image";
  htmlContent?: string;
  fileUrl?: string;
  creativeType: "email" | "display" | "search" | "social" | "native" | "push";
}

export async function proofreadCreative(
  params: ProofreadCreativeParams
): Promise<ProofreadCreativeResponse> {
  try {
    const response = await fetch("/api/proofread-creative", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Proofreading failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Proofread creative error:", error);
    throw error;
  }
}
