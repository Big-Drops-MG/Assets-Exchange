# Secure GET Endpoint: /api/admin/audit-logs

## Overview

**Endpoint:** `GET /api/admin/audit-logs`  
**Purpose:** Enable administrators to search and filter audit logs  
**Status:** ✅ **FULLY IMPLEMENTED**

---

## 1. Authentication & Authorization

### Implementation

**File:** `app/api/admin/audit-logs/route.ts` (lines 148-160, 162-170)

**Authentication Mechanism:**

- Uses existing `auth.api.getSession()` from BetterAuth
- Session-based authentication (reuses existing system)
- Validates session token from request headers

**Authorization Check:**

```typescript
function requireAdmin(session) {
  if (!session?.user) {
    return { authorized: false, error: "Unauthorized" };
  }

  const role = session.user.role;

  // Only admin or administrator roles allowed
  if (role !== "admin" && role !== "administrator") {
    return { authorized: false, error: "Unauthorized" };
  }

  return { authorized: true, session };
}
```

**Error Responses:**

- **401 Unauthorized:** No session or invalid session
- **401 Unauthorized:** User role is not admin/administrator

**Reuses Existing System:**

- ✅ Uses `auth.api.getSession()` (same as other admin endpoints)
- ✅ Uses same role checking pattern as `app/api/admin/requests/route.ts`
- ✅ Consistent with existing admin authentication mechanism

---

## 2. Filtering Support

### Query Parameters

All filters are **optional** and can be combined.

#### 2.1 AdminID Filter

**Parameter:** `adminId`  
**Type:** `string` (Note: Database uses CUID format, not integer)  
**Required:** No  
**Description:** Filter by specific administrator user ID

**Example:**

```
GET /api/admin/audit-logs?adminId=clx123abc
```

**Implementation:**

- Validates as non-empty string (CUID format)
- Maps to database column: `user_id`
- Uses indexed column for performance

**Note:** While you specified "integer", the system uses CUID (string) format for user IDs. This is consistent with the existing schema.

---

#### 2.2 Date Range Filter

**Parameters:** `startDate`, `endDate`  
**Type:** `string` (ISO 8601 format)  
**Required:** No (can use one or both)  
**Format:** `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`

**Examples:**

```
GET /api/admin/audit-logs?startDate=2024-01-01&endDate=2024-01-31
GET /api/admin/audit-logs?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z
```

**Behavior:**

- **Only `startDate`:** Returns logs from `startDate` to now
- **Only `endDate`:** Returns logs from beginning to `endDate`
- **Both provided:** Returns logs between dates (inclusive)
- **Date normalization:**
  - Date-only strings: `startDate` → 00:00:00, `endDate` → 23:59:59.999
  - Full timestamps: Used as-is

**Implementation:**

- Validates ISO 8601 format
- Ensures `startDate <= endDate`
- Maps to database column: `created_at`
- Uses indexed column for performance

---

#### 2.3 ActionType Filter

**Parameter:** `actionType`  
**Type:** `enum` - `"APPROVE"` or `"REJECT"`  
**Required:** No  
**Case Handling:** Case-insensitive input (normalized to uppercase)

**Examples:**

```
GET /api/admin/audit-logs?actionType=APPROVE
GET /api/admin/audit-logs?actionType=REJECT
GET /api/admin/audit-logs?actionType=approve  (normalized to APPROVE)
```

**Validation:**

- Must be exactly `"APPROVE"` or `"REJECT"`
- Invalid values return `400 Bad Request`
- Maps to database column: `action`
- Uses indexed column for performance

---

## 3. Response Format

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "clx123abc",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "adminId": "admin_user_id_123",
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

### Required Fields (Per Your Specification)

| Field              | Type   | Description                             | Status     |
| ------------------ | ------ | --------------------------------------- | ---------- |
| `timestamp`        | string | ISO 8601 timestamp of action            | ✅ Present |
| `adminId`          | string | Administrator user ID                   | ✅ Present |
| `actionType`       | string | Action type: APPROVE or REJECT          | ✅ Present |
| `affectedResource` | string | Resource affected (entityType:entityId) | ✅ Present |
| `details`          | object | Additional metadata                     | ✅ Present |

### Additional Fields (Included)

- `id` - Unique audit log entry ID
- `entityType` - Type of entity
- `entityId` - ID of entity
- `ipAddress` - Request IP address
- `userAgent` - User agent string
- `createdAt` - Same as timestamp (for backward compatibility)

**Note:** `affectedResource` is constructed as `entityType:entityId` (or just `entityType` if `entityId` is null) to provide a human-readable resource identifier.

---

## 4. Error Handling

### 4.1 Authentication Errors

**401 Unauthorized:**

```json
{
  "error": "Unauthorized"
}
```

**Causes:**

- No session token provided
- Invalid or expired session
- User role is not admin/administrator

### 4.2 Validation Errors

**400 Bad Request:**

```json
{
  "error": "actionType must be APPROVE or REJECT (actionType)"
}
```

**Common Validation Errors:**

- Invalid `actionType` (not APPROVE or REJECT)
- Invalid date format (not ISO 8601)
- `startDate` > `endDate`
- Invalid `page` or `limit` values

**Examples:**

```json
{
  "error": "Invalid startDate format. Expected ISO 8601 date string."
}
```

```json
{
  "error": "startDate must be less than or equal to endDate"
}
```

### 4.3 Server Errors

