/**
 * TODO: BACKEND - Personalization Color Storage
 *
 * This file defines the color structure for UI personalization.
 * Backend developers need to implement database storage for these color preferences.
 *
 * Requirements:
 * 1. Create a database table to store color personalization settings
 * 2. Implement API endpoints to save/load color preferences
 * 3. Support per-user or per-organization color customization
 * 4. Provide default fallback to baseColorPalette if no customization exists
 *
 * See: docs/PERSONALIZATION_BACKEND_TODOS.md for detailed implementation guide
 */

// Grouped color structure for easier personalization form creation
interface GroupedColors {
  // Base colors
  backgrounds: {
    base: string;
    card: string;
    dashboard: string;
    sidebar: string;
  };
  // Typography colors
  text: {
    title: string;
    label: string;
    description: string;
    primary: string;
    secondary: string;
  };
  // Input field colors
  inputs: {
    background: string;
    disabled: string;
    text: string;
    placeholder: string;
    border: string;
    borderFocus: string;
    borderDisabled: string;
    error: string;
    ring: string;
  };
  // Button colors
  buttons: {
    default: {
      background: string;
      text: string;
    };
    outline: {
      background: string;
      border: string;
      text: string;
    };
    disabled: {
      background: string;
      text: string;
    };
    hover: {
      background: string;
      text: string;
    };
  };
  // Sidebar colors
  sidebar: {
    background: string;
    menuItem: {
      active: {
        background: string;
        icon: string;
        text: string;
      };
      inactive: {
        icon: string;
        text: string;
      };
    };
    footer: {
      background: string;
      signOutButton: {
        background: string;
        text: string;
        icon: string;
      };
    };
  };
  // Header colors
  header: {
    background: string;
    text: string;
    icon: string;
  };
  // Stats card colors
  statsCards: {
    title: string;
    value: string;
    trend: {
      text: string;
      positive: {
        text: string;
        icon: string;
      };
      negative: {
        text: string;
        icon: string;
      };
    };
    historicalData: {
      label: string;
      value: string;
    };
    status: {
      totalAssets: {
        background: string;
        icon: string;
      };
      newRequests: {
        background: string;
        icon: string;
      };
      approvedAssets: {
        background: string;
        icon: string;
      };
      rejectedAssets: {
        background: string;
        icon: string;
      };
      pendingApproval: {
        background: string;
        icon: string;
      };
    };
  };
  // Card header colors
  cardHeader: {
    background: string;
    text: string;
  };
  // Request/Response card colors
  requestCards: {
    text: string;
    background: string;
    buttons: {
      view: {
        background: string;
        text: string;
        border: string;
      };
      approve: {
        background: string;
        text: string;
      };
      reject: {
        background: string;
        text: string;
        border: string;
      };
    };
  };
  // Accordion colors
  accordions: {
    purple: {
      background: string;
      border: string;
      offerId: {
        background: string;
        text: string;
      };
    };
    blue: {
      background: string;
      border: string;
      offerId: {
        background: string;
        text: string;
      };
    };
  };
}

