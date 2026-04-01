import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import {
  saveHtml,
  renameCreative,
  saveCreativeMetadata,
  getCreativeMetadata,
  updateCreativeContent,
} from "@/lib/creativeClient";
import {
  checkProofreadStatus,
  proofreadCreative,
  type ProofreadCreativeResponse,
} from "@/lib/proofreadCreativeClient";

const BRAND_GUIDELINES_STATUS_MESSAGES = [
  "Loading brand guidelines...",
  "Parsing creative content...",
  "Comparing against guidelines...",
  "Checking claims and language...",
  "Reviewing compliance rules...",
  "Finalizing report...",
];

const PROOFREAD_STATUS_MESSAGES = [
  "Preparing your creative...",
  "Sending to proofreading service...",
  "Analyzing grammar and style...",
  "Checking for issues and suggestions...",
  "Finalizing results...",
];

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
  metadata?: {
    fromLines?: string;
    subjectLines?: string;
    additionalNotes?: string;
    originalImageUrl?: string;
  };
}

interface UseSingleCreativeViewModalProps {
  isOpen: boolean;
  creative: Creative;
  onClose: () => void;
  onFileNameChange?: (fileId: string, newFileName: string) => void;
  onMetadataChange?: (
    fileId: string,
    metadata: {
      fromLines?: string;
      subjectLines?: string;
      additionalNotes?: string;
    }
  ) => void;
  showAdditionalNotes?: boolean;
  creativeType?: string;
  siblingCreatives?: Creative[];
  viewOnly?: boolean;
  offerId?: string;
}

