# Audit Logs API Contract

## Endpoint

```
GET /api/admin/audit-logs
```

## Authentication

- **Required**: Admin role (`role === "admin"` or `role === "administrator"`)
- **Auth Method**: Session-based via `auth.api.getSession()`
- **Unauthorized Response**: `401 Unauthorized` with `{ error: "Unauthorized" }`

## Query Parameters

All query parameters are **optional**. Any combination can be used.

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `adminId` | string | Filter by specific admin user ID | `?adminId=clx123abc` |
| `actionType` | string | Filter by action type. Must be `APPROVE` or `REJECT` (case-sensitive) | `?actionType=APPROVE` |
| `startDate` | ISO 8601 string | Start of date range (inclusive). Format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ` | `?startDate=2024-01-01` |
| `endDate` | ISO 8601 string | End of date range (inclusive). Format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ` | `?endDate=2024-01-31` |
| `page` | number | Page number for pagination (default: `1`, min: `1`) | `?page=2` |
| `limit` | number | Items per page (default: `20`, min: `1`, max: `100`) | `?limit=50` |

### Filter Combinations

All filters can be combined:

- `?adminId=clx123abc&actionType=APPROVE`
- `?startDate=2024-01-01&endDate=2024-01-31`
- `?adminId=clx123abc&actionType=REJECT&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50`
- No filters: Returns recent logs (paginated, sorted by `created_at DESC`)

### Date Range Behavior

- If only `startDate` is provided: Returns logs from `startDate` to now
- If only `endDate` is provided: Returns logs from beginning to `endDate`
- If both provided: Returns logs between `startDate` and `endDate` (inclusive)
- Date comparison uses `created_at` timestamp column

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

#### Data Array Items

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Audit log entry ID (CUID) |
| `adminId` | string | Admin user ID who performed the action |
| `actionType` | string | Action type: `APPROVE` or `REJECT` |
| `entityType` | string | Type of entity (e.g., `"creative_request"`) |
| `entityId` | string \| null | ID of the entity (nullable) |
| `details` | object \| null | Additional metadata (JSONB, nullable) |
| `ipAddress` | string \| null | IP address of the request (nullable) |
| `userAgent` | string \| null | User agent string (nullable) |
| `createdAt` | string | ISO 8601 timestamp of when the action occurred |

#### Meta Object

| Field | Type | Description |
|-------|------|-------------|
| `page` | number | Current page number |
| `limit` | number | Items per page |
| `total` | number | Total number of matching records |
| `totalPages` | number | Total number of pages (calculated: `Math.ceil(total / limit)`) |

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

#### 400 Bad Request

Invalid query parameters (e.g., invalid date format, invalid actionType):

```json
{
  "error": "Invalid startDate format. Expected ISO 8601 date string."
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Default Behavior

When no filters are provided:
- Returns most recent logs first (sorted by `created_at DESC`)
- Paginated with default `page=1` and `limit=20`
- Returns all audit logs (no filtering)

## Sorting

- **Default**: `created_at DESC` (most recent first)
- Always sorted by `created_at` timestamp
- No custom sorting parameters (consistent with existing admin endpoints)

## Database Schema Reference

The endpoint queries the `audit_logs` table:

```typescript
{
  id: string (primary key, CUID)
  userId: string (not null) - maps to admin user ID
  action: string (not null) - "APPROVE" or "REJECT"
  entityType: string (not null)
  entityId: string | null
  details: jsonb | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: timestamp (not null, indexed)
}
```

## Indexes Used

- `idx_audit_created_at` - For date range filtering and sorting
- `idx_audit_user` - For adminId filtering
- `idx_audit_action` - For actionType filtering

## Example Requests

### Get all recent logs (first page)
```
GET /api/admin/audit-logs
```

### Get logs for specific admin
```
GET /api/admin/audit-logs?adminId=clx123abc
```

### Get all APPROVE actions
```
GET /api/admin/audit-logs?actionType=APPROVE
```

### Get logs for date range
```
GET /api/admin/audit-logs?startDate=2024-01-01&endDate=2024-01-31
```

### Get REJECT actions for specific admin in date range (page 2)
```
GET /api/admin/audit-logs?adminId=clx123abc&actionType=REJECT&startDate=2024-01-01&endDate=2024-01-31&page=2&limit=50
```

## Implementation Notes

1. **Date Parsing**: Accept ISO 8601 strings. If only date part provided (YYYY-MM-DD), treat as start of day (00:00:00) for `startDate` and end of day (23:59:59) for `endDate`.

2. **Action Type Validation**: `actionType` must be exactly `"APPROVE"` or `"REJECT"` (case-sensitive). Return 400 if invalid.

3. **Pagination**: Calculate `totalPages` as `Math.ceil(total / limit)`.

4. **Empty Results**: If no logs match filters, return:
   ```json
   {
     "data": [],
     "meta": {
       "page": 1,
       "limit": 20,
       "total": 0,
       "totalPages": 0
     }
   }
   ```

5. **Performance**: Use indexed columns (`created_at`, `userId`, `action`) for efficient filtering.
