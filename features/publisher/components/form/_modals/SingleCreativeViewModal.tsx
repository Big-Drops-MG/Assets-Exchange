"use client";

import {
  Edit3,
  Eye,
  FileText,
  Image as ImageIcon,
  File,
  Sparkles,
  Maximize2,
  Minimize2,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import React, { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
const formatFileSizeLocal = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};
import {
  useSingleCreativeViewModal,
  type Creative,
} from "@/features/publisher/view-models/singleCreativeViewModal.viewModel";

interface SingleCreativeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  creative: Creative;
  onFileNameChange?: (fileId: string, newFileName: string) => void;
  onMetadataChange?: (
    fileId: string,
    metadata: {
      fromLines?: string;
      subjectLines?: string;
      additionalNotes?: string;
    }
  ) => void;
  onFileUpdate?: (updates: {
    url?: string;
    metadata?: {
      fromLines?: string;
      subjectLines?: string;
      proofreadingData?: {
        issues?: Array<unknown>;
        suggestions?: Array<unknown>;
        qualityScore?: {
          grammar?: number;
          readability?: number;
          conversion?: number;
          brandAlignment?: number;
        };
        success?: boolean;
      };
      originalImageUrl?: string;
      ai_issues?: Array<unknown>;
      ai_score?: number;
      ai_status?: string;
      last_checked?: string;
    };
  }) => void;
  showAdditionalNotes?: boolean;
  creativeType?: string;
  siblingCreatives?: Creative[];
  viewOnly?: boolean;
  onSaveAndSubmit?: (metadata: {
    fromLines: string;
    subjectLines: string;
    additionalNotes: string;
  }) => Promise<void>;
}

const getFileType = (fileName: string): "image" | "html" | "other" => {
  const lowerName = fileName.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(lowerName)) {
    return "image";
  }
  if (/\.(html|htm)$/i.test(lowerName)) {
    return "html";
  }
  return "other";
};

