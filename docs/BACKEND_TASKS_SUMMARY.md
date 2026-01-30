# Backend Tasks Summary - Completed vs Remaining

**Generated:** 2025-01-XX  
**Last Updated:** 2025-01-20  
**Based on:** Admin Architecture Test Report & Backend Sequential Plan

## 🎉 Recent Completions (January 2025)

### Telegram Bot Integration ✅

- Complete Telegram bot verification system
- Webhook and polling support
- Publisher telegramId saved immediately on verification
- Database schema updated with telegram_id fields

### Creative Metadata System ✅

- Production-ready PostgreSQL storage for creative metadata
- GET/POST endpoints for metadata management
- Database migration completed
- Supports fromLines, subjectLines, proofreadingData, htmlContent, additionalNotes

### File Upload & Content Management ✅

- HTML file upload and content retrieval
- Asset URL processing for relative paths
- File content API endpoint
- Publisher form submission with file handling

### Publisher Form Enhancements ✅

- Form submission API with Zod validation
- Offer ID display fix (proper Everflow IDs)
- Email and telegramId saved to database
- Creative metadata persistence

---

## ✅ Completed Tasks (60+ tasks)

### Phase 3.1: Admin Dashboard & Stats ✅

- ✅ Dashboard statistics API (`GET /api/admin/dashboard/stats`)
- ✅ Real-time stats with trends (today vs yesterday)
- ✅ Service: `features/admin/services/dashboard.service.ts`
- ✅ API: `app/api/admin/dashboard/stats/route.ts`

### Phase 3.2: Requests & Responses APIs ✅

- ✅ GET /api/admin/requests (pagination, filtering, search)
- ✅ GET /api/admin/requests/[id]
- ✅ POST /api/admin/requests/[id]/approve
- ✅ POST /api/admin/requests/[id]/reject
- ✅ Full CRUD operations for creative requests
- ✅ Service: `features/admin/services/request.service.ts`

### Phase 3.3: Advertiser Response APIs ✅

- ✅ GET /api/advertiser/responses
- ✅ POST /api/advertiser/responses/[id]/approve
- ✅ POST /api/advertiser/responses/[id]/send-back
- ✅ Ownership enforcement (advertisers can only access their own requests)
- ✅ Service: `features/advertiser/services/response.service.ts`

### Phase 3.4: Notifications ✅

- ✅ Workflow event notifications
- ✅ Slack/Discord webhook integration
- ✅ Service: `features/notifications/notification.service.ts`
- ✅ Types: `features/notifications/types.ts`

### Phase 3.5: Audit History ✅

- ✅ request_status_history table created
- ✅ Status change logging
- ✅ GET /api/admin/requests/[id]/history
- ✅ Service: `features/admin/services/statusHistory.service.ts`

### Phase 3.6: Offers CRUD ✅

- ✅ GET /api/admin/offers (with filtering by status)
- ✅ GET /api/admin/offers/[id]
- ✅ POST /api/admin/offers
- ✅ PUT /api/admin/offers/[id]
- ✅ DELETE /api/admin/offers/[id] (soft delete)
- ✅ POST /api/admin/offers/bulk-update (bulk update multiple offers)
- ✅ Service: `features/admin/services/offer.service.ts`

### Phase 3.7: Advertisers CRUD ✅

- ✅ GET /api/admin/advertisers (with search)
- ✅ GET /api/admin/advertisers/[id]
- ✅ POST /api/admin/advertisers
- ✅ PUT /api/admin/advertisers/[id]
- ✅ DELETE /api/admin/advertisers/[id] (soft delete)
- ✅ Service: `features/admin/services/advertiser.service.ts`

### Phase 3.8: Publishers CRUD ✅

- ✅ GET /api/admin/publishers (with search)
- ✅ GET /api/admin/publishers/[id]
- ✅ POST /api/admin/publishers
- ✅ PUT /api/admin/publishers/[id]
- ✅ DELETE /api/admin/publishers/[id] (soft delete)
- ✅ Service: `features/admin/services/publisher.service.ts`

### Phase 3.9: Brand Guidelines Management ✅

- ✅ GET /api/admin/offers/[id]/brand-guidelines (with inheritance from advertiser)
- ✅ POST /api/admin/offers/[id]/brand-guidelines (attach file - for future file uploads)
- ✅ PUT /api/admin/offers/[id]/brand-guidelines (attach URL/text types)
- ✅ DELETE /api/admin/offers/[id]/brand-guidelines (detach)
- ✅ GET /api/admin/advertisers/[id]/brand-guidelines
- ✅ PUT /api/admin/advertisers/[id]/brand-guidelines (attach URL/text types)
- ✅ DELETE /api/admin/advertisers/[id]/brand-guidelines (detach)
- ✅ Cascading brand guidelines from advertisers to offers
- ✅ Offer-specific brand guidelines override advertiser guidelines
- ✅ Smart update logic: updates inherited guidelines when advertiser guidelines change
- ✅ Service: `features/admin/services/brandGuidelines.service.ts`

### Phase 4.1: Client/Server Boundary Fixed ✅

- ✅ ViewModels refactored to use client adapters
- ✅ Client adapters created:
  - `features/admin/services/advertisers.client.ts`
  - `features/admin/services/publishers.client.ts`
  - `features/admin/services/offers.client.ts`
  - `features/admin/services/adminRequests.client.ts`
- ✅ Clean separation of concerns

### Phase 5.5: Everflow Integration ✅

- ✅ POST /api/admin/advertisers/sync (create background job for advertiser sync)
- ✅ POST /api/admin/everflow/sync (create background job for offers sync)
- ✅ Background job system for async Everflow syncs
- ✅ Job status tracking and polling
- ✅ Everflow advertiser sync service implementation
- ✅ Everflow offers sync service implementation
- ✅ Conflict resolution handling (update/skip)
- ✅ Filter support for syncing specific advertisers/offers
- ✅ Service: `features/admin/services/everflow.service.ts` (advertisers)
- ✅ Service: `features/admin/services/everflow.service.ts` (offers)

### Phase 6: Background Jobs Management ✅

- ✅ GET /api/admin/jobs (list all background jobs)
- ✅ GET /api/admin/jobs/[jobId] (get job details)
- ✅ GET /api/admin/jobs/[jobId]/events (get job events)
- ✅ POST /api/admin/jobs/[jobId]/retry (retry failed job)
- ✅ POST /api/admin/jobs/[jobId]/cancel (cancel running job)
- ✅ POST /api/admin/jobs/[jobId]/replay (replay job)
- ✅ GET /api/admin/everflow/sync-status/[jobId] (get sync job status)
- ✅ POST /api/admin/everflow/cancel/[jobId] (cancel sync job)
- ✅ GET /api/admin/everflow/active-job (get active sync job)
- ✅ Database schema: `background_jobs` table with status tracking
- ✅ Job event logging system

### Phase 7: Telegram Bot Integration ✅ (Partial)

- ✅ **POST /api/telegram/verify** - Verify Telegram ID and save to database
  - Matches publishers by email or telegramId
  - Updates existing publisher or creates new one
  - Saves telegramId immediately upon verification
- ✅ **POST /api/telegram/poll** - Poll Telegram API for new messages
  - Processes `/start` commands
  - Stores verification data in Redis
  - Sends confirmation messages