// Flattened color structure for backward compatibility
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
  colors: GroupedColors & {
    // Flattened properties for backward compatibility
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
    statsCardValueColor: string;
    statsCardTrendTextColor: string;
    statsCardTrendTextColorPositive: string;
    statsCardTrendIconColorPositive: string;
    statsCardTrendTextColorNegative: string;
    statsCardTrendIconColorNegative: string;
    statsCardHistoricalDataLabelColor: string;
    statsCardHistoricalDataValueColor: string;
    totalAssetsBackgroundColor: string;
    totalAssetsIconColor: string;
    newRequestsBackgroundColor: string;
    newRequestsIconColor: string;
    approvedAssetsBackgroundColor: string;
    approvedAssetsIconColor: string;
    rejectedAssetsBackgroundColor: string;
    rejectedAssetsIconColor: string;
    pendingApprovalBackgroundColor: string;
    pendingApprovalIconColor: string;
    cardHeaderBackgroundColor: string;
    cardHeaderTextColor: string;
    requestCardTextColor: string;
    requestCardBackgroundColor: string;
    AccordionPurpleBackgroundColor: string;
    AccordionBlueBackgroundColor: string;
    requestCardButtonTextColor: string;
    AccordionPurpleBorderColor: string;
    AccordionBlueBorderColor: string;
    requestCardViewButtonBackgroundColor: string;
    requestCardViewButtonTextColor: string;
    requestCardViewButtonBorderColor: string;
    requestCardApproveButtonBackgroundColor: string;
    requestCardApproveButtonTextColor: string;
    requestCardRejectedButtonBackgroundColor: string;
    requestCardRejectedButtonTextColor: string;
    requestCardRejectedButtonBorderColor: string;
    AccordionPurpleOfferIdBackgroundColor: string;
    AccordionBlueOfferIdBackgroundColor: string;
    AccordionPurpleOfferIdTextColor: string;
    AccordionBlueOfferIdTextColor: string;
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

function generateGroupedColors(
  palette: BaseColorPalette,
  overrides?: ColorOverrides
): GroupedColors {
  const { primary, neutral, semantic, text, background } = palette;
  const disabledColor = neutral.base;
  const white = "#FFFFFF";
  const transparent = "transparent";

  return {
    backgrounds: {
      base: overrides?.background ?? background.base,
      card: overrides?.cardBackground ?? background.card,
      dashboard: overrides?.dashboardBackground ?? background.dashboard,
      sidebar: overrides?.sidebarBackground ?? background.sidebar,
    },
    text: {
      title: overrides?.titleColor ?? primary,
      label: overrides?.labelColor ?? primary,
      description: overrides?.descriptionColor ?? text.secondary,
      primary: text.primary,
      secondary: text.secondary,
    },
    inputs: {
      background: overrides?.inputBackgroundColor ?? white,
      disabled: overrides?.inputDisabledColor ?? disabledColor,
      text: overrides?.inputTextColor ?? text.primary,
      placeholder: overrides?.inputPlaceholderColor ?? text.secondary,
      border: overrides?.inputBorderColor ?? neutral.base,
      borderFocus: overrides?.inputBorderFocusColor ?? primary,
      borderDisabled: overrides?.inputBorderDisabledColor ?? neutral.base,
      error: overrides?.inputErrorColor ?? semantic.error,
      ring: overrides?.inputRingColor ?? primary,
    },
    buttons: {
      default: {
        background: overrides?.buttonDefaultBackgroundColor ?? primary,
        text: overrides?.buttonDefaultTextColor ?? white,
      },
      outline: {
        background: overrides?.buttonOutlineBackgroundColor ?? transparent,
        border: overrides?.buttonOutlineBorderColor ?? primary,
        text: overrides?.buttonOutlineTextColor ?? primary,
      },
      disabled: {
        background: overrides?.buttonDisabledBackgroundColor ?? disabledColor,
        text: overrides?.buttonDisabledTextColor ?? white,
      },
      hover: {
        background: overrides?.buttonHoverBackgroundColor ?? primary,
        text: overrides?.buttonHoverTextColor ?? white,
      },
    },
    sidebar: {
      background: overrides?.sidebarBackground ?? background.sidebar,
      menuItem: {
        active: {
          background:
            overrides?.sidebarMenuItemActiveColor ??
            overrides?.sidebarActiveOptionHighlightBackgroundColor ??
            "#E9EEFF",
          icon:
            overrides?.sidebarMenuItemIconActiveColor ??
            overrides?.sidebarActiveOptionHighlightTextColor ??
            "#1E40AF",
          text:
            overrides?.sidebarMenuItemTextActiveColor ??
            overrides?.sidebarActiveOptionHighlightTextColor ??
            "#1E40AF",
        },
        inactive: {
          icon: overrides?.sidebarMenuItemIconInactiveColor ?? "#3D3D3D",
          text: overrides?.sidebarMenuItemTextInactiveColor ?? "#3D3D3D",
        },
      },
      footer: {
        background: overrides?.sidebarFooterBackgroundColor ?? "#F6F7F9",
        signOutButton: {
          background:
            overrides?.sidebarFooterSignOutButtonBackgroundColor ?? "#FFDFDF",
          text: overrides?.sidebarFooterSignOutButtonTextColor ?? "#D70000",
          icon: overrides?.sidebarFooterSignOutButtonIconColor ?? "#D70000",
        },
      },
    },
    header: {
      background: overrides?.headerBackgroundColor ?? "#DEF3FF",
      text: overrides?.headerTextColor ?? "#3D3D3D",
      icon: overrides?.headerIconColor ?? "#2563EB",
    },
    statsCards: {
      title: overrides?.statsCardTitleColor ?? "#525252",
      value: overrides?.statsCardValueColor ?? "#000000",
      trend: {
        text: overrides?.statsCardTrendTextColor ?? "#3D3D3D",
        positive: {
          text: overrides?.statsCardTrendTextColorPositive ?? "#16A34A",
          icon: overrides?.statsCardTrendIconColorPositive ?? "#16A34A",
        },
        negative: {
          text: overrides?.statsCardTrendTextColorNegative ?? "#DC2626",
          icon: overrides?.statsCardTrendIconColorNegative ?? "#DC2626",
        },
      },
      historicalData: {
        label: overrides?.statsCardHistoricalDataLabelColor ?? "#3D3D3D",
        value: overrides?.statsCardHistoricalDataValueColor ?? "#000000",
      },
      status: {
        totalAssets: {
          background: overrides?.totalAssetsBackgroundColor ?? "#EBE4FF",
          icon: overrides?.totalAssetsIconColor ?? "#5B3E96",
        },
        newRequests: {
          background: overrides?.newRequestsBackgroundColor ?? "#DBE3FF",
          icon: overrides?.newRequestsIconColor ?? "#1E40AF",
        },
        approvedAssets: {
          background: overrides?.approvedAssetsBackgroundColor ?? "#DAF3DC",
          icon: overrides?.approvedAssetsIconColor ?? "#14532D",
        },
        rejectedAssets: {
          background: overrides?.rejectedAssetsBackgroundColor ?? "#FFEDE3",
          icon: overrides?.rejectedAssetsIconColor ?? "#FF8743",
        },
        pendingApproval: {
          background: overrides?.pendingApprovalBackgroundColor ?? "#DBFBFC",
          icon: overrides?.pendingApprovalIconColor ?? "#006D77",
        },
      },
    },
    cardHeader: {
      background: overrides?.cardHeaderBackgroundColor ?? "#2c91cc",
      text: overrides?.cardHeaderTextColor ?? "#FFFFFF",
    },
    requestCards: {
      text: overrides?.requestCardTextColor ?? "#3D3D3D",
      background: overrides?.requestCardBackgroundColor ?? "#F9F7FF",
      buttons: {
        view: {
          background:
            overrides?.requestCardViewButtonBackgroundColor ?? "#F3F6FF",
          text: overrides?.requestCardViewButtonTextColor ?? "#2563EB",
          border: overrides?.requestCardViewButtonBorderColor ?? "#2563EB",
        },
        approve: {
          background:
            overrides?.requestCardApproveButtonBackgroundColor ?? "#3B82F6",
          text: overrides?.requestCardApproveButtonTextColor ?? "#EFF8FF",
        },
        reject: {
          background:
            overrides?.requestCardRejectedButtonBackgroundColor ?? "#FFFFFF",
          text: overrides?.requestCardRejectedButtonTextColor ?? "#EF4444",
          border: overrides?.requestCardRejectedButtonBorderColor ?? "#EF4444",
        },
      },
    },
    accordions: {
      purple: {
        background: overrides?.AccordionPurpleBackgroundColor ?? "#F9F7FF",
        border: overrides?.AccordionPurpleBorderColor ?? "#9B81D1",
        offerId: {
          background:
            overrides?.AccordionPurpleOfferIdBackgroundColor ?? "#EBE4FF",
          text: overrides?.AccordionPurpleOfferIdTextColor ?? "#5B3E96",
        },
      },
      blue: {
        background: overrides?.AccordionBlueBackgroundColor ?? "#F1F9FF",
        border: overrides?.AccordionBlueBorderColor ?? "#7C90CF",
        offerId: {
          background:
            overrides?.AccordionBlueOfferIdBackgroundColor ?? "#DBE3FF",
          text: overrides?.AccordionBlueOfferIdTextColor ?? "#1E40AF",
        },
      },
    },
  };
}

function generateColorsFromPalette(
  palette: BaseColorPalette,
  overrides?: ColorOverrides
): AppVariables["colors"] {
  const grouped = generateGroupedColors(palette, overrides);

  // Flatten for backward compatibility
  return {
    ...grouped,
    // Flattened properties
    background: grouped.backgrounds.base,
    cardBackground: grouped.backgrounds.card,
    dashboardBackground: grouped.backgrounds.dashboard,
    sidebarBackground: grouped.backgrounds.sidebar,
    titleColor: grouped.text.title,
    labelColor: grouped.text.label,
    descriptionColor: grouped.text.description,
    inputBackgroundColor: grouped.inputs.background,
    inputDisabledColor: grouped.inputs.disabled,
    inputTextColor: grouped.inputs.text,
    inputPlaceholderColor: grouped.inputs.placeholder,
    inputBorderColor: grouped.inputs.border,
    inputBorderFocusColor: grouped.inputs.borderFocus,
    inputErrorColor: grouped.inputs.error,
    inputBorderDisabledColor: grouped.inputs.borderDisabled,
    inputRingColor: grouped.inputs.ring,
    buttonDefaultBackgroundColor: grouped.buttons.default.background,
    buttonDefaultTextColor: grouped.buttons.default.text,
    buttonOutlineBackgroundColor: grouped.buttons.outline.background,
    buttonOutlineBorderColor: grouped.buttons.outline.border,
    buttonOutlineTextColor: grouped.buttons.outline.text,
    buttonDisabledBackgroundColor: grouped.buttons.disabled.background,
    buttonDisabledTextColor: grouped.buttons.disabled.text,
    buttonHoverBackgroundColor: grouped.buttons.hover.background,
    buttonHoverTextColor: grouped.buttons.hover.text,
    sidebarActiveOptionHighlightBackgroundColor:
      grouped.sidebar.menuItem.active.background,
    sidebarActiveOptionHighlightTextColor: grouped.sidebar.menuItem.active.text,
    sidebarMenuItemActiveColor: grouped.sidebar.menuItem.active.background,
    sidebarMenuItemIconActiveColor: grouped.sidebar.menuItem.active.icon,
    sidebarMenuItemTextActiveColor: grouped.sidebar.menuItem.active.text,
    sidebarMenuItemTextInactiveColor: grouped.sidebar.menuItem.inactive.text,
    sidebarMenuItemIconInactiveColor: grouped.sidebar.menuItem.inactive.icon,
    sidebarFooterSignOutButtonBackgroundColor:
      grouped.sidebar.footer.signOutButton.background,
    sidebarFooterSignOutButtonTextColor:
      grouped.sidebar.footer.signOutButton.text,
    sidebarFooterSignOutButtonIconColor:
      grouped.sidebar.footer.signOutButton.icon,
    sidebarFooterBackgroundColor: grouped.sidebar.footer.background,
    headerBackgroundColor: grouped.header.background,
    headerTextColor: grouped.header.text,
    headerIconColor: grouped.header.icon,
    statsCardTitleColor: grouped.statsCards.title,
    statsCardValueColor: grouped.statsCards.value,
    statsCardTrendTextColor: grouped.statsCards.trend.text,
    statsCardTrendTextColorPositive: grouped.statsCards.trend.positive.text,
    statsCardTrendIconColorPositive: grouped.statsCards.trend.positive.icon,
    statsCardTrendTextColorNegative: grouped.statsCards.trend.negative.text,
    statsCardTrendIconColorNegative: grouped.statsCards.trend.negative.icon,
    statsCardHistoricalDataLabelColor: grouped.statsCards.historicalData.label,
    statsCardHistoricalDataValueColor: grouped.statsCards.historicalData.value,
    totalAssetsBackgroundColor:
      grouped.statsCards.status.totalAssets.background,
    totalAssetsIconColor: grouped.statsCards.status.totalAssets.icon,
    newRequestsBackgroundColor:
      grouped.statsCards.status.newRequests.background,
    newRequestsIconColor: grouped.statsCards.status.newRequests.icon,
    approvedAssetsBackgroundColor:
      grouped.statsCards.status.approvedAssets.background,
    approvedAssetsIconColor: grouped.statsCards.status.approvedAssets.icon,
    rejectedAssetsBackgroundColor:
      grouped.statsCards.status.rejectedAssets.background,
    rejectedAssetsIconColor: grouped.statsCards.status.rejectedAssets.icon,
    pendingApprovalBackgroundColor:
      grouped.statsCards.status.pendingApproval.background,
    pendingApprovalIconColor: grouped.statsCards.status.pendingApproval.icon,
    cardHeaderBackgroundColor: grouped.cardHeader.background,
    cardHeaderTextColor: grouped.cardHeader.text,
    requestCardTextColor: grouped.requestCards.text,
    requestCardBackgroundColor: grouped.requestCards.background,
    AccordionPurpleBackgroundColor: grouped.accordions.purple.background,
    AccordionBlueBackgroundColor: grouped.accordions.blue.background,
    requestCardButtonTextColor: grouped.requestCards.buttons.view.text,
    AccordionPurpleBorderColor: grouped.accordions.purple.border,
    AccordionBlueBorderColor: grouped.accordions.blue.border,
    requestCardViewButtonBackgroundColor:
      grouped.requestCards.buttons.view.background,
    requestCardViewButtonTextColor: grouped.requestCards.buttons.view.text,
    requestCardViewButtonBorderColor: grouped.requestCards.buttons.view.border,
    requestCardApproveButtonBackgroundColor:
      grouped.requestCards.buttons.approve.background,
    requestCardApproveButtonTextColor:
      grouped.requestCards.buttons.approve.text,
    requestCardRejectedButtonBackgroundColor:
      grouped.requestCards.buttons.reject.background,
    requestCardRejectedButtonTextColor:
      grouped.requestCards.buttons.reject.text,
    requestCardRejectedButtonBorderColor:
      grouped.requestCards.buttons.reject.border,
    AccordionPurpleOfferIdBackgroundColor:
      grouped.accordions.purple.offerId.background,
    AccordionBlueOfferIdBackgroundColor:
      grouped.accordions.blue.offerId.background,
    AccordionPurpleOfferIdTextColor: grouped.accordions.purple.offerId.text,
    AccordionBlueOfferIdTextColor: grouped.accordions.blue.offerId.text,
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

/**
 * TODO: BACKEND - Load Personalization from Database
 *
 * This function should be updated to:
 * 1. Check for user/organization-specific color preferences in database
 * 2. Load customPalette and overrides from database if they exist
 * 3. Fall back to defaultVariables if no customization is found
 * 4. Cache the loaded preferences to avoid repeated database queries
 *
 * Suggested implementation:
 * - Create a service function: getUserColorPreferences(userId: string)
 * - Store preferences in a JSONB column or separate color_preferences table
 * - Return Partial<BaseColorPalette> and ColorOverrides from database
 *
 * Example:
 * const userPreferences = await getUserColorPreferences(userId);
 * return getVariables(userPreferences.palette, userPreferences.overrides);
 */
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

// Export grouped colors type for form generation
export type { GroupedColors };
