# Codebase Dependency Map Report

**Generated:** Analysis of "Reset Stuck Jobs", "Audit Logs", and Dashboard-related functionality  
**Scope:** Frontend pages/components, backend routes/services, shared UI components, navigation links, and dashboard coupling

---

## Table of Contents

1. [Reset Stuck Jobs](#1-reset-stuck-jobs)
2. [Audit Logs](#2-audit-logs)
3. [Dashboard Routes & Components](#3-dashboard-routes--components)
4. [Navigation & Coupling](#4-navigation--coupling)
5. [Shared Dependencies](#5-shared-dependencies)

---

## 1. Reset Stuck Jobs

### 1.1 Frontend Components

#### Primary Component

- **File:** `features/admin/components/ResetStuckJobsButton.tsx`
- **Type:** React Client Component
- **Purpose:** Button component that triggers reset of stuck scanning jobs
- **Key Features:**
  - Confirmation dialog before action
  - Loading state management
  - Toast notifications for success/error
  - Error handling with redirect on auth failure
  - Calls `resetStuckScanningAssets()` service function

#### Usage Locations

- **File:** `features/admin/components/AdminDashboard.tsx` (line 50)
  - Rendered in System Operations section
  - Passes `onSuccess={refresh}` callback
  - Visible on `/dashboard` page for admin users

### 1.2 Frontend Services/Hooks

#### Client Service

- **File:** `features/admin/services/creatives.client.ts`
- **Function:** `resetStuckScanningAssets()`
- **Returns:** `Promise<ResetStuckScanningResponse>`
- **API Endpoint:** `POST /api/admin/creatives/reset-stuck-scanning`
- **Error Handling:** Custom `ResetStuckScanningError` class
- **Network Error Detection:** Handles fetch failures

#### View Model (Indirect)

- **File:** `features/admin/view-models/useAdminDashboardViewModel.ts`
- **Function:** `refresh()` callback passed to ResetStuckJobsButton
- **Purpose:** Refreshes dashboard data after successful reset

### 1.3 Backend API Routes

#### Primary Endpoint (Admin)

- **File:** `app/api/admin/creatives/reset-stuck-scanning/route.ts`
- **Method:** `POST`
- **Path:** `/api/admin/creatives/reset-stuck-scanning`
- **Authentication:** Requires `admin` or `administrator` role
- **Functionality:**
  - Finds creatives stuck in `SCANNING` status for >15 minutes
  - Resets them to `PENDING` status
  - Increments `scan_attempts`
  - Creates audit log entries
  - Returns count of reset items

#### Duplicate Endpoint (Ops)

- **File:** `app/api/ops/creatives/reset-stuck-scanning/route.ts`
- **Method:** `POST`
- **Path:** `/api/ops/creatives/reset-stuck-scanning`
- **Note:** Identical implementation to admin endpoint (code duplication)
- **Authentication:** Requires `admin` or `administrator` role

### 1.4 Database Schema

#### Tables Used

- **Table:** `creatives` (from `lib/schema.ts`)
  - Fields: `id`, `status`, `statusUpdatedAt`, `scanAttempts`, `lastScanError`
  - Query: Finds `status = 'SCANNING'` AND `status_updated_at < now() - interval '15 minutes'`
  - Update: Sets `status = 'pending'`, increments `scan_attempts`

- **Table:** `audit_logs` (from `lib/schema.ts`)
  - Action: `RESET_STUCK_SCANNING_ASSETS`
  - Entity Type: `creatives`
  - Details: Includes affected count, IDs, threshold, user info

### 1.5 Scripts & Documentation

#### Verification Script

- **File:** `scripts/verify-reset-stuck-jobs.ts`
- **Purpose:** Verifies reset functionality, database state, and audit logs

#### Documentation Files

- `docs/RESET_STUCK_JOBS_VERIFICATION_GUIDE.md`
- `docs/RESET_STUCK_JOBS_TESTING_INSTRUCTIONS.md`
- `docs/RESET_STUCK_JOBS_TEST_VERIFICATION.md`
- `docs/RESET_STUCK_JOBS_FINAL_VERIFICATION.md`
- `docs/CODE_REVIEW_RESET_STUCK_SCANNING.md`
- `docs/ENDPOINT_VERIFICATION_REPORT.md`

---

## 2. Audit Logs

### 2.1 Frontend Components

#### Primary Component

- **File:** `features/admin/components/AuditLogsTable.tsx`
- **Type:** React Client Component
- **Purpose:** Displays audit logs with filtering and pagination
- **Key Features:**
  - Filter by Admin ID, Action Type (APPROVE/REJECT), Date Range
  - Pagination (default 20 items per page)
  - Search and Clear filter buttons
  - Loading and error states
  - Table display with formatted timestamps

#### Usage Locations

- **File:** `features/admin/components/AdminDashboard.tsx` (line 57)
  - Rendered at bottom of admin dashboard
  - Visible on `/dashboard` page for admin users

### 2.2 Frontend Services

#### Service Layer

- **File:** `features/admin/services/auditLogs.service.ts`
- **Function:** `getAuditLogs()`
- **Parameters:**
  - `adminId?: string`
  - `actionType?: "APPROVE" | "REJECT"`
  - `startDate?: Date`
  - `endDate?: Date`
  - `page: number`
  - `limit: number`
- **Returns:** Paginated audit logs with metadata
- **Database:** Direct Drizzle ORM queries

#### Export Service

- **File:** `features/admin/services/auditLogs.service.ts` (if exists)
- **Function:** `streamAuditLogsExport()` (referenced in export routes)
- **Purpose:** CSV export functionality

#### Utility Functions

- **File:** `features/admin/utils/queryStringGenerator.ts`
- **Function:** `generateAuditLogsQueryString()`
- **Purpose:** Generates URL query strings from filter state

### 2.3 Backend API Routes

#### Primary Endpoint (Admin)

- **File:** `app/api/admin/audit-logs/route.ts`
- **Method:** `GET`
- **Path:** `/api/admin/audit-logs`
- **Authentication:** Requires `admin` or `administrator` role
- **Query Parameters:**
  - `adminId` / `adminID` (backward compatible)
  - `actionType` / `action` (backward compatible)
  - `startDate` / `dateFrom` / `from` (backward compatible)
  - `endDate` / `dateTo` / `to` (backward compatible)
  - `page` (default: 1)
  - `limit` (default: 20, max: 100)
- **Validation:** Uses `auditLogsQuerySchema` from `lib/validations/admin.ts`

#### Export Endpoint (Admin)

- **File:** `app/api/admin/audit-logs/export/route.ts`
- **Method:** `GET`
- **Path:** `/api/admin/audit-logs/export`
- **Purpose:** CSV export of filtered audit logs
- **Uses:** `streamAuditLogsExport()` service

#### Utils (Admin)

- **File:** `app/api/admin/audit-logs/utils.ts`
- **Functions:**
  - `parseAuditLogsQueryParams()` - Shared query parameter parsing
  - Interfaces: `AuditLogsFilters`, `AuditLogsQueryParams`

#### Duplicate Endpoints (Ops)

- **File:** `app/api/ops/audit-logs/route.ts` - Identical to admin endpoint
- **File:** `app/api/ops/audit-logs/export/route.ts` - Identical export endpoint
- **File:** `app/api/ops/audit-logs/utils.ts` - Identical utils
- **Note:** Code duplication between `/api/admin/audit-logs` and `/api/ops/audit-logs`

### 2.4 Database Schema

#### Table Definition

- **Table:** `audit_logs` (from `lib/schema.ts`, lines 502-522)
- **Fields:**
  - `id` (text, primary key, CUID)
  - `userId` (text, not null) - Admin user ID
  - `action` (text, not null) - Action type
  - `entityType` (text, not null)
  - `entityId` (text, nullable)
  - `details` (jsonb, nullable)
  - `ipAddress` (text, nullable)
  - `userAgent` (text, nullable)
  - `createdAt` (timestamp, default now)

#### Indexes

- `idx_audit_user` on `user_id`
- `idx_audit_action` on `action`
- `idx_audit_created_at` on `created_at`

### 2.5 Validation Schema

#### Zod Schema

- **File:** `lib/validations/admin.ts` (lines 68-92)
- **Schema:** `auditLogsQuerySchema`
- **Validates:** Query parameters with backward compatibility for multiple param names

### 2.6 Documentation

#### Documentation Files

- `docs/AUDIT_LOGS_IMPLEMENTATION_SUMMARY.md`
- `docs/AUDIT_LOGS_SCHEMA_ANALYSIS.md`
- `docs/AUDIT_LOGS_API_DESIGN.md`
- `docs/AUDIT_LOGS_QUERY_LOGIC_DESIGN.md`
- `docs/AUDIT_LOGS_IMPLEMENTATION.md`
- `docs/AUDIT_LOGS_CODE_REVIEW.md`
- `docs/AUDIT_LOGS_INDEXES_AND_RESPONSE_VERIFICATION.md`
- `docs/AUDIT_LOGS_API_CONTRACT.md`
- `docs/AUDIT_LOGS_FRONTEND_IMPLEMENTATION.md`
- `docs/AUDIT_LOGS_ENDPOINT_DESIGN.md`
- `docs/AUDIT_LOGS_URL_FILTER_PLAN.md`
- `docs/AUDIT_LOGS_TEST_CASES.md`

---

## 3. Dashboard Routes & Components

### 3.1 Dashboard Route Structure

#### Root Dashboard Route

- **File:** `app/(dashboard)/page.tsx`
- **Path:** `/` (within dashboard group)
- **Behavior:** Redirects based on user role
  - `admin` / `administrator` → `/ops`
  - `advertiser` → `/creatives`
  - default → `/creatives`

#### Dashboard Page Route

- **File:** `app/(dashboard)/dashboard/page.tsx`
- **Path:** `/dashboard`
- **Behavior:**
  - If `user.role === "admin"` → Renders `<AdminDashboard />`
  - Otherwise → Shows "coming soon" message
- **Component:** Uses `AdminDashboard` from `@/features/admin`

#### Operations Dashboard Route

- **File:** `app/(dashboard)/(administrator)/ops/page.tsx`
- **Path:** `/ops`
- **Behavior:** Operations metrics dashboard
- **Features:**
  - Active jobs, failed jobs, dead letter queue
  - Error rate, latency metrics
  - Charts and job tables
  - Auto-refresh every 10 seconds
- **API:** Calls `/api/admin/ops/metrics`

### 3.2 Dashboard Layout

#### Main Layout

- **File:** `app/(dashboard)/layout.tsx`
- **Purpose:** Wraps all dashboard routes
- **Features:**
  - Sidebar navigation (`DashboardSidebar`)
  - Header with sidebar trigger and last updated
  - Error boundary
  - User authentication check
  - Role-based menu configuration

#### Administrator Layout

- **File:** `app/(dashboard)/(administrator)/layout.tsx`
- **Purpose:** Additional layout for administrator routes
- **Routes:** `/ops`, `/advertisers`, `/offers`

### 3.3 Dashboard Components

#### Admin Dashboard Component

- **File:** `features/admin/components/AdminDashboard.tsx`
- **Type:** React Client Component
- **Features:**
  - Stats cards (5 cards)
  - Reset Stuck Jobs button (System Operations section)
  - Admin Performance Chart
  - Request component
  - Response component
  - Audit Logs Table
- **ViewModel:** Uses `useAdminDashboardViewModel()`

#### Dashboard Sidebar

- **File:** `features/dashboard/components/DashboardSidebar.tsx`
- **Purpose:** Navigation sidebar for dashboard
- **Features:**
  - Role-based menu configuration
  - User profile display
  - Sign out button
  - Active route highlighting

#### Shared Dashboard Components

- **File:** `features/dashboard/components/StatsCard.tsx` - Stat card display
- **File:** `features/dashboard/components/PerformanceChart.tsx` - Performance charts
- **File:** `features/dashboard/components/EntityDataTable.tsx` - Data tables

### 3.4 Dashboard Services

#### View Model

- **File:** `features/admin/view-models/useAdminDashboardViewModel.ts`
- **Hook:** `useAdminDashboardViewModel()`
- **Purpose:** Manages dashboard data fetching and state
- **Service:** Calls `getAdminDashboardData()` from `dashboard.client.ts`

#### Client Service

- **File:** `features/admin/services/dashboard.client.ts`
- **Function:** `getAdminDashboardData()`
- **API:** `GET /api/admin/dashboard/stats`

#### Backend Service

- **File:** `features/admin/services/dashboard.service.ts`
- **Function:** `getDashboardStats()`
- **Purpose:** Server-side dashboard statistics

### 3.5 Dashboard API Routes

#### Stats Endpoint

- **File:** `app/api/admin/dashboard/stats/route.ts`
- **Method:** `GET`
- **Path:** `/api/admin/dashboard/stats`
- **Purpose:** Returns dashboard statistics

#### Performance Endpoint

- **File:** `app/api/admin/dashboard/performance/route.ts`
- **Method:** `GET`
- **Path:** `/api/admin/dashboard/performance`
- **Query:** `comparisonType` parameter

#### Ops Metrics Endpoint

- **File:** `app/api/admin/ops/metrics/route.ts`
- **Method:** `GET`
- **Path:** `/api/admin/ops/metrics`
- **Purpose:** Operations dashboard metrics

### 3.6 Sidebar Configuration

#### Menu Config

- **File:** `features/dashboard/models/sidebar.config.ts`
- **Config:** `adminMenuConfig`
- **Menu Items:**
  - Dashboard (`/dashboard`)
  - Creatives (`/creatives`)
  - Manage Requests (`/requests`)
  - Manage Response (`/response`)
  - Manage Advertisers (`/advertisers`)
  - Offers (`/offers`)
  - Settings (`/settings`)

#### Sidebar Service

- **File:** `features/dashboard/services/sidebar.service.ts`
- **Function:** `getSidebarMenuConfig(role: UserRole)`
- **Purpose:** Returns menu config based on user role
- **Note:** Currently only returns `adminMenuConfig` for admin role

---

## 4. Navigation & Coupling

### 4.1 Navigation Links to Dashboard

#### Sidebar Navigation

- **Component:** `DashboardSidebar` (used in `app/(dashboard)/layout.tsx`)
- **Links:**
  - Dashboard → `/dashboard` (for admin role)
  - All other menu items use their respective routes

#### Redirects to Dashboard

- **File:** `app/(dashboard)/page.tsx` - Redirects admin/administrator to `/ops`
- **File:** `app/unauthorized/page.tsx` - Link to `/dashboard`
- **File:** `app/disconnected/page.tsx` - Redirects to `/dashboard` on reconnect
- **File:** `features/auth/view-models/useLoginViewModel.ts` - Redirects to `/dashboard` after login
- **File:** `components/offline-detector.tsx` - Redirects to `/dashboard` when online

### 4.2 Navigation Links to Reset Stuck Jobs

#### Direct Access

- **Location:** `features/admin/components/AdminDashboard.tsx` (line 50)
- **Path:** `/dashboard` (admin role only)
- **UI:** Button in "System Operations" section

#### No Direct Navigation

- No sidebar menu item for Reset Stuck Jobs
- No dedicated route/page for Reset Stuck Jobs
- Only accessible via Admin Dashboard

### 4.3 Navigation Links to Audit Logs

#### Direct Access

- **Location:** `features/admin/components/AdminDashboard.tsx` (line 57)
- **Path:** `/dashboard` (admin role only)
- **UI:** Table component at bottom of dashboard

#### No Direct Navigation

- No sidebar menu item for Audit Logs
- No dedicated route/page for Audit Logs
- Only accessible via Admin Dashboard

### 4.4 Dashboard Coupling

#### Tight Coupling Points

1. **AdminDashboard Component**
   - Directly imports and renders:
     - `ResetStuckJobsButton` (line 12, 50)
     - `AuditLogsTable` (line 11, 57)
   - Both features are embedded in dashboard, not separate pages

2. **Route Dependencies**
   - `/dashboard` route requires `AdminDashboard` component
   - `AdminDashboard` requires both Reset Stuck Jobs and Audit Logs
   - Cannot access these features independently

3. **API Endpoint Duplication**
   - `/api/admin/creatives/reset-stuck-scanning` (used by dashboard)
   - `/api/ops/creatives/reset-stuck-scanning` (duplicate, unused by dashboard)
   - `/api/admin/audit-logs` (used by dashboard)
   - `/api/ops/audit-logs` (duplicate, unused by dashboard)

4. **Role-Based Access**
   - Dashboard layout checks user role
   - AdminDashboard only renders for `admin` role
   - Reset Stuck Jobs and Audit Logs only visible to admins

### 4.5 Feature Isolation

#### Reset Stuck Jobs

- **Isolated:** ✅ (can be extracted as separate component)
- **Dependencies:**
  - Service: `creatives.client.ts`
  - API: `/api/admin/creatives/reset-stuck-scanning`
  - Schema: `creatives`, `audit_logs` tables

#### Audit Logs

- **Isolated:** ✅ (can be extracted as separate component)
- **Dependencies:**
  - Service: `auditLogs.service.ts`
  - API: `/api/admin/audit-logs`
  - Schema: `audit_logs` table
  - Validation: `auditLogsQuerySchema`

#### Dashboard

- **Coupled:** ⚠️ (tightly coupled to Reset Stuck Jobs and Audit Logs)
- **Dependencies:**
  - Both features embedded in `AdminDashboard`
  - Shared layout and navigation
  - Role-based access control

---

## 5. Shared Dependencies

### 5.1 Shared UI Components

#### From `@/components/ui`

- `Button` - Used by ResetStuckJobsButton, AuditLogsTable
- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Used by AdminDashboard
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` - Used by AuditLogsTable
- `Input`, `Label` - Used by AuditLogsTable filters
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - Used by AuditLogsTable
- `Calendar`, `Popover`, `PopoverContent`, `PopoverTrigger` - Used by AuditLogsTable date pickers
- `Skeleton` - Used by AdminDashboard loading state
- `confirm-dialog` - Used by ResetStuckJobsButton

#### From `@/features/dashboard`

- `StatsCard` - Used by AdminDashboard
- `PerformanceChart` - Used by AdminDashboard (via AdminPerformanceChart)

### 5.2 Shared Services

#### Authentication

- **File:** `lib/auth.ts`
- **Used by:** All API routes for session validation
- **Function:** `auth.api.getSession()`

#### Database

- **File:** `lib/db.ts`
- **Used by:** All backend services
- **ORM:** Drizzle ORM

#### Schema

- **File:** `lib/schema.ts`
- **Tables:** `creatives`, `audit_logs`
- **Used by:** All database operations

#### Logger

- **File:** `lib/logger.ts`
- **Used by:** Reset Stuck Jobs endpoint for logging

#### Validation

- **File:** `lib/validations/admin.ts`
- **Schema:** `auditLogsQuerySchema`
- **Used by:** Audit Logs API routes

### 5.3 Shared Utilities

#### User Management

- **File:** `lib/get-user.ts`
- **Function:** `getCurrentUser()`
- **Used by:** All dashboard pages for authentication

#### Utilities

- **File:** `lib/utils.ts`
- **Function:** `cn()` (className utility)
- **Used by:** Multiple components

### 5.4 Shared Types

#### Types

- **File:** `features/admin/types/admin.types.ts`
- **File:** `features/dashboard/types/dashboard.types.ts`
- **Used by:** Multiple components and services

---

## Summary

### Reset Stuck Jobs

- **Frontend:** 1 component (`ResetStuckJobsButton`)
- **Backend:** 2 API endpoints (admin + ops duplicate)
- **Services:** 1 client service
- **Database:** 2 tables (`creatives`, `audit_logs`)
- **Access:** Only via `/dashboard` page (admin role)

### Audit Logs

- **Frontend:** 1 component (`AuditLogsTable`)
- **Backend:** 4 API endpoints (2 GET + 2 export, with admin/ops duplicates)
- **Services:** 1 service + 1 export service
- **Database:** 1 table (`audit_logs`)
- **Access:** Only via `/dashboard` page (admin role)

### Dashboard

- **Routes:** 3 main routes (`/`, `/dashboard`, `/ops`)
- **Components:** 1 main component (`AdminDashboard`) + multiple shared components
- **Services:** 3 services (dashboard, performance, ops metrics)
- **APIs:** 3 endpoints (stats, performance, metrics)
- **Navigation:** Sidebar with role-based menu
- **Coupling:** Tightly coupled to Reset Stuck Jobs and Audit Logs

### Key Findings

1. **Code Duplication:** Both Reset Stuck Jobs and Audit Logs have duplicate endpoints under `/api/admin` and `/api/ops`
2. **Tight Coupling:** Both features are embedded in `AdminDashboard` component, not accessible as separate pages
3. **No Direct Navigation:** Neither feature has sidebar menu items or dedicated routes
4. **Role-Based Access:** All features require `admin` or `administrator` role
5. **Shared Infrastructure:** Heavy use of shared UI components, services, and utilities

---

**End of Report**