- ✅ **POST /api/telegram/webhook** - Receive updates from Telegram
  - Handles incoming messages from Telegram
  - Processes verification requests
- ✅ **GET /api/telegram/setup-webhook** - Configure Telegram webhook URL
  - Helper endpoint to set up webhook
  - Script: `scripts/setup-telegram-webhook.ts`
- ✅ **GET /api/cron/telegram-poll** - Cron job for backup polling
  - Runs every minute (configured in vercel.json)
  - Backup mechanism if webhook fails
- ✅ **Database Schema** - Enhanced publishers and creative_requests tables
  - `publishers.telegram_id` field added
  - `creative_requests.telegram_id` field added
  - `creative_requests.email` field added
- ✅ **Migration** - Migration 0008 executed successfully
- ✅ **Redis Integration** - Temporary verification storage
  - Stores verification codes with TTL
  - Used for Telegram ID verification flow
- ⏳ **GET /api/check-telegram-start** - Check Telegram verification status
  - Task: Endpoint that takes `username` and checks if `chat_id` is linked
  - Logic: Query `telegram_users` table (or publishers.telegram_id) for verification status
  - Purpose: Enables "Auto-Verify" experience on frontend
  - Priority: 🟡 **MEDIUM** - UX enhancement
  - Note: May need `telegram_users` table or use existing `publishers.telegram_id`

### Phase 8.2: Security & Validation (Partial) ✅

- ✅ **Authentication**: All API endpoints require authentication
- ✅ **Authorization**: Admin role checks enforced on all admin endpoints
- ✅ **SQL Injection Protection**: Drizzle ORM with parameterized queries (all endpoints)
- ✅ **Rate Limiting**: Implemented on brand guidelines and offers endpoints
  - `app/api/admin/advertisers/[id]/brand-guidelines/route.ts`
  - `app/api/admin/offers/[id]/brand-guidelines/route.ts`
  - `app/api/admin/offers/route.ts`
  - `app/api/admin/offers/[id]/route.ts`
  - Uses `@upstash/ratelimit` with Redis
- ✅ **Error Handling**: Consistent error responses across endpoints
- ✅ **Input Validation**: Basic validation on brand guidelines endpoints (type, url, text required)
- ✅ **Health Check**: GET /api/health endpoint implemented
- ✅ **Metrics**: GET /api/admin/ops/metrics endpoint implemented
- ⏳ **Public Offer Security Filter** - Enforce privacy constraints
  - Task: Ensure `GET /api/offers` endpoint applies `WHERE privacy = 'public' AND status = 'active'`
  - Risk: Without this, publishers could submit creatives for private/internal offers
  - Priority: 🚨 **HIGH** - Critical security gap
  - Location: `app/api/offers/route.ts`
- ⏳ **Maintenance Mode Logic** - System-wide maintenance check
  - Task: Read `maintenance_mode = true` from `system_settings` table
  - Logic: Block `POST /api/submit` requests when maintenance mode is active
  - Implementation: Middleware or API-level check
  - Priority: 🟡 **MEDIUM** - Operational requirement
- ⚠️ **Input Sanitization**: Not yet implemented (Priority 1)
- ⚠️ **Zod Schemas**: Not yet implemented for all endpoints (Priority 1)
- ⚠️ **Admin Seed Endpoint**: Not secured (Priority 1 - Critical)

### Phase 8.1: File Upload Security ⚠️

- ⚠️ **File Uploads**: Not yet implemented (blocked until Phase 8.1)
- ⚠️ **Malware Scanning**: Not implemented (required before enabling file uploads)
- ⚠️ **File Validation**: Not implemented (file type, size, MIME type checking)
- ⚠️ **File Status Tracking**: Not implemented (pending_scan, clean, infected)
- ⚠️ **File Uploads Table**: Not created in database
- ✅ **Security Note**: File uploads are correctly blocked until security infrastructure is in place
- ✅ **Current Implementation**: API returns error "File uploads are not yet supported" for file type brand guidelines

---

## ⚠️ Critical Security Issues (Priority 1)

### 1. Fix Client/Server Boundary Issues (URGENT - Blocks Build)

**Status:** ⚠️ **NOT FIXED**

- `NewOfferManuallyModal.tsx` - Still imports `getAllAdvertisers` from server service
- `AdvertiserDetailsModal.tsx` - Still imports `getAdvertiserById` from server service
- `BulkEditModal.tsx` - Still imports `bulkUpdateOffers` from server service
- **Impact:** Application cannot build/run
- **Fix:** Replace with client adapters

### 2. Secure Admin Seed Endpoint (CRITICAL Security Issue)

**Status:** ⚠️ **NOT FIXED**

- **File:** `app/api/admin/seed/route.ts`
- **Issue:** No authentication check - anyone can create admin users
- **Risk Level:** 🔴 **CRITICAL**
- **Fix:** Add admin role check or restrict to development environment only

### 3. Add Input Validation (CRITICAL Security Issue)

**Status:** ⚠️ **NOT IMPLEMENTED**

- **Issue:** No validation on API endpoints
- **Missing:**
  - Email format validation
  - String length limits
  - Required field validation
  - Search parameter sanitization
- **Files to Update:**
  - `app/api/admin/advertisers/route.ts`
  - `app/api/admin/publishers/route.ts`
  - `app/api/admin/offers/route.ts`
  - `app/api/admin/requests/[id]/reject/route.ts`
- **Fix:** Implement Zod schemas for all endpoints

### 4. Add Input Sanitization (CRITICAL Security Issue)

**Status:** ⚠️ **NOT IMPLEMENTED**

- **Issue:** User input not sanitized before storage
- **Missing:**
  - XSS protection
  - Input sanitization
  - DOMPurify for rich text content
- **Fix:** Sanitize all user input before storage

---

## ⏳ Remaining Tasks (90+ tasks)

### Phase 3.2 Performance Chart API

- ⏳ GET /api/admin/dashboard/performance?comparisonType={type}
- ⏳ Support 4 comparison types (Today vs Yesterday, Today vs Last Week, etc.)

### Phase 4.1 Request/Response Read Operations (Partial)

- ⏳ GET /api/admin/requests/recent?limit=3
- ⏳ GET /api/admin/responses/recent?limit=3
- ⏳ GET /api/admin/responses/:id
- ⏳ GET /api/admin/requests/:id/related-response
- ⏳ GET /api/admin/responses/:id/related-request

### Phase 5 Offers Management (Partial)

- ✅ POST /api/admin/offers/bulk-update (bulk update multiple offers with same changes)
- ⏳ PATCH /api/admin/offers/:id/status (activate/deactivate offer)
- ⏳ PATCH /api/admin/offers/:id/visibility (update visibility - used by dropdown in offers table)

### Phase 6 Advertisers & Publishers (Partial)

- ⏳ PATCH /api/admin/advertisers/:id/status (activate/deactivate advertiser)
- ⏳ POST /api/admin/advertisers/pull-from-api (sync from external API - different from Everflow sync)
- ⏳ PATCH /api/admin/publishers/:id/status (activate/deactivate publisher)

### Phase 7 Brand Guidelines ✅

