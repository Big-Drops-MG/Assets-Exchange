# Audit Logs Table Schema Analysis

## Table Information

**Table Name:** `audit_logs`  
**Schema:** `public` (default PostgreSQL schema)  
**Database:** Neon Postgres

## Schema Definition

### Source: `lib/schema.ts` (lines 502-522)

```typescript
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_audit_user").on(table.userId),
    actionIdx: index("idx_audit_action").on(table.action),
    createdAtIdx: index("idx_audit_created_at").on(table.createdAt),
  })
);
```

### SQL Migration: `drizzle/0005_same_stranger.sql`

```sql
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
```

---

## Required Fields Verification

### ✅ 1. Unique Identifier (ID)

**Field Name:** `id`  
**Database Column:** `id`  
**Type:** `text` (CUID format)  
**Constraints:**

- ✅ Primary Key
- ✅ NOT NULL
- ✅ Auto-generated using `createId()` (CUID2)

**Status:** ✅ **PRESENT**

---

### ⚠️ 2. Administrator Identifier

**Field Name:** `userId` (TypeScript)  
**Database Column:** `user_id`  
**Type:** `text`  
**Constraints:**

- ✅ NOT NULL
- ✅ Indexed (`idx_audit_user`)

**Note:** The column is named `user_id` (not `admin_id`), but it stores the administrator's user ID. In the context of audit logs for approve/reject actions, this field contains the admin user ID.

**Status:** ✅ **PRESENT** (as `user_id`)

**Mapping:**

- API Query Param: `adminId`
- TypeScript Property: `userId`
- Database Column: `user_id`
- Usage: Stores the ID of the admin user who performed the action

---

### ✅ 3. Action Indicator

**Field Name:** `action` (TypeScript)  
**Database Column:** `action`  
**Type:** `text`  
**Constraints:**

- ✅ NOT NULL
- ✅ Indexed (`idx_audit_action`)

**Expected Values:**

- `"APPROVE"` - When admin approves a request
- `"REJECT"` - When admin rejects a request

**Status:** ✅ **PRESENT**

**Note:** Currently stored as free-text (not ENUM), but validation ensures only `APPROVE` or `REJECT` values are accepted via the API.

---

### ✅ 4. Creation Timestamp

**Field Name:** `createdAt` (TypeScript)  
**Database Column:** `created_at`  
**Type:** `timestamp`  
**Constraints:**

- ✅ NOT NULL
- ✅ Default: `now()` (automatically set on insert)
- ✅ Indexed (`idx_audit_created_at`)

**Status:** ✅ **PRESENT**

---

## Additional Fields

The table also includes these optional fields:

| Field        | TypeScript   | Database Column | Type    | Nullable    | Description                               |
| ------------ | ------------ | --------------- | ------- | ----------- | ----------------------------------------- |
| `entityType` | `entityType` | `entity_type`   | `text`  | ❌ NOT NULL | Type of entity (e.g., "creative_request") |
| `entityId`   | `entityId`   | `entity_id`     | `text`  | ✅ NULL     | ID of the entity being acted upon         |
| `details`    | `details`    | `details`       | `jsonb` | ✅ NULL     | Additional metadata (JSON object)         |
| `ipAddress`  | `ipAddress`  | `ip_address`    | `text`  | ✅ NULL     | IP address of the request                 |
| `userAgent`  | `userAgent`  | `user_agent`    | `text`  | ✅ NULL     | User agent string                         |

---

## Indexes

The table has three indexes for query performance:

1. **`idx_audit_user`** - On `user_id` column
   - Used for filtering by admin ID
   - Improves query performance when filtering by `adminId`

2. **`idx_audit_action`** - On `action` column
   - Used for filtering by action type (APPROVE/REJECT)
   - Improves query performance when filtering by `actionType`

3. **`idx_audit_created_at`** - On `created_at` column
   - Used for date range filtering and sorting
   - Critical for pagination and chronological queries

---

## Field Mapping Summary

| Requirement        | TypeScript Property | Database Column | Status                    |
| ------------------ | ------------------- | --------------- | ------------------------- |
| Unique Identifier  | `id`                | `id`            | ✅ Present                |
| Administrator ID   | `userId`            | `user_id`       | ✅ Present (as `user_id`) |
| Action Indicator   | `action`            | `action`        | ✅ Present                |
| Creation Timestamp | `createdAt`         | `created_at`    | ✅ Present                |

---

## Verification Results

### ✅ All Required Fields Present

1. **Unique Identifier (ID):** ✅ `id` (text, primary key, auto-generated CUID)
2. **Administrator Identifier:** ✅ `user_id` (text, not null, indexed)
3. **Action Indicator:** ✅ `action` (text, not null, indexed) - stores "APPROVE" or "REJECT"
4. **Creation Timestamp:** ✅ `created_at` (timestamp, not null, default now(), indexed)

### Schema Consistency

- ✅ Schema definition matches SQL migration
- ✅ All required fields are NOT NULL
- ✅ Primary key is properly defined
- ✅ Indexes are created for query optimization
- ✅ Default values are set appropriately

### API Mapping

The API endpoint correctly maps query parameters to database columns:

- `adminId` → `user_id` (via `auditLogs.userId`)
- `actionType` → `action` (via `auditLogs.action`)
- `startDate`/`endDate` → `created_at` (via `auditLogs.createdAt`)

---

## Conclusion

**All required fields are present and properly configured:**

✅ **ID** - Primary key, auto-generated CUID  
✅ **Admin ID** - Stored as `user_id`, indexed for performance  
✅ **Action** - Stores "APPROVE" or "REJECT", indexed for filtering  
✅ **Created At** - Timestamp with default, indexed for sorting/filtering

The schema is complete and ready for the audit logs API endpoint.
