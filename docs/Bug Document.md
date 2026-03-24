This document lists all semantic errors found in the codebase where the code does something different from what was intended.

## 1. UI/UX Features - Buttons, Modals, Forms

### Issue #1: Download Button Doesn't Actually Download

**File:** `features/admin/components/RequestItem.tsx`  
**Lines:** 972-1060, 1310-1398, 1455-1545  
**Current Behavior:** The Download button sets `isDownloading` state to true, shows a loading spinner, displays a success toast, but never actually downloads any file. The actual download logic is commented out as TODO.  
**Intended Behavior:** The button should download the creative file(s) associated with the request.  
**Semantic Mismatch:** Button appears functional (shows loading state) but performs no actual download operation.

### Issue #2: Notify Button Doesn't Send Notifications

**File:** `features/admin/components/RequestItem.tsx`  
**Lines:** 641-713  
**Current Behavior:** The Notify button shows loading state and displays a success toast, but all actual notification logic is commented out as TODO. It only simulates with a `setTimeout`.  
**Intended Behavior:** The button should send email/notifications to publishers and advertisers based on request status.  
**Semantic Mismatch:** Button appears functional but doesn't perform the intended notification action.

### Issue #3: Empty Handler Functions in Track Page

**File:** `app/(publisher)/track/page.tsx`  
**Lines:** 623-647  
**Current Behavior:** Three handler functions are defined and passed to modals but contain no implementation:

- `handleRemoveCreative` (line 623) - Only has a comment "For read-only view in track page"
- `handleFileNameChange` (line 627) - Only has a comment "For sent-back, allow file name changes"
- `handleMetadataChange` (line 631) - Only has a comment "For sent-back, allow metadata changes"
- `handleFileUpdate` (line 642) - Only has a comment "Handle file updates after proofreading or edits"

These handlers are passed to `SingleCreativeViewModal` and `MultipleCreativesModal` components.  
**Intended Behavior:** These handlers should allow users to modify creatives when in revision mode (sent-back status).  
**Semantic Mismatch:** Modals receive handlers that do nothing, making edit functionality non-functional even when `viewOnly={false}`.

### Issue #4: Deprecated onKeyPress Event Handler

**File:** `app/page.tsx`  
**Line:** 150  
**Current Behavior:** Uses `onKeyPress` event handler which is deprecated in React.  
**Intended Behavior:** Should use `onKeyDown` instead for keyboard event handling.  
**Semantic Mismatch:** Code uses deprecated API that may stop working in future React versions.

## 2. Data Binding Issues

### Issue #5: Unused Variable \_telegramHint

**File:** `features/publisher/hooks/usePublisherForm.ts`  
**Line:** 262  
**Current Behavior:** Variable `_telegramHint` is declared and assigned but never used.  
**Intended Behavior:** This variable was likely intended to be included in the router.push query params or used elsewhere.  
**Semantic Mismatch:** Data is computed but never utilized.

### Issue #6: Empty updateFormData Function

**File:** `features/publisher/hooks/useFormValidation.ts`  
**Lines:** 31-34  
**Current Behavior:** `updateFormData` function is defined with `useCallback` but has an empty implementation (does nothing).  
**Intended Behavior:** This function should update form validation state when form data changes.  
**Semantic Mismatch:** Function exists but provides no functionality.

## 3. API/Service Calls

### Issue #7: Download Button State Management Issue

**File:** `features/admin/components/RequestItem.tsx`  
**Lines:** 1044-1059, 1382-1397, 1531-1545  
**Current Behavior:** `setIsDownloading(true)` is called at the start of the onClick handler, but since there's no actual download logic, the state is set to `false` in the finally block without any download occurring. The loading state is shown but no network request is made.  
**Intended Behavior:** Should set loading state, make API call to download endpoint, handle the response, then reset state.  
**Semantic Mismatch:** Loading state is managed but no actual API call is made.

### Issue #8: Notify Button API Call Missing