- ✅ GET /api/admin/offers/:id/brand-guidelines (with inheritance)
- ✅ GET /api/admin/advertisers/:id/brand-guidelines
- ✅ PUT /api/admin/offers/:id/brand-guidelines (URL/text types)
- ✅ PUT /api/admin/advertisers/:id/brand-guidelines (URL/text types)
- ✅ DELETE /api/admin/offers/:id/brand-guidelines
- ✅ DELETE /api/admin/advertisers/:id/brand-guidelines
- ✅ Cascading logic: advertiser guidelines → offers (only for offers without own guidelines)
- ✅ Update logic: when advertiser guidelines change, inherited offers get updated
- ⏳ PUT /api/admin/publishers/:id/brand-guidelines (not yet implemented)

### Phase 7.1: Admin Configurable Settings API ⏳

- ⏳ **GET /api/admin/settings/form-config** - Retrieve publisher form configuration
  - Returns: JSON blob with labels, styles, toggles
  - Storage: `system_settings` table (Key: `publisher_form_config`)
  - Priority: 🚨 **HIGH** - Enables "Ditto" UI customization
- ⏳ **POST /api/admin/settings/form-config** - Update publisher form configuration
  - Accepts: JSON with custom field labels (e.g., "Yahoo ID" instead of "Email")
  - Accepts: Hex codes for Backgrounds, Inputs, Text Colors
  - Accepts: Boolean toggles (`showTelegram`, `showCompany`, etc.)
  - Validation: Ensure JSON structure matches frontend expectations
  - Priority: 🚨 **HIGH** - Critical for admin customization
- ⏳ **Database Schema** - Ensure `system_settings` table supports JSONB values
  - Current: Table exists with `key` (unique), `value` (text)
  - May need: Update to support JSONB or validate JSON string storage

### Phase 7.2: Feedback & Annotation System ⏳

- ⏳ **Database Schema** - Create `annotations` table
  - Fields: id, creative_id (FK), request_id (FK), annotator_role, annotator_id, annotation_type ('image' | 'text'), x_coordinate, y_coordinate, selected_text, comment, status ('pending' | 'resolved'), created_at, updated_at
  - Indexes: creative_id, request_id, annotator_id, status
  - Priority: 🚨 **HIGH** - Critical for review workflow
- ⏳ **POST /api/admin/annotations** - Save annotation/comment
  - Accepts: creative_id, request_id, annotation_type, x/y coordinates (for images), selected_text (for text), comment
  - Validates: Coordinates within image bounds, text selection valid
  - Stores: Annotator role and ID automatically from session
  - Priority: 🚨 **HIGH** - Core annotation functionality
- ⏳ **GET /api/admin/annotations** - List annotations for a creative/request
  - Query params: creative_id, request_id, status
  - Returns: All annotations with annotator info and timestamps
  - Priority: 🚨 **HIGH** - Display annotations in admin portal
- ⏳ **PATCH /api/admin/annotations/[id]** - Update annotation status
  - Allows: Mark as resolved, update comment
  - Validates: Only annotator or admin can update
  - Priority: 🟡 **MEDIUM** - Annotation management
- ⏳ **GET /api/public/track/[id]** - Update tracking endpoint to include annotations
  - Task: Add annotations array to tracking response
  - Purpose: Publishers can see feedback on their creatives
  - Filter: Only show annotations for the specific request
  - Priority: 🚨 **HIGH** - Publisher visibility of feedback
- ⏳ **POST /api/advertiser/annotations** - Advertiser annotation endpoint
  - Same structure as admin endpoint
  - Validates: Advertiser can only annotate their own requests
  - Priority: 🚨 **HIGH** - Advertiser review capability
- ⏳ **Service Layer** - `features/admin/services/annotation.service.ts`
  - Core annotation logic
  - Coordinate validation
  - Text selection parsing
  - Priority: 🚨 **HIGH** - Business logic implementation

### Phase 8.2 Security & Validation (Partial)

- ✅ Authentication: All endpoints require authentication
- ✅ Authorization: Admin role checks enforced
- ✅ SQL Injection Protection: Drizzle ORM parameterized queries
- ✅ Rate Limiting: Implemented on brand guidelines endpoints
- ✅ Error Handling: Consistent error responses
- ✅ Basic Input Validation: Type checking on brand guidelines endpoints
- ⏳ Add input sanitization (Priority 1)
- ⏳ Add comprehensive Zod schemas for all endpoints (Priority 1)
  - Form validation TODOs in:
    - `features/admin/components/AdvertiserDetailsModal.tsx` (line 172)
    - `features/admin/components/NewAdvertiserManuallyModal.tsx` (line 165)
  - Backend should validate all form fields (name, email, required fields, string lengths)
- ⏳ Add security headers (Priority 2)
- ⏳ Secure admin seed endpoint (Priority 1 - Critical)
- ⏳ Fix client/server boundary issues (Priority 1 - may be fixed)

### Phase 8.1 Publisher Form Upload Structure ✅ (Partial)

- ✅ **POST /api/upload endpoint** - Single file upload (HTML, images, ZIP with smart detection)
- ✅ **POST /api/upload-zip endpoint** - ZIP file extraction (via analyze-zip)
- ✅ **File storage** - Vercel Blob storage integration (`lib/fileStorage.ts`)
- ✅ **POST /api/submit endpoint** - Publisher form submission with Zod validation
- ✅ **GET /api/offers endpoint** - Fetch active offers with proper Everflow IDs
- ✅ **GET /api/files endpoint** - File content retrieval with asset URL processing
- ✅ **GET /api/creative/metadata endpoint** - Retrieve creative metadata
- ✅ **POST /api/creative/metadata endpoint** - Save/update creative metadata
- ✅ **Database schema** - `creative_metadata` table created with indexes
- ✅ **Database migration** - Migration 0006 executed successfully
- ✅ **Smart ZIP Detection Logic** - Heuristic to detect single vs multiple creatives
  - Logic: If 1 HTML file + Images → Single Creative, Otherwise → Multiple Creatives
  - Implemented in `/api/upload` with `smartDetection` parameter
  - Extracts files and uploads individually to Vercel Blob
- ⏳ **HTML Dependency Parser Service** - Parse HTML to identify asset dependencies
  - Task: Read HTML files inside ZIP, find `<img>`, `<link>`, `<script>` tags
  - Mark referenced assets as `is_dependency = true` in database
  - Prevents dependency files from cluttering dashboard
  - Priority: 🚨 **HIGH** - Critical functional gap
- ⏳ Create file_uploads database table (for tracking uploads)
- ⏳ Install and configure blob storage SDK (using Vercel Blob currently)
- ⏳ Set up storage provider abstraction layer
- ⏳ Create file validation utilities (basic validation exists)
- ⏳ **Malware Scanner Hook Activation** - Uncomment and enable malware scanning
  - Status: Code exists in `/api/upload/route.ts` but commented out
  - Task: Uncomment Python service webhook once service is stable
  - Priority: 🟡 **MEDIUM** - Pending deployment
  - Blocked: Until Python malware service is live

### Phase 9: Publisher Flow, Analytics & Ops Integration ✅ (Partial)

**Note:** Advanced features (Generative AI, Behavioral Analytics) moved to Phase 10 per requirements.

