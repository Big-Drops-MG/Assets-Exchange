import { type PublisherFormData } from "../hooks/usePublisherForm";
import type { useFormValidation } from "../hooks/useFormValidation";

export interface PersonalDetailProps {
    formData: PublisherFormData;
    onDataChange: (data: Partial<PublisherFormData>) => void;
    validation: ReturnType<typeof useFormValidation>;
}

export interface ContactDetailsProps {
    formData: PublisherFormData;
    onDataChange: (data: Partial<PublisherFormData>) => void;
    validation: ReturnType<typeof useFormValidation>;
}

export interface CreativeDetailsProps {
    formData: PublisherFormData;
    onDataChange: (data: Partial<PublisherFormData>) => void;
    validation: ReturnType<typeof useFormValidation>;
}