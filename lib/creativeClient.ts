"use client";

interface SaveHtmlParams {
  fileUrl: string;
  html: string;
  newFileName: string;
}

interface RenameCreativeParams {
  creativeId: string;
  fileUrl: string;
  newName: string;
}

interface CreativeMetadata {
  fromLines?: string;
  subjectLines?: string;
  proofreadingData?: unknown;
  htmlContent?: string;
  additionalNotes?: string;
  metadata?: {
    lastSaved?: string;
    lastGenerated?: string;
    lastProofread?: string;
    creativeType?: string;
    fileName?: string;
  };
}

interface SaveCreativeMetadataParams {
  creativeId: string;
  fromLines?: string;
  subjectLines?: string;
  proofreadingData?: unknown;
  htmlContent?: string;
  additionalNotes?: string;
  metadata?: CreativeMetadata["metadata"];
}

interface GetCreativeMetadataResponse {
  success: boolean;
  metadata?: CreativeMetadata;
}

export async function saveHtml(params: SaveHtmlParams): Promise<void> {
  try {
    const response = await fetch("/api/creative/save-html", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to save HTML");
    }
  } catch (error) {
    console.error("Save HTML error:", error);
    throw error;
  }
}

export async function renameCreative(params: RenameCreativeParams): Promise<void> {
  try {
    const response = await fetch("/api/creative/rename", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      let errorMessage = "Failed to rename creative";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          if (errorText && !errorText.startsWith("<!DOCTYPE")) {
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to rename creative");
    }
  } catch (error) {
    console.error("Rename creative error:", error);
    throw error;
  }
}

export async function saveCreativeMetadata(
  params: SaveCreativeMetadataParams
): Promise<void> {
  try {
    const response = await fetch("/api/creative/metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to save creative metadata");
    }
  } catch (error) {
    console.error("Save creative metadata error:", error);
    throw error;
  }
}

export async function getCreativeMetadata(
  creativeId: string
): Promise<GetCreativeMetadataResponse> {
  try {
    const response = await fetch(`/api/creative/metadata?creativeId=${encodeURIComponent(creativeId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to get creative metadata");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get creative metadata error:", error);
    return {
      success: false,
    };
  }
}