**Goal:** Turn publisher form into first-class backend workflow with tracking, grammar AI integration, and operational analytics.

**Key Principles:**

- All API calls made by Admin portal only (no direct publisher/advertiser API access)
- Single immutable approval chain: Publisher → Admin → Advertiser
- Analytics tracks operational metrics only (not approval/rejection events)
- Tracking ID system for publisher visibility
- Grammar AI integration (all calls from Admin backend)
- Ops dashboard for monitoring external calls

#### Sprint 9.1: Core Submission & Workflow Backbone ✅ (Partial)

**Database Migrations:**

- ✅ **Creative Metadata Table** - `creative_metadata` table created
  - Fields: id, creative_id (unique), from_lines, subject_lines, proofreading_data (jsonb), html_content, additional_notes, metadata (jsonb), created_at, updated_at
  - Indexes: creative_id, updated_at
- ✅ **Creative Requests Table** - Enhanced with email and telegram_id fields
  - Fields: email, telegram_id added via migration 0008
- ✅ **Publishers Table** - Enhanced with telegram_id field
  - Field: telegram_id added via migration 0008
- ⏳ Create `publisher_submissions` table (using creative_requests currently)
- ⏳ Create `creatives` table (metadata stored in creative_metadata)
- ⏳ Create `creative_files` table (files stored in blob storage)
- ⏳ Create `submission_reviews` table

**Zod Schemas:**

- ✅ **Submit Schema** - `submitSchema` in `/api/submit/route.ts` with validation
  - Validates: affiliateId, companyName, firstName, lastName, email, telegramId, offerId, creativeType, fromLines, subjectLines, priority
- ⏳ `PublisherSubmissionSchema` - comprehensive validation schema
- ⏳ `CreativeSchema` - validation for creative details
- ⏳ `FileUploadSchema` - validation for file uploads

**Backend Endpoints:**

- ✅ **POST /api/submit** - Publisher form submission endpoint
  - Validates input with Zod
  - Creates creative request in database
  - Fetches offer details
  - Calculates line counts
  - Returns request ID
- ✅ **GET /api/offers** - Fetch active offers with proper Everflow IDs
  - Returns both database ID and Everflow offer ID
  - Used by publisher form for offer selection
  - ⚠️ **SECURITY GAP**: Must enforce `WHERE privacy = 'public' AND status = 'active'`
  - Priority: 🚨 **HIGH** - Critical security requirement
- ✅ **GET /api/files** - File content retrieval
  - Fetches HTML/content from blob storage
  - Processes relative asset URLs to absolute URLs
  - Supports processAssets parameter
- ✅ **GET /api/creative/metadata** - Retrieve creative metadata
  - Fetches from database by creativeId (file URL)
  - Returns fromLines, subjectLines, proofreadingData, htmlContent, additionalNotes
- ✅ **POST /api/creative/metadata** - Save/update creative metadata
  - Upsert operation (create or update)
  - Stores metadata in PostgreSQL
- ⏳ **PATCH /api/admin/requests/[id]/metadata** - Admin metadata editing endpoint
  - Task: Allow admin to update fromLines, subjectLines, and annotations for individual files
  - Purpose: Admin portal needs to check/edit from and subject lines, plus notes
  - Endpoint: Update `specificFromLines`, `specificSubjectLines`, and `annotations` fields
  - Priority: 🚨 **HIGH** - Critical admin workflow requirement
  - Note: This is different from creative metadata - this is request-level metadata
- ⏳ **POST /api/publisher/draft** - Cross-device draft persistence
  - Task: Save form drafts to database (if cross-device support needed)
  - Current: Implemented in browser LocalStorage
  - Decision: If LocalStorage is sufficient, skip this task
  - Priority: 🔵 **LOW** - Optional enhancement
- ⏳ POST /api/admin/publisher/submissions - Create submission from form data (admin-only)
- ⏳ POST /api/admin/publisher/submissions/:id/creative - Attach creative to submission
- ⏳ POST /api/admin/publisher/submissions/:id/submit - Lock submission (make immutable)
- ⏳ GET /api/admin/publisher/submissions - List all submissions (admin view)
- ⏳ GET /api/admin/publisher/submissions/:id - Get submission details

**Service Layer:**

- ✅ **File Storage Service** - `lib/fileStorage.ts`
  - saveBuffer function for uploading to Vercel Blob
  - Returns file URL and metadata
- ⏳ `features/publisher/services/submission.service.ts` - Core submission logic
- ⏳ `features/publisher/services/file.service.ts` - File handling logic
- ⏳ Generate unique tracking ID (12 alphanumeric characters)

**Testing:**

- ✅ Submit full form → entry created in creative_requests table
- ✅ Email and telegramId saved to database
- ✅ Creative metadata can be saved and retrieved
- ✅ HTML files can be uploaded and content loaded
- ⏳ Creatives attached properly
- ⏳ Submission becomes immutable after submit
- ⏳ Tracking ID generated and unique

#### Sprint 9.2: Tracking & Status Flow ⏳

**Status Enum:**

```typescript
type SubmissionStatus =
  | "submitted"
  | "admin_review"
  | "admin_approved"
  | "admin_rejected"
  | "advertiser_review"
  | "advertiser_approved"
  | "advertiser_rejected";
```

**Backend Endpoints:**

- ⏳ GET /api/public/track/:trackingId - Public tracking page (read-only)
  - Returns: current status, admin approval state, advertiser approval state, uploaded creatives, grammar processing status
- ⏳ POST /api/admin/publisher/:id/admin-approve - Admin approves submission
- ⏳ POST /api/admin/publisher/:id/admin-reject - Admin rejects submission
- ⏳ POST /api/admin/publisher/:id/forward-to-advertiser - Move to advertiser review
- ⏳ POST /api/admin/publisher/:id/advertiser-approve - Advertiser approves (called by admin)
- ⏳ POST /api/admin/publisher/:id/advertiser-reject - Advertiser rejects (called by admin)

**Status Transition Logic:**

- ⏳ Validate status transitions (enforce workflow rules)
- ⏳ Log all status changes in `submission_reviews` table
- ⏳ Prevent invalid transitions

**Service Layer:**

- ⏳ `features/publisher/services/tracking.service.ts` - Tracking logic
- ⏳ `features/publisher/services/status.service.ts` - Status transition logic

**Testing:**

- ⏳ Status transitions are enforced
- ⏳ Invalid transitions rejected
- ⏳ Tracking page shows correct step
- ⏳ Status history is logged

### Sprint 9.3: Grammar AI Integration + Analytics ✅ (Partial)

**Grammar Model Integration:**

- Model URL: `https://grammar-correction-1-5tha.onrender.com`
- ✅ **Create `lib/services/grammar.service.ts`** - Grammar service wrapper
  - ✅ Integrated with OpenAI for Marketing Suggestions & Quality Scores
  - ✅ Image text extraction and analysis
  - ✅ HTML/Text processing
  - ✅ Client-side integration for Publisher Portal
- ⏳ All grammar calls made from Admin backend only (Currently implemented as client-side service for immediate feedback)
- ⏳ Create `external_tasks` table
  - Fields: id, source ('grammar'), submission_id, asset_id, status, task_id (external), started_at, finished_at, error

**Analytics Table:**

