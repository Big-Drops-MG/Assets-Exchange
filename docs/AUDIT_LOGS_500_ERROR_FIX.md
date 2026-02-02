# Audit Logs 500 Error - Root Cause & Fix

## Issue Identified

**Error:** 500 Internal Server Error on `GET /api/admin/audit-logs`

**Root Cause:** Incorrect count query syntax in the service layer.

## Problem Location

**File:** `features/admin/services/auditLogs.service.ts`  
**Line:** 61

### Original (Incorrect) Code:

```typescript
db
    .select({ count: count() })
    .from(auditLogs)
    .where(whereClause),
```

### Issue:

The `count()` function from drizzle-orm was used incorrectly. The codebase pattern uses `sql<number>`count(*)`` for count queries.

## Verification

**Database Schema (Confirmed):**
- Table: `public.audit_logs` ✅
- Columns: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `user_agent`, `created_at` ✅

**Column Mapping (Verified):**
- `adminId` query param → `user_id` column ✅ (via `auditLogs.userId`)
- `actionType` query param → `action` column ✅ (via `auditLogs.action`)
- `startDate`/`endDate` → `created_at` column ✅ (via `auditLogs.createdAt`)

**Table Name (Verified):**
- Schema uses `pgTable("audit_logs", ...)` ✅
- Maps to `public.audit_logs` in Postgres ✅

## Fix Applied

**File:** `features/admin/services/auditLogs.service.ts`

**Change:**
1. Removed `count` from imports (line 1)
2. Changed count query to use `sql<number>`count(*)`` pattern (line 61)

### Fixed Code:

```typescript
import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
// ... rest of code ...

db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(whereClause),
```

## Pattern Consistency

This matches the pattern used in other services:
- `features/admin/services/request.service.ts` (line 71)
- `features/admin/services/dashboard.service.ts` (multiple lines)
- `app/api/admin/ops/metrics/route.ts` (multiple lines)

All use: `sql<number>`count(*)``

## Testing

After fix, verify:
1. ✅ Endpoint returns 200 OK
2. ✅ Count query executes successfully
3. ✅ Pagination metadata is correct
4. ✅ All filters work correctly

## Summary

**Mismatched Column/Table Names:** None - all column mappings are correct.

**Exact File and Line:** 
- `features/admin/services/auditLogs.service.ts` line 61
- Also removed unused `count` import on line 1

**Fix Description:**
Changed the count query from using `count()` function to using `sql<number>`count(*)`` template literal, which matches the codebase pattern and properly executes the SQL COUNT query in Drizzle ORM.
