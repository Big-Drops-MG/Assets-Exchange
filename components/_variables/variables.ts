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
    sidebarMenuItemActiveColor: string;
    sidebarMenuItemIconActiveColor: string;
    sidebarMenuItemTextActiveColor: string;
    sidebarMenuItemTextInactiveColor: string;
    sidebarMenuItemIconInactiveColor: string;
    sidebarFooterSignOutButtonBackgroundColor: string;
    sidebarFooterSignOutButtonTextColor: string;
    sidebarFooterSignOutButtonIconColor: string;
    sidebarFooterBackgroundColor: string;
    headerBackgroundColor: string;
    headerTextColor: string;
    headerIconColor: string;
    statsCardTitleColor: string;
    statsCardIconColor: string;
    statsCardIconBackgroundColor: string;
    statsCardValueColor: string;
    statsCardTrendTextColor: string;
    statsCardTrendTextColorPositive: string;
    statsCardTrendIconColorPositive: string;
    statsCardTrendTextColorNegative: string;
    statsCardTrendIconColorNegative: string;
    statsCardHistoricalDataLabelColor: string;
    statsCardHistoricalDataValueColor: string;
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
    sidebarMenuItemActiveColor: string;
    sidebarMenuItemIconActiveColor: string;
    sidebarMenuItemIconInactiveColor: string;
    sidebarMenuItemTextInactiveColor: string;
    sidebarMenuItemTextActiveColor: string;
    sidebarFooterSignOutButtonBackgroundColor: string;
    sidebarFooterSignOutButtonTextColor: string;
    sidebarFooterSignOutButtonIconColor: string;
    sidebarFooterBackgroundColor: string;
    headerBackgroundColor: string;
    headerTextColor: string;
    headerIconColor: string;
  };
  statsCardContent: {
    statsCardTitleColor: string;
    statsCardIconColor: string;
    statsCardIconBackgroundColor: string;
    statsCardValueColor: string;
    statsCardTrendTextColor: string;
    statsCardTrendTextColorPositive: string;
    statsCardTrendIconColorPositive: string;
    statsCardTrendTextColorNegative: string;
    statsCardTrendIconColorNegative: string;
    statsCardHistoricalDataLabelColor: string;
    statsCardHistoricalDataValueColor: string;
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
    sidebarMenuItemActiveColor:
      overrides?.sidebarMenuItemActiveColor ?? "#E9EEFF",
    sidebarMenuItemIconActiveColor:
      overrides?.sidebarMenuItemIconActiveColor ?? "#1E40AF",
    sidebarMenuItemTextActiveColor:
      overrides?.sidebarMenuItemTextActiveColor ?? "#1E40AF",
    sidebarMenuItemTextInactiveColor:
      overrides?.sidebarMenuItemTextInactiveColor ?? "#3D3D3D",
    sidebarMenuItemIconInactiveColor:
      overrides?.sidebarMenuItemIconInactiveColor ?? "#3D3D3D",
    sidebarFooterSignOutButtonBackgroundColor:
      overrides?.sidebarFooterSignOutButtonBackgroundColor ?? "#FFDFDF",
    sidebarFooterSignOutButtonTextColor:
      overrides?.sidebarFooterSignOutButtonTextColor ?? "#D70000",
    sidebarFooterSignOutButtonIconColor:
      overrides?.sidebarFooterSignOutButtonIconColor ?? "#D70000",
    sidebarFooterBackgroundColor:
      overrides?.sidebarFooterBackgroundColor ?? "#F6F7F9",
    headerBackgroundColor: overrides?.headerBackgroundColor ?? "#DEF3FF",
    headerTextColor: overrides?.headerTextColor ?? "#3D3D3D",
    headerIconColor: overrides?.headerIconColor ?? "#2563EB",
    statsCardTitleColor: overrides?.statsCardTitleColor ?? "#525252",
    statsCardIconColor: overrides?.statsCardIconColor ?? "#5B3E96",
    statsCardIconBackgroundColor:
      overrides?.statsCardIconBackgroundColor ?? "#EBE4FF",
    statsCardValueColor: overrides?.statsCardValueColor ?? "#000000",
    statsCardTrendTextColor: overrides?.statsCardTrendTextColor ?? "#3D3D3D",
    statsCardTrendTextColorPositive:
      overrides?.statsCardTrendTextColorPositive ?? "#16A34A",
    statsCardTrendIconColorPositive:
      overrides?.statsCardTrendIconColorPositive ?? "#16A34A",
    statsCardTrendTextColorNegative:
      overrides?.statsCardTrendTextColorNegative ?? "#DC2626",
    statsCardTrendIconColorNegative:
      overrides?.statsCardTrendIconColorNegative ?? "#DC2626",
    statsCardHistoricalDataLabelColor:
      overrides?.statsCardHistoricalDataLabelColor ?? "#3D3D3D",
    statsCardHistoricalDataValueColor:
      overrides?.statsCardHistoricalDataValueColor ?? "#000000",
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
    sidebarMenuItemActiveColor: "#E9EEFF",
    sidebarMenuItemIconActiveColor: "#1E40AF",
    sidebarMenuItemTextActiveColor: "#1E40AF",
    sidebarMenuItemTextInactiveColor: "#3D3D3D",
    sidebarMenuItemIconInactiveColor: "#3D3D3D",
    sidebarFooterBackgroundColor: "#F6F7F9",
    sidebarFooterSignOutButtonBackgroundColor: "#FFDFDF",
    sidebarFooterSignOutButtonTextColor: "#D70000",
    sidebarFooterSignOutButtonIconColor: "#D70000",
    headerBackgroundColor: "#DEF3FF",
    headerTextColor: "#3D3D3D",
    headerIconColor: "#2563EB",
  },
  statsCardContent: {
    statsCardTitleColor: "#525252",
    statsCardIconColor: "#5B3E96",
    statsCardIconBackgroundColor: "#EBE4FF",
    statsCardValueColor: "#000000",
    statsCardTrendTextColor: "#3D3D3D",
    statsCardTrendTextColorPositive: "#16A34A",
    statsCardTrendIconColorPositive: "#16A34A",
    statsCardTrendTextColorNegative: "#DC2626",
    statsCardTrendIconColorNegative: "#DC2626",
    statsCardHistoricalDataLabelColor: "#3D3D3D",
    statsCardHistoricalDataValueColor: "#000000",
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