- ⏳ Create `external_calls` table
  - Fields: id, service, endpoint, request_size, response_time_ms, status_code, created_at
- ⏳ Log all external API calls (grammar, everflow, email, telegram)
- ⏳ Wrap external calls with logging hook

**Backend Endpoints:**

- ⏳ POST /api/admin/publisher/submissions/:id/process-grammar - Trigger grammar processing
- ⏳ GET /api/admin/publisher/submissions/:id/grammar-status - Get grammar processing status
- ⏳ POST /api/admin/publisher/submissions/:id/retry-grammar - Retry failed grammar job

**Service Layer:**

- ⏳ `features/publisher/services/grammar.service.ts` - Grammar processing logic
- ⏳ `lib/analytics/externalCalls.service.ts` - External call logging
- ⏳ Background job integration for async grammar processing

**Testing:**

- ⏳ Upload creative → grammar call logged
- ⏳ Failed calls logged with status
- ⏳ Metrics visible in Ops dashboard
- ⏳ Grammar processing works end-to-end

#### Sprint 9.4: Admin Portal Integration ⏳

**Admin Portal Changes:**

- ⏳ Update "Manage Requests" page to show publisher submissions
- ⏳ Add "View Request" functionality that shows same submission window as publisher
- ⏳ Admin can see: creatives, notes, status, tracking ID
- ⏳ Admin actions: Approve, Reject, Forward to Advertiser, Trigger Grammar Check

**Ops Dashboard Extensions:**

- ⏳ New section: "External Operations"
  - Table: External API Calls (grammar, everflow, email, telegram)
  - Metrics: Submissions per day, Approval rates, Time to approval
  - Health: Avg grammar time, Failure rate, Retry counts
- ⏳ Add "Publisher Funnel" metrics card
- ⏳ Add "Processing Health" metrics card

**UI Components:**

- ⏳ Update `ManageRequestsPage` - List + filters for publisher submissions
- ⏳ Create `SubmissionDetails` component - Read-only mirror of publisher UI
- ⏳ Update `OpsDashboard` - Add External Calls card

**Service Layer:**

- ⏳ `features/admin/services/publisherSubmissions.service.ts` - Admin submission management
- ⏳ Integration with existing request service

**Testing:**

- ⏳ Admin sees submissions
- ⏳ Can view same publisher UI
- ⏳ Ops shows grammar API calls
- ⏳ All admin actions work correctly

#### Sprint 9.5: Notifications ⏳

**Notification Triggers:**

- ⏳ On submission created → Send email + Telegram with tracking ID
- ⏳ On admin_approved → Notify publisher
- ⏳ On admin_rejected → Notify publisher
- ⏳ On advertiser_approved → Notify publisher
- ⏳ On advertiser_rejected → Notify publisher

**Notification Channels:**

- ⏳ Email notifications (with tracking ID)
- ⏳ Telegram notifications (if telegram_id provided)

**Service Layer:**

- ⏳ `features/notifications/services/publisherNotifications.service.ts` - Publisher notification logic
- ⏳ Integration with existing notification service
- ⏳ Email template for tracking ID
- ⏳ Telegram bot integration

**Testing:**

- ⏳ Email sent on submission
- ⏳ Telegram sent if ID provided
- ⏳ Status change notifications work
- ⏳ Tracking ID included in all notifications

#### Phase 9 Analytics (Operational Only) ⏳

**Metrics Tracked:**

- ⏳ submissions/day - Growth metric
- ⏳ approval_rate - Quality metric
- ⏳ avg_admin_response_time - Ops performance
- ⏳ avg_advertiser_response_time - Partner performance
- ⏳ grammar_failure_rate - AI health
- ⏳ external_api_latency - Reliability

**NOT Tracked (as per requirements):**

- ❌ submission_approved events
- ❌ submission_rejected events
- ❌ Admin moderation actions as analytics

**Analytics Service:**

- ⏳ `features/analytics/services/publisherAnalytics.service.ts` - Publisher analytics
- ⏳ `features/analytics/services/operationalAnalytics.service.ts` - Operational metrics

#### Phase 9 Security & Validation ⏳

**Security Rules:**

- ⏳ Public submit endpoint: Rate limiting + CAPTCHA (optional)
- ⏳ File scanning enforced (malware scanning)
- ⏳ No direct model exposure to publisher
- ⏳ No direct advertiser API exposure
- ⏳ Tracking endpoint is read-only
- ⏳ Admin orchestrates all transitions

**Validation:**

- ⏳ Input validation on all submission fields
- ⏳ File type and size validation
- ⏳ ZIP bomb protection
- ⏳ Tracking ID format validation (12 alphanumeric)

#### Phase 9 Testing Plan ⏳

**Manual Testing:**

- ⏳ Submit form → Receive email & telegram
- ⏳ See in Admin → Approve → Forward to advertiser
- ⏳ Track status change
- ⏳ Grammar processing success/failure
- ⏳ Replay grammar job

**Failure Scenarios:**

- ⏳ Broken grammar model
- ⏳ Telegram fail
- ⏳ Email fail
- ⏳ Duplicate submission
- ⏳ Invalid status transitions

#### Phase 9 Completion Criteria ⏳

Phase 9 is complete when:

- ✅ Publisher can submit form
- ✅ Admin sees request in Manage Requests
- ✅ Admin reviews and forwards to advertiser
- ✅ Advertiser reviews (via admin)
- ✅ Publisher tracks status via tracking ID
- ✅ Grammar model integration works
- ✅ Ops dashboard shows health metrics
- ✅ All external calls logged and visible
- ✅ No frontend changes required (backend only)

### Phase 5.5 Everflow Integration (Partial)

- ✅ POST /api/admin/advertisers/sync (create sync job)
- ✅ POST /api/admin/everflow/sync (create sync job for offers)
- ✅ Background job system for async syncs
- ✅ Job status tracking and polling
- ⏳ Additional Everflow API endpoints (if needed)
- ⏳ Advanced filtering and conflict resolution options

### Phase 10: Advanced Intelligence & Analytics (Deferred)

**Status**: ⏳ **PENDING** - Moved to Phase 10 per requirements

#### Generative AI Integration

- ⏳ **POST /api/ai/generate-metadata** - Generate From/Subject Lines from files
  - Task: "Click generate → Scan files → Give From/Subject Lines"
  - Model: Under development
  - Integration: Deferred until model is ready
  - Background Processing: Async generation via background jobs
  - Input: Creative files (HTML, images)
  - Output: Generated fromLines and subjectLines
  - Status: **PENDING (Phase 10)** - Model being built
- ⏳ **Creative Content Generation** - AI-powered creative suggestions
- ⏳ **Model Integration Service** - `lib/services/generativeAI.service.ts`

#### Publisher/Advertiser Behavioral Analytics

- ⏳ **User Events Table** - Track granular actions:
  - Time spent on Step 2
  - Field validation errors
  - Form abandonment points
  - Device/browser tracking
  - Click patterns and interactions
- ⏳ **Analytics Service** - `features/analytics/services/behavioralAnalytics.service.ts`
- ⏳ **Visualization UI** - Dedicated dashboard for behavioral insights
- ⏳ **Funnel Analysis** - Publisher submission funnel with drop-off points
- **Status**: Requires new `user_events` table and dedicated UI

