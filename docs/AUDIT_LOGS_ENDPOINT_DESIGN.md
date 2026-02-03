# GET /api/admin/audit-logs Endpoint Design

## Overview

**Endpoint:** `GET /api/admin/audit-logs`  
**Purpose:** Allow administrators to search and filter audit logs  
**Status:** ✅ **FULLY IMPLEMENTED**

---

## Query Parameters

All query parameters are **optional** and can be combined.

### 1. adminId

**Parameter:** `adminId`  
**Type:** `string` (UUID v4 or CUID format)  
**Required:** No  
**Validation Rules:**

- Must be a valid UUID format (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- Also accepts CUID format for backward compatibility (e.g., `clx123abc...`)
- Cannot be empty
- Maximum length: 100 characters

**Example:**

```
GET /api/admin/audit-logs?adminId=550e8400-e29b-41d4-a716-446655440000
```

**Validation Error:**

```json
{
  "error": "adminId must be a valid UUID (e.g., 550e8400-e29b-41d4-a716-446655440000) or CUID format (adminId)"
}
```

---

### 2. from

**Parameter:** `from`  
**Type:** `string` (ISO 8601 date format)  
**Required:** No  
**Validation Rules:**

- Must be a valid date in ISO 8601 format
- If only `from` is provided, filters logs from that date onwards (inclusive)
- Date-only strings (YYYY-MM-DD) are normalized to start of day (00:00:00)

**Formats Accepted:**

- Date only: `YYYY-MM-DD` (e.g., `2024-01-01`)
- Full timestamp: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., `2024-01-01T10:30:00.000Z`)

**Example:**

```
GET /api/admin/audit-logs?from=2024-01-01
```

**Behavior:**

- Returns all logs from `2024-01-01 00:00:00` onwards

**Validation Error:**

```json
{
  "error": "Invalid date format. Expected ISO 8601 date string. (from)"
}
```

---

### 3. to

**Parameter:** `to`  
**Type:** `string` (ISO 8601 date format)  
**Required:** No  
**Validation Rules:**

- Must be a valid date in ISO 8601 format
- If only `to` is provided, filters logs up to that date (inclusive)
- Date-only strings (YYYY-MM-DD) are normalized to end of day (23:59:59.999)

**Formats Accepted:**

- Date only: `YYYY-MM-DD` (e.g., `2024-01-31`)
- Full timestamp: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., `2024-01-31T23:59:59.999Z`)

**Example:**

```
GET /api/admin/audit-logs?to=2024-01-31
```

**Behavior:**

- Returns all logs up to `2024-01-31 23:59:59.999`

**Validation Error:**

```json
{
  "error": "Invalid date format. Expected ISO 8601 date string. (to)"
}
```

---

### 4. from and to (Combined)

**Validation Rules:**

- Both must be valid dates
- **Critical:** If `from` is later than `to`, returns a validation error
- When both provided, filters logs between `from` and `to` (inclusive)

**Example:**

```
GET /api/admin/audit-logs?from=2024-01-01&to=2024-01-31
```

**Behavior:**

- Returns logs from `2024-01-01 00:00:00` to `2024-01-31 23:59:59.999`

**Validation Error (from > to):**

```json
{
  "error": "from date must be less than or equal to to date (from)"
}
```

---

### 5. action

**Parameter:** `action`  
**Type:** `enum` - `"APPROVE"` or `"REJECT"`  
**Required:** No  
**Validation Rules:**

- Must be exactly `"APPROVE"` or `"REJECT"` (case-insensitive input, normalized to uppercase)
- Any other value returns a validation error

**Example:**

```
GET /api/admin/audit-logs?action=APPROVE
GET /api/admin/audit-logs?action=REJECT
GET /api/admin/audit-logs?action=approve  (normalized to APPROVE)
```

**Validation Error:**

```json
{
  "error": "Invalid enum value. Expected 'APPROVE' | 'REJECT', received 'INVALID' (action)"
}
```

---

## Validation Rules Summary

| Parameter     | Validation Rule                   | Error Message                                           |
| ------------- | --------------------------------- | ------------------------------------------------------- |
| `adminId`     | Must be valid UUID or CUID format | "adminId must be a valid UUID..."                       |
| `action`      | Must be "APPROVE" or "REJECT"     | "Invalid enum value. Expected 'APPROVE' \| 'REJECT'..." |
| `from`        | Must be valid ISO 8601 date       | "Invalid date format. Expected ISO 8601 date string."   |
| `to`          | Must be valid ISO 8601 date       | "Invalid date format. Expected ISO 8601 date string."   |
| `from` & `to` | `from` must be ≤ `to`             | "from date must be less than or equal to to date"       |

---