export const useSingleCreativeViewModal = ({
  isOpen,
  creative,
  onClose,
  onFileNameChange,
  onMetadataChange: _onMetadataChange,
  showAdditionalNotes: _showAdditionalNotes = false,
  creativeType: _creativeType = "email",
  siblingCreatives = [],
  viewOnly = false,
  offerId,
}: UseSingleCreativeViewModalProps) => {
  const [editableFileName, setEditableFileName] = useState(creative.name);
  const [editableNameOnly, setEditableNameOnly] = useState(() => {
    const lastDotIndex = creative.name.lastIndexOf(".");
    return lastDotIndex > 0
      ? creative.name.substring(0, lastDotIndex)
      : creative.name;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [fromLines, setFromLines] = useState(
    creative.metadata?.fromLines || ""
  );
  const [subjectLines, setSubjectLines] = useState(
    creative.metadata?.subjectLines || ""
  );
  const [isHtmlEditorFullscreen, setIsHtmlEditorFullscreen] = useState(false);
  const [isImagePreviewFullscreen, setIsImagePreviewFullscreen] =
    useState(false);
  const [isHtmlPreviewFullscreen, setIsHtmlPreviewFullscreen] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [proofreadingData, setProofreadingData] =
    useState<ProofreadCreativeResponse | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingHtml, setIsSavingHtml] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState(
    creative.metadata?.additionalNotes || ""
  );
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [complianceViolations, _setComplianceViolations] = useState<
    Array<{
      rule_type?: string;
      evidence_text?: string;
      source?: string;
      confidence?: number;
      type?: string;
      original?: string;
      note?: string;
    }>
  >([]);
  const [brandGuidelinesResponse, setBrandGuidelinesResponse] = useState<
    | { message: string }
    | {
        message: Array<{
          rule_type: string;
          evidence_text: string;
          source?: string;
          confidence?: number;
          recommended_changes?: string | null;
          old_violating_line?: string | null;
          new_recommended_line?: string | null;
        }>;
      }
    | null
  >(null);
  const [isCheckingBrandGuidelines, setIsCheckingBrandGuidelines] =
    useState(false);
  const [brandGuidelinesStatusMessage, setBrandGuidelinesStatusMessage] =
    useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proofreadStatusMessage, setProofreadStatusMessage] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);
  const [showOriginalFullscreen, setShowOriginalFullscreen] = useState(false);
  const [showOriginalHtmlFullscreen, setShowOriginalHtmlFullscreen] =
    useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const proofreadStatusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const brandGuidelinesStatusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startBrandGuidelinesStatusRotation = useCallback(() => {
    setBrandGuidelinesStatusMessage(
      BRAND_GUIDELINES_STATUS_MESSAGES[0] ?? "Analyzing..."
    );
    let index = 0;
    brandGuidelinesStatusIntervalRef.current = setInterval(() => {
      index = (index + 1) % BRAND_GUIDELINES_STATUS_MESSAGES.length;
      setBrandGuidelinesStatusMessage(
        BRAND_GUIDELINES_STATUS_MESSAGES[index] ?? "Analyzing..."
      );
    }, 3000);
  }, []);

  const stopBrandGuidelinesStatusRotation = useCallback(() => {
    if (brandGuidelinesStatusIntervalRef.current) {
      clearInterval(brandGuidelinesStatusIntervalRef.current);
      brandGuidelinesStatusIntervalRef.current = null;
    }
    setBrandGuidelinesStatusMessage("");
  }, []);

  const startProofreadStatusRotation = useCallback(() => {
    setProofreadStatusMessage(PROOFREAD_STATUS_MESSAGES[0] ?? "Analyzing...");
    let index = 0;
    proofreadStatusIntervalRef.current = setInterval(() => {
      index = (index + 1) % PROOFREAD_STATUS_MESSAGES.length;
      setProofreadStatusMessage(
        PROOFREAD_STATUS_MESSAGES[index] ?? "Analyzing..."
      );
    }, 3500);
  }, []);

  const stopProofreadStatusRotation = useCallback(() => {
    if (proofreadStatusIntervalRef.current) {
      clearInterval(proofreadStatusIntervalRef.current);
      proofreadStatusIntervalRef.current = null;
    }
    setProofreadStatusMessage("");
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (proofreadStatusIntervalRef.current)
        clearInterval(proofreadStatusIntervalRef.current);
    };
  }, []);

  const getMarkedImageUrlFromModel = useCallback((): string | null => {
    if (
      !proofreadingData?.result ||
      typeof proofreadingData.result !== "object"
    ) {
      return null;
    }
    const result = proofreadingData.result as Record<string, unknown>;
    const isModelImageUrl = (s: string) =>
      (s.startsWith("https://") || s.startsWith("data:image/")) &&
      (s.includes("proofread-results") || s.includes("blob"));
    if (
      result.marked_image &&
      typeof result.marked_image === "string" &&
      isModelImageUrl(result.marked_image)
    ) {
      return result.marked_image;
    }
    const oc = result.output_content;
    if (typeof oc === "string" && isModelImageUrl(oc)) {
      return oc;
    }
    return null;
  }, [proofreadingData]);

  const getMarkedImageUrl = useCallback((): string | null => {
    const fromModel = getMarkedImageUrlFromModel();
    if (fromModel) return fromModel;

    if (!proofreadingData) {
      return null;
    }

    const originalUrl = creative.url || creative.previewUrl || "";

    if (
      !proofreadingData.result ||
      typeof proofreadingData.result !== "object"
    ) {
      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV === "development"
      ) {
        console.warn("[Proofread] getMarkedImageUrl: no result object", {
          hasProofreadingData: !!proofreadingData,
          hasResult: !!proofreadingData.result,
          resultType: typeof proofreadingData.result,
        });
      }
      return null;
    }
    const result = proofreadingData.result as Record<string, unknown>;

    if (
      result.marked_image &&
      typeof result.marked_image === "string" &&
      result.marked_image !== originalUrl
    ) {
      return result.marked_image;
    }
    if (
      result.marked_image_url &&
      typeof result.marked_image_url === "string" &&
      result.marked_image_url !== originalUrl
    ) {
      return result.marked_image_url;
    }
    if (
      result.annotated_image_url &&
      typeof result.annotated_image_url === "string" &&
      result.annotated_image_url !== originalUrl
    ) {
      return result.annotated_image_url;
    }
    if (
      result.corrected_file_url &&
      typeof result.corrected_file_url === "string" &&
      result.corrected_file_url !== originalUrl
    ) {
      return result.corrected_file_url;
    }
    if (
      result.annotated_image &&
      typeof result.annotated_image === "string" &&
      result.annotated_image !== originalUrl
    ) {
      return result.annotated_image;
    }
    if (
      result.output_image &&
      typeof result.output_image === "string" &&
      result.output_image !== originalUrl
    ) {
      return result.output_image;
    }
    if (
      result.processed_image &&
      typeof result.processed_image === "string" &&
      result.processed_image !== originalUrl
    ) {
      return result.processed_image;
    }
    const outputContent = result.output_content;
    if (
      typeof outputContent === "string" &&
      outputContent !== originalUrl &&
      (outputContent.startsWith("https://") ||
        outputContent.startsWith("data:image/")) &&
      (outputContent.includes("proofread") ||
        outputContent.includes("blob") ||
        /\.(jpe?g|png|webp|gif)(\?|$)/i.test(outputContent))
    ) {
      return outputContent;
    }
    if (
      Array.isArray(result.image_marked_urls) &&
      result.image_marked_urls.length > 0
    ) {
      const firstMarkedUrl = result.image_marked_urls[0];
      if (
        typeof firstMarkedUrl === "string" &&
        firstMarkedUrl !== originalUrl
      ) {
        return firstMarkedUrl;
      }
    }

    if (result.result && typeof result.result === "object") {
      const nestedResult = result.result as Record<string, unknown>;
      if (
        nestedResult.marked_image &&
        typeof nestedResult.marked_image === "string" &&
        nestedResult.marked_image !== originalUrl
      ) {
        return nestedResult.marked_image;
      }
      if (
        nestedResult.marked_image_url &&
        typeof nestedResult.marked_image_url === "string" &&
        nestedResult.marked_image_url !== originalUrl
      ) {
        return nestedResult.marked_image_url;
      }
      if (
        nestedResult.annotated_image_url &&
        typeof nestedResult.annotated_image_url === "string" &&
        nestedResult.annotated_image_url !== originalUrl
      ) {
        return nestedResult.annotated_image_url;
      }
      if (
        nestedResult.corrected_file_url &&
        typeof nestedResult.corrected_file_url === "string" &&
        nestedResult.corrected_file_url !== originalUrl
      ) {
        return nestedResult.corrected_file_url;
      }
      if (
        nestedResult.annotated_image &&
        typeof nestedResult.annotated_image === "string" &&
        nestedResult.annotated_image !== originalUrl
      ) {
        return nestedResult.annotated_image;
      }
      if (
        nestedResult.output_image &&
        typeof nestedResult.output_image === "string" &&
        nestedResult.output_image !== originalUrl
      ) {
        return nestedResult.output_image;
      }
    }

    const allKeys = Object.keys(result);
    for (const key of allKeys) {
      const value = result[key];
      if (
        typeof value === "string" &&
        value !== originalUrl &&
        (value.startsWith("data:image/") ||
          (value.startsWith("https://") &&
            (value.includes(".png") ||
              value.includes(".jpg") ||
              value.includes(".jpeg") ||
              value.includes("blob") ||
              value.includes("proofread"))))
      ) {
        return value;
      }
    }

    for (const value of Object.values(result)) {
      if (
        typeof value === "string" &&
        value !== originalUrl &&
        value.startsWith("https://") &&
        value.includes("proofread-results")
      ) {
        return value;
      }
    }

    if (
      typeof process !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      console.warn(
        "[Proofread] getMarkedImageUrl: no image URL found in result",
        {
          resultKeys: Object.keys(result),
          sampleValues: Object.fromEntries(
            Object.entries(result)
              .slice(0, 5)
              .map(([k, v]) => [
                k,
                typeof v === "string" ? v.slice(0, 80) : typeof v,
              ])
          ),
        }
      );
    }
    return null;
  }, [
    proofreadingData,
    creative.url,
    creative.previewUrl,
    getMarkedImageUrlFromModel,
  ]);

  const getOriginalImageUrl = useCallback((): string => {
    return (
      creative.metadata?.originalImageUrl ?? creative.previewUrl ?? creative.url
    );
  }, [creative.url, creative.previewUrl, creative.metadata?.originalImageUrl]);

  const getMarkedHtmlContent = useCallback((): string | null => {
    if (
      !proofreadingData?.result ||
      typeof proofreadingData.result !== "object"
    ) {
      return null;
    }
    const result = proofreadingData.result as Record<string, unknown>;

    if (result.output_content && typeof result.output_content === "string") {
      return result.output_content;
    }
    if (result.corrected_html && typeof result.corrected_html === "string") {
      return result.corrected_html;
    }
    if (result.annotated_html && typeof result.annotated_html === "string") {
      return result.annotated_html;
    }
    if (result.marked_html && typeof result.marked_html === "string") {
      return result.marked_html;
    }

    if (result.result && typeof result.result === "object") {
      const nestedResult = result.result as Record<string, unknown>;
      if (
        nestedResult.output_content &&
        typeof nestedResult.output_content === "string"
      ) {
        return nestedResult.output_content;
      }
      if (
        nestedResult.corrected_html &&
        typeof nestedResult.corrected_html === "string"
      ) {
        return nestedResult.corrected_html;
      }
      if (
        nestedResult.annotated_html &&
        typeof nestedResult.annotated_html === "string"
      ) {
        return nestedResult.annotated_html;
      }
      if (
        nestedResult.marked_html &&
        typeof nestedResult.marked_html === "string"
      ) {
        return nestedResult.marked_html;
      }
    }

    return null;
  }, [proofreadingData]);

  const processHtmlContent = useCallback(
    (html: string) => {
      if (!html || !siblingCreatives || siblingCreatives.length === 0) {
        return html;
      }

      let processedHtml = html;

      const srcRegex = /src=["']([^"']+)["']/gi;

      processedHtml = processedHtml.replace(srcRegex, (match, url) => {
        const decodedUrl = decodeURIComponent(url);
        let normalizedTarget = decodedUrl.replace(/\\/g, "/");
        if (normalizedTarget.startsWith("./")) {
          normalizedTarget = normalizedTarget.substring(2);
        }

        const matchedSibling = siblingCreatives.find((sibling) => {
          const isAsset =
            sibling.type?.startsWith("image/") ||
            /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(sibling.name);
          if (!isAsset) return false;

          const siblingPath = sibling.name.replace(/\\/g, "/");

          const lowerSibling = siblingPath.toLowerCase();
          const lowerTarget = normalizedTarget.toLowerCase();
          if (lowerSibling === lowerTarget) return true;

          if (lowerSibling.endsWith("/" + lowerTarget)) return true;

          const siblingBasename = lowerSibling.split("/").pop();
          const targetBasename = lowerTarget.split("/").pop();

          return siblingBasename === targetBasename;
        });

        if (matchedSibling) {
          const replacementUrl =
            matchedSibling.previewUrl || matchedSibling.url;

          return `src="${replacementUrl}"`;
        }

        return match;
      });

      return processedHtml;
    },
    [siblingCreatives]
  );

  const onMetadataChangeRef = useRef(_onMetadataChange);
  useEffect(() => {
    onMetadataChangeRef.current = _onMetadataChange;
  }, [_onMetadataChange]);

  const loadExistingCreativeData = useCallback(async () => {
    try {
      const data = await getCreativeMetadata(creative.id);
      if (data.success && data.metadata) {
        const loadedFromLines = data.metadata.fromLines || "";
        const loadedSubjectLines = data.metadata.subjectLines || "";
        setFromLines(loadedFromLines);
        setSubjectLines(loadedSubjectLines);
        if (
          data.metadata.proofreadingData &&
          typeof data.metadata.proofreadingData === "object" &&
          Object.keys(data.metadata.proofreadingData).length > 0
        ) {
          const loaded = data.metadata
            .proofreadingData as ProofreadCreativeResponse;
          const loadedHasResult =
            loaded.result != null && typeof loaded.result === "object";
          if (loadedHasResult) {
            setProofreadingData(loaded);
          }
        }

        if (data.metadata.metadata?.brandGuidelinesData) {
          const bgData = data.metadata.metadata.brandGuidelinesData;
          const violations = (bgData.violations ?? []).filter(
            (
              v
            ): v is {
              rule_type: string;
              evidence_text: string;
              confidence?: number;
              source?: string;
            } =>
              typeof v.rule_type === "string" &&
              typeof v.evidence_text === "string"
          );
          if (violations.length === 0) {
            setBrandGuidelinesResponse({
              message: "All guidelines are followed. No violations detected.",
            });
          } else {
            setBrandGuidelinesResponse({ message: violations });
          }
        }
        if (data.metadata.htmlContent) {
          setHtmlContent(processHtmlContent(data.metadata.htmlContent));
        }
        if (data.metadata.additionalNotes) {
          setAdditionalNotes(data.metadata.additionalNotes);
        }
        if (loadedFromLines || loadedSubjectLines) {
          onMetadataChangeRef.current?.(creative.id, {
            fromLines: loadedFromLines,
            subjectLines: loadedSubjectLines,
          });
        }
      }
    } catch (_error) {
      console.error("No existing data found for creative:", creative.id);
    }
  }, [creative, processHtmlContent]);

  const lastFetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      lastFetchedIdRef.current = null;
      return;
    }

    if (isOpen && creative.id && lastFetchedIdRef.current !== creative.id) {
      lastFetchedIdRef.current = creative.id;
      loadExistingCreativeData();
    }
  }, [isOpen, creative.id, loadExistingCreativeData]);

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

  const fetchHtmlContent = useCallback(async () => {
    try {
      let htmlText = "";

      if (
        (creative as { embeddedHtml?: string }).embeddedHtml &&
        (creative as { embeddedHtml?: string }).embeddedHtml!.length > 0
      ) {
        htmlText = (creative as { embeddedHtml?: string }).embeddedHtml!;
      } else {
        const isVercelBlobUrl = creative.url.includes(
          "blob.vercel-storage.com"
        );

        if (isVercelBlobUrl) {
          try {
            const directResponse = await fetch(creative.url, {
              method: "GET",
              headers: {
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              },
              mode: "cors",
            });

            if (directResponse.ok) {
              htmlText = await directResponse.text();
            }
          } catch (error) {
            console.error("Error fetching HTML from Vercel Blob:", error);
          }
        } else {
          const encodedFileUrl = encodeURIComponent(creative.url);
          let apiUrl = `${API_ENDPOINTS.GET_FILE_CONTENT}?fileId=${creative.id}&fileUrl=${encodedFileUrl}&processAssets=true`;
          if (creative.uploadId) {
            apiUrl += `&uploadId=${encodeURIComponent(creative.uploadId)}`;
          }

          try {
            const apiResponse = await fetch(apiUrl, {
              method: "GET",
              headers: {
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              },
            });

            if (apiResponse.ok) {
              const responseData = await apiResponse.json();
              if (responseData.requiresClientFetch && responseData.url) {
                const directResponse = await fetch(responseData.url, {
                  method: "GET",
                  headers: {
                    Accept:
                      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                  },
                  mode: "cors",
                });
                if (directResponse.ok) {
                  htmlText = await directResponse.text();
                }
              } else {
                htmlText = await apiResponse.text();
              }
            } else {
              const directResponse = await fetch(creative.url, {
                method: "GET",
                headers: {
                  Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
                mode: "cors",
              });

              if (directResponse.ok) {
                htmlText = await directResponse.text();
              }
            }
          } catch (error) {
            console.error("Error fetching HTML via API:", error);
            try {
              const directResponse = await fetch(creative.url, {
                method: "GET",
                headers: {
                  Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
                mode: "cors",
              });
              if (directResponse.ok) {
                htmlText = await directResponse.text();
              }
            } catch (fallbackError) {
              console.error("Error fetching HTML directly:", fallbackError);
            }
          }
        }
      }

      if (htmlText) {
        const hasProofreading = proofreadingData?.result;
        if (hasProofreading) {
          const result = proofreadingData.result as Record<string, unknown>;
          const correctedHtml =
            (result.output_content && typeof result.output_content === "string"
              ? result.output_content
              : null) ||
            (result.marked_html && typeof result.marked_html === "string"
              ? result.marked_html
              : null) ||
            (result.corrected_html && typeof result.corrected_html === "string"
              ? result.corrected_html
              : null);

          if (correctedHtml && correctedHtml.trim().length > 0) {
            setHtmlContent(processHtmlContent(correctedHtml));
          } else {
            setHtmlContent(processHtmlContent(htmlText));
          }
        } else {
          setHtmlContent(processHtmlContent(htmlText));
        }
      }
    } catch (error) {
      console.error("Error fetching HTML:", error);
      await tryAlternativeHtmlLoading();
    }
  }, [creative, proofreadingData, processHtmlContent]);

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
      (creative.type.includes("html") ||
        creative.name.toLowerCase().includes(".html"))
    ) {
      fetchHtmlContent();
    }
  }, [isOpen, creative.type, creative.name, fetchHtmlContent]);

  useEffect(() => {
    const isHtmlFile =
      creative.html ||
      creative.type === "html" ||
      /\.html?$/i.test(creative.name);

    if (isHtmlFile && proofreadingData?.result) {
      const result = proofreadingData.result as Record<string, unknown>;

      let correctedHtml: string | null = null;
      if (result.output_content && typeof result.output_content === "string") {
        correctedHtml = result.output_content;
      } else if (result.marked_html && typeof result.marked_html === "string") {
        correctedHtml = result.marked_html;
      } else if (
        result.corrected_html &&
        typeof result.corrected_html === "string"
      ) {
        correctedHtml = result.corrected_html;
      }

      if (correctedHtml && correctedHtml.trim().length > 0) {
        setHtmlContent(correctedHtml);
        setPreviewKey((prev) => prev + 1);
      }
    }
  }, [proofreadingData, creative.html, creative.type, creative.name]);

  const handleSaveAll = useCallback(async () => {
    try {
      setIsSaving(true);

      let existingMetadata: Record<string, unknown> = {};
      try {
        const existing = await getCreativeMetadata(creative.id);
        existingMetadata =
          (existing.metadata?.metadata as Record<string, unknown>) || {};
      } catch {}

      await saveCreativeMetadata({
        creativeId: creative.id,
        fromLines,
        subjectLines,
        proofreadingData: proofreadingData || undefined,
        htmlContent,
        additionalNotes,
        metadata: {
          ...existingMetadata,
          lastSaved: new Date().toISOString(),
          creativeType: creative.type,
          fileName: creative.name,
        },
      });
      _onMetadataChange?.(creative.id, {
        fromLines,
        subjectLines,
        additionalNotes,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save creative data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save creative data";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    creative,
    fromLines,
    subjectLines,
    proofreadingData,
    htmlContent,
    additionalNotes,
    _onMetadataChange,
    onClose,
  ]);

  const handleFileNameSave = async () => {
    if (!editableNameOnly.trim()) {
      return;
    }

    const originalExtension = creative.name.substring(
      creative.name.lastIndexOf(".")
    );
    const newFileName = editableNameOnly.trim() + originalExtension;

    if (creative.name === newFileName) {
      setIsEditing(false);
      return;
    }

    const previousName = creative.name;
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
      setEditableFileName(previousName);
      const lastDotIndex = previousName.lastIndexOf(".");
      setEditableNameOnly(
        lastDotIndex > 0
          ? previousName.substring(0, lastDotIndex)
          : previousName
      );
      const errorMessage =
        error instanceof Error ? error.message : "Failed to rename file";
      alert(`Error: ${errorMessage}`);
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

      const isHtml =
        creative.html ||
        creative.type === "html" ||
        /\.html?$/i.test(creative.name);

      let fileToSend: File | null = null;

      if (isHtml && htmlContent) {
        fileToSend = new File([htmlContent], creative.name || "creative.html", {
          type: "text/html",
        });
      } else {
        try {
          const fileResponse = await fetch(creative.url);
          if (fileResponse.ok) {
            const blob = await fileResponse.blob();
            fileToSend = new File([blob], creative.name, {
              type: creative.type || blob.type,
            });
          }
        } catch {
          console.error("Could not fetch creative file for analysis");
        }
      }

      if (!fileToSend) {
        toast.error("Could not read the creative file.");
        return;
      }

      const formData = new FormData();
      formData.append("creative", fileToSend);
      if (offerId) formData.append("offerId", offerId);

      const res = await fetch("/api/publisher/analyze-creative", {
        method: "POST",
        body: formData,
      });

      const result = (await res.json()) as {
        success: boolean;
        data?: {
          fromLines: string;
          subjectLines: string;
          analysis: Record<string, unknown>;
        };
        error?: string;
      };

      if (!result.success || !result.data) {
        throw new Error(
          result.error || "Pipeline returned an unexpected response"
        );
      }

      const {
        fromLines: newFrom,
        subjectLines: newSubject,
        analysis,
      } = result.data;

      const mergeContent = (existing: string, incoming: string) => {
        const existingLines = existing
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        const incomingLines = incoming
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        const merged = Array.from(
          new Set([...existingLines, ...incomingLines])
        );
        return merged.join("\n");
      };

      const mergedFrom = mergeContent(fromLines, newFrom);
      const mergedSubject = mergeContent(subjectLines, newSubject);

      setFromLines(mergedFrom);
      setSubjectLines(mergedSubject);

      if (analysis && Object.keys(analysis).length > 0) {
        const rawIssues = (analysis.violations ??
          analysis.corrections ??
          analysis.issues ??
          []) as Array<{
          // Compliance API fields (/v1/analyze)
          rule_type?: string;
          evidence_text?: string;
          source?: string;
          confidence?: number;
          // Legacy grammar API fields
          original_word?: string;
          corrected_word?: string;
          original_context?: string;
          corrected_context?: string;
          type?: string;
          original?: string;
          correction?: string;
          note?: string;
        }>;

        const mappedIssues = rawIssues.map((c) => ({
          type: c.rule_type ?? c.type ?? "Violation",
          rule_type: c.rule_type,
          evidence_text: c.evidence_text,
          source: c.source,
          confidence: c.confidence,
          original: c.original ?? c.original_word ?? c.evidence_text ?? "",
          correction: c.correction ?? c.corrected_word ?? "",
          note:
            c.note ??
            (c.original_context
              ? `"${c.original_context}" → "${c.corrected_context}"`
              : undefined),
        }));

        const proofreadResult: ProofreadCreativeResponse = {
          success: true,
          issues: mappedIssues,
          suggestions:
            (analysis.suggestions as ProofreadCreativeResponse["suggestions"]) ??
            [],
          qualityScore:
            analysis.qualityScore as ProofreadCreativeResponse["qualityScore"],
        };

        setProofreadingData(proofreadResult);
      }

      try {
        await saveCreativeMetadata({
          creativeId: creative.id,
          fromLines: mergedFrom,
          subjectLines: mergedSubject,
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
        console.error("Failed to auto-save generated content:", saveError);
      }

      const issueCount =
        (result.data.analysis?.corrections as unknown[] | undefined)?.length ??
        0;
      if (issueCount > 0) {
        toast.success(
          `Generated! ${issueCount} issue${issueCount !== 1 ? "s" : ""} found.`
        );
      } else {
        toast.success("From & Subject lines generated successfully!");
      }
    } catch (error) {
      console.error("Content generation pipeline failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate content";
      toast.error(`Generation failed: ${errorMessage}`);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleAnalyzeBrandGuidelines = useCallback(async () => {
    setIsCheckingBrandGuidelines(true);
    startBrandGuidelinesStatusRotation();
    try {
      const isHtml =
        creative.html ||
        creative.type === "html" ||
        /\.html?$/i.test(creative.name);

      let fileToSend: File | null = null;

      const hostedUrl = creative.url?.startsWith("https://")
        ? creative.url
        : null;
      if (hostedUrl) {
        try {
          const fileResponse = await fetch(hostedUrl);
          if (fileResponse.ok) {
            const blob = await fileResponse.blob();
            fileToSend = new File([blob], creative.name, {
              type: creative.type || blob.type,
            });
          }
        } catch {
          console.error(
            "Could not fetch creative file for brand guidelines analysis"
          );
        }
      }

      if (!fileToSend && isHtml && htmlContent) {
        fileToSend = new File([htmlContent], creative.name || "creative.html", {
          type: "text/html",
        });
      }

      if (!fileToSend) {
        toast.error("Could not read the creative file.");
        return;
      }

      const formData = new FormData();
      formData.append("creative", fileToSend);
      if (offerId) formData.append("offerId", offerId);

      const res = await fetch("/api/publisher/analyze-brand-guidelines", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success || !result.data) {
        throw new Error(result.error || "Brand guidelines analysis failed");
      }

      const data = result.data as {
        status?: string;
        violations?: Array<{
          rule_type: string;
          evidence_text: string;
          confidence?: number;
          source?: string;
        }>;
      };

      try {
        const existing = await getCreativeMetadata(creative.id);
        const currentMetadata = existing.metadata?.metadata || {};

        await saveCreativeMetadata({
          creativeId: creative.id,
          fromLines: existing.metadata?.fromLines,
          subjectLines: existing.metadata?.subjectLines,
          proofreadingData: existing.metadata?.proofreadingData,
          htmlContent: existing.metadata?.htmlContent,
          additionalNotes: existing.metadata?.additionalNotes,
          metadata: {
            ...currentMetadata,
            brandGuidelinesData: data,
            lastBrandGuidelines: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error("Failed to persist brand guidelines result:", err);
      }
      if (!data.violations || data.violations.length === 0) {
        setBrandGuidelinesResponse({
          message: "All guidelines are followed. No violations detected.",
        });
        toast.success("Brand Guidelines followed!");
      } else {
        setBrandGuidelinesResponse({ message: data.violations });
        toast.warning(`Found ${data.violations.length} brand guideline issues`);
      }
    } catch (error) {
      console.error("Brand Guidelines Analysis failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to analyze guidelines";
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      stopBrandGuidelinesStatusRotation();
      setIsCheckingBrandGuidelines(false);
    }
  }, [
    creative,
    htmlContent,
    offerId,
    startBrandGuidelinesStatusRotation,
    stopBrandGuidelinesStatusRotation,
  ]);

  const handleRegenerateAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      startProofreadStatusRotation();
      if (pollRef.current) clearInterval(pollRef.current);

      const isHtml =
        creative.html ||
        creative.type === "html" ||
        /\.html?$/i.test(creative.name);
      const isImg = creative.type === "image" || /^image\//.test(creative.type);

      let fileUrl: string | null = null;

      if (isHtml) {
        if (!htmlContent) {
          stopProofreadStatusRotation();
          setIsAnalyzing(false);
          return;
        }
        fileUrl = creative.url;
        if (!fileUrl) {
          stopProofreadStatusRotation();
          setIsAnalyzing(false);
          return;
        }
        if (fileUrl.startsWith("/")) {
          fileUrl = `${window.location.origin}${fileUrl}`;
        }
      } else if (isImg) {
        fileUrl = creative.previewUrl || creative.url;
        if (!fileUrl) {
          stopProofreadStatusRotation();
          setIsAnalyzing(false);
          return;
        }
        if (fileUrl.startsWith("/")) {
          fileUrl = `${window.location.origin}${fileUrl}`;
        }
      }

      if (!fileUrl) {
        stopProofreadStatusRotation();
        setIsAnalyzing(false);
        return;
      }

      toast.info("Analysis started...", {
        description: "This may take a few moments.",
      });

      const result = await proofreadCreative({
        creativeId: creative.id,
        fileUrl,
        htmlContent: isHtml && htmlContent ? htmlContent : undefined,
      });

      const isSyncComplete = result.status === "completed" || result.result;

      if (isSyncComplete) {
        const resultData = (result.result || result) as Record<string, unknown>;
        const payload =
          resultData.result && typeof resultData.result === "object"
            ? (resultData.result as Record<string, unknown>)
            : resultData;
        if (
          typeof process !== "undefined" &&
          process.env.NODE_ENV === "development"
        ) {
          console.warn("[Proofread] Sync response:", {
            hasResult: !!result.result,
            resultDataKeys: Object.keys(resultData),
            payloadKeys: Object.keys(payload),
            correctionsCount: Array.isArray(payload.corrections)
              ? payload.corrections.length
              : 0,
            hasMarkedImage: !!(payload as Record<string, unknown>).marked_image,
            hasOutputContent:
              typeof (payload as Record<string, unknown>).output_content ===
              "string",
          });
        }
        const rawCorrections = (payload.corrections ||
          payload.issues ||
          resultData.corrections ||
          resultData.issues ||
          []) as Array<{
          original_word?: string;
          corrected_word?: string;
          original_context?: string;
          corrected_context?: string;
          type?: string;
          original?: string;
          correction?: string;
          note?: string;
        }>;

        const issues: ProofreadCreativeResponse["issues"] = rawCorrections.map(
          (c) => ({
            type: c.type || "Spelling",
            original: c.original || c.original_word || "",
            correction: c.correction || c.corrected_word || "",
            note:
              c.note ||
              (c.original_context
                ? `"${c.original_context}" → "${c.corrected_context}"`
                : undefined),
          })
        );

        const finalResult: ProofreadCreativeResponse = {
          success: true,
          result: payload,
          issues,
          suggestions:
            (payload.suggestions as ProofreadCreativeResponse["suggestions"]) ??
            (resultData.suggestions as ProofreadCreativeResponse["suggestions"]) ??
            [],
          qualityScore:
            (payload.qualityScore as ProofreadCreativeResponse["qualityScore"]) ??
            (resultData.qualityScore as ProofreadCreativeResponse["qualityScore"]),
        };

        if (
          typeof process !== "undefined" &&
          process.env.NODE_ENV === "development"
        ) {
          console.warn("[Proofread] Setting proofreadingData:", {
            issuesCount: finalResult.issues?.length ?? 0,
            hasResult: !!finalResult.result,
            resultKeys: finalResult.result
              ? Object.keys(finalResult.result as object)
              : [],
          });
        }
        setProofreadingData(finalResult);

        saveCreativeMetadata({
          creativeId: creative.id,
          fromLines,
          subjectLines,
          proofreadingData: finalResult,
          htmlContent,
          additionalNotes,
          metadata: {
            lastProofread: new Date().toISOString(),
            creativeType: creative.type,
            fileName: creative.name,
          },
        }).catch((err) =>
          console.error("Failed to persist proofreading result:", err)
        );

        const isHtmlFile =
          creative.html ||
          creative.type === "html" ||
          /\.html?$/i.test(creative.name);

        if (isHtmlFile) {
          const proofreadResult = (finalResult.result || finalResult) as Record<
            string,
            unknown
          >;

          let correctedHtml: string | null = null;
          if (
            proofreadResult.output_content &&
            typeof proofreadResult.output_content === "string"
          ) {
            correctedHtml = proofreadResult.output_content;
          } else if (
            proofreadResult.marked_html &&
            typeof proofreadResult.marked_html === "string"
          ) {
            correctedHtml = proofreadResult.marked_html;
          } else if (
            proofreadResult.corrected_html &&
            typeof proofreadResult.corrected_html === "string"
          ) {
            correctedHtml = proofreadResult.corrected_html;
          }

          if (correctedHtml && correctedHtml.trim().length > 0) {
            setHtmlContent(correctedHtml);
            setPreviewKey((prev) => prev + 1);
          }
        }

        setShowOriginal(false);
        setShowOriginalFullscreen(false);
        setShowOriginalHtmlFullscreen(false);
        stopProofreadStatusRotation();
        setIsAnalyzing(false);

        const issueCount = issues?.length || 0;
        if (issueCount === 0) {
          toast.success("No issues found!", {
            description: "Your creative looks great.",
          });
        } else {
          toast.warning(
            `${issueCount} issue${issueCount !== 1 ? "s" : ""} found`,
            { description: "Switching to marked view..." }
          );
        }
      } else if (result.taskId) {
        pollRef.current = setInterval(async () => {
          try {
            const statusData = await checkProofreadStatus({
              taskId: result.taskId!,
            });

            if (
              statusData.status === "SUCCESS" ||
              statusData.status === "completed"
            ) {
              if (pollRef.current) clearInterval(pollRef.current);

              const resultData = (statusData.result || statusData) as Record<
                string,
                unknown
              >;
              const rawCorrections = (resultData.corrections ||
                resultData.issues ||
                []) as Array<{
                original_word?: string;
                corrected_word?: string;
                original_context?: string;
                corrected_context?: string;
                type?: string;
                original?: string;
                correction?: string;
                note?: string;
              }>;

              const issues: ProofreadCreativeResponse["issues"] =
                rawCorrections.map((c) => ({
                  type: c.type || "Spelling",
                  original: c.original || c.original_word || "",
                  correction: c.correction || c.corrected_word || "",
                  note:
                    c.note ||
                    (c.original_context
                      ? `"${c.original_context}" → "${c.corrected_context}"`
                      : undefined),
                }));

              const finalResult: ProofreadCreativeResponse = {
                success: true,
                result: resultData,
                issues,
                suggestions:
                  (resultData.suggestions as ProofreadCreativeResponse["suggestions"]) ||
                  [],
                qualityScore:
                  resultData.qualityScore as ProofreadCreativeResponse["qualityScore"],
              };

              setProofreadingData(finalResult);

              const isHtmlFile =
                creative.html ||
                creative.type === "html" ||
                /\.html?$/i.test(creative.name);

              if (isHtmlFile) {
                const proofreadResult = (finalResult.result ||
                  finalResult) as Record<string, unknown>;

                let correctedHtml: string | null = null;
                if (
                  proofreadResult.output_content &&
                  typeof proofreadResult.output_content === "string"
                ) {
                  correctedHtml = proofreadResult.output_content;
                } else if (
                  proofreadResult.marked_html &&
                  typeof proofreadResult.marked_html === "string"
                ) {
                  correctedHtml = proofreadResult.marked_html;
                } else if (
                  proofreadResult.corrected_html &&
                  typeof proofreadResult.corrected_html === "string"
                ) {
                  correctedHtml = proofreadResult.corrected_html;
                }

                if (correctedHtml && correctedHtml.trim().length > 0) {
                  setHtmlContent(correctedHtml);
                  setPreviewKey((prev) => prev + 1);
                }
              }

              setShowOriginal(false);
              setShowOriginalFullscreen(false);
              setShowOriginalHtmlFullscreen(false);
              stopProofreadStatusRotation();
              setIsAnalyzing(false);

              const issueCount = issues?.length || 0;
              if (issueCount === 0) {
                toast.success("No issues found!", {
                  description: "Your creative looks great.",
                });
              } else {
                toast.warning(
                  `${issueCount} issue${issueCount !== 1 ? "s" : ""} found`,
                  { description: "Switching to marked view..." }
                );
              }
            } else if (
              statusData.status === "FAILURE" ||
              statusData.status === "failed"
            ) {
              if (pollRef.current) clearInterval(pollRef.current);
              stopProofreadStatusRotation();
              setIsAnalyzing(false);
              setShowOriginal(true);
              setShowOriginalFullscreen(true);
              setShowOriginalHtmlFullscreen(true);
              toast.error("Analysis failed", {
                description: "Please try again.",
              });
            }
          } catch (err) {
            console.error("Polling error:", err);
            if (pollRef.current) clearInterval(pollRef.current);
            stopProofreadStatusRotation();
            setIsAnalyzing(false);
            toast.error("Failed to retrieve results");
          }
        }, 2000);
      } else {
        stopProofreadStatusRotation();
        setIsAnalyzing(false);
        toast.error("No task ID received");
      }
    } catch (error) {
      console.error("Proofreading failed:", error);
      if (pollRef.current) clearInterval(pollRef.current);
      stopProofreadStatusRotation();
      setIsAnalyzing(false);
      setShowOriginal(true);
      setShowOriginalFullscreen(true);
      setShowOriginalHtmlFullscreen(true);

      const errorMessage =
        error instanceof Error ? error.message : "Please try again.";
      const isServiceUnavailable =
        errorMessage.includes("temporarily unavailable") ||
        errorMessage.includes("502") ||
        errorMessage.includes("503") ||
        errorMessage.includes("504") ||
        errorMessage.includes("starting up");

      toast.error(
        isServiceUnavailable ? "AI Service Unavailable" : "Proofreading failed",
        {
          description: isServiceUnavailable
            ? "The AI service is starting up. Please wait a moment and try again."
            : errorMessage,
          duration: isServiceUnavailable ? 8000 : 5000,
        }
      );

      setProofreadingData({
        success: false,
        issues: [],
        suggestions: [
          {
            icon: isServiceUnavailable ? "info" : "alert",
            type: isServiceUnavailable ? "Notice" : "Error",
            description: isServiceUnavailable
              ? "The AI service is temporarily unavailable. It may be starting up. Please wait a moment and try again."
              : "Proofreading failed. Please try again.",
          },
        ],
        qualityScore: {
          grammar: 0,
          readability: 0,
          conversion: 0,
          brandAlignment: 0,
        },
      });
    }
  };

  const handleSaveHtml = async () => {
    try {
      setIsSavingHtml(true);

      const updateResult = await updateCreativeContent({
        creativeId: creative.id,
        content: htmlContent,
        filename: creative.name,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to update file");
      }

      if (updateResult.newUrl) {
        creative.url = updateResult.newUrl;
      }

      await saveHtml({
        creativeId: creative.id,
        html: htmlContent,
      });

      setPreviewKey((prev) => prev + 1);
      toast.success("HTML saved successfully!", {
        description: "File updated in storage.",
      });
    } catch (error) {
      console.error("Failed to save HTML:", error);
      toast.error("Failed to save HTML", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSavingHtml(false);
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

  useEffect(() => {
    if (!isImagePreviewFullscreen) {
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [isImagePreviewFullscreen]);

  const constrainPosition = useCallback(
    (
      x: number,
      y: number,
      zoom: number,
      containerWidth: number,
      containerHeight: number,
      imgWidth: number,
      imgHeight: number
    ) => {
      if (zoom <= 1) {
        return { x: 0, y: 0 };
      }

      const containerAspect = containerWidth / containerHeight;
      const imageAspect = imgWidth / imgHeight;

      let displayedWidth: number;
      let displayedHeight: number;

      if (imageAspect > containerAspect) {
        displayedWidth = containerWidth;
        displayedHeight = containerWidth / imageAspect;
      } else {
        displayedHeight = containerHeight;
        displayedWidth = containerHeight * imageAspect;
      }
      const scaledWidth = displayedWidth * zoom;
      const scaledHeight = displayedHeight * zoom;

      const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
      const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);

      const constrainedX = Math.max(-maxX, Math.min(maxX, x));
      const constrainedY = Math.max(-maxY, Math.min(maxY, y));

      return { x: constrainedX, y: constrainedY };
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    setImageZoom((prev) => {
      const newZoom = Math.min(prev + 0.25, 1.5);
      if (
        newZoom > 1 &&
        imageDimensions.width > 0 &&
        imageDimensions.height > 0
      ) {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight - 80;
        const constrained = constrainPosition(
          imagePosition.x,
          imagePosition.y,
          newZoom,
          containerWidth,
          containerHeight,
          imageDimensions.width,
          imageDimensions.height
        );
        setImagePosition(constrained);
      }
      return newZoom;
    });
  }, [imagePosition, imageDimensions, constrainPosition]);

  const handleZoomOut = useCallback(() => {
    setImageZoom((prev) => {
      const newZoom = Math.max(prev - 0.25, 1);
      if (newZoom === 1) {
        setImagePosition({ x: 0, y: 0 });
      } else if (imageDimensions.width > 0 && imageDimensions.height > 0) {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight - 80;
        const constrained = constrainPosition(
          imagePosition.x,
          imagePosition.y,
          newZoom,
          containerWidth,
          containerHeight,
          imageDimensions.width,
          imageDimensions.height
        );
        setImagePosition(constrained);
      }
      return newZoom;
    });
  }, [imagePosition, imageDimensions, constrainPosition]);

  const handleResetZoom = useCallback(() => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  const handleImageMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (imageZoom > 1) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStart({
          x: e.clientX - imagePosition.x,
          y: e.clientY - imagePosition.y,
        });
      }
    },
    [imageZoom, imagePosition]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (
        isDragging &&
        imageZoom > 1 &&
        imageDimensions.width > 0 &&
        imageDimensions.height > 0
      ) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight - 80;

        const constrained = constrainPosition(
          newX,
          newY,
          imageZoom,
          containerWidth,
          containerHeight,
          imageDimensions.width,
          imageDimensions.height
        );

        setImagePosition(constrained);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, imageZoom, dragStart, imageDimensions, constrainPosition]);

  const handleImageMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setImageDimensions({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    },
    []
  );

  const isProofreadComplete = !!proofreadingData && !isAnalyzing;
  const proofreadResult = proofreadingData
    ? {
        issues: proofreadingData.issues || [],
        suggestions: proofreadingData.suggestions || [],
        qualityScore: proofreadingData.qualityScore,
        marked_image: getMarkedImageUrl(),
        success: proofreadingData.success,
      }
    : null;

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
    complianceViolations,
    brandGuidelinesResponse,
    setBrandGuidelinesResponse,
    isCheckingBrandGuidelines,
    brandGuidelinesStatusMessage,
    handleAnalyzeBrandGuidelines,
    htmlContent,
    isSaving,
    isSavingHtml,
    previewKey,
    additionalNotes,
    isGeneratingContent,
    isAnalyzing,
    proofreadStatusMessage,
    imageZoom,
    imagePosition,
    isDragging,
    showOriginal,
    setShowOriginal,
    showOriginalFullscreen,
    setShowOriginalFullscreen,
    showOriginalHtmlFullscreen,
    setShowOriginalHtmlFullscreen,
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
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleImageMouseDown,
    handleImageMouseUp,
    handleImageLoad,
    toggleHtmlEditorFullscreen: () =>
      setIsHtmlEditorFullscreen(!isHtmlEditorFullscreen),
    toggleImagePreviewFullscreen: () =>
      setIsImagePreviewFullscreen(!isImagePreviewFullscreen),
    toggleHtmlPreviewFullscreen: () =>
      setIsHtmlPreviewFullscreen(!isHtmlPreviewFullscreen),
    togglePreviewCollapse: () => setIsPreviewCollapsed(!isPreviewCollapsed),
    getMarkedImageUrl,
    getMarkedImageUrlFromModel,
    getOriginalImageUrl,
    getMarkedHtmlContent,
    isProofreadComplete,
    proofreadResult,
    viewOnly,
  };
};