#### Advanced Analytics Features

- ⏳ **Publisher Funnel Analytics** - Submissions per day, approval rates, drop-off points
- ⏳ **Processing Health Metrics** - Avg grammar processing time, failure rates
- ⏳ **External Operations Dashboard** - All external API calls (grammar, everflow, email, telegram)
- ⏳ **Predictive Analytics** - ML models for approval prediction
- **Status**: Foundation exists, advanced features deferred to Phase 10

#### Additional Phase 10 Features

- ⏳ Notifications table schema (enhanced)
- ⏳ WebSocket/SSE for real-time notifications
- ⏳ Compliance Model Integration (8 tasks blocked pending deployment)
- ⏳ Testing & Cleanup

---

## 📊 Summary Statistics

### By Status:

- **✅ Done:** 75+ tasks (Updated: January 2025)
  - Phase 3.1-3.9: Admin Dashboard & Core APIs ✅
  - Phase 4.1: Client/Server Boundary ✅
  - Phase 5.5: Everflow Integration ✅
  - Phase 6: Background Jobs Management ✅
  - Phase 7: Telegram Bot Integration ✅ (NEW)
  - Phase 8.1: Publisher Form Upload (Partial) ✅ (NEW)
  - Phase 9.1: Core Submission (Partial) ✅ (NEW)
- **⏳ Remaining:** 70+ tasks (includes Phase 9 completion, Grammar AI, Analytics)
- **⚠️ Security Issues (Priority 1):** 4 tasks
- **⏳ Blocked:** 8 tasks (Compliance Model Integration)
- **⚠️ File Upload Security:** Basic validation implemented, malware scanning pending

### By Priority:

- **🔴 CRITICAL (Security):** 4 tasks (Must fix before production)
- **🔴 CRITICAL (Features):** 8 tasks (Database schema, Auth, Core APIs)
- **🚨 HIGH (Missing Critical):** 5 tasks (HTML Dependency Parser, Admin Settings API, Public Offer Filter, Feedback & Annotation System, Admin Metadata Edit)
- **🟡 HIGH:** 20+ tasks (Dashboard, Requests, Offers)
- **🟡 MEDIUM (Missing):** 4 tasks (Telegram Polling, Malware Hook, Maintenance Mode, Legal Placeholder)
- **🟢 MEDIUM:** 15+ tasks (Advertisers, Publishers, Notifications)
- **⚪ LOW:** 5+ tasks (Real-time, Advanced features, Cross-Device Drafts)

### Next Immediate Steps:

1. **Fix Build Errors** (URGENT)
   - Replace server service imports in client components
   - Use client adapters instead

2. **Secure Admin Seed Endpoint** (CRITICAL)
   - Add authentication check

3. **Add Input Validation** (CRITICAL)
   - Implement Zod schemas for all API endpoints

4. **Add Input Sanitization** (CRITICAL)
   - Sanitize all user input before storage

5. **Implement Rate Limiting** (HIGH)
   - Add rate limiting middleware

6. **Improve Error Handling** (HIGH)
   - Return generic error messages to clients
   - Log detailed errors server-side only

---

## 🚨 Critical Missing Backend Tasks (Identified January 2025)

### High Priority Missing Tasks

| Task Name                            | Status                | Priority  | Location                               |
| ------------------------------------ | --------------------- | --------- | -------------------------------------- |
| **HTML Dependency Parser Service**   | ⏳ Missing Logic      | 🚨 HIGH   | `app/api/upload/route.ts`              |
| **Admin Settings API (Form Config)** | ⏳ Missing API        | 🚨 HIGH   | `app/api/admin/settings/form-config`   |
| **Public Offer Security Filter**     | ⏳ Missing Constraint | 🚨 HIGH   | `app/api/offers/route.ts`              |
| **Feedback & Annotation System**     | ⏳ Missing System     | 🚨 HIGH   | `app/api/admin/annotations`            |
| **Admin Metadata Edit API**          | ⏳ Missing Endpoint   | 🚨 HIGH   | `app/api/admin/requests/[id]/metadata` |
| **Telegram Polling API**             | ⏳ Missing Endpoint   | 🟡 MEDIUM | `app/api/check-telegram-start`         |
| **Malware Hook Activation**          | ⏳ Pending Deployment | 🟡 MEDIUM | `app/api/upload/route.ts`              |
| **Maintenance Mode Logic**           | ⏳ Missing Logic      | 🟡 MEDIUM | Middleware or API-level check          |
| **Cross-Device Draft API**           | ⏳ Optional           | 🔵 LOW    | `app/api/publisher/draft`              |
| **Legal Compliance Placeholder**     | ⏳ Missing Endpoint   | 🟡 MEDIUM | `app/api/ai/legal-check`               |

### Detailed Task Descriptions

#### 1. HTML Dependency Parser Service 🚨 HIGH

- **Current State**: ZIP files are extracted but all files treated as flat "Creatives"
- **Required Logic**: Parse HTML files inside ZIP, find `<img>`, `<link>`, `<script>` tags
- **Action**: Mark referenced assets as `is_dependency = true` in database
- **Benefit**: Prevents dependency files from cluttering dashboard
- **Implementation**: Add parser service inside upload pipeline

#### 2. Admin Settings API (Form Config) 🚨 HIGH

- **Endpoint**: `GET/POST /api/admin/settings/form-config`
- **Storage**: `system_settings` table (Key: `publisher_form_config`)
- **Data Structure**: JSON blob with:
  - `labels`: Custom field names (e.g., "Yahoo ID" instead of "Email")
  - `styles`: Hex codes for Backgrounds, Inputs, Text Colors
  - `toggles`: Booleans (`showTelegram`, `showCompany`, etc.)
- **Purpose**: Enables "Ditto" UI customization from Admin portal

#### 3. Public Offer Security Filter 🚨 HIGH

- **Current Gap**: `/api/offers` endpoint may return private/internal offers
- **Required Fix**: Enforce `WHERE privacy = 'public' AND status = 'active'`
- **Risk**: Without this, publishers could submit creatives for private offers
- **Location**: `app/api/offers/route.ts`

#### 4. Feedback & Annotation System 🚨 HIGH

- **Endpoints**:
  - `POST /api/admin/annotations` - Save annotation with x/y coordinates or selected text
  - `GET /api/admin/annotations` - List annotations for creative/request
  - `PATCH /api/admin/annotations/[id]` - Update annotation status
  - `POST /api/advertiser/annotations` - Advertiser annotation endpoint
- **Database**: Create `annotations` table with coordinate/text selection support
- **Purpose**: Allow Admins/Advertisers to click on images (x,y coordinates) or select text to leave correction comments
- **Publisher Visibility**: Update `GET /api/public/track/[id]` to include annotations
- **Use Case**: Publishers see feedback on their creatives via tracking page
- **Current**: System not implemented

#### 5. Admin Metadata Edit API 🚨 HIGH

- **Endpoint**: `PATCH /api/admin/requests/[id]/metadata`
- **Purpose**: Allow admin to update fromLines, subjectLines, and annotations for individual files
- **Use Case**: Admin portal needs to check/edit from and subject lines, plus notes
- **Fields**: Update `specificFromLines`, `specificSubjectLines`, and `annotations`
- **Current**: View-only access exists, edit capability missing