## Response Format

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "clx123abc",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "adminId": "550e8400-e29b-41d4-a716-446655440000",
      "actionType": "APPROVE",
      "affectedResource": "creative_request:req_456",
      "entityType": "creative_request",
      "entityId": "req_456",
      "details": {
        "requestId": "req_456",
        "offerName": "Example Offer",
        "comments": "Looks good"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00.000Z"
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

## Error Responses

### 400 Bad Request - Validation Errors

All validation errors return `400 Bad Request` with a descriptive error message:

```json
{
  "error": "adminId must be a valid UUID (e.g., 550e8400-e29b-41d4-a716-446655440000) or CUID format (adminId)"
}
```

```json
{
  "error": "Invalid enum value. Expected 'APPROVE' | 'REJECT', received 'INVALID' (action)"
}
```

```json
{
  "error": "Invalid date format. Expected ISO 8601 date string. (from)"
}
```

```json
{
  "error": "from date must be less than or equal to to date (from)"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

**Causes:**

- No session token
- Invalid/expired session
- User is not an admin/administrator

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Example Requests

### 1. Filter by AdminID

```
GET /api/admin/audit-logs?adminId=550e8400-e29b-41d4-a716-446655440000
```

### 2. Filter by Action

```
GET /api/admin/audit-logs?action=APPROVE
```

### 3. Filter by Date Range (from only)

```
GET /api/admin/audit-logs?from=2024-01-01
```

Returns logs from January 1, 2024 onwards

### 4. Filter by Date Range (to only)

```
GET /api/admin/audit-logs?to=2024-01-31
```

Returns logs up to January 31, 2024

### 5. Filter by Date Range (from and to)

```
GET /api/admin/audit-logs?from=2024-01-01&to=2024-01-31
```

Returns logs between January 1 and January 31, 2024

### 6. Combined Filters

```
GET /api/admin/audit-logs?adminId=550e8400-e29b-41d4-a716-446655440000&action=REJECT&from=2024-01-01&to=2024-01-31
```

Returns REJECT actions by specific admin in date range

### 7. No Filters

```
GET /api/admin/audit-logs
```

Returns all recent logs (paginated)

---

## Implementation Details

### Validation Implementation

**File:** `lib/validations/admin.ts`

```typescript
// UUID v4 validation regex
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// CUID validation regex (for backward compatibility)
const cuidRegex = /^c[a-z0-9]{24}$/i;

const idSchema = z
  .string()
  .min(1, "ID cannot be empty")
  .max(100, "ID is too long")
  .refine((val) => uuidRegex.test(val) || cuidRegex.test(val), {
    message:
      "adminId must be a valid UUID (e.g., 550e8400-e29b-41d4-a716-446655440000) or CUID format",
  });

export const auditLogsQuerySchema = z
  .object({
    adminId: idSchema.optional(),
    action: z.enum(["APPROVE", "REJECT"]).optional(),
    from: isoDateStringSchema.optional(),
    to: isoDateStringSchema.optional(),
    // ... pagination params
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        const from = new Date(data.from);
        const to = new Date(data.to);
        return from <= to;
      }
      return true;
    },
    {
      message: "from date must be less than or equal to to date",
      path: ["from"],
    }
  );
```

### Route Handler

**File:** `app/api/admin/audit-logs/route.ts`

- Extracts query parameters: `adminId`, `action`, `from`, `to`
- Validates using Zod schema
- Normalizes dates (date-only strings → start/end of day)
- Validates `from <= to` relationship
- Returns appropriate error messages for validation failures

### Service Layer

**File:** `features/admin/services/auditLogs.service.ts`

- Builds dynamic WHERE clause based on provided filters
- Applies filters conditionally:
  - `adminId` → filters by `user_id`
  - `action` → filters by `action`
  - `from` → filters `created_at >= from`
  - `to` → filters `created_at <= to`
- Uses indexed columns for performance

---

## Validation Flow

```
1. Extract query parameters from URL
   ↓
2. Parse and trim values
   ↓
3. Validate using Zod schema:
   - adminId: UUID/CUID format check
   - action: APPROVE/REJECT enum check
   - from: ISO 8601 date validation
   - to: ISO 8601 date validation
   ↓
4. Additional validation:
   - Convert date strings to Date objects
   - Normalize date-only strings (start/end of day)
   - Check: from <= to
   ↓
5. If any validation fails → Return 400 with error message
   ↓
6. If all valid → Proceed to database query
```

---

## Testing Scenarios

### Valid Requests

- ✅ `?adminId=550e8400-e29b-41d4-a716-446655440000`
- ✅ `?action=APPROVE`
- ✅ `?from=2024-01-01`
- ✅ `?to=2024-01-31`
- ✅ `?from=2024-01-01&to=2024-01-31`
- ✅ `?adminId=550e8400-e29b-41d4-a716-446655440000&action=REJECT&from=2024-01-01&to=2024-01-31`

### Invalid Requests (Should Return 400)

- ❌ `?adminId=invalid-id` → Invalid UUID format
- ❌ `?action=INVALID` → Not APPROVE or REJECT
- ❌ `?from=invalid-date` → Invalid date format
- ❌ `?to=invalid-date` → Invalid date format
- ❌ `?from=2024-01-31&to=2024-01-01` → from > to
- ❌ `?action=approve` → Valid (normalized to APPROVE)

---

## Status

✅ **FULLY IMPLEMENTED**

All validation rules are implemented:

- ✅ `adminId` validated as UUID/CUID format
- ✅ `action` validated as APPROVE or REJECT
- ✅ `from` validated as valid date
- ✅ `to` validated as valid date
- ✅ `from <= to` validation enforced
- ✅ All validation errors return appropriate 400 responses
