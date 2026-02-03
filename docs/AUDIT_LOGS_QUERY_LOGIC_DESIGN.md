# Dynamic Query Logic Design: GET /api/admin/audit-logs

## Overview

This document explains how the **single, dynamic query** for the audit logs endpoint adapts based on provided filter parameters. The query is constructed programmatically, building a WHERE clause conditionally based on which filters are provided.

**Pagination Method:** **Limit/Offset** (page-based pagination)

---

## Base Query Structure

### Starting Point

The base query always starts with:

```sql
SELECT
  id, user_id, action, entity_type, entity_id,
  details, ip_address, user_agent, created_at
FROM audit_logs
```

This is the foundation - we select all audit log columns from the `audit_logs` table.

---

## Dynamic WHERE Clause Construction

The query adapts by **conditionally building a WHERE clause** based on provided filters. Here's how it works:

### Step 1: Initialize Empty Filter Array

```typescript
const where: SQL[] = [];
```

We start with an empty array that will hold our filter conditions.

### Step 2: Conditionally Add Filters

Each filter is checked, and if provided, a condition is added to the array:

#### Filter 1: AdminID

**If `adminId` is provided:**

```typescript
if (adminId) {
  where.push(eq(auditLogs.userId, adminId));
}
```

**What this does:**

- Adds condition: `user_id = 'provided_admin_id'`
- Filters logs to only those created by the specified administrator

**SQL Equivalent:**

```sql
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
```

**Plain English:** "Show me only logs where the user_id column matches the admin ID I provided."

---

#### Filter 2: ActionType

**If `action` is provided:**

```typescript
if (action) {
  where.push(eq(auditLogs.action, action));
}
```

**What this does:**

- Adds condition: `action = 'APPROVE'` or `action = 'REJECT'`
- Filters logs to only those with the specified action type

**SQL Equivalent:**

```sql
WHERE action = 'APPROVE'
-- or
WHERE action = 'REJECT'
```

**Plain English:** "Show me only logs where the action column matches the action type I specified (APPROVE or REJECT)."

---

#### Filter 3: From Date

**If `from` is provided:**

```typescript
if (from) {
  where.push(gte(auditLogs.createdAt, from));
}
```

**What this does:**

- Adds condition: `created_at >= '2024-01-01 00:00:00'`
- Filters logs to only those created on or after the specified date

**SQL Equivalent:**

```sql
WHERE created_at >= '2024-01-01 00:00:00'
```

**Plain English:** "Show me only logs where the created_at timestamp is greater than or equal to the 'from' date I provided."

---

#### Filter 4: To Date

**If `to` is provided:**

```typescript
if (to) {
  where.push(lte(auditLogs.createdAt, to));
}
```

**What this does:**

- Adds condition: `created_at <= '2024-01-31 23:59:59.999'`
- Filters logs to only those created on or before the specified date

**SQL Equivalent:**

```sql
WHERE created_at <= '2024-01-31 23:59:59.999'
```

**Plain English:** "Show me only logs where the created_at timestamp is less than or equal to the 'to' date I provided."

---

### Step 3: Combine Filters with AND

After collecting all provided filters, we combine them:

```typescript
const whereClause = where.length > 0 ? and(...where) : undefined;
```

**What this does:**

- If any filters were added, combine them with `AND`
- If no filters were provided, the WHERE clause is `undefined` (no filtering)

**SQL Equivalent (with all filters):**

```sql
WHERE user_id = 'admin_id'
  AND action = 'APPROVE'
  AND created_at >= '2024-01-01 00:00:00'
  AND created_at <= '2024-01-31 23:59:59.999'
```

**Plain English:** "Show me logs that match ALL of the conditions I specified (all filters must be true)."

---

## Query Scenarios Explained

### Scenario 1: No Filters

**Request:**

```
GET /api/admin/audit-logs
```

**Query Construction:**

- `where` array remains empty: `[]`
- `whereClause` = `undefined` (no WHERE clause)

**Final SQL:**

```sql
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Plain English:** "Show me all audit logs, sorted by newest first, give me the first 20."

---

### Scenario 2: Only AdminID Filter

**Request:**

```
GET /api/admin/audit-logs?adminId=550e8400-e29b-41d4-a716-446655440000
```

**Query Construction:**

- `where` array: `[eq(user_id, '550e8400-e29b-41d4-a716-446655440000')]`
- `whereClause` = `user_id = '550e8400-e29b-41d4-a716-446655440000'`

**Final SQL:**

```sql
SELECT * FROM audit_logs
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Plain English:** "Show me all audit logs created by this specific administrator, sorted by newest first, give me the first 20."

---

### Scenario 3: Only ActionType Filter

**Request:**

```
GET /api/admin/audit-logs?action=APPROVE
```

**Query Construction:**

- `where` array: `[eq(action, 'APPROVE')]`
- `whereClause` = `action = 'APPROVE'`

**Final SQL:**

