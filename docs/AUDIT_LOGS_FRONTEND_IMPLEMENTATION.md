# Audit Logs Frontend Implementation

## Overview

The audit logs filtering and display functionality has been fully implemented in the Admin Dashboard.

---

## API Endpoint Updates

### New Query Parameters

The `GET /api/admin/audit-logs` endpoint now accepts:

| Parameter    | Type          | Description                             | Format                    |
| ------------ | ------------- | --------------------------------------- | ------------------------- |
| `adminID`    | string/number | Filter by administrator ID              | Any string/number         |
| `dateFrom`   | string        | Filter logs from this date (inclusive)  | `YYYY-MM-DD`              |
| `dateTo`     | string        | Filter logs up to this date (inclusive) | `YYYY-MM-DD`              |
| `actionType` | enum          | Filter by action type                   | `"APPROVE"` or `"REJECT"` |

**Backward Compatibility:** The endpoint also supports the old parameter names (`adminId`, `from`, `to`, `action`) for backward compatibility.

### Validation Rules

1. **adminID**: Accepts any string/number (validated as non-empty)
2. **dateFrom/dateTo**: Must be valid dates in `YYYY-MM-DD` format
3. **actionType**: Must be `"APPROVE"` or `"REJECT"`
4. **Date Range**: `dateFrom` must be ≤ `dateTo`

---

## Frontend Component: AuditLogsTable

### Location

`features/admin/components/AuditLogsTable.tsx`

### Features

#### 1. Filter Controls

**Action Type Dropdown:**

- Options: "All", "Approve", "Reject"
- Default: "All" (returns all action types)

**Admin ID Input:**

- Text input field
- Validates numeric format on search
- Supports Enter key to trigger search

**Date Pickers:**

- `dateFrom`: Calendar picker for start date
- `dateTo`: Calendar picker for end date
- Uses `date-fns` for date formatting
- Displays selected dates in `YYYY-MM-DD` format

**Search Button:**

- Triggers API request with current filter values
- Shows loading state during request
- Validates inputs before making request

#### 2. Data Table

**Columns:**

- ID (truncated for display)
- Admin ID
- Action (with color-coded badges: green for APPROVE, red for REJECT)
- Timestamp (formatted as `YYYY-MM-DD HH:mm:ss`)
- Entity Type
- Entity ID
- Details (truncated JSON preview)

#### 3. Pagination

- Shows current page and total pages
- Displays total result count
- Previous/Next buttons
- Disabled states when at first/last page
- Maintains filters when changing pages

#### 4. Error Handling

- Displays error messages in the UI
- Shows toast notifications for validation errors
- Handles empty result sets gracefully
- Loading states during API requests

---

## Integration

### Added to AdminDashboard

The `AuditLogsTable` component has been added to the `AdminDashboard` component:

```tsx
import { AuditLogsTable } from "./AuditLogsTable";

// In the component:
<AuditLogsTable />;
```

### Component Structure

```
AdminDashboard
├── Admin Tools Section
├── Stats Cards
├── AdminPerformanceChart
├── Request Component
├── Response Component
└── AuditLogsTable (NEW)
    ├── Filter Section
    │   ├── Admin ID Input
    │   ├── Action Type Dropdown
    │   ├── Date From Picker
    │   ├── Date To Picker
    │   └── Search Button
    └── Results Section
        ├── Data Table
        └── Pagination Controls
```

---

## User Flow

1. **Initial Load:**
   - Component loads with default filters (no filters applied)
   - Fetches first page of all audit logs

2. **Filtering:**
   - User selects filters (Admin ID, Action Type, Date Range)
   - Clicks "Search" button
   - Component validates inputs
   - Makes API request with filter parameters
   - Updates table with filtered results
   - Resets to page 1

3. **Pagination:**
   - User clicks Previous/Next buttons
   - Component maintains current filters
   - Fetches new page with same filters
   - Updates table with new page results

4. **Error Handling:**
   - Invalid inputs show toast notifications
   - API errors display in error section
   - Empty results show friendly message

---

## Validation

### Client-Side Validation

1. **Admin ID:**
   - Validates numeric format (if provided)
   - Shows error if non-numeric value entered

2. **Date Range:**
   - Validates `dateFrom ≤ dateTo`
   - Shows error if invalid range

3. **Action Type:**
   - Always valid (dropdown selection)

### Server-Side Validation

- All inputs validated by Zod schema
- Date format validation
- Date range validation
- Returns appropriate error messages

---

## API Request Example

```typescript
// Example request with all filters
GET /api/admin/audit-logs?adminID=123&actionType=APPROVE&dateFrom=2024-01-01&dateTo=2024-01-31&page=1&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx123abc",
      "admin_id": "123",
      "action": "APPROVE",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "entityType": "creative_request",
      "entityId": "req_456",
      "details": { ... },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## UI Components Used

- `Button` - Search button and pagination
- `Input` - Admin ID input field
- `Select` - Action Type dropdown
- `Calendar` - Date pickers
- `Popover` - Date picker container
- `Table` - Data table display
- `Label` - Form labels
- `toast` - Error notifications

---

## Status

✅ **FULLY IMPLEMENTED**

- ✅ API endpoint updated with new parameter names
- ✅ Validation schema updated
- ✅ AuditLogsTable component created
- ✅ Filters implemented (Admin ID, Action Type, Date Range)
- ✅ Search functionality working
- ✅ Table display with all required columns
- ✅ Pagination functional with filters
- ✅ Error handling implemented
- ✅ Integrated into AdminDashboard

---

## Testing Checklist

- [x] Action Type dropdown works (All, Approve, Reject)
- [x] Admin ID input accepts values
- [x] Date pickers work correctly
- [x] Search button triggers API request
- [x] Filters are applied correctly
- [x] Table displays results
- [x] Pagination works with filters
- [x] Error handling works
- [x] Empty results handled gracefully
- [x] Loading states display correctly
