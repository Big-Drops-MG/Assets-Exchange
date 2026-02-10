# Batch A/B Testing - Manual Test Checklist

## Prerequisites

- Admin access to /ops dashboard
- At least 3-5 assets available in the system
- Access to database or API to verify data

---

## Test 1: Create Batch A with Assets

**Steps:**

1. Navigate to /ops dashboard
2. Click on "Batch A/B Testing" card
3. Enter batch label: "Test Batch A"
4. Select 2-3 assets from the list
5. Click "Create Batch & Assign Assets"

**Expected Results:**

- ✅ Loading spinner shows during creation
- ✅ Success message appears: "Batch created and assets assigned successfully"
- ✅ Form clears (label empty, no assets selected)
- ✅ Batch appears in "Batches & Assets" list
- ✅ Batch shows correct asset count
- ✅ Batch status is "active"

**Verify:**

- Check database: batch exists in `batches` table
- Check database: assets exist in `batch_assets` table with correct `batch_id`

---

## Test 2: Create Batch B with Assets

**Steps:**

1. Enter batch label: "Test Batch B"
2. Select 2-3 different assets (or some overlapping)
3. Click "Create Batch & Assign Assets"

**Expected Results:**

- ✅ Batch B created successfully
- ✅ Both Batch A and Batch B visible in list
- ✅ Asset counts are correct
- ✅ No duplicate assignments (same asset can't be in both batches)

**Verify:**

- Database: Both batches exist
- Database: Assets correctly assigned

---

## Test 3: Move Asset from Batch A to Batch B

**Steps:**

1. Expand Batch A in "Batches & Assets" table
2. Find an asset in Batch A
3. Click "Move to batch..." dropdown
4. Select "Test Batch B"
5. Confirm the move in dialog

**Expected Results:**

- ✅ Confirmation dialog appears
- ✅ Asset moves from Batch A to Batch B
- ✅ Batch A asset count decreases by 1
- ✅ Batch B asset count increases by 1
- ✅ Asset no longer appears in Batch A
- ✅ Asset appears in Batch B
- ✅ Success toast: "Asset moved to batch"
- ✅ Analytics refresh automatically

**Verify:**

- Database: Asset's `batch_id` in `batch_assets` changed from A to B
- Database: Only one record exists for this asset (no duplicates)

---

## Test 4: Remove Asset from Batch

**Steps:**

1. Expand Batch B
2. Find an asset
3. Click trash icon to remove
4. Confirm removal in dialog

**Expected Results:**

- ✅ Confirmation dialog appears (destructive variant)
- ✅ Asset removed from Batch B
- ✅ Batch B asset count decreases
- ✅ Asset no longer appears in Batch B list
- ✅ Success toast: "Asset removed from batch"
- ✅ Analytics refresh automatically

**Verify:**

- Database: Asset record removed from `batch_assets` table
- Database: Asset still exists in `assets_table` (not deleted)

---

## Test 5: Record Impressions & Clicks

**Steps:**

1. Note the asset IDs in Batch A and Batch B
2. Use API or database to insert impressions/clicks for assets in batches:
   - Insert 100 impressions for Batch A assets
   - Insert 50 impressions for Batch B assets
   - Insert 10 clicks for Batch A assets
   - Insert 5 clicks for Batch B assets
3. Ensure `batch_id` is set correctly in impressions/clicks tables

**Expected Results:**

- ✅ Impressions recorded with correct `batch_id`
- ✅ Clicks recorded with correct `batch_id`
- ✅ Analytics reflect the new data

**Verify:**

- Database: `impressions` table has `batch_id` set
- Database: `clicks` table has `batch_id` set
- UI: Batch Performance shows correct counts

---

## Test 6: Compare A vs B

**Steps:**

1. In "Batch Comparison (A vs B)" section
2. Select "Test Batch A" as Batch A
3. Select "Test Batch B" as Batch B
4. Wait for comparison to load

**Expected Results:**

- ✅ Loading spinner shows
- ✅ Comparison table displays:
  - Batch A: 100 impressions, 10 clicks, 10.00% CTR
  - Batch B: 50 impressions, 5 clicks, 10.00% CTR
  - Difference row shows: +50 impressions, +5 clicks, +0.00% CTR
- ✅ Metrics are correctly calculated
- ✅ Layout doesn't break

**Verify:**

- Calculations are correct
- CTR handles zero impressions gracefully

---

## Test 7: Test Empty Batch

**Steps:**

1. Create a new batch "Test Empty Batch" with no assets
2. View the batch in "Batches & Assets" list
3. Expand the batch

**Expected Results:**

- ✅ Batch appears in list with 0 assets
- ✅ Expanding shows: "No assets in this batch"
- ✅ Batch appears in comparison dropdown (if active)
- ✅ Analytics shows 0 impressions, 0 clicks, 0.00% CTR

**Verify:**

- Database: Batch exists with no `batch_assets` records
- UI: Empty state displays correctly

---

## Test 8: Test Batch with Zero Clicks

**Steps:**

1. Create batch "Test Zero Clicks"
2. Add assets to batch
3. Record impressions but no clicks for these assets
4. View analytics

**Expected Results:**

- ✅ Impressions count shows correctly
- ✅ Clicks shows 0
- ✅ CTR shows 0.00% (not NaN or error)
- ✅ No division by zero errors
- ✅ Comparison works correctly

**Verify:**

- Database: Impressions have `batch_id`, clicks have `batch_id` (or null)
- UI: CTR calculation handles zero clicks gracefully

---

## Test 9: Error Handling

**Steps:**

1. Try to create batch with empty label
2. Try to create batch with no assets selected
3. Try to create duplicate batch label
4. Try to move asset to same batch
5. Disconnect network and try operations

**Expected Results:**

- ✅ Validation errors show clearly
- ✅ Duplicate label error: "Batch with label 'X' already exists"
- ✅ Network errors show retry button
- ✅ All errors are user-friendly
- ✅ UI doesn't break on errors

---

## Test 10: Regression - Existing /ops Features

**Steps:**

1. Test all other /ops cards:
   - Active Jobs
   - Failed Jobs
   - Dead Letter Queue
   - Error Rate
   - Latency
   - Daily Stats
   - Audit Logs

**Expected Results:**

- ✅ All existing cards work correctly
- ✅ No layout issues
- ✅ No broken functionality
- ✅ Performance not degraded

---

## Test 11: Edge Cases

**Steps:**

1. Create batch with very long label (100+ chars)
2. Create batch with special characters in label
3. Try to assign same asset twice to same batch
4. Try to move asset that doesn't exist
5. Try to remove asset that's not in batch

**Expected Results:**

- ✅ Long labels handled (truncated or wrapped)
- ✅ Special characters handled
- ✅ Duplicate assignment prevented
- ✅ Invalid operations show clear errors

---

## Test 12: Performance & Loading States

**Steps:**

1. Create batch with 50+ assets
2. Load batches list with many batches
3. Expand multiple batches simultaneously
4. Perform operations while loading

**Expected Results:**

- ✅ Loading states show correctly
- ✅ No UI freezing
- ✅ Operations complete in reasonable time
- ✅ Timeouts work (30s limit)

---

## Bugs Found & Fixed

### Bug 1: Partial Batch Creation on Asset Assignment Failure ✅ FIXED

**Issue:** If asset assignment fails after batch creation, batch exists but is incomplete.
**Fix:** Modified `handleCreateBatch` to:

- Track successful vs failed assignments
- Continue with all assignments even if some fail
- Show appropriate error message if any assignments fail
- Still refresh UI to show partially created batch
- Clear form only if all assignments succeed

### Bug 2: CTR Calculation with Zero Impressions ✅ VERIFIED

**Issue:** Division by zero possible in CTR calculation.
**Status:** Already handled in `calculateCTR` function - returns 0 if impressions is 0.
**Additional Fix:** Added null/NaN checks in all UI display locations for CTR values.

### Bug 3: Missing Refresh After Operations ✅ FIXED

**Issue:** Some operations don't refresh the batches list.
**Fix:** All operations now call `fetchBatchesList()` and `fetchBatchAnalytics()`:

- After batch creation
- After asset removal
- After asset move

### Bug 4: Comparison with Missing Batch Data ✅ FIXED

**Issue:** If batch has no analytics data, comparison might break with null/undefined errors.
**Fix:** Added comprehensive null checks:

- All CTR calculations check for null/NaN before calling `.toFixed()`
- All impression/click displays use nullish coalescing (`?? 0`)
- Comparison table handles missing data gracefully
- Empty state shows when no batch performance data available

### Bug 5: Error State Blocking Retries ✅ FIXED

**Issue:** useEffect conditions checked for `!error` which prevented retries after errors.
**Fix:** Removed error state checks from useEffect conditions:

- `fetchBatchAnalytics` - removed `!batchAnalyticsError` check
- `fetchAssetsList` - removed `!assetsListError` check
- `fetchBatchesList` - removed `!batchesListError` check

### Bug 6: Missing Retry Buttons ✅ FIXED

**Issue:** Error states didn't have retry functionality.
**Fix:** Added retry buttons to all error states:

- Assets list error
- Batch analytics error
- Batches list error
- Comparison error
- All retry buttons show loading state while retrying

### Bug 7: No Timeout Protection ✅ FIXED

**Issue:** Requests could hang indefinitely, leaving UI stuck in loading state.
**Fix:** Added 30-second timeout with AbortController to all fetch functions:

- `fetchBatchAnalytics`
- `fetchAssetsList`
- `fetchBatchesList`
- `fetchComparison`

### Bug 8: Null Safety in Display Values ✅ FIXED

**Issue:** Potential null/undefined errors when displaying metrics.
**Fix:** Added nullish coalescing and NaN checks:

- All CTR displays check for null/NaN
- All impression/click displays use `?? 0`
- Comparison calculations handle missing data
- Batch performance list handles empty data

---

## Test Results Summary

| Test                      | Status     | Notes |
| ------------------------- | ---------- | ----- |
| Create Batch A            | ⏳ Pending |       |
| Create Batch B            | ⏳ Pending |       |
| Move Asset A→B            | ⏳ Pending |       |
| Remove Asset              | ⏳ Pending |       |
| Record Impressions/Clicks | ⏳ Pending |       |
| Compare A vs B            | ⏳ Pending |       |
| Empty Batch               | ⏳ Pending |       |
| Zero Clicks               | ⏳ Pending |       |
| Error Handling            | ⏳ Pending |       |
| Regression Tests          | ⏳ Pending |       |
| Edge Cases                | ⏳ Pending |       |
| Performance               | ⏳ Pending |       |

---

## Notes

- All tests should be performed in a test/staging environment
- Database should be backed up before testing
- Test data should be cleaned up after testing