#### 6. Telegram Polling API 🟡 MEDIUM

- **Endpoint**: `GET /api/check-telegram-start`
- **Logic**: Takes `username`, checks if `chat_id` is linked in database
- **Purpose**: Enables "Auto-Verify" experience on frontend
- **Storage**: May need `telegram_users` table or use `publishers.telegram_id`

#### 7. Malware Hook Activation 🟡 MEDIUM

- **Current State**: Code exists in `/api/upload/route.ts` but commented out
- **Task**: Uncomment Python service webhook once service is stable
- **Blocked**: Until Python malware service is live
- **Priority**: Deployment-ready task

#### 8. Maintenance Mode Logic 🟡 MEDIUM

- **Task**: Read `maintenance_mode = true` from `system_settings` table
- **Logic**: Block `POST /api/submit` requests when maintenance mode is active
- **Implementation**: Middleware or API-level check
- **Purpose**: Safely update platform without accepting new submissions

#### 9. Cross-Device Draft API 🔵 LOW

- **Endpoint**: `POST /api/publisher/draft`
- **Current**: Implemented in browser LocalStorage
- **Decision**: If LocalStorage is sufficient, skip this task
- **Use Case**: Allow publishers to switch devices and keep form data

#### 10. Legal Compliance Placeholder 🟡 MEDIUM

- **Endpoint**: `POST /api/ai/legal-check`
- **Returns**: `{ status: "pending_implementation" }`
- **Purpose**: Prevent 404 errors when "Legal Check" button is clicked
- **Status**: Under development, placeholder needed for UI compatibility

---

## 📝 Notes

- All completed tasks have been marked with ✅ in `BACKEND_SEQUENTIAL_PLAN.md`
- Security issues identified in `ADMIN_ARCHITECTURE_TEST_REPORT.md` have been added to Phase 8.2
- Client adapters are working correctly for ViewModels
- API authentication and authorization are properly implemented
- SQL injection protection is in place via Drizzle ORM
- Rate limiting is implemented on brand guidelines endpoints
- Everflow sync functionality is fully implemented with background jobs
- Background job management APIs are complete
- **File Upload Security**: File uploads are correctly blocked until security infrastructure (malware scanning, file validation, status tracking) is implemented in Phase 8.1

---

## Recent Completions (2026-01-08)

### Brand Guidelines Feature - Fully Implemented ✅

**Endpoints Completed:**

- ✅ `GET /api/admin/advertisers/[id]/brand-guidelines` - Get advertiser brand guidelines
- ✅ `PUT /api/admin/advertisers/[id]/brand-guidelines` - Create/update advertiser brand guidelines (URL/text types)
- ✅ `DELETE /api/admin/advertisers/[id]/brand-guidelines` - Remove advertiser brand guidelines
- ✅ `GET /api/admin/offers/[id]/brand-guidelines` - Get offer brand guidelines (with inheritance from advertiser)
- ✅ `PUT /api/admin/offers/[id]/brand-guidelines` - Create/update offer brand guidelines (URL/text types)
- ✅ `POST /api/admin/offers/[id]/brand-guidelines` - Attach file brand guidelines (for future file uploads)
- ✅ `DELETE /api/admin/offers/[id]/brand-guidelines` - Remove offer brand guidelines

**Features Implemented:**

- ✅ **Cascading Logic**: When advertiser brand guidelines are set, they automatically cascade to all associated offers that don't have their own guidelines
- ✅ **Smart Updates**: When advertiser brand guidelines are updated, offers that inherited the old guidelines get updated with the new ones (only core fields compared: type, url, text)
- ✅ **Override Protection**: Offers with their own custom brand guidelines are preserved and not overwritten when advertiser guidelines change
- ✅ **Inheritance**: Offers without brand guidelines automatically inherit from their advertiser when viewing
- ✅ **Support Types**: URL and Text types fully implemented (File upload pending Phase 8.1)
- ✅ **Database**: Added `brand_guidelines` JSONB column to `advertisers` table
- ✅ **Migration**: Applied migration `0007_add_brand_guidelines_to_advertisers.sql`

**Service Functions:**

- ✅ `attachAdvertiserBrandGuidelines()` - Attach/update advertiser brand guidelines with cascading to offers
- ✅ `detachAdvertiserBrandGuidelines()` - Remove advertiser brand guidelines and cascade removal to offers
- ✅ `getAdvertiserBrandGuidelines()` - Get advertiser brand guidelines
- ✅ `attachOfferBrandGuidelines()` - Attach/update offer-specific brand guidelines
- ✅ `detachBrandGuidelines()` - Remove offer brand guidelines
- ✅ `getOfferBrandGuidelines()` - Get offer brand guidelines (checks offer first, then inherits from advertiser)

**Files Updated:**

- ✅ `features/admin/services/brandGuidelines.service.ts` - Complete service implementation
- ✅ `app/api/admin/advertisers/[id]/brand-guidelines/route.ts` - API endpoints
- ✅ `app/api/admin/offers/[id]/brand-guidelines/route.ts` - API endpoints
- ✅ `features/admin/components/BrandGuidelinesModal.tsx` - UI component with full CRUD support
- ✅ `lib/schema.ts` - Added `brandGuidelines` column to `advertisers` table

---

---

## Additional Completed Features (2026-01-08)

### Everflow Integration - Fully Implemented ✅

**Endpoints Completed:**

- ✅ `POST /api/admin/advertisers/sync` - Create advertiser sync job
- ✅ `POST /api/admin/everflow/sync` - Create offers sync job
- ✅ `GET /api/admin/jobs` - List all background jobs
- ✅ `GET /api/admin/jobs/[jobId]` - Get job details
- ✅ `GET /api/admin/jobs/[jobId]/events` - Get job events
- ✅ `POST /api/admin/jobs/[jobId]/retry` - Retry failed job
- ✅ `POST /api/admin/jobs/[jobId]/cancel` - Cancel running job
- ✅ `GET /api/admin/everflow/sync-status/[jobId]` - Get sync job status
- ✅ `POST /api/admin/everflow/cancel/[jobId]` - Cancel sync job

**Features Implemented:**

- ✅ Background job system for async Everflow syncs
- ✅ Job status tracking (pending, running, completed, failed)
- ✅ Job event logging
- ✅ Conflict resolution (update/skip)
- ✅ Filter support for syncing specific records
- ✅ Polling mechanism for job status updates

### Security Features - Partially Implemented ✅

**Completed:**

- ✅ Authentication: All endpoints require valid session
- ✅ Authorization: Admin role checks on all admin endpoints
- ✅ SQL Injection Protection: Drizzle ORM parameterized queries
- ✅ Rate Limiting: Implemented on brand guidelines endpoints using `@upstash/ratelimit`
- ✅ Basic Input Validation: Type and required field checks on brand guidelines
- ✅ Error Handling: Consistent error responses

**Pending (Priority 1):**

- ⚠️ Input Sanitization: XSS protection not yet implemented
- ⚠️ Comprehensive Zod Schemas: Only basic validation exists
- ⚠️ Admin Seed Endpoint Security: No authentication check (CRITICAL)
- ⚠️ Security Headers: Not yet implemented

