"use client";

import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
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

import {
  useNewAdvertiserManuallyViewModel,
  type NewAdvertiserFormData,
} from "../view-models/useNewAdvertiserManuallyViewModel";

async function generateNextManualAdvertiserId(): Promise<string> {
  try {
    const res = await fetch("/api/admin/advertisers/next-manual-id");
    if (!res.ok) throw new Error("Failed to fetch next manual ID");
    const json = await res.json();
    return json.nextId ?? "MA0001";
  } catch (e) {
    console.error("Failed to generate advertiser ID:", e);
    return "MA0001";
  }
}

function isValidMaIncrementalId(id: string): boolean {
  const t = id.trim();
  return /^MA\d+$/.test(t) && t.length <= 100;
}

interface NewAdvertiserManuallyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (advertiserId: string) => void;
}

/**
 * TODO: BACKEND - Password Generation
 *
 * Currently generates client-side: 8 characters with mixed case, numbers, and special chars
 *
 * Backend should:
 * 1. Generate secure passwords using cryptographically secure random number generator
 * 2. Enforce password complexity requirements
 * 3. Hash password before storing (never store plain text)
 * 4. Consider password strength requirements:
 *    - Minimum length (8 characters)
 *    - Mix of uppercase, lowercase, numbers, special characters
 *    - Avoid common passwords
 *
 * Security Notes:
 * - Use bcrypt, argon2, or similar for hashing
 * - Store only hashed password, never plain text
 * - Consider password reset flow instead of auto-generation
 */
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

