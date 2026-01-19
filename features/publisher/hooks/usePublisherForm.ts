import { useState } from "react";

export interface PublisherFormData {
  affiliateId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  telegramId: string;
  offerId: string;
  creativeType: string;
  additionalNotes: string;
  fromLines: string;
  subjectLines: string;
  priority: string;
}

export const usePublisherForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PublisherFormData>({
    affiliateId: "",
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    telegramId: "",
    offerId: "",
    creativeType: "",
    additionalNotes: "",
    fromLines: "",
    subjectLines: "",
    priority: "medium",
  });

  const onDataChange = (data: Partial<PublisherFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit form");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Submission error:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    formData,
    onDataChange,
    nextStep,
    previousStep,
    goToStep,
    isSubmitting,
    handleSubmit,
  };
};