const formatRuleType = (ruleType: string): string => {
  if (!ruleType.trim()) return "—";
  return ruleType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const SingleCreativeViewModal: React.FC<SingleCreativeViewModalProps> = ({
  isOpen,
  onClose,
  creative,
  onFileNameChange,
  onMetadataChange,
  onFileUpdate,
  showAdditionalNotes = false,
  creativeType = "email",
  siblingCreatives = [],
  viewOnly = false,
  onSaveAndSubmit,
}) => {
  const viewModel = useSingleCreativeViewModal({
    isOpen,
    creative,
    onClose,
    onFileNameChange,
    onMetadataChange,
    showAdditionalNotes,
    creativeType,
    siblingCreatives,
    viewOnly,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSaveAndSubmit = async () => {
    if (onSaveAndSubmit) {
      setIsSubmitting(true);
      try {
        await onSaveAndSubmit({
          fromLines: viewModel.fromLines,
          subjectLines: viewModel.subjectLines,
          additionalNotes: viewModel.additionalNotes,
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      viewModel.handleSaveAll();
    }
  };

  const { isProofreadComplete, proofreadResult, isAnalyzing } = viewModel;

  // ✅ FIX: Add sync guard to prevent infinite loop
  const hasSyncedRef = useRef(false);

  // Reset sync flag when a NEW analysis starts
  React.useEffect(() => {
    if (isAnalyzing) {
      hasSyncedRef.current = false;
    }
  }, [isAnalyzing]);

  React.useEffect(() => {
    if (
      isProofreadComplete &&
      proofreadResult &&
      !hasSyncedRef.current &&
      onFileUpdate &&
      viewModel.proofreadingData
    ) {
      onFileUpdate({
        url: creative?.url,
        metadata: {
          ...creative?.metadata,
          proofreadingData: viewModel.proofreadingData,
          originalImageUrl: creative?.url || creative?.previewUrl,
          ai_issues: proofreadResult.issues || [],
          ai_score:
            proofreadResult.qualityScore?.grammar ||
            (proofreadResult.issues?.length === 0 ? 100 : 80),
          ai_status:
            (proofreadResult.issues?.length || 0) === 0 ? "clean" : "flagged",
          last_checked: new Date().toISOString(),
        },
      });

      hasSyncedRef.current = true;
    }
  }, [
    isProofreadComplete,
    proofreadResult,
    onFileUpdate,
    creative?.url,
    creative?.previewUrl,
    creative?.metadata,
    viewModel.proofreadingData,
  ]);

  if (!isOpen) return null;

  const fileType = getFileType(creative.name);
  const isImage = fileType === "image";
  const isHtml = fileType === "html";

  const handleDialogClose = () => {
    if (onSaveAndSubmit) {
      onClose();
    } else {
      viewModel.handleSaveAll();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent
          className="max-w-screen! max-h-screen! w-screen h-screen m-0 p-0 rounded-none"
          showCloseButton={false}
        >
          <DialogDescription className="sr-only">
            Single creative view
          </DialogDescription>
          <div className="flex flex-col h-full w-full">
            {/* Header */}
            <DialogHeader className="shrink-0 border-b p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="shrink-0">
                    {isImage ? (
                      <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                    ) : isHtml ? (
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                    ) : (
                      <File className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    {!viewOnly && viewModel.isEditing ? (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center">
                          <Input
                            value={viewModel.editableNameOnly}
                            onChange={viewModel.handleFileNameChange}
                            onKeyDown={viewModel.handleKeyDown}
                            className="text-xs sm:text-sm font-medium h-8 sm:h-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white px-3 py-2 w-auto min-w-0"
                            autoFocus
                            placeholder="Filename"
                          />
                          <span className="text-xs sm:text-sm text-gray-700 font-medium px-2 py-2 h-8 sm:h-9 flex items-center whitespace-nowrap">
                            {creative.name.substring(
                              creative.name.lastIndexOf(".")
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={viewModel.handleFileNameSave}
                            className="h-9 w-9 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              viewModel.setIsEditing(false);
                              viewModel.setEditableFileName(creative.name);
                              const lastDotIndex =
                                creative.name.lastIndexOf(".");
                              viewModel.setEditableNameOnly(
                                lastDotIndex > 0
                                  ? creative.name.substring(0, lastDotIndex)
                                  : creative.name
                              );
                            }}
                            className="h-9 w-9 border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                          {viewModel.editableFileName}
                        </DialogTitle>
                        {!viewOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const lastDotIndex =
                                viewModel.editableFileName.lastIndexOf(".");
                              viewModel.setEditableNameOnly(
                                lastDotIndex > 0
                                  ? viewModel.editableFileName.substring(
                                      0,
                                      lastDotIndex
                                    )
                                  : viewModel.editableFileName
                              );
                              viewModel.setIsEditing(true);
                            }}
                            className="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg shrink-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded border border-purple-200">
                      {creative.type?.split("/")[1] || "File"}
                    </span>
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-xs font-medium rounded border border-green-200">
                      {formatFileSizeLocal(creative.size)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {viewOnly ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onClose}
                      className="h-9 px-3 sm:px-4 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveAndSubmit}
                      disabled={viewModel.isSaving || isSubmitting}
                      className="h-9 px-3 sm:px-4 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm disabled:opacity-50"
                    >
                      {viewModel.isSaving || isSubmitting
                        ? "Saving..."
                        : "Save and Continue"}
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Content */}
            <DialogBody className="max-h-screen! flex-1 flex flex-col lg:flex-row overflow-hidden p-0">
              {/* Preview Column */}
              <div
                className={`${
                  viewModel.isPreviewCollapsed ? "hidden lg:flex" : "flex"
                } lg:w-1/2 lg:border-r border-gray-200 p-4 sm:p-6 bg-gray-50 flex-col min-h-0`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 mb-5 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Preview
                    </h3>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={viewModel.togglePreviewCollapse}
                      className="lg:hidden flex items-center gap-2 h-9"
                    >
                      <ChevronUp className="h-4 w-4" />
                      <span>Collapse</span>
                    </Button>

                    {/* Toggle between Original and Marked view - only show after analysis */}
                    {isImage &&
                      (creative.previewUrl || creative.url) &&
                      viewModel.proofreadingData && (
                        <div className="inline-flex items-center gap-0 border border-gray-300 rounded-lg p-0.5 bg-white shadow-sm h-9">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              viewModel.setShowOriginal(true);
                            }}
                            className={`h-full px-4 text-xs font-medium transition-all rounded-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center ${
                              viewModel.showOriginal
                                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent"
                            }`}
                          >
                            Original
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              viewModel.setShowOriginal(false);
                            }}
                            className={`h-full px-4 text-xs font-medium transition-all rounded-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center ${
                              !viewModel.showOriginal
                                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent"
                            }`}
                          >
                            Marked
                          </button>
                        </div>
                      )}

                    {/* Toggle between Original and Marked view for HTML - only show after analysis */}
                    {isHtml && viewModel.proofreadingData && (
                      <div className="inline-flex items-center gap-0 border border-gray-300 rounded-lg p-0.5 bg-white shadow-sm h-9">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            viewModel.setShowOriginal(true);
                          }}
                          className={`h-full px-4 text-xs font-medium transition-all rounded-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center ${
                            viewModel.showOriginal
                              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent"
                          }`}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            viewModel.setShowOriginal(false);
                          }}
                          className={`h-full px-4 text-xs font-medium transition-all rounded-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center ${
                            !viewModel.showOriginal
                              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent"
                          }`}
                        >
                          Marked
                        </button>
                      </div>
                    )}

                    {isImage && (creative.previewUrl || creative.url) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={viewModel.toggleImagePreviewFullscreen}
                        className="flex items-center gap-2 h-9"
                      >
                        <Maximize2 className="h-4 w-4" />
                        <span>Fullscreen</span>
                      </Button>
                    )}
                    {isHtml && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={viewModel.toggleHtmlPreviewFullscreen}
                        className="flex items-center gap-2 h-9"
                      >
                        <Maximize2 className="h-4 w-4" />
                        <span>Fullscreen</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-auto min-h-[300px] lg:min-h-0">
                  {isImage && (creative.previewUrl || creative.url) ? (
                    viewModel.proofreadingData && !viewModel.showOriginal ? (
                      (() => {
                        const markedImageUrl =
                          viewModel.getMarkedImageUrlFromModel?.() ??
                          viewModel.getMarkedImageUrl();
                        return markedImageUrl ? (
                          <div className="w-full p-4 flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={markedImageUrl}
                              alt={`Marked ${creative.name}`}
                              className="max-w-[600px] w-full h-auto rounded-lg shadow-sm"
                            />
                          </div>
                        ) : (
                          // Fallback placeholder if marked image URL is not available
                          <div className="w-full h-full flex items-center justify-center p-8">
                            <div className="flex flex-col items-center gap-4 text-center max-w-md">
                              <div className="p-4 bg-amber-100 rounded-full">
                                <FileText className="h-12 w-12 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                                  Marked View
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Marked image is being processed. Please
                                  wait...
                                </p>
                                {viewModel.proofreadingData.issues &&
                                  viewModel.complianceViolations.length > 0 && (
                                    <div className="mt-4 flex items-center justify-center gap-2">
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                        <X className="h-3 w-3" />
                                        {
                                          viewModel.proofreadingData.issues
                                            .length
                                        }{" "}
                                        Issue
                                        {viewModel.proofreadingData.issues
                                          .length !== 1
                                          ? "s"
                                          : ""}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="w-full p-4 flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            viewModel.getOriginalImageUrl?.() ||
                            creative.previewUrl ||
                            creative.url
                          }
                          alt={creative.name}
                          className="max-w-[600px] w-full h-auto rounded-lg shadow-sm"
                        />
                      </div>
                    )
                  ) : isHtml ? (
                    viewModel.proofreadingData && !viewModel.showOriginal ? (
                      (() => {
                        const markedHtmlContent =
                          viewModel.getMarkedHtmlContent();
                        return markedHtmlContent ? (
                          <iframe
                            key={`marked-${viewModel.previewKey}`}
                            srcDoc={markedHtmlContent}
                            title="Marked HTML Preview"
                            className="w-full h-full border-0"
                            sandbox="allow-scripts allow-same-origin"
                          />
                        ) : (
                          // Fallback placeholder if marked HTML is not available
                          <div className="w-full h-full flex items-center justify-center p-8">
                            <div className="flex flex-col items-center gap-4 text-center max-w-md">
                              <div className="p-4 bg-amber-100 rounded-full">
                                <FileText className="h-12 w-12 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                                  Marked View
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Marked HTML is being processed. Please wait...
                                </p>
                                {viewModel.proofreadingData.issues &&
                                  viewModel.complianceViolations.length > 0 && (
                                    <div className="mt-4 flex items-center justify-center gap-2">
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                        <X className="h-3 w-3" />
                                        {
                                          viewModel.proofreadingData.issues
                                            .length
                                        }{" "}
                                        Issue
                                        {viewModel.proofreadingData.issues
                                          .length !== 1
                                          ? "s"
                                          : ""}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      // Original view - show the actual HTML
                      <iframe
                        key={viewModel.previewKey}
                        srcDoc={
                          viewModel.htmlContent ||
                          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#666;"><p>HTML content will appear here</p></div>'
                        }
                        title="HTML Preview"
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-center space-y-3 p-4">
                      <div>
                        <File className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-3">
                          File Preview Not Available
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => window.open(creative.url, "_blank")}
                          className="flex items-center gap-2 h-9"
                        >
                          <Eye className="h-4 w-4" />
                          Open File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Features Column */}
              <div
                className={`${
                  viewModel.isPreviewCollapsed ? "w-full" : "lg:w-1/2"
                } p-4 sm:p-6 overflow-y-auto bg-gray-50 border-t lg:border-t-0 border-gray-200`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Features
                      </h3>
                    </div>

                    {viewModel.isPreviewCollapsed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={viewModel.togglePreviewCollapse}
                        className="lg:hidden flex items-center gap-2 h-9"
                      >
                        <ChevronDown className="h-4 w-4" />
                        <span>Show Preview</span>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* HTML Editor */}
                    {isHtml && (
                      <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 mb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <FileText className="h-5 w-5 text-orange-600" />
                            </div>
                            <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
                              HTML Editor
                            </h3>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={viewModel.toggleHtmlEditorFullscreen}
                              className="flex items-center gap-2 h-9"
                            >
                              <Maximize2 className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                Fullscreen
                              </span>
                              <span className="sm:hidden">Full</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={viewModel.handleSaveHtml}
                              disabled={viewModel.isSaving}
                              className="flex items-center gap-2 h-9 disabled:opacity-50 bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800 hover:border-orange-400 font-medium shadow-sm transition-colors"
                            >
                              {viewModel.isSaving ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <FileText className="h-4 w-4" />
                                  <span>Save Changes</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                              HTML Code
                            </Label>
                            <Textarea
                              value={viewModel.htmlContent}
                              onChange={(e) =>
                                viewModel.setHtmlContent(e.target.value)
                              }
                              placeholder="Edit your HTML code here..."
                              rows={8}
                              className="w-full resize-none text-xs sm:text-sm font-mono border-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              Make changes to your HTML creative. The preview
                              will update automatically.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Email Content */}
                    {creativeType === "email" && (
                      <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 mb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <FileText className="h-5 w-5 text-green-600" />
                            </div>
                            <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
                              Email Content
                            </h3>
                          </div>

                          {!viewOnly && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={viewModel.handleGenerateContent}
                              disabled={viewModel.isGeneratingContent}
                              className="flex items-center gap-2 w-full sm:w-auto h-9 disabled:opacity-50 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800 hover:border-green-400 font-medium shadow-sm"
                            >
                              {viewModel.isGeneratingContent ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4" />
                                  <span className="hidden sm:inline">
                                    Generate From & Subject Lines
                                  </span>
                                  <span className="sm:hidden">
                                    Generate Content
                                  </span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                              From Lines
                            </Label>
                            {viewOnly ? (
                              <div className="w-full p-3 text-xs sm:text-sm bg-gray-50 rounded-md border border-gray-200 text-gray-700 whitespace-pre-wrap min-h-[76px]">
                                {viewModel.fromLines ||
                                  "No from lines provided"}
                              </div>
                            ) : (
                              <>
                                <Textarea
                                  value={viewModel.fromLines}
                                  onChange={(e) =>
                                    viewModel.setFromLines(e.target.value)
                                  }
                                  placeholder="Enter from lines (one per line)"
                                  rows={6}
                                  className="w-full resize-none text-xs sm:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                  Enter email from lines, one per line
                                </p>
                              </>
                            )}
                          </div>

                          <div>
                            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                              Subject Lines
                            </Label>
                            {viewOnly ? (
                              <div className="w-full p-3 text-xs sm:text-sm bg-gray-50 rounded-md border border-gray-200 text-gray-700 whitespace-pre-wrap min-h-[76px]">
                                {viewModel.subjectLines ||
                                  "No subject lines provided"}
                              </div>
                            ) : (
                              <>
                                <Textarea
                                  value={viewModel.subjectLines}
                                  onChange={(e) =>
                                    viewModel.setSubjectLines(e.target.value)
                                  }
                                  placeholder="Enter subject lines (one per line)"
                                  rows={6}
                                  className="w-full resize-none text-xs sm:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                  Enter email subject lines, one per line
                                </p>
                              </>
                            )}
                          </div>
                          {/* Compliance Violations - populated after Generate is clicked */}
                          {viewModel.complianceViolations &&
                            viewModel.complianceViolations.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                                  Compliance Violations
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                                    {viewModel.complianceViolations.length}
                                  </span>
                                </p>
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                  {(
                                    viewModel.complianceViolations as Array<{
                                      type?: string;
                                      rule_type?: string;
                                      note?: string;
                                      evidence_text?: string;
                                      original?: string;
                                      confidence?: number;
                                      source?: string;
                                    }>
                                  ).map((v, i) => (
                                    <div
                                      key={i}
                                      className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs"
                                    >
                                      <span className="shrink-0 px-1.5 py-0.5 bg-red-200 text-red-800 rounded font-semibold text-[10px] uppercase whitespace-nowrap">
                                        {v.rule_type ?? v.type ?? "Violation"}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-red-800 font-medium leading-snug">
                                          {v.evidence_text ??
                                            v.note ??
                                            v.original ??
                                            "Issue detected"}
                                        </p>
                                        {(v.confidence !== undefined ||
                                          v.source) && (
                                          <p className="text-red-400 mt-0.5">
                                            {v.source && (
                                              <span className="capitalize">
                                                {v.source}
                                              </span>
                                            )}
                                            {v.confidence !== undefined &&
                                              v.source &&
                                              "  "}
                                            {v.confidence !== undefined && (
                                              <span>
                                                {Math.round(v.confidence * 100)}
                                                % confidence
                                              </span>
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Brand Guidelines Compatibility */}
                    <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 mb-4 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <ShieldCheck className="h-5 w-5 text-indigo-600" />
                          </div>
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
                            Brand Guidelines Compatibility
                          </h3>
                        </div>

                        {!viewOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={viewModel.handleAnalyzeBrandGuidelines}
                            disabled={viewModel.isCheckingBrandGuidelines}
                            className="flex items-center gap-2 w-full sm:w-auto h-9 disabled:opacity-50 bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 hover:border-indigo-400 font-medium shadow-sm"
                          >
                            {viewModel.isCheckingBrandGuidelines ? (
                              <>
                                <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin" />
                                <span>Analyzing...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                  Analyze Brand Guidelines
                                </span>
                                <span className="sm:hidden">Analyze</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {viewModel.brandGuidelinesResponse == null ? (
                          <p className="text-sm text-gray-500">
                            Run a check to verify this creative against brand
                            guidelines. Results will appear here.
                          </p>
                        ) : typeof viewModel.brandGuidelinesResponse
                            ?.message === "string" ? (
                          <div className="flex flex-col gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                              <span className="text-sm font-semibold text-green-800">
                                All good
                              </span>
                            </div>
                            <p className="text-sm text-green-700 pl-8">
                              {viewModel.brandGuidelinesResponse?.message ?? ""}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <span className="w-2 h-2 bg-amber-500 rounded-full" />
                              Guidelines issues
                              {Array.isArray(
                                viewModel.brandGuidelinesResponse?.message
                              ) &&
                                ` (${viewModel.brandGuidelinesResponse?.message.length ?? 0})`}
                            </h4>
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {Array.isArray(
                                viewModel.brandGuidelinesResponse?.message
                              ) &&
                                viewModel.brandGuidelinesResponse?.message.map(
                                  (item, i) => (
                                    <div
                                      key={i}
                                      className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs"
                                    >
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded font-semibold text-[10px] uppercase whitespace-nowrap">
                                          Rule type
                                        </span>
                                        <span className="font-medium text-gray-800">
                                          {formatRuleType(item.rule_type ?? "")}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block mb-0.5">
                                          Evidence text
                                        </span>
                                        <p className="text-gray-800 leading-snug">
                                          {item.evidence_text ?? "—"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">
                                          Confidence
                                        </span>
                                        <span className="font-medium text-amber-800">
                                          {item.confidence != null
                                            ? `${(item.confidence * 100).toFixed(2)}%`
                                            : "—"}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Proofreading */}
                    <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 mb-4 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <FileText className="h-5 w-5 text-amber-600" />
                          </div>
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
                            Proofreading & Optimization
                          </h3>
                        </div>

                        {!viewOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={viewModel.handleRegenerateAnalysis}
                            disabled={viewModel.isAnalyzing}
                            className="flex items-center gap-2 w-full sm:w-auto h-9 disabled:opacity-50 bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-400 font-medium shadow-sm"
                          >
                            {viewModel.isAnalyzing ? (
                              <>
                                <div className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                                <span>Analyzing...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                  Analyze Creative
                                </span>
                                <span className="sm:hidden">Analyze</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {viewModel.isAnalyzing && (
                          <div className="flex flex-col items-center gap-3 py-4">
                            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium text-gray-700 text-center">
                              {viewModel.proofreadStatusMessage ||
                                "Analyzing..."}
                            </p>
                            <p className="text-xs text-gray-500 text-center">
                              This may take a minute. Please do not close this
                              window.
                            </p>
                          </div>
                        )}

                        {!viewModel.isAnalyzing && (
                          <div className="space-y-6">
                            {viewModel.proofreadingData ? (
                              <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="flex h-6 w-1 rounded-full bg-red-500"
                                    aria-hidden
                                  />
                                  <h4 className="text-sm font-semibold text-gray-800 tracking-tight">
                                    Issues to fix
                                  </h4>
                                  {(viewModel.proofreadingData.issues?.length ??
                                    0) > 0 && (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                      {
                                        viewModel.proofreadingData.issues
                                          ?.length
                                      }
                                    </span>
                                  )}
                                </div>
                                {viewModel.proofreadingData.issues &&
                                viewModel.proofreadingData.issues.length > 0 ? (
                                  <ul className="space-y-2" role="list">
                                    {viewModel.proofreadingData.issues.map(
                                      (issue: unknown, index: number) => {
                                        const issueData = issue as {
                                          type?: string;
                                          note?: string;
                                          original?: string;
                                          correction?: string;
                                        };
                                        return (
                                          <li
                                            key={index}
                                            className="flex rounded-lg border border-gray-200 bg-gray-50/80 pl-3 pr-4 py-3 border-l-4 border-l-red-500"
                                          >
                                            <div className="flex-1 min-w-0">
                                              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-red-600 mb-1">
                                                {issueData.type || "Issue"}
                                              </span>
                                              <p className="text-sm text-gray-800 leading-snug">
                                                {issueData.note ??
                                                  issueData.type ??
                                                  "Issue"}
                                              </p>
                                              {(issueData.original ??
                                                issueData.correction) && (
                                                <p className="mt-2 text-sm">
                                                  {issueData.original && (
                                                    <span className="text-gray-500 line-through mr-2">
                                                      {issueData.original}
                                                    </span>
                                                  )}
                                                  {issueData.correction && (
                                                    <span className="text-emerald-600 font-medium">
                                                      {issueData.correction}
                                                    </span>
                                                  )}
                                                </p>
                                              )}
                                            </div>
                                          </li>
                                        );
                                      }
                                    )}
                                  </ul>
                                ) : (
                                  <div className="rounded-lg border border-gray-200 bg-emerald-50/80 pl-3 pr-4 py-3 border-l-4 border-l-emerald-500">
                                    <p className="text-sm font-medium text-emerald-800">
                                      No issues found. Your creative looks good.
                                    </p>
                                  </div>
                                )}
                              </section>
                            ) : (
                              <p className="text-sm text-gray-500">
                                {viewOnly
                                  ? "No proofreading analysis available."
                                  : 'Click the "Analyze Creative" button to start proofreading.'}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Suggestions */}
                        {viewModel.proofreadingData &&
                          !viewModel.isAnalyzing && (
                            <section className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="flex h-6 w-1 rounded-full bg-blue-500"
                                  aria-hidden
                                />
                                <h4 className="text-sm font-semibold text-gray-800 tracking-tight">
                                  Suggestions
                                </h4>
                                {viewModel.proofreadingData.suggestions &&
                                  viewModel.proofreadingData.suggestions
                                    .length > 0 && (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                      {
                                        viewModel.proofreadingData.suggestions
                                          .length
                                      }
                                    </span>
                                  )}
                              </div>
                              {viewModel.proofreadingData.suggestions &&
                              viewModel.proofreadingData.suggestions.length >
                                0 ? (
                                <ul className="space-y-2" role="list">
                                  {viewModel.proofreadingData.suggestions.map(
                                    (suggestion: unknown, index: number) => {
                                      const suggestionData = suggestion as {
                                        type?: string;
                                        description?: string;
                                      };
                                      return (
                                        <li
                                          key={index}
                                          className="rounded-lg border border-gray-200 bg-gray-50/80 pl-3 pr-4 py-3 border-l-4 border-l-blue-500"
                                        >
                                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1.5">
                                            {suggestionData.type ??
                                              "Suggestion"}
                                          </span>
                                          <p className="text-sm text-gray-800 leading-snug">
                                            {suggestionData.description ?? ""}
                                          </p>
                                        </li>
                                      );
                                    }
                                  )}
                                </ul>
                              ) : (
                                <div className="rounded-lg border border-gray-200 bg-gray-50/80 pl-3 pr-4 py-3 border-l-4 border-l-blue-500">
                                  <p className="text-sm font-medium text-gray-700">
                                    No suggestions. Your creative is in good
                                    shape.
                                  </p>
                                </div>
                              )}
                            </section>
                          )}

                        {/* Quality Score */}
                        {viewModel.proofreadingData &&
                          !viewModel.isAnalyzing && (
                            <section className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="flex h-6 w-1 rounded-full bg-violet-500"
                                  aria-hidden
                                />
                                <h4 className="text-sm font-semibold text-gray-800 tracking-tight">
                                  Quality score
                                </h4>
                              </div>
                              <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                  {[
                                    {
                                      label: "Grammar",
                                      value:
                                        viewModel.proofreadingData.qualityScore
                                          ?.grammar ?? 0,
                                    },
                                    {
                                      label: "Readability",
                                      value:
                                        viewModel.proofreadingData.qualityScore
                                          ?.readability ?? 0,
                                    },
                                    {
                                      label: "Conversion",
                                      value:
                                        viewModel.proofreadingData.qualityScore
                                          ?.conversion ?? 0,
                                    },
                                    {
                                      label: "Brand alignment",
                                      value:
                                        viewModel.proofreadingData.qualityScore
                                          ?.brandAlignment ?? 0,
                                    },
                                  ].map((item) => (
                                    <div
                                      key={item.label}
                                      className="flex flex-col gap-1"
                                    >
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {item.label}
                                      </p>
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="text-xl font-semibold tabular-nums text-gray-900">
                                          {item.value}
                                        </span>
                                        <span className="text-sm text-gray-400">
                                          / 100
                                        </span>
                                      </div>
                                      <div
                                        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
                                        role="presentation"
                                      >
                                        <div
                                          className="h-full rounded-full bg-violet-500 transition-all"
                                          style={{
                                            width: `${Math.min(100, item.value)}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          )}
                      </div>
                    </div>

                    {/* Additional Notes */}
                    {showAdditionalNotes && (
                      <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 mb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <FileText className="h-5 w-5 text-indigo-600" />
                            </div>
                            <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
                              Additional Notes
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                              Notes & Comments
                            </Label>
                            {viewOnly ? (
                              <div className="w-full p-3 text-xs sm:text-sm bg-gray-50 rounded-md border border-gray-200 text-gray-700 whitespace-pre-wrap min-h-[100px]">
                                {viewModel.additionalNotes ||
                                  "No additional notes provided"}
                              </div>
                            ) : (
                              <>
                                <Textarea
                                  value={viewModel.additionalNotes}
                                  onChange={(e) =>
                                    viewModel.setAdditionalNotes(e.target.value)
                                  }
                                  placeholder="Add any additional notes, comments, or instructions for this creative..."
                                  rows={4}
                                  className="w-full resize-none text-xs sm:text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                  Use this space to add any specific notes,
                                  instructions, or comments about this creative.
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogBody>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Preview Modal */}
      {isImage && (creative.previewUrl || creative.url) && (
        <Dialog
          open={viewModel.isImagePreviewFullscreen}
          onOpenChange={(open) => {
            if (!open) {
              viewModel.setIsImagePreviewFullscreen(false);
            }
          }}
        >
          <DialogContent className="max-w-screen! max-h-screen! w-screen h-screen m-0 p-0 rounded-none bg-black/50 backdrop-blur-md">
            <DialogTitle className="sr-only">
              Fullscreen Image Preview - {creative.name}
            </DialogTitle>
            <div className="flex flex-col h-full w-full relative">
              <DialogHeader className="shrink-0 border-b border-gray-700 p-4 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={viewModel.handleZoomOut}
                      disabled={viewModel.imageZoom <= 1}
                      className="h-9 text-white hover:bg-white/20 disabled:opacity-50"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={viewModel.handleZoomIn}
                      disabled={viewModel.imageZoom >= 1.5}
                      className="h-9 text-white hover:bg-white/20 disabled:opacity-50"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={viewModel.handleResetZoom}
                      disabled={viewModel.imageZoom === 1}
                      className="h-9 text-white hover:bg-white/20 disabled:opacity-50"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                    {/* Toggle between Original and Marked view for image in fullscreen */}
                    {viewModel.proofreadingData && (
                      <div className="inline-flex items-center gap-0 border border-gray-300 rounded-lg p-0.5 bg-white shadow-sm h-9 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            viewModel.setShowOriginalFullscreen(true);
                          }}
                          className={`h-full px-4 text-xs font-medium transition-all rounded-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center ${
                            viewModel.showOriginalFullscreen
                              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent"
                          }`}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            viewModel.setShowOriginalFullscreen(false);
                          }}
                          className={`h-full px-4 text-xs font-medium transition-all rounded-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center ${
                            !viewModel.showOriginalFullscreen
                              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent"
                          }`}
                        >
                          Marked
                        </button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewModel.setIsImagePreviewFullscreen(false)}
                    className="h-9 text-white hover:bg-white/20"
                    title="Close"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </Button>
                </div>
              </DialogHeader>
              <DialogBody className="flex-1 flex items-center justify-center overflow-hidden p-0 m-0 max-w-full! max-h-full!">
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden relative select-none"
                  style={{
                    cursor:
                      viewModel.imageZoom > 1
                        ? viewModel.isDragging
                          ? "grabbing"
                          : "grab"
                        : "default",
                    userSelect: "none",
                  }}
                  onMouseDown={viewModel.handleImageMouseDown}
                  onMouseUp={viewModel.handleImageMouseUp}
                  onMouseLeave={viewModel.handleImageMouseUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      viewModel.proofreadingData &&
                      !viewModel.showOriginalFullscreen
                        ? (viewModel.getMarkedImageUrlFromModel?.() ??
                            viewModel.getMarkedImageUrl()) ||
                          creative.previewUrl ||
                          creative.url
                        : viewModel.getOriginalImageUrl?.() ||
                          creative.previewUrl ||
                          creative.url
                    }
                    alt={
                      viewModel.proofreadingData &&
                      !viewModel.showOriginalFullscreen
                        ? `Marked ${creative.name}`
                        : creative.name
                    }
                    className="max-w-full max-h-full object-contain select-none pointer-events-none"
                    style={{
                      transform: `scale(${viewModel.imageZoom}) translate(${viewModel.imagePosition.x}px, ${viewModel.imagePosition.y}px)`,
                      transformOrigin: "center center",
                      transition: viewModel.isDragging
                        ? "none"
                        : "transform 0.2s ease-out",
                    }}
                    onLoad={viewModel.handleImageLoad}
                    draggable={false}
                  />
                </div>
              </DialogBody>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fullscreen HTML Preview Modal */}
      {isHtml && (
        <Dialog
          open={viewModel.isHtmlPreviewFullscreen}
          onOpenChange={(open) => {
            if (!open) {
              viewModel.setIsHtmlPreviewFullscreen(false);
            }
          }}
        >
          <DialogContent className="max-w-screen! max-h-screen w-screen h-screen m-0 p-0 rounded-none bg-black/50 backdrop-blur-md">
            <DialogTitle className="sr-only">
              Fullscreen HTML Preview - {creative.name}
            </DialogTitle>
            <div className="flex flex-col h-full w-full relative">
              <DialogHeader className="shrink-0 border-b border-gray-700 p-4 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Toggle between Original and Marked view for HTML in fullscreen */}
                    {viewModel.proofreadingData && (
                      <div className="inline-flex items-center gap-0 border border-gray-300 rounded-lg p-0.5 bg-white shadow-sm h-9">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            viewModel.setShowOriginalHtmlFullscreen(true);
                          }}
                          className={`h-full px-4 text-xs font-medium transition-all rounded-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center ${
                            viewModel.showOriginalHtmlFullscreen
                              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent"
                          }`}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            viewModel.setShowOriginalHtmlFullscreen(false);
                          }}
                          className={`h-full px-4 text-xs font-medium transition-all rounded-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center ${
                            !viewModel.showOriginalHtmlFullscreen
                              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent"
                          }`}
                        >
                          Marked
                        </button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewModel.setIsHtmlPreviewFullscreen(false)}
                    className="h-9 text-white hover:bg-white/20"
                    title="Close"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </Button>
                </div>
              </DialogHeader>
              <DialogBody className="flex-1 overflow-hidden p-0 max-w-full! max-h-full!">
                {viewModel.proofreadingData &&
                !viewModel.showOriginalHtmlFullscreen ? (
                  // Marked view - show the marked HTML from API
                  (() => {
                    const markedHtmlContent = viewModel.getMarkedHtmlContent();
                    return markedHtmlContent ? (
                      <iframe
                        key={`fullscreen-marked-${viewModel.previewKey}`}
                        srcDoc={markedHtmlContent}
                        title="Marked HTML Preview Fullscreen"
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    ) : (
                      // Fallback placeholder if marked HTML is not available
                      <div className="w-full h-full flex items-center justify-center p-8 bg-white">
                        <div className="flex flex-col items-center gap-4 text-center max-w-md">
                          <div className="p-4 bg-amber-100 rounded-full">
                            <FileText className="h-12 w-12 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">
                              Marked View
                            </h4>
                            <p className="text-sm text-gray-600">
                              Marked HTML is being processed. Please wait...
                            </p>
                            {viewModel.proofreadingData.issues &&
                              viewModel.complianceViolations.length > 0 && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                    <X className="h-3 w-3" />
                                    {viewModel.complianceViolations.length}{" "}
                                    Issue
                                    {viewModel.proofreadingData.issues
                                      .length !== 1
                                      ? "s"
                                      : ""}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  // Original view - show the actual HTML
                  <iframe
                    key={`fullscreen-${viewModel.previewKey}`}
                    srcDoc={
                      viewModel.htmlContent ||
                      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#666;"><p>HTML content will appear here</p></div>'
                    }
                    title="HTML Preview Fullscreen"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </DialogBody>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fullscreen HTML Editor Modal */}
      {isHtml && (
        <Dialog
          open={viewModel.isHtmlEditorFullscreen}
          onOpenChange={(open) => {
            if (!open) {
              viewModel.setIsHtmlEditorFullscreen(false);
            }
          }}
        >
          <DialogContent className="max-w-screen! max-h-screen w-screen h-screen m-0 p-0 rounded-none">
            <DialogTitle className="sr-only">
              Fullscreen HTML Editor - {creative.name}
            </DialogTitle>
            <div className="flex flex-col h-full w-full">
              <DialogHeader className="shrink-0 border-b border-gray-200 p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        HTML Editor - {creative.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Edit your HTML code and see live preview
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={viewModel.handleSaveHtml}
                      disabled={viewModel.isSaving}
                      className="flex items-center gap-2 h-9 disabled:opacity-50 bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800 hover:border-orange-400 font-medium shadow-sm transition-colors"
                    >
                      {viewModel.isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewModel.setIsHtmlEditorFullscreen(false)}
                      className="h-9 w-9 p-0 hover:bg-red-400 hover:text-white transition-colors"
                      title="Close"
                    >
                      <Minimize2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <DialogBody className="flex-1 overflow-hidden p-0 max-w-full! max-h-full!">
                <div className="flex h-full w-full">
                  {/* Editor Column - Left */}
                  <div className="w-1/2 border-r border-gray-200 flex flex-col bg-gray-50">
                    <div className="shrink-0 p-3 border-b border-gray-200 bg-white">
                      <Label className="text-sm font-semibold text-gray-700">
                        HTML Code Editor
                      </Label>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      <Textarea
                        value={viewModel.htmlContent}
                        onChange={(e) => {
                          viewModel.setHtmlContent(e.target.value);
                        }}
                        placeholder="Edit your HTML code here..."
                        className="w-full h-full resize-none text-sm font-mono border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 min-h-full"
                        style={{ minHeight: "100%" }}
                      />
                    </div>
                  </div>

                  {/* Preview Column - Right */}
                  <div className="w-1/2 flex flex-col bg-white">
                    <div className="shrink-0 p-3 border-b border-gray-200 bg-white">
                      <Label className="text-sm font-semibold text-gray-700">
                        Live Preview
                      </Label>
                    </div>
                    <div className="flex-1 overflow-auto p-4 bg-gray-50">
                      <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                        <iframe
                          key={`editor-fullscreen-${viewModel.previewKey}`}
                          srcDoc={
                            viewModel.htmlContent ||
                            '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#666;"><p>HTML content will appear here</p></div>'
                          }
                          title="HTML Editor Live Preview"
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin"
                          style={{ minHeight: "100%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </DialogBody>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SingleCreativeViewModal;