**500 Internal Server Error:**

```json
{
  "error": "Internal server error"
}
```

**Causes:**

- Database connection issues
- Unexpected errors during query execution
- Service layer failures

**Error Logging:**

- Errors are logged server-side with full details
- Client receives generic error message (prevents information leakage)

---

## Implementation Details

### File Structure

**Route Handler:**

- **File:** `app/api/admin/audit-logs/route.ts`
- **Responsibilities:**
  - HTTP request/response handling
  - Authentication/authorization
  - Query parameter parsing and validation
  - Error handling and response formatting

**Service Layer:**

- **File:** `features/admin/services/auditLogs.service.ts`
- **Responsibilities:**
  - Dynamic query building
  - Database interaction
  - Data transformation
  - Pagination logic

**Validation:**

- **File:** `lib/validations/admin.ts`
- **Schema:** `auditLogsQuerySchema`
- **Responsibilities:**
  - Type-safe parameter validation
  - Constraint enforcement
  - Error message generation

### Authentication Flow

```
1. Request arrives at GET /api/admin/audit-logs
   ↓
2. Extract session from headers via auth.api.getSession()
   ↓
3. Check if session exists
   ↓ (No session → 401)
4. Check if user role is admin or administrator
   ↓ (Not admin → 401)
5. Proceed with request processing
```

### Filtering Logic

**Dynamic Query Building:**

```typescript
const where: SQL[] = [];

// Conditionally add filters
if (adminId) {
  where.push(eq(auditLogs.userId, adminId));
}

if (actionType) {
  where.push(eq(auditLogs.action, actionType));
}

if (startDate) {
  where.push(gte(auditLogs.createdAt, startDate));
}

if (endDate) {
  where.push(lte(auditLogs.createdAt, endDate));
}

// Combine all filters
const whereClause = where.length > 0 ? and(...where) : undefined;
```

**Performance:**

- All filters use indexed columns
- Single query adapts to provided filters
- No full table scans

---

## Example Requests

### 1. Get All Recent Logs

```
GET /api/admin/audit-logs
```

Returns first 20 most recent logs

### 2. Filter by AdminID

```
GET /api/admin/audit-logs?adminId=clx123abc
```

Returns all logs for that admin

### 3. Filter by ActionType

```
GET /api/admin/audit-logs?actionType=APPROVE
```

Returns only APPROVE actions

### 4. Filter by Date Range

```
GET /api/admin/audit-logs?startDate=2024-01-01&endDate=2024-01-31
```

Returns logs from January 2024

### 5. Combined Filters

```
GET /api/admin/audit-logs?adminId=clx123abc&actionType=REJECT&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50
```

Returns REJECT actions by specific admin in date range

---

## Security Features

### ✅ Implemented

1. **Session-Based Authentication**
   - Validates session token
   - Checks session expiration
   - Reuses existing auth system

2. **Role-Based Authorization**
   - Verifies admin/administrator role
   - Consistent with other admin endpoints
   - Prevents unauthorized access

3. **Input Validation**
   - All parameters validated before database access
   - Type-safe validation with Zod
   - Prevents SQL injection (via Drizzle ORM)

4. **Error Handling**
   - Generic error messages to clients
   - Detailed logging server-side
   - Appropriate HTTP status codes

5. **Performance**
   - Indexed columns for all filters
   - Pagination to prevent large result sets
   - Efficient query execution

---

## Database Schema

**Table:** `public.audit_logs`

| Column        | Type      | Maps To                                           | Indexed                   |
| ------------- | --------- | ------------------------------------------------- | ------------------------- |
| `id`          | text (PK) | Response `id`                                     | ✅ Primary Key            |
| `user_id`     | text      | Query `adminId`, Response `adminId`               | ✅ `idx_audit_user`       |
| `action`      | text      | Query `actionType`, Response `actionType`         | ✅ `idx_audit_action`     |
| `created_at`  | timestamp | Query `startDate`/`endDate`, Response `timestamp` | ✅ `idx_audit_created_at` |
| `entity_type` | text      | Response `entityType`, `affectedResource`         | ❌                        |
| `entity_id`   | text      | Response `entityId`, `affectedResource`           | ❌                        |
| `details`     | jsonb     | Response `details`                                | ❌                        |

---

## Compliance Checklist

### ✅ Authentication & Authorization

- [x] Validates admin token/session
- [x] Confirms administrative role
- [x] Returns 401 for unauthorized access
- [x] Reuses existing admin authentication mechanism

### ✅ Filtering

- [x] AdminID filter supported (as string/CUID)
- [x] DateRange filter (startDate and endDate in ISO 8601)
- [x] ActionType filter (APPROVE, REJECT enum)

### ✅ Response

- [x] Returns JSON array of matching audit logs
- [x] Includes `timestamp` field
- [x] Includes `adminId` field
- [x] Includes `actionType` field
- [x] Includes `affectedResource` field
- [x] Includes `details` field

### ✅ Error Handling

- [x] Appropriate error messages for invalid parameters
- [x] Internal server error handling
- [x] Proper HTTP status codes

---

## Status

✅ **FULLY IMPLEMENTED AND SECURE**

The endpoint is complete with:

- ✅ Secure authentication and authorization
- ✅ All required filters implemented
- ✅ Proper response format with all required fields
- ✅ Comprehensive error handling
- ✅ Performance optimizations
- ✅ Consistent with existing codebase patterns
