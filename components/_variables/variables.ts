export interface AppVariables {
  logo: {
    path: string;
    alt: string;
  };
  secondaryLogo: {
    path: string;
    alt: string;
  };
  favicon: {
    path: string;
    alt: string;
  };
  colors: {
    background: string;
    cardBackground: string;
    dashboardBackground: string;
    sidebarBackground: string;
    titleColor: string;
    labelColor: string;
    descriptionColor: string;
    inputBackgroundColor: string;
    inputDisabledColor: string;
    inputTextColor: string;
    inputPlaceholderColor: string;
    inputBorderColor: string;
    inputBorderFocusColor: string;
    inputErrorColor: string;
    inputBorderDisabledColor: string;
    inputRingColor: string;
    buttonDefaultBackgroundColor: string;
    buttonDefaultTextColor: string;
    buttonOutlineBackgroundColor: string;
    buttonOutlineBorderColor: string;
    buttonOutlineTextColor: string;
    buttonDisabledBackgroundColor: string;
    buttonDisabledTextColor: string;
    buttonHoverBackgroundColor: string;
    buttonHoverTextColor: string;
    sidebarActiveOptionHighlightBackgroundColor: string;
    sidebarActiveOptionHighlightTextColor: string;
  };
  branding: {
    appName: string;
    companyName: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
  };
}

interface BaseColorPalette {
  primary: string;
  secondary?: string;
  neutral: {
    light: string;
    base: string;
    dark: string;
  };
  semantic: {
    error: string;
    warning?: string;
    success?: string;
    info?: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  background: {
    base: string;
    card: string;
    dashboard: string;
    sidebar: string;
  };
}

interface ColorOverrides {
  [key: string]: string | undefined;
}

function generateColorsFromPalette(
  palette: BaseColorPalette,
  overrides?: ColorOverrides
): AppVariables["colors"] {
  const { primary, neutral, semantic, text, background } = palette;

  const disabledColor = neutral.base;
  const white = "#FFFFFF";
  const transparent = "transparent";

  return {
    background: overrides?.background ?? background.base,
    cardBackground: overrides?.cardBackground ?? background.card,
    dashboardBackground: overrides?.dashboardBackground ?? background.dashboard,
    sidebarBackground: overrides?.sidebarBackground ?? background.sidebar,
    titleColor: overrides?.titleColor ?? primary,
    labelColor: overrides?.labelColor ?? primary,
    descriptionColor: overrides?.descriptionColor ?? text.secondary,
    inputBackgroundColor: overrides?.inputBackgroundColor ?? white,
    inputDisabledColor: overrides?.inputDisabledColor ?? disabledColor,
    inputTextColor: overrides?.inputTextColor ?? text.primary,
    inputPlaceholderColor: overrides?.inputPlaceholderColor ?? text.secondary,
    inputBorderColor: overrides?.inputBorderColor ?? neutral.base,
    inputBorderFocusColor: overrides?.inputBorderFocusColor ?? primary,
    inputErrorColor: overrides?.inputErrorColor ?? semantic.error,
    inputBorderDisabledColor:
      overrides?.inputBorderDisabledColor ?? neutral.base,
    inputRingColor: overrides?.inputRingColor ?? primary,
    buttonDefaultBackgroundColor:
      overrides?.buttonDefaultBackgroundColor ?? primary,
    buttonDefaultTextColor: overrides?.buttonDefaultTextColor ?? white,
    buttonOutlineBackgroundColor:
      overrides?.buttonOutlineBackgroundColor ?? transparent,
    buttonOutlineBorderColor: overrides?.buttonOutlineBorderColor ?? primary,
    buttonOutlineTextColor: overrides?.buttonOutlineTextColor ?? primary,
    buttonDisabledBackgroundColor:
      overrides?.buttonDisabledBackgroundColor ?? disabledColor,
    buttonDisabledTextColor: overrides?.buttonDisabledTextColor ?? white,
    buttonHoverBackgroundColor:
      overrides?.buttonHoverBackgroundColor ?? primary,
    buttonHoverTextColor: overrides?.buttonHoverTextColor ?? white,
    sidebarActiveOptionHighlightBackgroundColor:
      overrides?.sidebarActiveOptionHighlightBackgroundColor ?? "#E9EEFF",
    sidebarActiveOptionHighlightTextColor:
      overrides?.sidebarActiveOptionHighlightTextColor ?? "#1E40AF",
  };
}

const baseColorPalette: BaseColorPalette = {
  primary: "#2c91cc",
  neutral: {
    light: "#FAFAFA",
    base: "#999999",
    dark: "#6b7280",
  },
  semantic: {
    error: "#FF0000",
  },
  text: {
    primary: "#010101",
    secondary: "#6b7280",
  },
  background: {
    base: "#EFF8FF",
    card: "#FFFFFF",
    dashboard: "#FFFFFF",
    sidebar: "#FAFAFA",
  },
};

const logoPath = "/logo.svg";
const secondaryLogoPath = "/secondary-logo.svg";
const alt = "Big Drops Marketing Group Logo";
const faviconPath = "/favicon.png";
const faviconAlt = "Big Drops Marketing Group Favicon";

export const defaultVariables: AppVariables = {
  logo: {
    path: logoPath,
    alt,
  },
  favicon: {
    path: faviconPath,
    alt: faviconAlt,
  },
  secondaryLogo: {
    path: secondaryLogoPath,
    alt,
  },
  colors: generateColorsFromPalette(baseColorPalette),
  branding: {
    appName: "Big Drops Marketing Group",
    companyName: "Big Drops Marketing Group",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    headingFont: "Plus Jakarta Sans, sans-serif",
  },
};

export const getVariables = (
  customPalette?: Partial<BaseColorPalette>,
  overrides?: ColorOverrides
): AppVariables => {
  if (!customPalette && !overrides) {
    return defaultVariables;
  }

  const mergedPalette: BaseColorPalette = {
    ...baseColorPalette,
    ...customPalette,
    neutral: {
      ...baseColorPalette.neutral,
      ...customPalette?.neutral,
    },
    semantic: {
      ...baseColorPalette.semantic,
      ...customPalette?.semantic,
    },
    text: {
      ...baseColorPalette.text,
      ...customPalette?.text,
    },
    background: {
      ...baseColorPalette.background,
      ...customPalette?.background,
    },
  };

  return {
    ...defaultVariables,
    colors: generateColorsFromPalette(mergedPalette, overrides),
  };
};
