# REST API Endpoint Design: GET /api/admin/audit-logs

## Overview

**Endpoint:** `GET /api/admin/audit-logs`  
**Purpose:** Enable administrators to filter and retrieve audit logs with optional query parameters  
**Status:** ✅ **IMPLEMENTED**

---

## Endpoint Specification

### Base URL

```
GET /api/admin/audit-logs
```

### Authentication

- **Required:** Yes
- **Method:** Session-based authentication
- **Roles Allowed:** `admin` or `administrator`
- **Unauthorized Response:** `401 Unauthorized`

---

## Query Parameters

All query parameters are **optional** and can be used in any combination.

### 1. AdminID Filter

**Parameter:** `adminId`  
**Type:** `string`  
**Required:** No  
**Description:** Filter audit logs by specific administrator user ID

**Example:**

```
GET /api/admin/audit-logs?adminId=clx123abc
```

**Database Mapping:**

- Query Param: `adminId`
- Database Column: `user_id`
- Index: `idx_audit_user` (optimized for filtering)

---

### 2. Date Range Filter

**Parameters:** `startDate`, `endDate`  
**Type:** `string` (ISO 8601 format)  
**Required:** No (can use one or both)  
**Description:** Filter audit logs by creation date range

**Formats Accepted:**

- Date only: `YYYY-MM-DD` (e.g., `2024-01-01`)
- Full timestamp: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., `2024-01-01T10:30:00.000Z`)

**Behavior:**

- **Only `startDate`:** Returns logs from `startDate` to current time
- **Only `endDate`:** Returns logs from beginning to `endDate`
- **Both provided:** Returns logs between `startDate` and `endDate` (inclusive)
- **Date normalization:**
  - Date-only strings: `startDate` set to 00:00:00, `endDate` set to 23:59:59.999
  - Full timestamps: Used as-is

**Examples:**

```
GET /api/admin/audit-logs?startDate=2024-01-01
GET /api/admin/audit-logs?endDate=2024-12-31
GET /api/admin/audit-logs?startDate=2024-01-01&endDate=2024-01-31
```

**Database Mapping:**

- Query Params: `startDate`, `endDate`
- Database Column: `created_at`
- Index: `idx_audit_created_at` (optimized for range queries)

---

### 3. ActionType Filter

**Parameter:** `actionType`  
**Type:** `string` (enum)  
**Required:** No  
**Allowed Values:** `APPROVE`, `REJECT` (case-sensitive)  
**Description:** Filter audit logs by action type

**Validation:**

- Must be exactly `"APPROVE"` or `"REJECT"`
- Case-insensitive input (normalized to uppercase)
- Invalid values return `400 Bad Request`

**Examples:**

```
GET /api/admin/audit-logs?actionType=APPROVE
GET /api/admin/audit-logs?actionType=REJECT
GET /api/admin/audit-logs?actionType=approve  (normalized to APPROVE)
```

**Database Mapping:**

- Query Param: `actionType`
- Database Column: `action`
- Index: `idx_audit_action` (optimized for filtering)

---

### 4. Pagination Parameters

**Parameters:** `page`, `limit`  
**Type:** `number`  
**Required:** No (defaults provided)  
**Description:** Control pagination of results

**Defaults:**

- `page`: `1` (first page)
- `limit`: `20` (items per page)

**Constraints:**

- `page`: Minimum `1`
- `limit`: Minimum `1`, Maximum `100`

**Examples:**

```
GET /api/admin/audit-logs?page=1&limit=20
GET /api/admin/audit-logs?page=2&limit=50
```

---

## Filter Combinations

All filters can be combined in any way:

### Single Filter

```
GET /api/admin/audit-logs?adminId=clx123abc
GET /api/admin/audit-logs?actionType=APPROVE
GET /api/admin/audit-logs?startDate=2024-01-01&endDate=2024-01-31
```

### Multiple Filters

```
GET /api/admin/audit-logs?adminId=clx123abc&actionType=APPROVE
GET /api/admin/audit-logs?actionType=REJECT&startDate=2024-01-01&endDate=2024-01-31
GET /api/admin/audit-logs?adminId=clx123abc&actionType=REJECT&startDate=2024-01-01&endDate=2024-01-31&page=2&limit=50
```

### No Filters

```
GET /api/admin/audit-logs
```

Returns all recent logs (paginated, sorted by `created_at DESC`)

---

## Response Format

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "clx123abc",
      "adminId": "admin_user_id_123",
      "actionType": "APPROVE",
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

### Response Fields

**Data Array Items:**

- `id` (string) - Unique audit log entry ID (CUID)
- `adminId` (string) - Admin user ID who performed the action
- `actionType` (string) - Action type: `"APPROVE"` or `"REJECT"`
- `entityType` (string) - Type of entity (e.g., `"creative_request"`)
- `entityId` (string | null) - ID of the entity acted upon
- `details` (object | null) - Additional metadata (JSONB)
- `ipAddress` (string | null) - IP address of the request
- `userAgent` (string | null) - User agent string
- `createdAt` (string) - ISO 8601 timestamp

