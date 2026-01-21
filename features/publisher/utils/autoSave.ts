"use client";

import type { PublisherFormData } from "../hooks/usePublisherForm";

const STORAGE_KEY = "publisher_form_draft";
const FILES_STORAGE_KEY = "publisher_form_files";

export interface SavedFormState {
  formData: PublisherFormData;
  currentStep: number;
  timestamp: number;
}

export interface SavedFileMeta {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  source?: "single" | "zip";
  html?: boolean;
  previewUrl?: string;
  assetCount?: number;
  hasAssets?: boolean;
  fromLines?: string;
  subjectLines?: string;
}

export interface SavedFilesState {
  files: SavedFileMeta[];
  uploadedZipFileName: string;
  timestamp: number;
}

/**
 * Save form data to localStorage
 */
export const saveFormState = (formData: PublisherFormData, currentStep: number): void => {
  try {
    const state: SavedFormState = {
      formData,
      currentStep,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save form state:", error);
  }
};

/**
 * Load saved form data from localStorage
 */
export const loadFormState = (): SavedFormState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved) as SavedFormState;
    
    // Check if saved data is older than 7 days, if so, clear it
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (state.timestamp < sevenDaysAgo) {
      clearFormState();
      return null;
    }

    return state;
  } catch (error) {
    console.error("Failed to load form state:", error);
    return null;
  }
};

/**
 * Clear saved form data
 */
export const clearFormState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FILES_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear form state:", error);
  }
};

/**
 * Save uploaded files state to localStorage
 */
export const saveFilesState = (files: SavedFileMeta[], uploadedZipFileName: string): void => {
  try {
    const state: SavedFilesState = {
      files,
      uploadedZipFileName,
      timestamp: Date.now(),
    };
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save files state:", error);
  }
};

/**
 * Load saved files state from localStorage
 */
export const loadFilesState = (): SavedFilesState | null => {
  try {
    const saved = localStorage.getItem(FILES_STORAGE_KEY);
    if (!saved) {
      console.log("No saved files state found in localStorage");
      return null;
    }

    const state = JSON.parse(saved) as SavedFilesState;
    
    // Check if saved data is older than 7 days, if so, clear it
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (state.timestamp < sevenDaysAgo) {
      clearFilesState();
      return null;
    }
    return state;
  } catch (error) {
    console.error("Failed to load files state:", error);
    return null;
  }
};

/**
 * Clear saved files state
 */
export const clearFilesState = (): void => {
  try {
    localStorage.removeItem(FILES_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear files state:", error);
  }
};
