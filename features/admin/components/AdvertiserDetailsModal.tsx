"use client";

import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Check,
  X as XIcon,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { getVariables } from "@/components/_variables";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getAdvertiser,
  updateAdvertiser,
  deleteAdvertiser,
} from "../services/advertisers.client";
import type { Advertiser } from "../types/advertiser.types";

interface AdvertiserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertiserId: string | null;
  onSuccess?: () => void;
}

interface EditAdvertiserFormData {
  advertiserId: string;
  advertiserName: string;
  status: "Active" | "Inactive";
  email: string;
  password: string;
}

function generatePassword(): string {
  const length = 8;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export function AdvertiserDetailsModal({
  open,
  onOpenChange,
  advertiserId,
  onSuccess,
}: AdvertiserDetailsModalProps) {
  const variables = getVariables();
  const inputRingColor = variables.colors.inputRingColor;

  const isApiSource = (createdMethod: string) => {
    return createdMethod?.toLowerCase() === "api";
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [isEditingAdvertiserName, setIsEditingAdvertiserName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<EditAdvertiserFormData>({
    advertiserId: "",
    advertiserName: "",
    status: "Active",
    email: "",
    password: "",
  });

  const [initialFormData, setInitialFormData] =
    useState<EditAdvertiserFormData | null>(null);

  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof EditAdvertiserFormData, string>>
  >({});
  const [internalOpen, setInternalOpen] = useState(open);
  const [showApiCredentialInputs, setShowApiCredentialInputs] = useState(false);

  const needsApiCredentialGate = useMemo(
    () =>
      Boolean(
        advertiser &&
        isApiSource(advertiser.createdMethod) &&
        !advertiser.contactEmail?.trim()
      ),
    [advertiser]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!initialFormData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  // Sync internal state with prop when dialog is opened from outside
  useEffect(() => {
    if (open && !internalOpen) {
      setInternalOpen(true);
    }
  }, [open, internalOpen]);

  /**
   * TODO: BACKEND - Fetch Advertiser Details
   *
   * Currently uses getAdvertiserById service which should call:
   * GET /api/admin/advertisers/:id
   *
   * Backend should return:
   * {
   *   id: string,
   *   advertiserName: string,
   *   advPlatform: string,
   *   createdMethod: "Manually" | "API",
   *   status: "Active" | "Inactive",
   *   createdAt: string,              // ISO timestamp
   *   updatedAt: string,               // ISO timestamp
   *   createdBy?: string,              // User ID who created
   *   updatedBy?: string              // User ID who last updated
   * }
   *
   * Error Handling:
   * - 404: Advertiser not found - show error message
   * - 401: Unauthorized - redirect to login
   * - 403: Forbidden - show permission denied
   * - 500: Server error - show error with retry option
   */
  useEffect(() => {
    if (open && advertiserId) {
      const fetchAdvertiser = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const fetchedAdvertiser = await getAdvertiser(advertiserId);
          if (fetchedAdvertiser) {
            setAdvertiser(fetchedAdvertiser);
            const status =
              fetchedAdvertiser.status === "active" ||
              fetchedAdvertiser.status === "inactive"
                ? ((fetchedAdvertiser.status.charAt(0).toUpperCase() +
                    fetchedAdvertiser.status.slice(1)) as "Active" | "Inactive")
                : (fetchedAdvertiser.status as "Active" | "Inactive") ||
                  "Active";
            const initialData = {
              advertiserId: fetchedAdvertiser.id,
              advertiserName: fetchedAdvertiser.advertiserName,
              status,
              email: fetchedAdvertiser.contactEmail || "",
              password: "",
            };
            setFormData(initialData);
            setInitialFormData(initialData);
            setIsEditingAdvertiserName(false);
            setIsEditingEmail(false);
            setIsEditingPassword(false);
            setShowPassword(false);
            const apiMissingEmail =
              isApiSource(fetchedAdvertiser.createdMethod) &&
              !fetchedAdvertiser.contactEmail?.trim();
            setShowApiCredentialInputs(!apiMissingEmail);
          } else {
            setError("Advertiser not found");
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load advertiser details"
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchAdvertiser();
    }
  }, [open, advertiserId]);

  /**
   * TODO: BACKEND - Form Validation
   *
   * Current validation is client-side only. Backend should also validate:
   *
   * 1. Advertiser ID (if manually created):
   *    - Required if createdMethod is "Manually"
   *    - Format validation: M#### (M followed by exactly 4 digits)
   *    - Uniqueness check if ID is being changed
   *
   * 2. Advertiser Name (if manually created):
   *    - Required if createdMethod is "Manually"
   *    - Max length validation
   *    - Character restrictions
   *
   * 3. Platform:
   *    - Required, must be "Everflow"
   *    - Validate against allowed platform values
   *
   * 4. Status (if manually created):
   *    - Must be "Active" or "Inactive"
   *    - Only editable if createdMethod is "Manually"
   *
   * Return field-specific errors for better UX:
   * {
   *   field: string,
   *   message: string
   * }[]
   */
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof EditAdvertiserFormData, string>> = {};

    if (advertiser && !isApiSource(advertiser.createdMethod)) {
      if (!formData.advertiserId.trim()) {
        errors.advertiserId = "Advertiser ID is required";
      }
      if (!formData.advertiserName.trim()) {
        errors.advertiserName = "Advertiser name is required";
      }
    }

    if (needsApiCredentialGate && showApiCredentialInputs) {
      if (!formData.email.trim()) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
      if (!formData.password.trim()) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }
    } else {
      if (
        formData.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        errors.email = "Please enter a valid email address";
      }
      if (
        isEditingPassword &&
        formData.password.trim() &&
        formData.password.length < 8
      ) {
        errors.password = "Password must be at least 8 characters";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * TODO: BACKEND - Implement Advertiser Update
   *
   * This function handles updating advertiser details.
   *
   * Endpoint: PUT /api/admin/advertisers/:id
   *
   * Request Body:
   * {
   *   advertiserId?: string,                // Only if advertiser was created manually
   *   advertiserName?: string,                // Only if advertiser was created manually
   *   status?: "Active" | "Inactive",         // Only if advertiser was created manually
   *   advPlatform?: string
   * }
   *
   * Business Rules:
   * - Advertiser ID and Advertiser Name can only be updated if createdMethod is "Manually"
   * - Status can only be updated if createdMethod is "Manually"
   * - API-created advertisers: Only advPlatform can be updated
   * - Manually-created advertisers: All fields can be updated
   *
   * Response:
   * {
   *   id: string,
   *   advertiserName: string,
   *   advPlatform: string,
   *   createdMethod: "Manually" | "API",
   *   status: "Active" | "Inactive",
   *   updatedAt: string                     // ISO timestamp
   * }
   *
   * Error Handling:
   * - 400: Validation errors
   *   - Invalid advertiserId format (if provided)
   *   - Invalid status value (if provided)
   *   - Return field-specific errors
   *
   * - 401: Unauthorized - redirect to login
   * - 403: Forbidden - show permission denied
   * - 404: Advertiser not found
   * - 409: Conflict - advertiserId already exists (if changing advertiserId)
   * - 500: Server error - show error with retry option
   *
   * Success:
   * - Return updated advertiser object
   * - Show success notification
   * - Refresh advertisers list
   * - Close modal
   *
   * Audit Trail:
   * - Log all update actions
   * - Track which fields were changed
   * - Store previous values for rollback if needed
   * - Track who updated and when
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (needsApiCredentialGate && !showApiCredentialInputs) {
      return;
    }

    if (!validateForm() || !advertiser) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // TODO: BACKEND - Include all form fields in update payload
      // TODO: Validate business rules (e.g., can't edit ID/Name/Status if API-created)
      // TODO: Handle optimistic updates and rollback on error

      const updatePayload: Partial<{
        name: string;
        contactEmail: string;
        status: "active" | "inactive";
        password: string;
      }> = {};

      if (!isApiSource(advertiser.createdMethod)) {
        updatePayload.name = formData.advertiserName;
        const statusLower = formData.status.toLowerCase() as
          | "active"
          | "inactive";
        updatePayload.status = statusLower;
      }

      // Email/password can be set for ALL advertisers
      if (formData.email) {
        updatePayload.contactEmail = formData.email;
      }
      if (formData.password?.trim()) {
        updatePayload.password = formData.password;
      }

      const updatedAdvertiser = await updateAdvertiser(
        advertiser.id,
        updatePayload
      );

      if (updatedAdvertiser) {
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update advertiser"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!advertiser) return;
    await confirmDialog({
      title: "Delete Advertiser",
      description: `Are you sure you want to delete "${advertiser.advertiserName}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setIsDeleting(true);
          await deleteAdvertiser(advertiser.id);
          toast.success("Advertiser deleted", {
            description: `${advertiser.advertiserName} has been removed.`,
          });
          setInternalOpen(false);
          onOpenChange(false);
          onSuccess?.();
        } catch (err) {
          toast.error("Failed to delete advertiser", {
            description:
              err instanceof Error ? err.message : "Please try again.",
          });
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const handleOpenChange = useCallback(
    async (newOpen: boolean) => {
      if (isSubmitting || isDeleting) {
        return;
      }

      // If trying to close and there are unsaved changes, show confirm dialog
      if (!newOpen && hasUnsavedChanges) {
        const confirmed = await confirmDialog({
          title: "Unsaved Changes",
          description:
            "You have unsaved changes. Are you sure you want to close?",
          confirmText: "Close",
          cancelText: "No, keep editing",
          variant: "default",
          onConfirm: () => {
            setInitialFormData(null);
          },
          onCancel: () => {
            // Keep the dialog open - reset internal state to true
            setInternalOpen(true);
          },
        });
        // If user cancelled, dialog stays open (already handled in onCancel)
        if (!confirmed) {
          return;
        }
        // If confirmed, close the dialog immediately
        setInitialFormData(null);
        setInternalOpen(false);
        onOpenChange(false);
        return;
      }

      // If no unsaved changes, allow normal close
      setInternalOpen(newOpen);
      onOpenChange(newOpen);
    },
    [isSubmitting, isDeleting, hasUnsavedChanges, onOpenChange]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting && !isDeleting) {
      onOpenChange(false);
    }
  }, [isSubmitting, isDeleting, onOpenChange]);

  const updateFormField = <K extends keyof EditAdvertiserFormData>(
    field: K,
    value: EditAdvertiserFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleGeneratePassword = () => {
    updateFormField("password", generatePassword());
  };

  return (
    <Dialog open={internalOpen} onOpenChange={handleOpenChange}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .edit-advertiser-modal-input:focus-visible {
            outline: none !important;
            border-color: ${inputRingColor} !important;
            box-shadow: 0 0 0 3px ${inputRingColor}50 !important;
          }
          .edit-advertiser-modal-input:-webkit-autofill,
          .edit-advertiser-modal-input:-webkit-autofill:hover,
          .edit-advertiser-modal-input:-webkit-autofill:focus,
          .edit-advertiser-modal-input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px ${variables.colors.inputBackgroundColor} inset !important;
            -webkit-text-fill-color: ${variables.colors.inputTextColor} !important;
            box-shadow: 0 0 0 30px ${variables.colors.inputBackgroundColor} inset !important;
            background-color: ${variables.colors.inputBackgroundColor} !important;
            color: ${variables.colors.inputTextColor} !important;
          }
          .edit-advertiser-modal-input::selection {
            background-color: ${inputRingColor}40 !important;
            color: ${variables.colors.inputTextColor} !important;
          }
          .edit-advertiser-modal-input::-moz-selection {
            background-color: ${inputRingColor}40 !important;
            color: ${variables.colors.inputTextColor} !important;
          }
        `,
        }}
      />
      <DialogContent
        className="max-w-4xl! w-full max-h-[90vh] m-0 rounded-lg p-0 overflow-hidden shadow-xl"
        showCloseButton={false}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-w-0">
          <DialogHeader
            className="px-6 py-5 border-b"
            style={{
              backgroundColor: variables.colors.cardHeaderBackgroundColor,
            }}
          >
            <DialogTitle
              className="text-lg font-semibold font-inter"
              style={{ color: variables.colors.cardHeaderTextColor }}
            >
              Advertiser Details
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="min-w-0 flex-1 overflow-y-auto px-6 py-6">
            {isLoading ? (
              <div className="space-y-8 w-full">
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
                <div className="border-t pt-6">
                  <div className="space-y-6">
                    <Skeleton className="h-5 w-32" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-12 w-full rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ) : error && !advertiser ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-destructive">{error}</div>
              </div>
            ) : advertiser ? (
              <div className="space-y-8 w-full">
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-inter text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Advertiser ID
                      </Label>
                      <div className="min-h-10 flex items-center">
                        <div className="font-inter text-sm flex items-center gap-2 w-full min-h-10 px-3 py-2 rounded-md bg-muted/30">
                          <span className="flex-1 font-medium">
                            {advertiser.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-inter text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Status
                      </Label>
                      {!isApiSource(advertiser.createdMethod) ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateFormField("status", "Active")}
                            disabled={isSubmitting}
                            className="flex-1 h-10 rounded-lg border font-inter text-sm font-medium transition-all"
                            style={
                              formData.status === "Active"
                                ? {
                                    backgroundColor: "#D1FAE5",
                                    borderColor: "#10B981",
                                    color: "#065F46",
                                  }
                                : {
                                    backgroundColor:
                                      variables.colors.inputBackgroundColor,
                                    borderColor:
                                      variables.colors.inputBorderColor,
                                    color: variables.colors.descriptionColor,
                                  }
                            }
                          >
                            Active
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateFormField("status", "Inactive")
                            }
                            disabled={isSubmitting}
                            className="flex-1 h-10 rounded-lg border font-inter text-sm font-medium transition-all"
                            style={
                              formData.status === "Inactive"
                                ? {
                                    backgroundColor: "#FEE2E2",
                                    borderColor: "#EF4444",
                                    color: "#991B1B",
                                  }
                                : {
                                    backgroundColor:
                                      variables.colors.inputBackgroundColor,
                                    borderColor:
                                      variables.colors.inputBorderColor,
                                    color: variables.colors.descriptionColor,
                                  }
                            }
                          >
                            Inactive
                          </button>
                        </div>
                      ) : (
                        <div className="min-h-10 flex items-center">
                          <span
                            className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium border"
                            style={{
                              backgroundColor:
                                advertiser.status === "Active"
                                  ? variables.colors
                                      .approvedAssetsBackgroundColor
                                  : variables.colors
                                      .rejectedAssetsBackgroundColor,
                              borderColor:
                                advertiser.status === "Active"
                                  ? "#86EFAC"
                                  : "#FFC2A3",
                              color:
                                advertiser.status === "Active"
                                  ? variables.colors.approvedAssetsIconColor
                                  : variables.colors.rejectedAssetsIconColor,
                            }}
                          >
                            {advertiser.status}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-inter text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Created Method
                      </Label>
                      <div className="font-inter text-sm flex items-center min-h-10 px-3 py-2 rounded-md bg-muted/30">
                        <span className="font-medium">
                          {advertiser.createdMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-inter text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Advertiser Name
                    </Label>
                    <div className="min-h-10 flex items-center">
                      {!isApiSource(advertiser.createdMethod) &&
                      isEditingAdvertiserName ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={formData.advertiserName}
                            onChange={(e) =>
                              updateFormField("advertiserName", e.target.value)
                            }
                            disabled={isSubmitting}
                            className="h-10 font-inter edit-advertiser-modal-input flex-1 text-sm"
                            style={{
                              backgroundColor:
                                variables.colors.inputBackgroundColor,
                              borderColor: variables.colors.inputBorderColor,
                              color: variables.colors.inputTextColor,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (advertiser) {
                                updateFormField(
                                  "advertiserName",
                                  advertiser.advertiserName
                                );
                              }
                              setIsEditingAdvertiserName(false);
                            }}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-md transition-colors shrink-0 border"
                            style={{
                              backgroundColor: "#FEE2E2",
                              borderColor: "#EF4444",
                              color: "#EF4444",
                            }}
                          >
                            <XIcon size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingAdvertiserName(false)}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-md transition-colors shrink-0 border"
                            style={{
                              backgroundColor: "#D1FAE5",
                              borderColor: "#10B981",
                              color: "#10B981",
                            }}
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="font-inter text-sm flex items-center gap-2 w-full min-h-10 px-3 py-2 rounded-md bg-muted/30">
                          <span className="flex-1 font-medium">
                            {formData.advertiserName}
                          </span>
                          {!isApiSource(advertiser.createdMethod) && (
                            <button
                              type="button"
                              onClick={() => setIsEditingAdvertiserName(true)}
                              disabled={isSubmitting}
                              className="p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0 opacity-60 hover:opacity-100"
                              style={{
                                color: variables.colors.inputTextColor,
                              }}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {validationErrors.advertiserName && (
                      <p className="text-xs text-destructive font-inter mt-1">
                        {validationErrors.advertiserName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="space-y-6">
                    {needsApiCredentialGate && !showApiCredentialInputs ? (
                      <div className="space-y-3">
                        <p
                          className="text-sm font-inter"
                          style={{
                            color: variables.colors.descriptionColor,
                          }}
                        >
                          No login email or password is set yet. Create
                          credentials to enable advertiser access.
                        </p>
                        <Button
                          type="button"
                          onClick={() => setShowApiCredentialInputs(true)}
                          disabled={isSubmitting}
                          className="h-11 font-inter text-sm"
                          style={{
                            backgroundColor:
                              variables.colors.buttonDefaultBackgroundColor,
                            color: variables.colors.buttonDefaultTextColor,
                          }}
                        >
                          Create Credentials
                        </Button>
                      </div>
                    ) : (
                      <>
                        {needsApiCredentialGate && showApiCredentialInputs ? (
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <Label className="font-inter text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Email
                              </Label>
                              <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                  updateFormField("email", e.target.value)
                                }
                                disabled={isSubmitting}
                                placeholder="Enter email address"
                                className="h-12 font-inter edit-advertiser-modal-input w-full text-sm"
                                style={{
                                  backgroundColor:
                                    variables.colors.inputBackgroundColor,
                                  borderColor:
                                    variables.colors.inputBorderColor,
                                  color: variables.colors.inputTextColor,
                                }}
                              />
                              {validationErrors.email && (
                                <p className="text-xs text-destructive font-inter mt-1">
                                  {validationErrors.email}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <Label className="font-inter text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Password
                              </Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1 min-w-0">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) =>
                                      updateFormField(
                                        "password",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter password (min 8 characters)"
                                    disabled={isSubmitting}
                                    className="h-12 font-inter edit-advertiser-modal-input pr-10 text-sm w-full"
                                    style={{
                                      backgroundColor:
                                        variables.colors.inputBackgroundColor,
                                      borderColor:
                                        variables.colors.inputBorderColor,
                                      color: variables.colors.inputTextColor,
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowPassword(!showPassword)
                                    }
                                    disabled={isSubmitting}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                                    style={{
                                      color: variables.colors.descriptionColor,
                                    }}
                                    aria-label={
                                      showPassword
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleGeneratePassword}
                                  disabled={isSubmitting}
                                  className="h-12 px-4 font-inter whitespace-nowrap shrink-0"
                                  style={{
                                    backgroundColor:
                                      variables.colors
                                        .buttonOutlineBackgroundColor,
                                    borderColor:
                                      variables.colors.buttonOutlineBorderColor,
                                    color:
                                      variables.colors.buttonOutlineTextColor,
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Generate
                                </Button>
                              </div>
                              {validationErrors.password && (
                                <p className="text-xs text-destructive font-inter mt-1">
                                  {validationErrors.password}
                                </p>
                              )}
                              <p
                                className="text-xs font-inter"
                                style={{
                                  color: variables.colors.descriptionColor,
                                }}
                              >
                                Password must be at least 8 characters long
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1.5">
                              <Label className="font-inter text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Email
                              </Label>
                              <div className="min-h-10 flex items-center">
                                {isEditingEmail ? (
                                  <div className="flex items-center gap-2 w-full">
                                    <Input
                                      type="email"
                                      value={formData.email}
                                      onChange={(e) =>
                                        updateFormField("email", e.target.value)
                                      }
                                      disabled={isSubmitting}
                                      className="h-10 font-inter edit-advertiser-modal-input flex-1 text-sm"
                                      style={{
                                        backgroundColor:
                                          variables.colors.inputBackgroundColor,
                                        borderColor:
                                          variables.colors.inputBorderColor,
                                        color: variables.colors.inputTextColor,
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (advertiser) {
                                          updateFormField(
                                            "email",
                                            advertiser.contactEmail || ""
                                          );
                                        }
                                        setIsEditingEmail(false);
                                      }}
                                      disabled={isSubmitting}
                                      className="p-1.5 rounded-md transition-colors shrink-0 border"
                                      style={{
                                        backgroundColor: "#FEE2E2",
                                        borderColor: "#EF4444",
                                        color: "#EF4444",
                                      }}
                                    >
                                      <XIcon size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingEmail(false)}
                                      disabled={isSubmitting}
                                      className="p-1.5 rounded-md transition-colors shrink-0 border"
                                      style={{
                                        backgroundColor: "#D1FAE5",
                                        borderColor: "#10B981",
                                        color: "#10B981",
                                      }}
                                    >
                                      <Check size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="font-inter text-sm flex items-center gap-2 w-full min-h-10 px-3 py-2 rounded-md bg-muted/30">
                                    <span className="flex-1 font-medium">
                                      {formData.email || "Not set"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingEmail(true)}
                                      disabled={isSubmitting}
                                      className="p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0 opacity-60 hover:opacity-100"
                                      style={{
                                        color: variables.colors.inputTextColor,
                                      }}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {validationErrors.email && (
                                <p className="text-xs text-destructive font-inter mt-1">
                                  {validationErrors.email}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label className="font-inter text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Password
                              </Label>
                              <div className="min-h-10 flex items-center">
                                {isEditingPassword ? (
                                  <div className="flex items-center gap-2 w-full">
                                    <div className="relative flex-1">
                                      <Input
                                        type={
                                          showPassword ? "text" : "password"
                                        }
                                        value={formData.password}
                                        onChange={(e) =>
                                          updateFormField(
                                            "password",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Enter new password (min 8 characters)"
                                        disabled={isSubmitting}
                                        className="h-10 font-inter edit-advertiser-modal-input pr-10 text-sm"
                                        style={{
                                          backgroundColor:
                                            variables.colors
                                              .inputBackgroundColor,
                                          borderColor:
                                            variables.colors.inputBorderColor,
                                          color:
                                            variables.colors.inputTextColor,
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShowPassword(!showPassword)
                                        }
                                        disabled={isSubmitting}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                                        style={{
                                          color:
                                            variables.colors.descriptionColor,
                                        }}
                                        aria-label={
                                          showPassword
                                            ? "Hide password"
                                            : "Show password"
                                        }
                                      >
                                        {showPassword ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateFormField("password", "");
                                        setIsEditingPassword(false);
                                        setShowPassword(false);
                                      }}
                                      disabled={isSubmitting}
                                      className="p-1.5 rounded-md transition-colors shrink-0 border"
                                      style={{
                                        backgroundColor: "#FEE2E2",
                                        borderColor: "#EF4444",
                                        color: "#EF4444",
                                      }}
                                    >
                                      <XIcon size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsEditingPassword(false);
                                        setShowPassword(false);
                                      }}
                                      disabled={isSubmitting}
                                      className="p-1.5 rounded-md transition-colors shrink-0 border"
                                      style={{
                                        backgroundColor: "#D1FAE5",
                                        borderColor: "#10B981",
                                        color: "#10B981",
                                      }}
                                    >
                                      <Check size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="font-inter text-sm flex items-center gap-2 w-full min-h-10 px-3 py-2 rounded-md bg-muted/30">
                                    <span className="flex-1 font-medium">
                                      ••••••••
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingPassword(true)}
                                      disabled={isSubmitting}
                                      className="p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0 opacity-60 hover:opacity-100"
                                      style={{
                                        color: variables.colors.inputTextColor,
                                      }}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {validationErrors.password && (
                                <p className="text-xs text-destructive font-inter mt-1">
                                  {validationErrors.password}
                                </p>
                              )}
                              {isEditingPassword && (
                                <p
                                  className="text-xs font-inter"
                                  style={{
                                    color: variables.colors.descriptionColor,
                                  }}
                                >
                                  Leave blank to keep current password. Password
                                  must be at least 8 characters.
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {error && (
                      <div className="rounded-md bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter
            className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 px-8 py-6 pt-4 border-t ${
              advertiser && !isApiSource(advertiser.createdMethod)
                ? "sm:justify-between"
                : "sm:justify-end"
            }`}
          >
            {advertiser && !isApiSource(advertiser.createdMethod) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="w-full sm:w-auto h-12 font-inter text-sm border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Advertiser
                  </>
                )}
              </Button>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 w-full sm:w-auto">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting || isDeleting}
                  onClick={handleClose}
                  className="w-full sm:w-auto h-12 font-inter text-sm"
                  style={{
                    backgroundColor:
                      variables.colors.buttonOutlineBackgroundColor,
                    borderColor: variables.colors.buttonOutlineBorderColor,
                    color: variables.colors.buttonOutlineTextColor,
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  isDeleting ||
                  (needsApiCredentialGate && !showApiCredentialInputs)
                }
                className="w-full sm:w-auto h-12 font-inter text-sm"
                style={{
                  backgroundColor:
                    isSubmitting ||
                    isDeleting ||
                    (needsApiCredentialGate && !showApiCredentialInputs)
                      ? variables.colors.buttonDisabledBackgroundColor
                      : variables.colors.buttonDefaultBackgroundColor,
                  color:
                    isSubmitting ||
                    isDeleting ||
                    (needsApiCredentialGate && !showApiCredentialInputs)
                      ? variables.colors.buttonDisabledTextColor
                      : variables.colors.buttonDefaultTextColor,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