**File:** `features/admin/components/RequestItem.tsx`  
**Lines:** 641-713  
**Current Behavior:** The Notify button handler has all API call logic commented out as TODO. It only simulates with `setTimeout` and shows a toast.  
**Intended Behavior:** Should make POST request to `/api/admin/creative-requests/:id/notify` with proper request body.  
**Semantic Mismatch:** Button handler appears to make API calls but doesn't actually do so.

## 4. Event Handlers

### Issue #9: Empty Handlers Passed to Modals

**File:** `app/(publisher)/track/page.tsx`  
**Lines:** 1148-1150, 1172-1174  
**Current Behavior:** Empty handler functions (`handleFileNameChange`, `handleMetadataChange`, `handleRemoveCreative`) are passed as props to `SingleCreativeViewModal` and `MultipleCreativesModal`. These modals likely call these handlers when users try to edit, but nothing happens.  
**Intended Behavior:** These handlers should update the creative metadata, file names, or remove creatives from the pending list during revision workflow.  
**Semantic Mismatch:** Event handlers are wired but don't execute any logic.

## 5. State Management

### Issue #10: Download State Set Without Operation

**File:** `features/admin/components/RequestItem.tsx`  
**Lines:** Multiple locations (972, 1310, 1456)  
**Current Behavior:** `setIsDownloading(true)` is called, but no download operation follows. The state is immediately set back to `false` in the finally block.  
**Intended Behavior:** State should be set to true, download should occur, then state set to false.  
**Semantic Mismatch:** State management suggests an operation is happening, but none occurs.

### Issue #11: Notify State Set Without Operation

**File:** `features/admin/components/RequestItem.tsx`  
**Line:** 642  
**Current Behavior:** `setIsNotifying(true)` is called, but no actual notification API call is made. State is set to false after simulated delay.  
**Intended Behavior:** State should reflect actual notification API call progress.  
**Semantic Mismatch:** Loading state doesn't reflect actual operation status.

## 6. Routing Issues

No routing issues found. All `router.push` calls appear to have complete paths and proper query parameters.

## 7. Asset Exchange Specific Features

### Issue #12: Creative Revision Workflow Non-Functional

**File:** `app/(publisher)/track/page.tsx`  
**Lines:** 568-621, 1148-1178  
**Current Behavior:** When a creative request has "sent-back" status, users can upload new creatives and open modals for editing. However, the handlers passed to these modals (`handleFileNameChange`, `handleMetadataChange`, `handleRemoveCreative`, `handleFileUpdate`) are empty. The `handleRevisionSubmit` function exists and works, but users cannot actually edit the creatives before submitting because the edit handlers do nothing.  
**Intended Behavior:** Users should be able to edit file names, metadata (fromLines, subjectLines, additionalNotes), and remove creatives in the modals before submitting the revision.  
**Semantic Mismatch:** Revision workflow UI is present but edit functionality is non-functional.

### Issue #13: Priority Levels Missing "Low" Option

**File:** `features/publisher/components/form/_steps/CreativeDetails.tsx`  
**Line:** 298-301  
**Current Behavior:** `priorityLevels` array only contains "High" and "Medium" options.  
**Intended Behavior:** Based on the priority badge logic elsewhere in the codebase (which checks for "high", "medium", and "low"), there should also be a "Low" priority option.  
**Semantic Mismatch:** Priority selection doesn't match the full range of priorities used elsewhere in the system.

## Summary

**Total Issues Found:** 13

**By Category:**

- UI/UX Features: 4 issues
- Data Binding: 2 issues
- API/Service Calls: 2 issues
- Event Handlers: 1 issue
- State Management: 2 issues
- Asset Exchange Specific: 2 issues

**Critical Issues (Features Completely Non-Functional):**

1. Download button (3 instances)
2. Notify button
3. Creative revision edit handlers (4 empty handlers)
4. Creative revision workflow edit functionality

**Medium Priority Issues:** 5. Deprecated onKeyPress usage 6. Missing "Low" priority option 7. Unused variables/functions

These semantic errors cause features to appear functional in the UI but fail to perform their intended operations at runtime.
