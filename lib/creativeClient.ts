"use client";

interface SaveHtmlParams {
  creativeId: string;
  html: string;
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
    // First, fetch existing metadata to preserve it
    const existingMetadata = await getCreativeMetadata(params.creativeId);
    
    // Merge existing metadata with new HTML content
    const metadataToSave = {
      creativeId: params.creativeId,
      htmlContent: params.html,
      // Preserve existing metadata
      fromLines: existingMetadata.metadata?.fromLines,
      subjectLines: existingMetadata.metadata?.subjectLines,
      proofreadingData: existingMetadata.metadata?.proofreadingData,
      additionalNotes: existingMetadata.metadata?.additionalNotes,
      metadata: existingMetadata.metadata?.metadata,
    };

    // Use the metadata endpoint to save HTML content
    const response = await fetch("/api/creative/metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadataToSave),
    });

    if (!response.ok) {
      let errorMessage = "Failed to save HTML";
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
      throw new Error(result.error || "Failed to save HTML");
    }
  } catch (error) {
    console.error("Save HTML error:", error);
    throw error;
  }
}

export async function renameCreative(
  params: RenameCreativeParams
): Promise<void> {
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
    const response = await fetch(
      `/api/creative/metadata?creativeId=${encodeURIComponent(creativeId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

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
