# Personalization Color Storage - Backend Implementation Guide

## Overview

This document provides detailed implementation requirements for storing and managing UI color personalization preferences in the database. The frontend has been structured with grouped color definitions to make form generation and database storage straightforward.

## Table of Contents

1. [Database Schema Design](#database-schema-design)
2. [API Endpoints](#api-endpoints)
3. [Data Structure](#data-structure)
4. [Implementation Steps](#implementation-steps)
5. [Example Queries](#example-queries)
6. [Migration Strategy](#migration-strategy)

---

## Database Schema Design

### Option 1: Single Table with JSONB (Recommended for PostgreSQL)

```sql
-- Personalization preferences table
CREATE TABLE color_preferences (
  id VARCHAR(255) PRIMARY KEY,

  -- Ownership (supports both user-level and organization-level customization)
  user_id VARCHAR(255),
  organization_id VARCHAR(255),

  -- Color customization data stored as JSONB for flexibility
  palette JSONB NOT NULL DEFAULT '{}',
  overrides JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),

  -- Constraints
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_preference UNIQUE (user_id),
  CONSTRAINT unique_org_preference UNIQUE (organization_id),
  CONSTRAINT check_ownership CHECK (
    (user_id IS NOT NULL AND organization_id IS NULL) OR
    (user_id IS NULL AND organization_id IS NOT NULL)
  ),

  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_organization_id (organization_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Option 2: Separate Tables for Palette and Overrides

```sql
-- Base color palette table
CREATE TABLE color_palettes (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  organization_id VARCHAR(255),

  -- Base palette colors
  primary_color VARCHAR(7) NOT NULL,
  secondary_color VARCHAR(7),

  -- Neutral colors
  neutral_light VARCHAR(7) NOT NULL,
  neutral_base VARCHAR(7) NOT NULL,
  neutral_dark VARCHAR(7) NOT NULL,

  -- Semantic colors
  error_color VARCHAR(7) NOT NULL,
  warning_color VARCHAR(7),
  success_color VARCHAR(7),
  info_color VARCHAR(7),

  -- Text colors
  text_primary VARCHAR(7) NOT NULL,
  text_secondary VARCHAR(7) NOT NULL,

  -- Background colors
  background_base VARCHAR(7) NOT NULL,
  background_card VARCHAR(7) NOT NULL,
  background_dashboard VARCHAR(7) NOT NULL,
  background_sidebar VARCHAR(7) NOT NULL,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_palette UNIQUE (user_id),
  CONSTRAINT unique_org_palette UNIQUE (organization_id)
);

-- Color overrides table (for specific component colors)
CREATE TABLE color_overrides (
  id VARCHAR(255) PRIMARY KEY,
  palette_id VARCHAR(255) NOT NULL,

  -- Override key-value pairs
  override_key VARCHAR(100) NOT NULL,
  override_value VARCHAR(7) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_palette FOREIGN KEY (palette_id) REFERENCES color_palettes(id) ON DELETE CASCADE,
  CONSTRAINT unique_palette_key UNIQUE (palette_id, override_key),
  INDEX idx_palette_id (palette_id)
);
```

### Recommended: Option 1 (JSONB)

**Advantages:**

- Flexible schema that can accommodate future color additions
- Easier to query and update
- Better performance with PostgreSQL JSONB indexing
- Simpler API implementation
- Matches the frontend structure directly

---

## API Endpoints

### 1. Get User Color Preferences

```typescript
GET /api/personalization/colors
GET /api/personalization/colors?userId={userId}
GET /api/personalization/colors?organizationId={orgId}

Response:
{
  "palette": {
    "primary": "#2c91cc",
    "neutral": {
      "light": "#FAFAFA",
      "base": "#999999",
      "dark": "#6b7280"
    },
    "semantic": {
      "error": "#FF0000"
    },
    "text": {
      "primary": "#010101",
      "secondary": "#6b7280"
    },
    "background": {
      "base": "#EFF8FF",
      "card": "#FFFFFF",
      "dashboard": "#FFFFFF",
      "sidebar": "#FAFAFA"
    }
  },
  "overrides": {
    "inputBackgroundColor": "#FFFFFF",
    "buttonDefaultBackgroundColor": "#2c91cc",
    // ... other overrides
  }
}
```

### 2. Save User Color Preferences

```typescript
POST /api/personalization/colors
PUT /api/personalization/colors/{preferenceId}

Request Body:
{
  "palette": {
    "primary": "#2c91cc",
    "neutral": { ... },
    "semantic": { ... },
    "text": { ... },
    "background": { ... }
  },
  "overrides": {
    "inputBackgroundColor": "#FFFFFF",
    // ... other overrides
  }
}

Response:
{
  "id": "pref_123",
  "userId": "user_456",
  "palette": { ... },
  "overrides": { ... },
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 3. Reset to Default Colors

```typescript
DELETE /api/personalization/colors/{preferenceId}
POST /api/personalization/colors/reset

Response:
{
  "message": "Color preferences reset to default",
  "defaults": { ... }
}
```

### 4. Get Available Color Groups (for form generation)

```typescript
GET /api/personalization/colors/schema

Response:
{
  "groups": [
    {
      "name": "backgrounds",
      "label": "Background Colors",
      "fields": [
        { "key": "base", "label": "Base Background", "type": "color" },
        { "key": "card", "label": "Card Background", "type": "color" },
        // ...
      ]
    },
    {
      "name": "inputs",
      "label": "Input Fields",
      "fields": [ ... ]
    },
    // ... other groups
  ]
}
```

---

## Data Structure

### Palette Structure (matches BaseColorPalette interface)

```typescript
interface BaseColorPalette {
  primary: string; // e.g., "#2c91cc"
  secondary?: string;
  neutral: {
    light: string; // e.g., "#FAFAFA"
    base: string; // e.g., "#999999"
    dark: string; // e.g., "#6b7280"
  };
  semantic: {
    error: string; // e.g., "#FF0000"
    warning?: string;
    success?: string;
    info?: string;
  };
  text: {
    primary: string; // e.g., "#010101"
    secondary: string; // e.g., "#6b7280"
  };
  background: {
    base: string; // e.g., "#EFF8FF"
    card: string; // e.g., "#FFFFFF"
    dashboard: string; // e.g., "#FFFFFF"
    sidebar: string; // e.g., "#FAFAFA"
  };
}
```

### Overrides Structure (flat key-value pairs)

```typescript
interface ColorOverrides {
  // Backgrounds
  background?: string;
  cardBackground?: string;
  dashboardBackground?: string;
  sidebarBackground?: string;

  // Text
  titleColor?: string;
  labelColor?: string;
  descriptionColor?: string;

  // Inputs
  inputBackgroundColor?: string;
  inputDisabledColor?: string;
  inputTextColor?: string;
  inputPlaceholderColor?: string;
  inputBorderColor?: string;
  inputBorderFocusColor?: string;
  inputErrorColor?: string;
  inputBorderDisabledColor?: string;
  inputRingColor?: string;

  // Buttons
  buttonDefaultBackgroundColor?: string;
  buttonDefaultTextColor?: string;
  buttonOutlineBackgroundColor?: string;
  buttonOutlineBorderColor?: string;
  buttonOutlineTextColor?: string;
  buttonDisabledBackgroundColor?: string;
  buttonDisabledTextColor?: string;
  buttonHoverBackgroundColor?: string;
  buttonHoverTextColor?: string;

  // Sidebar
  sidebarMenuItemActiveColor?: string;
  sidebarMenuItemIconActiveColor?: string;
  sidebarMenuItemTextActiveColor?: string;
  sidebarMenuItemTextInactiveColor?: string;
  sidebarMenuItemIconInactiveColor?: string;
  sidebarFooterSignOutButtonBackgroundColor?: string;
  sidebarFooterSignOutButtonTextColor?: string;
  sidebarFooterSignOutButtonIconColor?: string;
  sidebarFooterBackgroundColor?: string;

  // Header
  headerBackgroundColor?: string;
  headerTextColor?: string;
  headerIconColor?: string;

  // Stats Cards
  statsCardTitleColor?: string;
  statsCardValueColor?: string;
  statsCardTrendTextColor?: string;
  statsCardTrendTextColorPositive?: string;
  statsCardTrendIconColorPositive?: string;
  statsCardTrendTextColorNegative?: string;
  statsCardTrendIconColorNegative?: string;
  statsCardHistoricalDataLabelColor?: string;
  statsCardHistoricalDataValueColor?: string;
  totalAssetsBackgroundColor?: string;
  totalAssetsIconColor?: string;
  newRequestsBackgroundColor?: string;
  newRequestsIconColor?: string;
  approvedAssetsBackgroundColor?: string;
  approvedAssetsIconColor?: string;
  rejectedAssetsBackgroundColor?: string;
  rejectedAssetsIconColor?: string;
  pendingApprovalBackgroundColor?: string;
  pendingApprovalIconColor?: string;

  // Card Header
  cardHeaderBackgroundColor?: string;
  cardHeaderTextColor?: string;

  // Request Cards
  requestCardTextColor?: string;
  requestCardBackgroundColor?: string;
  requestCardViewButtonBackgroundColor?: string;
  requestCardViewButtonTextColor?: string;
  requestCardViewButtonBorderColor?: string;
  requestCardApproveButtonBackgroundColor?: string;
  requestCardApproveButtonTextColor?: string;
  requestCardRejectedButtonBackgroundColor?: string;
  requestCardRejectedButtonTextColor?: string;
  requestCardRejectedButtonBorderColor?: string;

  // Accordions
  AccordionPurpleBackgroundColor?: string;
  AccordionPurpleBorderColor?: string;
  AccordionPurpleOfferIdBackgroundColor?: string;
  AccordionPurpleOfferIdTextColor?: string;
  AccordionBlueBackgroundColor?: string;
  AccordionBlueBorderColor?: string;
  AccordionBlueOfferIdBackgroundColor?: string;
  AccordionBlueOfferIdTextColor?: string;
}
```

---

## Implementation Steps

### Step 1: Create Database Migration

1. Create migration file for `color_preferences` table
2. Run migration on development database
3. Test table creation and constraints

### Step 2: Create Service Layer

```typescript
// services/personalization.service.ts

export async function getUserColorPreferences(userId: string) {
  // Query database for user's color preferences
  // Return { palette, overrides } or null if not found
}

export async function saveUserColorPreferences(
  userId: string,
  palette: Partial<BaseColorPalette>,
  overrides: ColorOverrides
) {
  // Save or update color preferences in database
  // Handle both user-level and organization-level preferences
}

export async function resetUserColorPreferences(userId: string) {
  // Delete user's color preferences to revert to defaults
}
```

### Step 3: Create API Routes

1. Implement GET endpoint to fetch preferences
2. Implement POST/PUT endpoint to save preferences
3. Implement DELETE endpoint to reset preferences
4. Add authentication middleware
5. Add validation for color values (hex format)

### Step 4: Update Frontend Integration

1. Modify `getVariables()` function in `variables.ts` to:
   - Check for user preferences in database
   - Load preferences on user login
   - Cache preferences to avoid repeated queries
   - Fall back to defaults if no preferences exist

2. Create personalization form component that:
   - Uses the grouped color structure
   - Saves preferences via API
   - Provides live preview

### Step 5: Add Caching Layer

1. Implement Redis caching for color preferences
2. Cache key: `color_prefs:${userId}`
3. Invalidate cache on preference updates
4. Set TTL: 1 hour (or appropriate duration)

---

## Example Queries

### PostgreSQL (JSONB)

```sql
-- Get user color preferences
SELECT palette, overrides
FROM color_preferences
WHERE user_id = $1 AND is_active = true;

-- Save/Update user color preferences
INSERT INTO color_preferences (id, user_id, palette, overrides, created_by)
VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)
ON CONFLICT (user_id)
DO UPDATE SET
  palette = EXCLUDED.palette,
  overrides = EXCLUDED.overrides,
  updated_at = CURRENT_TIMESTAMP,
  updated_by = EXCLUDED.updated_by;

-- Get specific override value
SELECT overrides->>'inputBackgroundColor' as input_bg
FROM color_preferences
WHERE user_id = $1;

-- Query users with custom primary color
SELECT user_id, palette->>'primary' as primary_color
FROM color_preferences
WHERE palette->>'primary' != '#2c91cc';
```

### MySQL/MariaDB (JSON)

```sql
-- Get user color preferences
SELECT palette, overrides
FROM color_preferences
WHERE user_id = ? AND is_active = true;

-- Save/Update user color preferences
INSERT INTO color_preferences (id, user_id, palette, overrides, created_by)
VALUES (?, ?, JSON_OBJECT(...), JSON_OBJECT(...), ?)
ON DUPLICATE KEY UPDATE
  palette = VALUES(palette),
  overrides = VALUES(overrides),
  updated_at = CURRENT_TIMESTAMP,
  updated_by = VALUES(updated_by);

-- Get specific override value
SELECT JSON_EXTRACT(overrides, '$.inputBackgroundColor') as input_bg
FROM color_preferences
WHERE user_id = ?;
```

---

## Migration Strategy

### Phase 1: Database Setup

- [ ] Create `color_preferences` table
- [ ] Add indexes for performance
- [ ] Test with sample data

### Phase 2: Backend API

- [ ] Implement service layer functions
- [ ] Create API endpoints
- [ ] Add validation and error handling
- [ ] Write unit tests

### Phase 3: Frontend Integration

- [ ] Update `getVariables()` to load from database
- [ ] Create personalization form UI
- [ ] Add save/reset functionality
- [ ] Implement caching strategy

### Phase 4: Testing

- [ ] Test with multiple users
- [ ] Test organization-level preferences
- [ ] Test fallback to defaults
- [ ] Performance testing with caching

### Phase 5: Deployment

- [ ] Run migration on staging
- [ ] Test in staging environment
- [ ] Run migration on production
- [ ] Monitor performance

---

## Validation Rules

### Color Format Validation

```typescript
// All color values must be valid hex colors
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

function validateColorValue(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

// Validate entire palette
function validatePalette(palette: Partial<BaseColorPalette>): ValidationResult {
  // Check all color values are valid hex
  // Return errors for invalid colors
}
```

### Required Fields

- `primary` color is required in palette
- `neutral.base` is required in palette
- `semantic.error` is required in palette
- `text.primary` and `text.secondary` are required in palette
- All background colors are required in palette

---

## Security Considerations

1. **Authentication**: Only authenticated users can save their own preferences
2. **Authorization**: Admins can manage organization-level preferences
3. **Input Validation**: Validate all color values are valid hex codes
4. **Rate Limiting**: Limit preference update requests to prevent abuse
5. **Data Sanitization**: Sanitize all input before storing in database

---

## Performance Optimization

1. **Caching**: Cache user preferences in Redis/memory
2. **Lazy Loading**: Load preferences only when needed
3. **Batch Updates**: Support batch color updates
4. **Indexing**: Index `user_id` and `organization_id` for fast lookups
5. **JSONB Indexing**: Use GIN indexes on JSONB columns (PostgreSQL)

---

## Testing Checklist

- [ ] Unit tests for service layer functions
- [ ] Integration tests for API endpoints
- [ ] Test with valid color values
- [ ] Test with invalid color values (should fail validation)
- [ ] Test user-level preferences
- [ ] Test organization-level preferences
- [ ] Test fallback to defaults when no preferences exist
- [ ] Test preference updates
- [ ] Test preference deletion/reset
- [ ] Test caching behavior
- [ ] Performance tests with large datasets

---

## Related Files

- Frontend: `components/_variables/variables.ts`
- Type Definitions: `components/_variables/variables.ts` (GroupedColors interface)
- API Routes: `app/api/personalization/colors/route.ts` (to be created)
- Service: `services/personalization.service.ts` (to be created)
- Schema: `lib/schema.ts` (add color_preferences table)

---

## Notes

- The frontend structure supports both grouped access (`colors.inputs.background`) and flat access (`colors.inputBackgroundColor`) for backward compatibility
- Consider implementing a color preview feature in the personalization form
- Future enhancements could include:
  - Color theme presets
  - Dark mode support
  - Color accessibility validation (WCAG compliance)
  - Export/import color preferences