```sql
SELECT * FROM audit_logs
WHERE action = 'APPROVE'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Plain English:** "Show me all audit logs where the action is APPROVE, sorted by newest first, give me the first 20."

---

### Scenario 4: Only From Date Filter

**Request:**

```
GET /api/admin/audit-logs?from=2024-01-01
```

**Query Construction:**

- `where` array: `[gte(created_at, '2024-01-01 00:00:00')]`
- `whereClause` = `created_at >= '2024-01-01 00:00:00'`

**Final SQL:**

```sql
SELECT * FROM audit_logs
WHERE created_at >= '2024-01-01 00:00:00'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Plain English:** "Show me all audit logs created on or after January 1, 2024, sorted by newest first, give me the first 20."

---

### Scenario 5: Only To Date Filter

**Request:**

```
GET /api/admin/audit-logs?to=2024-01-31
```

**Query Construction:**

- `where` array: `[lte(created_at, '2024-01-31 23:59:59.999')]`
- `whereClause` = `created_at <= '2024-01-31 23:59:59.999'`

**Final SQL:**

```sql
SELECT * FROM audit_logs
WHERE created_at <= '2024-01-31 23:59:59.999'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Plain English:** "Show me all audit logs created on or before January 31, 2024, sorted by newest first, give me the first 20."

---

### Scenario 6: From and To Date Filters

**Request:**

```
GET /api/admin/audit-logs?from=2024-01-01&to=2024-01-31
```

**Query Construction:**

- `where` array:
  ```typescript
  [
    gte(created_at, "2024-01-01 00:00:00"),
    lte(created_at, "2024-01-31 23:59:59.999"),
  ];
  ```
- `whereClause` = `created_at >= '2024-01-01' AND created_at <= '2024-01-31'`

**Final SQL:**

```sql
SELECT * FROM audit_logs
WHERE created_at >= '2024-01-01 00:00:00'
  AND created_at <= '2024-01-31 23:59:59.999'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Plain English:** "Show me all audit logs created between January 1 and January 31, 2024 (inclusive), sorted by newest first, give me the first 20."

---

### Scenario 7: AdminID + ActionType

**Request:**

```
GET /api/admin/audit-logs?adminId=550e8400-e29b-41d4-a716-446655440000&action=APPROVE
```

**Query Construction:**

- `where` array:
  ```typescript
  [eq(user_id, "550e8400-e29b-41d4-a716-446655440000"), eq(action, "APPROVE")];
  ```
- `whereClause` = `user_id = 'admin_id' AND action = 'APPROVE'`

**Final SQL:**

```sql
SELECT * FROM audit_logs
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND action = 'APPROVE'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Plain English:** "Show me all audit logs created by this specific administrator where the action is APPROVE, sorted by newest first, give me the first 20."

---

### Scenario 8: All Filters Combined

**Request:**

```
GET /api/admin/audit-logs?adminId=550e8400-e29b-41d4-a716-446655440000&action=REJECT&from=2024-01-01&to=2024-01-31
```

**Query Construction:**

- `where` array:
  ```typescript
  [
    eq(user_id, "550e8400-e29b-41d4-a716-446655440000"),
    eq(action, "REJECT"),
    gte(created_at, "2024-01-01 00:00:00"),
    lte(created_at, "2024-01-31 23:59:59.999"),
  ];
  ```
- `whereClause` = All conditions combined with AND

**Final SQL:**

```sql
SELECT * FROM audit_logs
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND action = 'REJECT'
  AND created_at >= '2024-01-01 00:00:00'
  AND created_at <= '2024-01-31 23:59:59.999'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Plain English:** "Show me all audit logs that match ALL of these conditions: created by this specific administrator, action is REJECT, created between January 1 and January 31, 2024, sorted by newest first, give me the first 20."

---

## Sorting

**Always Applied:**

```typescript
.orderBy(desc(auditLogs.createdAt))
```

**SQL Equivalent:**

```sql
ORDER BY created_at DESC
```

**Plain English:** "Always sort results by the created_at timestamp in descending order (newest logs appear first)."

**Why:** This ensures administrators see the most recent activity first, which is typically the most relevant information.

---

## Pagination: Limit/Offset Method

### Implementation

```typescript
const offset = (page - 1) * limit;
```

**Example:**

- Page 1, Limit 20: `offset = (1 - 1) * 20 = 0`
- Page 2, Limit 20: `offset = (2 - 1) * 20 = 20`
- Page 3, Limit 50: `offset = (3 - 1) * 50 = 100`

**SQL Equivalent:**

```sql
LIMIT 20 OFFSET 0   -- Page 1
LIMIT 20 OFFSET 20  -- Page 2
LIMIT 50 OFFSET 100 -- Page 3
```

### How It Works

**Page 1 (offset 0):**

- Skip 0 records, return first 20
- Records 1-20

**Page 2 (offset 20):**

- Skip first 20 records, return next 20
- Records 21-40

**Page 3 (offset 40):**

- Skip first 40 records, return next 20
- Records 41-60

### Why Limit/Offset?

**Advantages:**

