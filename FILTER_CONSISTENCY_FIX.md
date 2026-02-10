# Filter Consistency Fix - Audit Logs Export

## Problem

The CSV export endpoint `/api/admin/audit-logs/export` and search endpoint `/api/admin/audit-logs` were using different filter parsing logic, potentially causing mismatches in results.

## Solution

Refactored both endpoints to use **shared filter building logic** to guarantee identical WHERE clauses.

## Changes Made

### 1. Created Shared Filter Builder Function

**File**: `features/admin/services/auditLogs.service.ts`

Added `buildAuditLogsWhereClause()` function that:

- Builds WHERE clause conditions from filter parameters
- Handles date normalization (endDate with time adjustment)
- Returns normalized filters for logging/verification
- **Single source of truth** for filter logic

```typescript
export function buildAuditLogsWhereClause(filters: AuditLogsFilterParams): {
  whereClause: SQL | undefined;
  normalizedFilters: { ... };
}
```

### 2. Updated Search Endpoint

**File**: `app/api/admin/audit-logs/route.ts`

- ✅ Removed duplicate `parseAndValidateQueryParams()` function
- ✅ Now uses shared `parseAuditLogsQueryParams()` from `utils.ts`
- ✅ Uses shared `buildAuditLogsWhereClause()` in service layer
- ✅ Added logging to verify filters

### 3. Updated Export Endpoint

**File**: `app/api/admin/audit-logs/export/route.ts`

- ✅ Already using shared `parseAuditLogsQueryParams()` (no change needed)
- ✅ Now uses shared `buildAuditLogsWhereClause()` in service layer
- ✅ Updated logging format to match search endpoint

### 4. Updated Service Functions

**File**: `features/admin/services/auditLogs.service.ts`

- ✅ `getAuditLogs()` now uses `buildAuditLogsWhereClause()`
- ✅ `streamAuditLogsForExport()` now uses `buildAuditLogsWhereClause()`
- ✅ Both functions generate **identical WHERE clauses**
- ✅ Added debug logging (enabled via `LOG_SQL_CONDITIONS=true`)

## Verification

### Filter Consistency Guarantees

1. **Same Query Parameter Parsing**
   - Both endpoints use `parseAuditLogsQueryParams()` from `utils.ts`
   - Same validation logic
   - Same date normalization

2. **Same WHERE Clause Building**
   - Both use `buildAuditLogsWhereClause()` function
   - Identical SQL conditions generated
   - Same date handling (endDate with time adjustment)

3. **Logging for Verification**
   - Both endpoints log filters in same format
   - Debug logging available for SQL conditions (set `LOG_SQL_CONDITIONS=true`)
   - Easy to verify both endpoints receive same filters

### Test Case: "REJECT from last 7 days"

**Query Parameters:**

```
actionType=REJECT
startDate=2024-01-01T00:00:00.000Z
endDate=2024-01-08T00:00:00.000Z
```

**Both endpoints will:**

1. Parse `actionType=REJECT` → `action = 'REJECT'`
2. Parse `startDate` → `created_at >= '2024-01-01T00:00:00.000Z'`
3. Parse `endDate` → `created_at <= '2024-01-08T23:59:59.999Z'` (time adjusted)
4. Generate identical WHERE clause:
   ```sql
   WHERE action = 'REJECT'
     AND created_at >= '2024-01-01T00:00:00.000Z'
     AND created_at <= '2024-01-08T23:59:59.999Z'
   ```

**Result**: Export returns **exactly the same rows** as search API.

## How to Verify

### Option 1: Check Logs

Both endpoints log filters in the same format:

```json
{
  "endpoint": "search" | "export",
  "filters": {
    "adminId": "...",
    "actionType": "REJECT",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-08T23:59:59.999Z"
  }
}
```

### Option 2: Enable SQL Condition Logging

Set environment variable:

```bash
LOG_SQL_CONDITIONS=true
```

This will log the normalized filters and WHERE clause status for both endpoints.

### Option 3: Manual Test

1. Search with filters: `GET /api/admin/audit-logs?actionType=REJECT&startDate=...&endDate=...`
2. Export with same filters: `GET /api/admin/audit-logs/export?actionType=REJECT&startDate=...&endDate=...`
3. Compare row counts and verify they match

## Benefits

✅ **No Duplication**: Single source of truth for filter logic
✅ **Guaranteed Consistency**: Both endpoints use same WHERE clause builder
✅ **Easy Verification**: Logging makes it easy to verify filters match
✅ **Maintainable**: Changes to filter logic only need to be made in one place
✅ **Type Safe**: Shared interfaces ensure type consistency

## Files Modified

1. `features/admin/services/auditLogs.service.ts`
   - Added `buildAuditLogsWhereClause()` function
   - Updated `getAuditLogs()` to use shared function
   - Updated `streamAuditLogsForExport()` to use shared function

2. `app/api/admin/audit-logs/route.ts`
   - Removed duplicate `parseAndValidateQueryParams()` function
   - Now uses shared `parseAuditLogsQueryParams()` from `utils.ts`
   - Added filter logging

3. `app/api/admin/audit-logs/export/route.ts`
   - Updated logging format to match search endpoint
   - (Already using shared parsing function)

## Status

✅ **COMPLETE** - Both endpoints now use identical filter logic with no duplication.