export function NewAdvertiserManuallyModal({
  open,
  onOpenChange,
  onSuccess,
}: NewAdvertiserManuallyModalProps) {
  const variables = getVariables();
  const inputRingColor = variables.colors.inputRingColor;
  const { isSubmitting, error, submitAdvertiser, reset } =
    useNewAdvertiserManuallyViewModel();

  const [formData, setFormData] = useState<NewAdvertiserFormData>({
    companyName: "",
    advertiserId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [initialFormData, setInitialFormData] =
    useState<NewAdvertiserFormData | null>(null);

  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof NewAdvertiserFormData, string>>
  >({});
  const [showPassword, setShowPassword] = useState(false);
  const [internalOpen, setInternalOpen] = useState(open);
  const [advertiserIdLoading, setAdvertiserIdLoading] = useState(false);

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

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    reset();
    setValidationErrors({});
    setAdvertiserIdLoading(true);
    generateNextManualAdvertiserId()
      .then((nextId) => {
        if (cancelled) return;
        const initialData: NewAdvertiserFormData = {
          companyName: "",
          advertiserId: nextId,
          firstName: "",
          lastName: "",
          email: "",
          password: "",
        };
        setFormData(initialData);
        setInitialFormData(initialData);
      })
      .finally(() => {
        if (!cancelled) setAdvertiserIdLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, reset]);

  /**
   * TODO: BACKEND - Form Validation
   *
   * Current validation is client-side only. Backend should also validate:
   *
   * 1. Company Name:
   *    - Required, non-empty after trim
   *    - Max length (e.g., 255 characters)
   *    - Character restrictions (no special chars that could cause issues)
   *
   * 2. Advertiser ID:
   *    - Required, format: MA#### (MA followed by exactly 4 digits)
   *    - Must be unique (check against existing advertisers)
   *    - Backend should validate uniqueness before creation
   *
   * 3. First Name / Last Name:
   *    - Required, non-empty after trim
   *    - Max length validation
   *    - Character restrictions (e.g., no numbers, special chars)
   *
   * 4. Email:
   *    - Required, valid email format
   *    - Must be unique (check against existing advertisers/users)
   *    - Backend should validate email uniqueness
   *    - Consider email domain restrictions if needed
   *
   * 5. Password:
   *    - Required, minimum 8 characters
   *    - Password complexity requirements (if auto-generated, ensure it meets requirements)
   *    - Backend should hash password before storing
   *
   * Return field-specific errors for better UX:
   * {
   *   field: string,
   *   message: string
   * }[]
   */
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof NewAdvertiserFormData, string>> = {};

    if (!formData.companyName.trim()) {
      errors.companyName = "Company name is required";
    }

    const id = formData.advertiserId.trim();
    if (!id) {
      errors.advertiserId = "Advertiser ID is required";
    } else if (!isValidMaIncrementalId(id)) {
      errors.advertiserId =
        "Advertiser ID must follow the MA0001 format (assigned automatically)";
    }

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Validation failed", {
        description: "Please fix the errors in the form before submitting.",
      });
      return;
    }

    try {
      const createdAdvertiser = await submitAdvertiser(formData);

      if (createdAdvertiser) {
        toast.success("Advertiser created successfully", {
          description: `Advertiser ${createdAdvertiser.id} has been created.`,
        });
        setInitialFormData(null);
        setInternalOpen(false);
        onSuccess?.(createdAdvertiser.id);
        onOpenChange(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create advertiser. Please try again.";
      toast.error("Failed to create advertiser", {
        description: errorMessage,
      });
    }
  };

  const handleOpenChange = useCallback(
    async (newOpen: boolean) => {
      if (isSubmitting) {
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
    [isSubmitting, hasUnsavedChanges, onOpenChange]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  }, [isSubmitting, onOpenChange]);

  const updateFormField = <K extends keyof NewAdvertiserFormData>(
    field: K,
    value: NewAdvertiserFormData[K]
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
    const newPassword = generatePassword();
    updateFormField("password", newPassword);
  };

  return (
    <Dialog open={internalOpen} onOpenChange={handleOpenChange}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .advertiser-modal-input:focus-visible {
            outline: none !important;
            border-color: ${inputRingColor} !important;
            box-shadow: 0 0 0 3px ${inputRingColor}50 !important;
          }
          .advertiser-modal-input:-webkit-autofill,
          .advertiser-modal-input:-webkit-autofill:hover,
          .advertiser-modal-input:-webkit-autofill:focus,
          .advertiser-modal-input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px ${variables.colors.inputBackgroundColor} inset !important;
            -webkit-text-fill-color: ${variables.colors.inputTextColor} !important;
            box-shadow: 0 0 0 30px ${variables.colors.inputBackgroundColor} inset !important;
            background-color: ${variables.colors.inputBackgroundColor} !important;
            color: ${variables.colors.inputTextColor} !important;
          }
          .advertiser-modal-input::selection {
            background-color: ${inputRingColor}40 !important;
            color: ${variables.colors.inputTextColor} !important;
          }
          .advertiser-modal-input::-moz-selection {
            background-color: ${inputRingColor}40 !important;
            color: ${variables.colors.inputTextColor} !important;
          }
        `,
        }}
      />
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-w-0">
          <DialogHeader
            className="-mt-1 -mx-1 mb-0 px-8 py-6 overflow-hidden"
            style={{
              backgroundColor: variables.colors.cardHeaderBackgroundColor,
            }}
          >
            <DialogTitle
              className="xl:text-lg text-sm lg:text-base font-inter font-semibold"
              style={{ color: variables.colors.cardHeaderTextColor }}
            >
              Create New Advertiser Manually
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="min-w-0">
            <div className="space-y-4 w-full">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="font-inter text-sm">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    updateFormField("companyName", e.target.value)
                  }
                  placeholder="Enter company name"
                  disabled={isSubmitting}
                  aria-invalid={!!validationErrors.companyName}
                  className="h-12 font-inter advertiser-modal-input"
                  style={{
                    backgroundColor: variables.colors.inputBackgroundColor,
                    borderColor: variables.colors.inputBorderColor,
                    color: variables.colors.inputTextColor,
                  }}
                />
                {validationErrors.companyName && (
                  <p className="text-sm text-destructive font-inter">
                    {validationErrors.companyName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="advertiserId" className="font-inter text-sm">
                  Advertiser ID <span className="text-destructive">*</span>
                </Label>
                <div
                  id="advertiserId"
                  role="status"
                  aria-busy={advertiserIdLoading}
                  aria-live="polite"
                  className="flex h-12 min-w-0 items-center rounded-lg border px-4 font-inter text-sm font-semibold tracking-wide"
                  style={{
                    borderColor: variables.colors.inputBorderColor,
                    backgroundColor: variables.colors.inputBackgroundColor,
                    color: variables.colors.inputTextColor,
                  }}
                >
                  {advertiserIdLoading ? (
                    <span
                      className="text-sm font-inter font-normal"
                      style={{ color: variables.colors.descriptionColor }}
                    >
                      Generating next ID…
                    </span>
                  ) : (
                    formData.advertiserId
                  )}
                </div>
                {validationErrors.advertiserId && (
                  <p className="text-sm text-destructive font-inter">
                    {validationErrors.advertiserId}
                  </p>
                )}
                <p
                  id="advertiser-id-hint"
                  className="text-xs font-inter"
                  style={{ color: variables.colors.descriptionColor }}
                >
                  Assigned automatically: MA0001, MA0002, and so on in order.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-inter text-sm">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      updateFormField("firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                    disabled={isSubmitting}
                    aria-invalid={!!validationErrors.firstName}
                    className="h-12 font-inter advertiser-modal-input"
                    style={{
                      backgroundColor: variables.colors.inputBackgroundColor,
                      borderColor: variables.colors.inputBorderColor,
                      color: variables.colors.inputTextColor,
                    }}
                  />
                  {validationErrors.firstName && (
                    <p className="text-sm text-destructive font-inter">
                      {validationErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-inter text-sm">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      updateFormField("lastName", e.target.value)
                    }
                    placeholder="Enter last name"
                    disabled={isSubmitting}
                    aria-invalid={!!validationErrors.lastName}
                    className="h-12 font-inter advertiser-modal-input"
                    style={{
                      backgroundColor: variables.colors.inputBackgroundColor,
                      borderColor: variables.colors.inputBorderColor,
                      color: variables.colors.inputTextColor,
                    }}
                  />
                  {validationErrors.lastName && (
                    <p className="text-sm text-destructive font-inter">
                      {validationErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-inter text-sm">
                  Email ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormField("email", e.target.value)}
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                  aria-invalid={!!validationErrors.email}
                  className="h-12 font-inter advertiser-modal-input"
                  style={{
                    backgroundColor: variables.colors.inputBackgroundColor,
                    borderColor: variables.colors.inputBorderColor,
                    color: variables.colors.inputTextColor,
                  }}
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive font-inter">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-inter text-sm">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        updateFormField("password", e.target.value)
                      }
                      placeholder="Enter password (min 8 characters)"
                      disabled={isSubmitting}
                      aria-invalid={!!validationErrors.password}
                      className="h-12 font-inter advertiser-modal-input pr-10"
                      style={{
                        backgroundColor: variables.colors.inputBackgroundColor,
                        borderColor: variables.colors.inputBorderColor,
                        color: variables.colors.inputTextColor,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                      style={{
                        color: variables.colors.descriptionColor,
                      }}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
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
                    className="h-12 px-4 font-inter whitespace-nowrap"
                    style={{
                      backgroundColor:
                        variables.colors.buttonOutlineBackgroundColor,
                      borderColor: variables.colors.buttonOutlineBorderColor,
                      color: variables.colors.buttonOutlineTextColor,
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-destructive font-inter">
                    {validationErrors.password}
                  </p>
                )}
                <p
                  className="text-xs font-inter"
                  style={{ color: variables.colors.descriptionColor }}
                >
                  Password must be at least 8 characters long
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 mt-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <DialogClose asChild className="w-full sm:w-auto min-w-0 shrink-0">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleClose}
                className="w-full flex-1 h-12! font-inter font-medium"
                style={{
                  backgroundColor:
                    variables.colors.buttonOutlineBackgroundColor,
                  borderColor: variables.colors.buttonOutlineBorderColor,
                  color: variables.colors.buttonOutlineTextColor,
                  height: "3rem",
                }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                advertiserIdLoading ||
                !formData.advertiserId.trim()
              }
              className="w-full flex-1 h-12! font-inter font-medium shrink-0"
              style={{
                backgroundColor:
                  isSubmitting ||
                  advertiserIdLoading ||
                  !formData.advertiserId.trim()
                    ? variables.colors.buttonDisabledBackgroundColor
                    : variables.colors.buttonDefaultBackgroundColor,
                color:
                  isSubmitting ||
                  advertiserIdLoading ||
                  !formData.advertiserId.trim()
                    ? variables.colors.buttonDisabledTextColor
                    : variables.colors.buttonDefaultTextColor,
                height: "3rem",
              }}
              aria-label="Create new advertiser"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Advertiser"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