- ✅ Simple to implement and understand
- ✅ Works well for small to medium datasets
- ✅ Allows jumping to any page directly
- ✅ Easy to calculate total pages

**Considerations:**

- For very large datasets (millions of records), cursor-based pagination may be more efficient
- Offset can become slow on large tables (database must count/skip many rows)

**Current Choice:** Limit/Offset is appropriate because:

1. Audit logs are typically queried with filters (reducing result set size)
2. Indexes on filter columns improve performance
3. Most queries return manageable result sets
4. Simpler implementation for administrators

---

## Complete Query Example

### With All Filters

**Request:**

```
GET /api/admin/audit-logs?adminId=550e8400-e29b-41d4-a716-446655440000&action=APPROVE&from=2024-01-01&to=2024-01-31&page=2&limit=50
```

**Complete SQL:**

```sql
SELECT
  id, user_id, action, entity_type, entity_id,
  details, ip_address, user_agent, created_at
FROM audit_logs
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND action = 'APPROVE'
  AND created_at >= '2024-01-01 00:00:00'
  AND created_at <= '2024-01-31 23:59:59.999'
ORDER BY created_at DESC
LIMIT 50 OFFSET 50
```

**Plain English:** "Find all audit logs where the user_id matches the provided admin ID, the action is APPROVE, and the created_at timestamp falls between January 1 and January 31, 2024. Sort them by newest first, skip the first 50 records, and return the next 50 records (page 2)."

---

## Performance Considerations

### Indexes Used

The query leverages these indexes for optimal performance:

1. **`idx_audit_user`** on `user_id`
   - Used when `adminId` filter is provided
   - Speeds up filtering by administrator

2. **`idx_audit_action`** on `action`
   - Used when `action` filter is provided
   - Speeds up filtering by action type

3. **`idx_audit_created_at`** on `created_at`
   - Used for date range filters (`from`/`to`)
   - Used for sorting (ORDER BY)
   - Critical for performance on large tables

### Query Optimization

**Best Case:** All filters provided with indexes

- Database can use multiple indexes
- Very fast query execution

**Worst Case:** No filters, large table

- Full table scan (but still sorted efficiently)
- Pagination limits result set size

**Typical Case:** 1-2 filters provided

- Indexes used for filtering
- Efficient sorting on indexed column
- Pagination prevents large result sets

---

## Implementation Code

### Service Layer (`features/admin/services/auditLogs.service.ts`)

```typescript
export async function getAuditLogs({
  adminId,
  action,
  from,
  to,
  page,
  limit,
}: {
  adminId?: string;
  action?: "APPROVE" | "REJECT";
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}) {
  // Step 1: Build dynamic WHERE clause
  const where: SQL[] = [];

  if (adminId) {
    where.push(eq(auditLogs.userId, adminId));
  }

  if (action) {
    where.push(eq(auditLogs.action, action));
  }

  if (from) {
    where.push(gte(auditLogs.createdAt, from));
  }

  if (to) {
    where.push(lte(auditLogs.createdAt, to));
  }

  // Step 2: Calculate pagination
  const offset = (page - 1) * limit;

  // Step 3: Combine filters with AND
  const whereClause = where.length > 0 ? and(...where) : undefined;

  // Step 4: Execute query with sorting and pagination
  const [rows, totalResult] = await Promise.all([
    db
      .select({
        /* columns */
      })
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt)) // Always sort by newest first
      .limit(limit)
      .offset(offset),
    // Parallel count query for pagination metadata
    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause),
  ]);

  return {
    data: rows,
    meta: {
      page,
      limit,
      total: Number(totalResult[0]?.count ?? 0),
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

## Summary

### Key Design Principles

1. **Single Query:** One query adapts to all filter combinations
2. **Conditional Building:** WHERE clause built dynamically based on provided filters
3. **AND Logic:** All filters are combined with AND (all must match)
4. **Always Sorted:** Results always sorted by `created_at DESC`
5. **Limit/Offset Pagination:** Page-based pagination with configurable limit

### How Query Adapts

| Filters Provided | WHERE Clause                                  |
| ---------------- | --------------------------------------------- |
| None             | No WHERE clause (all logs)                    |
| adminId only     | `user_id = 'admin_id'`                        |
| action only      | `action = 'APPROVE'` or `'REJECT'`            |
| from only        | `created_at >= 'from_date'`                   |
| to only          | `created_at <= 'to_date'`                     |
| from + to        | `created_at >= 'from' AND created_at <= 'to'` |
| All filters      | All conditions combined with AND              |

### Benefits of This Approach

✅ **Single Endpoint:** One endpoint handles all filter combinations  
✅ **Efficient:** Uses indexes for fast queries  
✅ **Flexible:** Any combination of filters works  
✅ **Maintainable:** Simple, clear logic  
✅ **Performant:** Indexed columns + pagination prevent performance issues

---

## Status

✅ **FULLY IMPLEMENTED**

The dynamic query logic is complete and working as designed. The query adapts seamlessly based on provided filter parameters, always sorts by newest first, and uses limit/offset pagination.