### File Upload Security Status ⚠️

**Current Status:** File uploads are correctly blocked until security infrastructure is complete

**Security Requirements (Phase 8.1):**

- ⏳ Malware scanning service (MANDATORY)
- ⏳ File status tracking (pending_scan, clean, infected)
- ⏳ File type validation (extension + MIME type sniffing)
- ⏳ File size limits
- ⏳ Filename sanitization
- ⏳ Rate limiting for upload endpoints
- ⏳ File uploads database table

**Current Implementation:**

- ✅ API correctly rejects file uploads with error message
- ✅ File validation code is commented out (waiting for infrastructure)
- ✅ Service functions prepared for file validation once table exists

**Recommendation:** Do NOT enable file uploads until all security requirements are met.

---

**Last Updated:** 2025-01-XX  
**Next Review:** After Priority 1 Security Fixes

## Recent Completions (Latest Update)

### Bulk Update Offers - Completed ✅

- ✅ `POST /api/admin/offers/bulk-update` - Bulk update multiple offers
- ✅ Supports updating visibility and brand guidelines for multiple offers
- ✅ FormData handling for file uploads (prepared for future)
- ✅ Rate limiting implemented
- ✅ API: `app/api/admin/offers/bulk-update/route.ts`

### Additional Endpoints Completed ✅

- ✅ `POST /api/admin/jobs/[jobId]/replay` - Replay background job
- ✅ `GET /api/admin/everflow/active-job` - Get active sync job
- ✅ `GET /api/health` - Health check endpoint
- ✅ `GET /api/admin/ops/metrics` - Metrics endpoint

---

## Phase 9: Publisher Flow, Analytics & Ops Integration - Detailed Plan

**Status:** ⏳ **Not Started**  
**Priority:** 🔴 **HIGH**  
**Dependencies:** None (can start immediately)

**📖 Full Implementation Guide:** See [PHASE_9_IMPLEMENTATION.md](./PHASE_9_IMPLEMENTATION.md) for complete details including:

- Database migrations (SQL + Drizzle)
- Zod schemas
- API endpoint specifications
- Service layer implementations
- Grammar AI integration
- Analytics implementation
- Testing plan

### Overview

Phase 9 transforms the publisher form into a complete backend workflow system with:

- Full submission pipeline (Publisher → Admin → Advertiser)
- Tracking ID system for publisher visibility
- Grammar AI integration (all calls from Admin)
- Operational analytics and monitoring
- Ops dashboard for external API visibility

### Key Architecture Decisions

1. **Admin-Only API Calls**: All external APIs (grammar, notifications) called by Admin backend only
2. **Single Source of Truth**: One submission object shared across Publisher → Admin → Advertiser
3. **Immutable Approval Chain**: Status transitions are logged and auditable
4. **Operational Analytics Only**: Track system behavior, not business events like approvals
5. **No Frontend Changes**: All work is backend-only

### Sprint Breakdown

**Sprint 9.1** (Week 1-2): Core submission backbone  
**Sprint 9.2** (Week 2-3): Tracking & status flow  
**Sprint 9.3** (Week 3-4): Grammar AI integration  
**Sprint 9.4** (Week 4-5): Admin portal integration  
**Sprint 9.5** (Week 5-6): Notifications & polish

### Database Schema

See Sprint 9.1 section above for complete table definitions:

- `publisher_submissions`
- `creatives`
- `creative_files`
- `submission_reviews`
- `external_tasks`
- `external_calls`

### API Endpoints Summary

**Public Endpoints:**

- ✅ `POST /api/submit` - Publisher form submission (with validation)
- ✅ `GET /api/offers` - Fetch active offers with Everflow IDs
- ✅ `GET /api/files` - File content retrieval (HTML, images, etc.)
- ✅ `GET /api/creative/metadata` - Retrieve creative metadata
- ✅ `POST /api/creative/metadata` - Save/update creative metadata
- ✅ `POST /api/telegram/verify` - Verify Telegram ID
- ✅ `POST /api/telegram/poll` - Poll Telegram for messages
- ✅ `POST /api/telegram/webhook` - Receive Telegram updates
- ✅ `GET /api/telegram/setup-webhook` - Configure webhook URL
- ⏳ `GET /api/public/track/:trackingId` - Tracking page (read-only)

**Admin Endpoints:**

- ⏳ `POST /api/admin/publisher/submissions` - Create submission
- ⏳ `GET /api/admin/publisher/submissions` - List submissions
- ⏳ `GET /api/admin/publisher/submissions/:id` - Get submission details
- ⏳ `POST /api/admin/publisher/submissions/:id/creative` - Attach creative
- ⏳ `POST /api/admin/publisher/submissions/:id/submit` - Lock submission
- ⏳ `POST /api/admin/publisher/:id/admin-approve` - Admin approves
- ⏳ `POST /api/admin/publisher/:id/admin-reject` - Admin rejects
- ⏳ `POST /api/admin/publisher/:id/forward-to-advertiser` - Forward to advertiser
- ⏳ `POST /api/admin/publisher/:id/advertiser-approve` - Advertiser approves
- ⏳ `POST /api/admin/publisher/:id/advertiser-reject` - Advertiser rejects
- ⏳ `POST /api/admin/publisher/submissions/:id/process-grammar` - Trigger grammar
- ⏳ `GET /api/admin/publisher/submissions/:id/grammar-status` - Grammar status
- ⏳ `POST /api/admin/publisher/submissions/:id/retry-grammar` - Retry grammar

### Grammar AI Integration Details

**Model:** `https://grammar-correction-1-5tha.onrender.com`

**Endpoints Used:**

- `POST /process` - Upload and process files
- `GET /task/{task_id}` - Get task status
- `GET /download/{filename}` - Download processed files
- `GET /health` - Health check

**Integration Rules:**

- All calls made from Admin backend only
- Async processing via background jobs
- Results stored in `external_tasks` table
- All calls logged in `external_calls` table

### Ops Dashboard Additions

**New Sections:**

1. **External Operations**
   - Table: All external API calls (grammar, everflow, email, telegram)
   - Filters: Service, status, date range
   - Metrics: Success rate, avg latency, failure count

2. **Publisher Funnel**
   - Submissions per day
   - Approval rates
   - Time to approval
   - Drop-off points

3. **Processing Health**
   - Avg grammar processing time
   - Grammar failure rate
   - Retry counts
   - Queue depth

### Analytics Philosophy

**Tracked:**

- Publisher behavior (form starts, completions, abandonments)
- System performance (processing times, latency)
- AI usage (grammar requests, success rates)
- Operational metrics (submissions/day, approval rates)

**NOT Tracked:**

- Admin approval/rejection events (workflow state, not analytics)
- Moderation decisions (internal operations)

### Security Considerations

- Rate limiting on public submit endpoint
- File validation (type, size, malware scanning)
- ZIP bomb protection
- Input sanitization
- Tracking endpoint is read-only
- Admin-only external API access

### Testing Strategy

**Automated:**

- Submission validation
- Status transition validation
- Grammar integration
- Notification delivery
- Analytics accuracy

**Manual:**

- End-to-end submission flow
- Admin review workflow
- Tracking page functionality
- Grammar processing
- Ops dashboard visibility
