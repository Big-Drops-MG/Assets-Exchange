import { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import { proofreadCreative } from "@/lib/proofreadCreativeClient";
import { saveHtml, renameCreative, saveCreativeMetadata, getCreativeMetadata } from "@/lib/creativeClient";
import { generateEmailContent } from "@/lib/generationClient";
import { ProofreadCreativeResponse } from "@/lib/proofreadCreativeClient";

export interface Creative {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  previewUrl?: string;
  html?: boolean;
  uploadId?: string;
  embeddedHtml?: string;
}

interface UseSingleCreativeViewModalProps {
  isOpen: boolean;
  creative: Creative;
  onClose: () => void;
  onFileNameChange?: (fileId: string, newFileName: string) => void;
  showAdditionalNotes?: boolean;
  creativeType?: string;
}

export const useSingleCreativeViewModal = ({
  isOpen,
  creative,
  onClose,
  onFileNameChange,
  showAdditionalNotes = false,
  creativeType = "email",
}: UseSingleCreativeViewModalProps) => {
  const [editableFileName, setEditableFileName] = useState(creative.name);
  const [editableNameOnly, setEditableNameOnly] = useState(() => {
    const lastDotIndex = creative.name.lastIndexOf(".");
    return lastDotIndex > 0
      ? creative.name.substring(0, lastDotIndex)
      : creative.name;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [fromLines, setFromLines] = useState("");
  const [subjectLines, setSubjectLines] = useState("");
  const [isHtmlEditorFullscreen, setIsHtmlEditorFullscreen] = useState(false);
  const [isImagePreviewFullscreen, setIsImagePreviewFullscreen] = useState(false);
  const [isHtmlPreviewFullscreen, setIsHtmlPreviewFullscreen] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [proofreadingData, setProofreadingData] = useState<ProofreadCreativeResponse | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen && creative.id) {
      loadExistingCreativeData();
    }
  }, [isOpen, creative.id]);

  useEffect(() => {
    if (isOpen) {
      setEditableFileName(creative.name);
      const lastDotIndex = creative.name.lastIndexOf(".");
      setEditableNameOnly(
        lastDotIndex > 0
          ? creative.name.substring(0, lastDotIndex)
          : creative.name
      );
    }
  }, [isOpen, creative.name]);

  const loadExistingCreativeData = async () => {
    try {
      const data = await getCreativeMetadata(creative.id);
      if (data.success && data.metadata) {
        setFromLines(data.metadata.fromLines || "");
        setSubjectLines(data.metadata.subjectLines || "");
        if (data.metadata.proofreadingData) {
          setProofreadingData(data.metadata.proofreadingData);
        }
        if (data.metadata.htmlContent) {
          setHtmlContent(data.metadata.htmlContent);
        }
        if (data.metadata.additionalNotes) {
          setAdditionalNotes(data.metadata.additionalNotes);
        }
      }
    } catch (error) {
      console.log("No existing data found for creative:", creative.id);
    }
  };

  const fetchHtmlContent = useCallback(async () => {
    try {
      if ((creative as { embeddedHtml?: string }).embeddedHtml && 
          (creative as { embeddedHtml?: string }).embeddedHtml!.length > 0) {
        setHtmlContent((creative as { embeddedHtml?: string }).embeddedHtml!);
        return;
      }

      const encodedFileUrl = encodeURIComponent(creative.url);
      let apiUrl = `${API_ENDPOINTS.GET_FILE_CONTENT}?fileId=${creative.id}&fileUrl=${encodedFileUrl}&processAssets=true`;
      if (creative.uploadId) {
        apiUrl += `&uploadId=${encodeURIComponent(creative.uploadId)}`;
      }

      const apiResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (apiResponse.ok) {
        const htmlText = await apiResponse.text();
        setHtmlContent(htmlText);
        return;
      }

      const directResponse = await fetch(creative.url, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        mode: "cors",
      });

      if (directResponse.ok) {
        const htmlText = await directResponse.text();
        setHtmlContent(htmlText);
      } else {
        await tryAlternativeHtmlLoading();
      }
    } catch (error) {
      console.error("Error fetching HTML:", error);
      await tryAlternativeHtmlLoading();
    }
  }, [creative.url, creative.id, creative.uploadId]);

  const tryAlternativeHtmlLoading = async () => {
    const fallbackContent = `<!-- HTML Content Loading Failed -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Creative Editor</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .message {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ff6b6b;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="message">
        <h3>⚠️ Unable to load original HTML content</h3>
        <p>You can start editing by replacing this content with your HTML code.</p>
    </div>
</body>
</html>`;
    setHtmlContent(fallbackContent);
  };

  useEffect(() => {
    if (
      isOpen &&
      creative.type &&
      (creative.type.includes("html") || creative.name.toLowerCase().includes(".html"))
    ) {
      fetchHtmlContent();
    }
  }, [isOpen, creative.type, creative.name, fetchHtmlContent]);

  const handleSaveAll = useCallback(async () => {
    try {
      setIsSaving(true);
      await saveCreativeMetadata({
        creativeId: creative.id,
        fromLines,
        subjectLines,
        proofreadingData: proofreadingData || undefined,
        htmlContent,
        additionalNotes,
        metadata: {
          lastSaved: new Date().toISOString(),
          creativeType: creative.type,
          fileName: creative.name,
        },
      });
      onClose();
    } catch (error) {
      console.error("Failed to save creative data:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save creative data";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [creative.id, fromLines, subjectLines, proofreadingData, htmlContent, additionalNotes, creative.type, creative.name, onClose]);

  const handleFileNameSave = async () => {
    if (!editableNameOnly.trim()) {
      return;
    }

    const originalExtension = creative.name.substring(creative.name.lastIndexOf("."));
    const newFileName = editableNameOnly.trim() + originalExtension;

    if (creative.name === newFileName) {
      setIsEditing(false);
      return;
    }

    setEditableFileName(newFileName);
    setIsEditing(false);

    try {
      await renameCreative({
        creativeId: creative.id,
        fileUrl: creative.url,
        newName: newFileName,
      });

      creative.name = newFileName;
      onFileNameChange?.(creative.id, newFileName);
    } catch (error) {
      console.error("Failed to rename file:", error);
      setEditableFileName(creative.name);
      const lastDotIndex = creative.name.lastIndexOf(".");
      setEditableNameOnly(
        lastDotIndex > 0
          ? creative.name.substring(0, lastDotIndex)
          : creative.name
      );
    }
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameOnly = e.target.value;
    setEditableNameOnly(nameOnly);
    const extension = creative.name.substring(creative.name.lastIndexOf("."));
    setEditableFileName(nameOnly + extension);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFileNameSave();
    } else if (e.key === "Escape") {
      setEditableFileName(creative.name);
      const lastDotIndex = creative.name.lastIndexOf(".");
      setEditableNameOnly(
        lastDotIndex > 0
          ? creative.name.substring(0, lastDotIndex)
          : creative.name
      );
      setIsEditing(false);
    }
  };

  const handleGenerateContent = async () => {
    try {
      setIsGeneratingContent(true);
      let sampleText = "";
      if (creative.type === "html" || creative.html) {
        if (htmlContent) {
          sampleText = htmlContent
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1000);
        }
      } else if (creative.type === "image") {
        sampleText = `Image creative: ${creative.name}`;
      }

      const { fromLines: newFromLines, subjectLines: newSubjectLines } =
        await generateEmailContent({
          creativeType: creative.type || "Email",
          sampleText,
          maxFrom: 4,
          maxSubject: 8,
        });

      const mergeContent = (existing: string, newItems: string[]) => {
        const existingLines = existing
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        const newLines = newItems.map((s) => s.trim()).filter(Boolean);
        const allLines = [...existingLines, ...newLines];
        const uniqueLines = Array.from(new Set(allLines));
        return uniqueLines.join("\n");
      };

      const mergedFromLines = mergeContent(fromLines, newFromLines);
      const mergedSubjectLines = mergeContent(subjectLines, newSubjectLines);

      setFromLines(mergedFromLines);
      setSubjectLines(mergedSubjectLines);

      try {
        await saveCreativeMetadata({
          creativeId: creative.id,
          fromLines: mergedFromLines,
          subjectLines: mergedSubjectLines,
          proofreadingData: proofreadingData || undefined,
          htmlContent,
          additionalNotes,
          metadata: {
            lastGenerated: new Date().toISOString(),
            creativeType: creative.type,
            fileName: creative.name,
          },
        });
      } catch (saveError) {
        console.error("Failed to save generated content:", saveError);
      }
    } catch (error) {
      console.error("Content generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleRegenerateAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const isHtml = creative.html || creative.type === "html" || /\.html?$/i.test(creative.name);
      const isImg = creative.type === "image" || /^image\//.test(creative.type);

      if (isHtml) {
        if (!htmlContent) {
          return;
        }
        const result = await proofreadCreative({
          fileType: "html",
          htmlContent,
          fileUrl: creative.previewUrl,
          creativeType: creative.type as
            | "email"
            | "display"
            | "search"
            | "social"
            | "native"
            | "push",
        });
        setProofreadingData(result);

        try {
          await saveCreativeMetadata({
            creativeId: creative.id,
            fromLines,
            subjectLines,
            proofreadingData: result,
            htmlContent,
            additionalNotes,
            metadata: {
              lastProofread: new Date().toISOString(),
              creativeType: creative.type,
              fileName: creative.name,
            },
          });
        } catch (saveError) {
          console.error("Failed to save proofreading results:", saveError);
        }
      } else if (isImg) {
        let imageUrl = creative.previewUrl || creative.url;
        if (!imageUrl) {
          return;
        }

        if (imageUrl && imageUrl.startsWith("/")) {
          imageUrl = `${window.location.origin}${imageUrl}`;
        }

        const result = await proofreadCreative({
          fileType: "image",
          fileUrl: imageUrl,
          creativeType: creative.type as
            | "email"
            | "display"
            | "search"
            | "social"
            | "native"
            | "push",
        });
        setProofreadingData(result);
      }
    } catch (error) {
      console.error("Proofreading failed:", error);
      setProofreadingData({
        success: false,
        issues: [],
        suggestions: [
          {
            icon: "ℹ️",
            type: "Notice",
            description: "Proofreading failed. Please try again.",
          },
        ],
        qualityScore: {
          grammar: 0,
          readability: 0,
          conversion: 0,
          brandAlignment: 0,
        },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveHtml = async () => {
    try {
      setIsSaving(true);
      await saveHtml({
        fileUrl: creative.url,
        html: htmlContent,
        newFileName: creative.name,
      });
      setPreviewKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to save HTML:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save HTML";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        handleSaveAll();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleSaveAll]);

  return {
    editableFileName,
    editableNameOnly,
    isEditing,
    fromLines,
    subjectLines,
    isHtmlEditorFullscreen,
    isImagePreviewFullscreen,
    isHtmlPreviewFullscreen,
    isPreviewCollapsed,
    proofreadingData,
    htmlContent,
    isSaving,
    previewKey,
    additionalNotes,
    isGeneratingContent,
    isAnalyzing,
    setIsEditing,
    setEditableFileName,
    setEditableNameOnly,
    setFromLines,
    setSubjectLines,
    setIsHtmlEditorFullscreen,
    setIsImagePreviewFullscreen,
    setIsHtmlPreviewFullscreen,
    setIsPreviewCollapsed,
    setHtmlContent,
    setAdditionalNotes,
    handleSaveAll,
    handleFileNameSave,
    handleFileNameChange,
    handleKeyDown,
    handleGenerateContent,
    handleRegenerateAnalysis,
    handleSaveHtml,
    toggleHtmlEditorFullscreen: () => setIsHtmlEditorFullscreen(!isHtmlEditorFullscreen),
    toggleImagePreviewFullscreen: () => setIsImagePreviewFullscreen(!isImagePreviewFullscreen),
    toggleHtmlPreviewFullscreen: () => setIsHtmlPreviewFullscreen(!isHtmlPreviewFullscreen),
    togglePreviewCollapse: () => setIsPreviewCollapsed(!isPreviewCollapsed),
  };
};
