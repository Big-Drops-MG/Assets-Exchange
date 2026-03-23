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
  taskId?: string;
  dbTaskId?: string;
  issues?: ProofreadIssue[];
  suggestions?: ProofreadSuggestion[];
  qualityScore?: QualityScore;
  status?: string;
  result?: unknown;
  error?: string;
}

interface ProofreadCreativeParams {
  creativeId: string;
  fileUrl: string;
  htmlContent?: string;
}

interface CheckStatusParams {
  taskId: string;
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
      credentials: "include",
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = "Proofreading failed";
      if (text.trimStart().startsWith("<") || text.includes("<!DOCTYPE")) {
        errorMessage =
          response.status >= 500
            ? "Proofreading failed. The server encountered an error. Please try again later."
            : "Proofreading failed.";
      } else {
        try {
          const parsed = JSON.parse(text);
          errorMessage = parsed.error || parsed.message || errorMessage;
        } catch {
          errorMessage = text.slice(0, 200) || errorMessage;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function checkProofreadStatus(
  params: CheckStatusParams
): Promise<ProofreadCreativeResponse> {
  try {
    const response = await fetch(
      `/api/proofread-creative?taskId=${params.taskId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = "Status check failed";
      if (text.trimStart().startsWith("<") || text.includes("<!DOCTYPE")) {
        errorMessage =
          response.status >= 500
            ? "Status check failed. The server encountered an error. Please try again later."
            : "Status check failed.";
      } else {
        try {
          const parsed = JSON.parse(text);
          errorMessage = parsed.error || parsed.message || errorMessage;
        } catch {
          errorMessage = text.slice(0, 200) || errorMessage;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}
