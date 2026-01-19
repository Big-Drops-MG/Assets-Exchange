import { useState, useCallback } from 'react';
import type { PublisherFormData } from './usePublisherForm';
import {
  validatePersonalDetails,
  validateContactDetails,
  validateCreativeDetails,
  validateForm,
  validateField,
  type ValidationResult,
} from '@/features/publisher/utils/validation';

export interface ValidationState {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
}

export const useFormValidation = (initialFormData: PublisherFormData) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    touched: {},
    isValid: false,
  });
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false);
  const [hasFromSubjectLines, setHasFromSubjectLines] = useState(false);

  // Update form data - this should not trigger state updates that cause infinite loops
  const updateFormData = useCallback((updates: Partial<PublisherFormData>) => {
    // This function is now just a placeholder - actual form data is managed by the parent component
    // We don't need to store form data here since it's passed as a parameter to validation functions
  }, []);

  // Mark field as touched
  const markFieldAsTouched = useCallback((fieldName: string) => {
    setValidationState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [fieldName]: true },
    }));
  }, []);

  // Mark field as touched on blur
  const handleFieldBlur = useCallback(
    (fieldName: string) => {
      markFieldAsTouched(fieldName);
    },
    [markFieldAsTouched]
  );

  // Validate a single field
  const validateSingleField = useCallback(
    (fieldName: keyof PublisherFormData, value: string) => {
      const result = validateField(fieldName, value);
      return result.error || '';
    },
    []
  );

  // Validate field on change
  const handleFieldChange = useCallback(
    (fieldName: keyof PublisherFormData, value: string) => {
      const result = validateField(fieldName, value);
      const error = result.error || '';

      setValidationState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: error,
        },
      }));
    },
    []
  );

  // Validate personal details step
  const validatePersonalDetailsStep = useCallback(
    (formData: Partial<PublisherFormData>): ValidationResult => {
      const result = validatePersonalDetails({
        affiliateId: formData.affiliateId || '',
        companyName: formData.companyName || '',
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
      });

      const fieldsToTouch: Array<keyof PublisherFormData> = [
        'affiliateId',
        'companyName',
        'firstName',
        'lastName'
      ];

      const touchedFields: Record<string, boolean> = {};
      fieldsToTouch.forEach((field) => {
        touchedFields[field] = true;
      });

      setValidationState((prev) => ({
        ...prev,
        errors: { ...prev.errors, ...result.errors },
        touched: { ...prev.touched, ...touchedFields },
      }));

      return result;
    },
    []
  );

  // Validate contact details step
  const validateContactDetailsStep = useCallback(
    (formData: Partial<PublisherFormData>): ValidationResult => {
      const result = validateContactDetails({
        email: formData.email || '',
        telegramId: formData.telegramId || '',
      });

      const fieldsToTouch: Array<keyof PublisherFormData> = [
        'email',
        'telegramId'
      ];

      const touchedFields: Record<string, boolean> = {};
      fieldsToTouch.forEach((field) => {
        touchedFields[field] = true;
      });

      setValidationState((prev) => ({
        ...prev,
        errors: { ...prev.errors, ...result.errors },
        touched: { ...prev.touched, ...touchedFields },
      }));

      return result;
    },
    []
  );

  // Validate creative details step
  const validateCreativeDetailsStep = useCallback(
    (
      formData: Partial<PublisherFormData>,
      hasFiles: boolean,
      hasLines: boolean
    ): ValidationResult => {
      const errors: Record<string, string> = {};

      const result = validateCreativeDetails({
        offerId: formData.offerId || '',
        creativeType: formData.creativeType || '',
        fromLines: formData.fromLines || '',
        subjectLines: formData.subjectLines || '',
      });

      Object.assign(errors, result.errors);

      // Additional validation for files and lines if required
      if (!formData.creativeType) {
        errors.creativeType = errors.creativeType || 'Please select a creative type';
      } else {
        if (formData.creativeType === 'email') {
          if (!hasFiles && !hasLines) {
            errors.creativeType = 'Please upload files or add from/subject lines';
          }
        } else {
          if (!hasFiles) {
            errors.creativeType = 'Please upload at least one creative file';
          }
        }
      }

      const fieldsToTouch: Array<keyof PublisherFormData> = [
        'offerId',
        'creativeType',
        'fromLines',
        'subjectLines'
      ];

      const touchedFields: Record<string, boolean> = {};
      fieldsToTouch.forEach((field) => {
        touchedFields[field] = true;
      });

      setValidationState((prev) => ({
        ...prev,
        errors: { ...prev.errors, ...errors },
        touched: { ...prev.touched, ...touchedFields },
      }));

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
    []
  );

  // Validate complete form
  const validateCompleteFormData = useCallback(
    (
      formData: PublisherFormData,
      hasFiles: boolean,
      hasLines: boolean
    ): ValidationResult => {
      const result = validateForm(formData);

      // Additional checks for files and lines
      const errors = { ...result.errors };

      if (formData.creativeType === 'email') {
        if (!hasFiles && !hasLines) {
          errors.creativeType = errors.creativeType || 'Please upload files or add from/subject lines';
        }
      } else {
        if (!hasFiles) {
          errors.creativeType = errors.creativeType || 'Please upload at least one creative file';
        }
      }

      const allFields: Array<keyof PublisherFormData> = [
        'affiliateId',
        'companyName',
        'firstName',
        'lastName',
        'email',
        'telegramId',
        'offerId',
        'creativeType',
        'fromLines',
        'subjectLines'
      ];

      const touchedFields: Record<string, boolean> = {};
      allFields.forEach((field) => {
        touchedFields[field] = true;
      });

      const isValid = Object.keys(errors).length === 0;

      setValidationState((prev) => ({
        ...prev,
        errors,
        isValid,
        touched: { ...prev.touched, ...touchedFields },
      }));

      return {
        valid: isValid,
        errors,
      };
    },
    []
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setValidationState((prev) => ({
      ...prev,
      errors: {},
      isValid: false,
    }));
  }, []);

  // Clear specific field error
  const clearFieldError = useCallback((fieldName: string) => {
    setValidationState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: '',
      },
    }));
  }, []);

  // Check if a specific field has an error
  const hasFieldError = useCallback(
    (fieldName: string): boolean => {
      return !!validationState.errors[fieldName];
    },
    [validationState.errors]
  );

  // Get error message for a specific field
  const getFieldErrorMessage = useCallback(
    (fieldName: string): string => {
      return validationState.errors[fieldName] || '';
    },
    [validationState.errors]
  );

  // Check if a field has been touched
  const isFieldTouched = useCallback(
    (fieldName: string): boolean => {
      return !!validationState.touched[fieldName];
    },
    [validationState.touched]
  );

  // Check if form is valid
  const isFormValid = useCallback((): boolean => {
    return validationState.isValid;
  }, [validationState.isValid]);

  // Update file upload state
  const updateFileUploadState = useCallback((hasFiles: boolean) => {
    setHasUploadedFiles(hasFiles);
  }, []);

  // Update from/subject lines state
  const updateFromSubjectLinesState = useCallback((hasLines: boolean) => {
    setHasFromSubjectLines(hasLines);
  }, []);

  // Validate all fields and update validation state
  const validateAllFields = useCallback(
    (
      formData: PublisherFormData,
      hasFiles: boolean,
      hasLines: boolean
    ) => {
      const result = validateCompleteFormData(formData, hasFiles, hasLines);
      return result;
    },
    [validateCompleteFormData]
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setValidationState({
      errors: {},
      touched: {},
      isValid: false,
    });
    setHasUploadedFiles(false);
    setHasFromSubjectLines(false);
  }, []);

  // Additional methods expected by components
  const hasErrors = Object.keys(validationState.errors).some(
    (key) => validationState.errors[key]
  );

  // Validate form method (used by some components)
  const validateFormMethod = useCallback(
    (data: Partial<PublisherFormData>) => {
      const formDataObj: PublisherFormData = {
        affiliateId: data.affiliateId || '',
        companyName: data.companyName || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        telegramId: data.telegramId || '',
        offerId: data.offerId || '',
        creativeType: data.creativeType || '',
        additionalNotes: data.additionalNotes || '',
        fromLines: data.fromLines || '',
        subjectLines: data.subjectLines || '',
        priority: data.priority || 'medium',
      };
      const result = validateCompleteFormData(
        formDataObj,
        hasUploadedFiles,
        hasFromSubjectLines
      );
      return result.valid;
    },
    [validateCompleteFormData, hasUploadedFiles, hasFromSubjectLines]
  );

  return {
    // Core validation state
    errors: validationState.errors,
    hasErrors,
    isValid: validationState.isValid,
    hasUploadedFiles,
    hasFromSubjectLines,

    // Core methods
    validateField: validateSingleField,
    validateForm: validateFormMethod,
    clearErrors,

    // Methods used by step components
    handleFieldChange,
    handleFieldBlur,
    getFieldErrorMessage,
    hasFieldError,
    isFieldTouched,
    markFieldAsTouched,

    // Step validation methods used by CreativeForm
    validatePersonalDetailsStep,
    validateContactDetailsStep,
    validateCreativeDetailsStep,
    validateCompleteFormData,

    // Additional methods (for backward compatibility)
    validationState,
    updateFormData,
    validateAllFields,
    clearFieldError,
    isFormValid,
    updateFileUploadState,
    updateFromSubjectLinesState,
    resetForm,
  };
};
