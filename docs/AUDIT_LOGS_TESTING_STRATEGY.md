# Audit Logs API - Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the `GET /api/admin/audit-logs` endpoint.

## Test Categories

### 1️⃣ No Filters Tests

**Purpose:** Verify default behavior when no filters are provided.

#### Test Cases:

1. **Returns Latest Logs**
   - **Request:** `GET /api/admin/audit-logs`
   - **Expected:** Returns logs sorted by `createdAt DESC` (latest first)
   - **Assertions:**
     - Status: 200
     - Response has `data` array
     - Response has `meta` object
     - Logs are sorted by date (newest first)

2. **Pagination Works**
   - **Request:** `GET /api/admin/audit-logs?page=1&limit=10`
   - **Expected:** Returns first 10 logs
   - **Request:** `GET /api/admin/audit-logs?page=2&limit=10`
   - **Expected:** Returns next 10 logs (different from page 1)
   - **Assertions:**
     - `meta.page` matches requested page
     - `meta.limit` matches requested limit
     - `meta.total` is accurate
     - `meta.totalPages` is calculated correctly
     - Page 1 and Page 2 return different results

3. **Default Pagination**
   - **Request:** `GET /api/admin/audit-logs` (no page/limit)
   - **Expected:** Uses defaults (page=1, limit=20)
   - **Assertions:**
     - `meta.page` is 1
     - `meta.limit` is 20
     - Returns at most 20 items

---

### 2️⃣ Single Filters Tests

**Purpose:** Verify each filter works independently.

#### Test Cases:

1. **Filter by adminId Only**
   - **Request:** `GET /api/admin/audit-logs?adminId=clx123abc`
   - **Expected:** Returns only logs for that admin
   - **Assertions:**
     - All logs have `adminId === "clx123abc"`
     - Status: 200

2. **Filter by actionType=APPROVE Only**
   - **Request:** `GET /api/admin/audit-logs?actionType=APPROVE`
   - **Expected:** Returns only APPROVE actions
   - **Assertions:**
     - All logs have `actionType === "APPROVE"`
     - Status: 200

3. **Filter by actionType=REJECT Only**
   - **Request:** `GET /api/admin/audit-logs?actionType=REJECT`
   - **Expected:** Returns only REJECT actions
   - **Assertions:**
     - All logs have `actionType === "REJECT"`
     - Status: 200

4. **Filter by startDate Only**
   - **Request:** `GET /api/admin/audit-logs?startDate=2024-01-01`
   - **Expected:** Returns logs from 2024-01-01 onwards
   - **Assertions:**
     - All logs have `createdAt >= 2024-01-01T00:00:00.000Z`
     - Status: 200

5. **Filter by endDate Only**
   - **Request:** `GET /api/admin/audit-logs?endDate=2024-12-31`
   - **Expected:** Returns logs up to 2024-12-31
   - **Assertions:**
     - All logs have `createdAt <= 2024-12-31T23:59:59.999Z`
     - Status: 200

6. **Filter by Date Range**
   - **Request:** `GET /api/admin/audit-logs?startDate=2024-01-01&endDate=2024-01-31`
   - **Expected:** Returns logs within date range
   - **Assertions:**
     - All logs are within the date range (inclusive)
     - Status: 200

---

### 3️⃣ Combined Filters Tests

**Purpose:** Verify filters work together correctly.

#### Test Cases:

1. **adminId + actionType**
   - **Request:** `GET /api/admin/audit-logs?adminId=clx123abc&actionType=APPROVE`
   - **Expected:** Returns APPROVE actions by that admin only
   - **Assertions:**
     - All logs match both filters
     - Status: 200

2. **actionType + Date Range**
   - **Request:** `GET /api/admin/audit-logs?actionType=REJECT&startDate=2024-01-01&endDate=2024-01-31`
   - **Expected:** Returns REJECT actions within date range
   - **Assertions:**
     - All logs match all filters
     - Status: 200

3. **All Three Filters Together**
   - **Request:** `GET /api/admin/audit-logs?adminId=clx123abc&actionType=APPROVE&startDate=2024-01-01&endDate=2024-01-31`
   - **Expected:** Returns APPROVE actions by that admin within date range
   - **Assertions:**
     - All logs match all three filters
     - Status: 200

---

### 4️⃣ Invalid Inputs Tests

**Purpose:** Verify validation rejects invalid inputs.

#### Test Cases:

1. **Invalid actionType**
   - **Request:** `GET /api/admin/audit-logs?actionType=INVALID`
   - **Expected:** 400 Bad Request
   - **Assertions:**
     - Status: 400
     - Error message mentions "actionType"
     - Error message mentions "APPROVE" or "REJECT"

2. **Invalid Date Format**
   - **Request:** `GET /api/admin/audit-logs?startDate=invalid-date`
   - **Expected:** 400 Bad Request
   - **Assertions:**
     - Status: 400
     - Error message mentions "date" or "format"

3. **startDate > endDate**
   - **Request:** `GET /api/admin/audit-logs?startDate=2024-12-31&endDate=2024-01-01`
   - **Expected:** 400 Bad Request
   - **Assertions:**
     - Status: 400
     - Error message mentions "startDate" and "endDate"

4. **Invalid Page Number**
   - **Request:** `GET /api/admin/audit-logs?page=0`
   - **Expected:** 400 Bad Request
   - **Assertions:**
     - Status: 400
     - Error message mentions "page"