**Meta Object:**

- `page` (number) - Current page number
- `limit` (number) - Items per page
- `total` (number) - Total matching records
- `totalPages` (number) - Total pages (calculated)

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

**Cause:** User is not authenticated or not an admin/administrator

### 400 Bad Request

```json
{
  "error": "actionType must be APPROVE or REJECT (actionType)"
}
```

**Causes:**

- Invalid `actionType` value
- Invalid date format
- `startDate` > `endDate`
- Invalid `page` or `limit` values

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

**Cause:** Unexpected server error

---

## Implementation Details

### File Structure

**Route Handler:**

- `app/api/admin/audit-logs/route.ts`
  - Handles HTTP request/response
  - Validates query parameters
  - Enforces authentication
  - Calls service layer

**Service Layer:**

- `features/admin/services/auditLogs.service.ts`
  - Builds dynamic database queries
  - Applies filters conditionally
  - Executes queries with pagination
  - Returns formatted results

**Validation:**

- `lib/validations/admin.ts`
  - Zod schema for query parameter validation
  - Type-safe validation with error messages

### Query Building Strategy

**Dynamic Filtering:**

```typescript
const where: SQL[] = [];

if (adminId) {
  where.push(eq(auditLogs.userId, adminId)); // Uses idx_audit_user
}

if (actionType) {
  where.push(eq(auditLogs.action, actionType)); // Uses idx_audit_action
}

if (startDate) {
  where.push(gte(auditLogs.createdAt, startDate)); // Uses idx_audit_created_at
}

if (endDate) {
  where.push(lte(auditLogs.createdAt, endDate)); // Uses idx_audit_created_at
}

const whereClause = where.length > 0 ? and(...where) : undefined;
```

**Performance:**

- All filters use indexed columns
- Single query adapts based on provided filters
- Parallel execution of data and count queries
- Pagination prevents unbounded result sets

### Sorting

- **Default:** `created_at DESC` (most recent first)
- Always sorted by creation timestamp
- Uses indexed column for efficient sorting

---

## Example Use Cases

### 1. Get All Recent Audit Logs

```
GET /api/admin/audit-logs
```

Returns first 20 most recent logs

### 2. Filter by Specific Admin

```
GET /api/admin/audit-logs?adminId=clx123abc
```

Returns all logs for that admin

### 3. Filter by Action Type

```
GET /api/admin/audit-logs?actionType=APPROVE
```

Returns only APPROVE actions

### 4. Filter by Date Range

```
GET /api/admin/audit-logs?startDate=2024-01-01&endDate=2024-01-31
```

Returns logs from January 2024

### 5. Combined Filters with Pagination

```
GET /api/admin/audit-logs?adminId=clx123abc&actionType=REJECT&startDate=2024-01-01&endDate=2024-01-31&page=2&limit=50
```

Returns REJECT actions by specific admin in date range, page 2, 50 per page

---

## Database Schema

**Table:** `public.audit_logs`

| Column        | Type      | Description                  | Indexed                   |
| ------------- | --------- | ---------------------------- | ------------------------- |
| `id`          | text      | Primary key (CUID)           | ✅ Primary Key            |
| `user_id`     | text      | Admin user ID                | ✅ `idx_audit_user`       |
| `action`      | text      | Action type (APPROVE/REJECT) | ✅ `idx_audit_action`     |
| `entity_type` | text      | Entity type                  | ❌                        |
| `entity_id`   | text      | Entity ID                    | ❌                        |
| `details`     | jsonb     | Additional metadata          | ❌                        |
| `ip_address`  | text      | Request IP                   | ❌                        |
| `user_agent`  | text      | User agent                   | ❌                        |
| `created_at`  | timestamp | Creation timestamp           | ✅ `idx_audit_created_at` |

---

## Security Considerations

1. **Authentication Required:** Only admin/administrator roles can access
2. **Input Validation:** All query parameters validated before database access
3. **SQL Injection Protection:** Uses Drizzle ORM with parameterized queries
4. **Rate Limiting:** Can be added at middleware level (not currently implemented)
5. **Data Access:** All admins can see all audit logs (no tenant isolation)

---

## Performance Optimizations

1. **Indexed Columns:** All filter columns are indexed
2. **Pagination:** Enforced to prevent large result sets
3. **Parallel Queries:** Data and count queries run simultaneously
4. **Efficient Sorting:** Uses indexed `created_at` column

---

## Status

✅ **FULLY IMPLEMENTED**

The endpoint is complete and ready for use:

- ✅ Route handler implemented
- ✅ Service layer implemented
- ✅ Validation schemas in place
- ✅ Error handling configured
- ✅ All filters working
- ✅ Pagination supported
- ✅ Performance optimized

---

## Testing

See `docs/AUDIT_LOGS_TESTING_STRATEGY.md` for comprehensive test cases covering:

- No filters
- Single filters
- Combined filters
- Invalid inputs
- Authentication tests
