# Debug Logging Guide - Stuck Job Rescuer

## Overview

Comprehensive debug logging has been added to the admin reset endpoint to verify:
1. API endpoint is being triggered
2. Correct SQL logic is executed
3. Rows are being updated properly

## Endpoint Location

**File:** `app/api/admin/creatives/reset-stuck-scanning/route.ts`  
**Method:** `POST`  
**Path:** `/api/admin/creatives/reset-stuck-scanning`

## Debug Logs Added

### 1. Function Entry
```
RESET STUCK JOB ENDPOINT HIT
```
- Confirms API endpoint is being called
- Logged immediately when function executes

### 2. Authentication Check
```
✅ Admin authenticated: { userId, role }
```
- Confirms admin authorization passed
- Shows which admin user triggered the endpoint

### 3. Query Parameters
```
📊 Query Parameters:
- thresholdMinutes: 30
- stuckThreshold: ISO timestamp
- currentTime: ISO timestamp
- statusFilter: "SCANNING"
- timeCondition: SQL condition string
```
- Shows all query parameters before execution
- Displays the threshold time calculation

### 4. Before SELECT Query
```
🔍 EXECUTING STUCK JOB RESET QUERY (SELECT)
Query Details:
- table: "creatives"
- whereConditions: [array of conditions]
- selectFields: [array of fields]
```
- Logs query structure before SELECT execution
- Shows table name and WHERE conditions

### 5. SELECT Query Result
```
📋 SELECT Query Result:
- rowsFound: count
- creativeIds: [array]
- details: [full row data]
```
- Shows how many rows were found
- Displays all matching creative IDs
- Includes full row details for verification

### 6. Before UPDATE Query
```
🔧 EXECUTING STUCK JOB RESET QUERY (UPDATE)
Update Query Details:
- table: "creatives"
- whereConditions: [array]
- updateFields: { object }
- affectedRows: count
- creativeIds: [array]
```
- Logs UPDATE query structure
- Shows all fields being updated
- Displays expected affected row count

### 7. After UPDATE Query
```
✅ ROWS UPDATED: <count>
Update Result:
- rowsAffected: count
- creativeIds: [array]
- newStatus: "pending"
- updatedAt: ISO timestamp
```
- **CRITICAL:** Confirms actual rows updated
- Shows final result with all details

### 8. Error Handling
```
❌ ERROR in reset stuck job endpoint: <error>
```
- Logs any errors that occur
- Includes full error details

## How to Use

### 1. Trigger the Endpoint
```bash
curl -X POST http://localhost:3000/api/admin/creatives/reset-stuck-scanning \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"
```

### 2. Check Console Output
All debug logs will appear in:
- **Development:** Browser console / terminal
- **Production:** Server logs (Vercel logs, etc.)

### 3. Verify Execution Flow

**Expected Flow:**
1. ✅ "RESET STUCK JOB ENDPOINT HIT" appears
2. ✅ "Admin authenticated" appears
3. ✅ "Query Parameters" shows correct threshold
4. ✅ "EXECUTING STUCK JOB RESET QUERY (SELECT)" appears
5. ✅ "SELECT Query Result" shows found rows
6. ✅ "EXECUTING STUCK JOB RESET QUERY (UPDATE)" appears
7. ✅ "ROWS UPDATED: X" shows actual count

**If No Rows Found:**
- "No stuck creatives found - returning early"
- No UPDATE query executed (as expected)

## Current Configuration

- **Threshold:** 30 minutes (configurable via `STUCK_THRESHOLD_MINUTES`)
- **Status Filter:** `status = 'SCANNING'`
- **Time Condition:** `status_updated_at < (now - 30 minutes)`
- **Reset To:** `status = 'pending'`

## SQL Query Structure

The endpoint executes two queries:

### SELECT Query (Find Stuck Rows)
```sql
SELECT id, status, status_updated_at, scan_attempts
FROM creatives
WHERE status = 'SCANNING'
  AND status_updated_at < '<threshold_timestamp>'
```

### UPDATE Query (Reset Stuck Rows)
```sql
UPDATE creatives
SET 
  status = 'pending',
  status_updated_at = '<current_timestamp>',
  updated_at = '<current_timestamp>',
  last_scan_error = COALESCE(last_scan_error, 'Reset by admin: stuck in SCANNING status for >30 minutes')
WHERE status = 'SCANNING'
  AND status_updated_at < '<threshold_timestamp>'
```

## Troubleshooting

### If "RESET STUCK JOB ENDPOINT HIT" doesn't appear:
- Endpoint is not being called
- Check API route path
- Verify HTTP method (must be POST)

### If "UNAUTHORIZED" appears:
- Admin authentication failed
- Check session cookie
- Verify user role is "admin"

### If "ROWS UPDATED: 0" but rows exist:
- Check threshold time (currently 30 minutes)
- Verify rows actually have `status = 'SCANNING'`
- Check `status_updated_at` timestamps in database
- Rows may be too fresh (< 30 minutes old)

### If UPDATE query doesn't execute:
- SELECT query found 0 rows
- This is expected behavior if no stuck rows exist

## Removing Debug Logs

Once verification is complete, remove all `console.log()` statements and keep only the structured `logger.info()` and `logger.error()` calls for production logging.