5. **Invalid Limit (Too High)**
   - **Request:** `GET /api/admin/audit-logs?limit=200`
   - **Expected:** 400 Bad Request
   - **Assertions:**
     - Status: 400
     - Error message mentions "limit" or "max"

6. **Invalid Limit (Too Low)**
   - **Request:** `GET /api/admin/audit-logs?limit=0`
   - **Expected:** 400 Bad Request
   - **Assertions:**
     - Status: 400
     - Error message mentions "limit" or "min"

---

### 5️⃣ Auth Tests

**Purpose:** Verify access control works correctly.

#### Test Cases:

1. **Non-Admin User Denied**
   - **Request:** `GET /api/admin/audit-logs` (with advertiser session)
   - **Expected:** 401 Unauthorized
   - **Assertions:**
     - Status: 401
     - Error: "Unauthorized"

2. **Unauthenticated User Denied**
   - **Request:** `GET /api/admin/audit-logs` (no session)
   - **Expected:** 401 Unauthorized
   - **Assertions:**
     - Status: 401
     - Error: "Unauthorized"

3. **Admin User Allowed**
   - **Request:** `GET /api/admin/audit-logs` (with admin session)
   - **Expected:** 200 OK
   - **Assertions:**
     - Status: 200
     - Returns data

4. **Administrator User Allowed**
   - **Request:** `GET /api/admin/audit-logs` (with administrator session)
   - **Expected:** 200 OK
   - **Assertions:**
     - Status: 200
     - Returns data

---

## Response Shape Validation

### Required Fields

Each log entry must include:
- `id` (string)
- `adminId` (string) - maps to `userId` in database
- `actionType` (string) - "APPROVE" or "REJECT"
- `createdAt` (string) - ISO 8601 timestamp
- `entityType` (string)
- `entityId` (string | null)
- `details` (object | null)
- `ipAddress` (string | null)
- `userAgent` (string | null)

### Meta Object

Must include:
- `page` (number)
- `limit` (number)
- `total` (number)
- `totalPages` (number)

### Test Cases:

1. **Correct Response Structure**
   - Verify all required fields exist
   - Verify field types are correct
   - Verify `actionType` is one of ["APPROVE", "REJECT"]

2. **Empty Results**
   - When no logs match filters, return empty array
   - `data` should be `[]`
   - `meta.total` should be `0`
   - `meta.totalPages` should be `0`

---

## Test Implementation

### Unit Tests

**File:** `__tests__/api/admin/audit-logs.test.ts`

- Test service layer independently
- Mock database responses
- Test query building logic
- Test validation logic

### Integration Tests

**File:** `__tests__/api/admin/audit-logs.integration.test.ts`

- Test full request/response cycle
- Use test database
- Test with real authentication
- Test with real data

### Manual Testing

**Postman Collection:** `docs/postman/audit-logs.postman.json`

1. Import collection
2. Set environment variables:
   - `baseUrl`: API base URL
   - `adminToken`: Admin session token
3. Run all test cases

---

## Test Data Setup

### Prerequisites

1. **Test Database**
   - Separate test database or test schema
   - Seed with test audit logs

2. **Test Users**
   - Admin user (role: "admin")
   - Administrator user (role: "administrator")
   - Advertiser user (role: "advertiser") - for negative tests

3. **Test Audit Logs**
   - Logs with different adminIds
   - Logs with APPROVE and REJECT actions
   - Logs across different date ranges
   - At least 25 logs for pagination tests

### Seed Script

```typescript
// scripts/seed-audit-logs-test.ts
// Creates test audit logs for testing
```

---

## Performance Tests

### Test Cases:

1. **Large Dataset**
   - Test with 10,000+ audit logs
   - Verify pagination performance
   - Verify query uses indexes

2. **Complex Filters**
   - Test with all filters combined
   - Verify query performance
   - Verify index usage

3. **Date Range Queries**
   - Test with large date ranges
   - Test with small date ranges
   - Verify index usage on `createdAt`

---

## Edge Cases

### Test Cases:

1. **Empty Database**
   - Should return empty array
   - `meta.total` should be 0

2. **Very Large Page Number**
   - Should return empty array
   - `meta.totalPages` should be correct

3. **Date Edge Cases**
   - Start date = end date (same day)
   - Date in future
   - Date far in past

4. **Special Characters in adminId**
   - Should handle CUID format correctly
   - Should not cause SQL injection

---

## Continuous Integration

### GitHub Actions / CI Pipeline

1. Run unit tests on every commit
2. Run integration tests on PR
3. Run performance tests on release

### Test Coverage Goals

- Unit tests: 80%+ coverage
- Integration tests: All endpoints covered
- Edge cases: All documented cases tested

---

## Test Execution

### Run All Tests

```bash
npm test audit-logs
```

### Run Specific Test Suite

```bash
npm test audit-logs -- --grep "No Filters"
```

### Run with Coverage

```bash
npm test audit-logs -- --coverage
```

---

## Test Results Documentation

### Expected Results

All tests should pass with:
- ✅ Green checkmarks
- No warnings
- Coverage > 80%

### Failure Investigation

When tests fail:
1. Check error message
2. Verify test data setup
3. Check database state
4. Review query logs
5. Check authentication setup
