# Work Summary (Swapnaja) – Detailed

## 1. Upload security – magic-byte validation

### 1.1 `lib/security/validateBuffer.ts` (new)

- **Purpose:** Validate uploads by **buffer content** (magic bytes), not by client-reported type.
- **Function:** `validateBufferMagicBytes(buffer: Buffer)`.
- **Returns:** Either `{ ok: true, detectedMime, detectedExt }` or `{ ok: false, reason }`.
- **Logic:**
  - Rejects empty buffer or size &gt; 50MB (uses `MAX_FILE_SIZE` from `lib/security/route.ts`).
  - Uses `file-type` to detect MIME from magic bytes.
  - If `file-type` returns nothing (e.g. for HTML): reads first 4096 bytes as UTF-8, checks for `&lt;!doctype html`, `&lt;html`, `&lt;head`, `&lt;body`; if found and `text/html` is in `ALLOWED_MIME_TYPES`, returns `text/html` / `html`.
  - Otherwise checks detected MIME against `ALLOWED_MIME_TYPES`; if not allowed returns `Invalid file type: ${detected.mime}`.
- **Used by:** `app/api/upload/route.ts` (top-level file and each ZIP entry), `app/api/upload/process-zip/route.ts` (each extracted entry).

### 1.2 `lib/security/route.ts` (central security config)

- **Exports:**
  - **ALLOWED_MIME_TYPES:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `text/html`, `application/zip`, `application/x-zip-compressed`, `video/mp4`, `video/webm`.
  - **MAX_FILE_SIZE:** 50 _ 1024 _ 1024 (50MB).
  - **sanitizeFilename(filename):** Replaces non–alphanumeric (except `.` and `-`) with `_`, collapses multiple dots to one, truncates to 100 chars. Used to avoid path traversal and unsafe names.
  - **validateFile(file: File):** Client-side check: `file.type` in `ALLOWED_MIME_TYPES` and `file.size` &lt;= 50MB; returns `{ valid, error? }`.
- **Consumers:** `validateBuffer.ts` (ALLOWED_MIME_TYPES, MAX_FILE_SIZE), `app/api/upload/route.ts` (sanitizeFilename), `hooks/useFileUpload.ts` (sanitizeFilename, validateFile), `app/api/admin/uploads/auth/route.ts` (ALLOWED_MIME_TYPES, MAX_FILE_SIZE).

---

## 2. Upload API changes

### 2.1 `app/api/upload/route.ts` (main upload endpoint)

- **Input:** Either `multipart/form-data` (field `file`, optional `smartDetection` = "true") or raw body with optional query `?smartDetection=true` and `?filename=...`.
- **Validation:** Every received buffer (single file or each file inside a ZIP) is validated with `validateBufferMagicBytes()`. Invalid file returns 415 with `error`, `reason`, and for ZIP entries also `file`.
- **Single file:**
  - Filename is sanitized: `sanitizeFilename(fileName)` before `saveBuffer()`.
  - Response `fileType` uses **server-detected MIME** (`v.detectedMime`), not client `file.type`.
  - Response shape: `{ success, file: { fileId, fileName, fileUrl, fileSize, fileType, uploadDate } }`.
- **ZIP when smartDetection=true:**
  - ZIP type detected from magic bytes (`v.detectedMime` / `v.detectedExt`), not from extension.
  - Parsed with `ZipParserService.parseAndIdentifyDependencies()`.
  - Limit: 50 entries; over that returns 400 "ZIP contains too many files (Limit: 50)".
  - Each entry: validated with `validateBufferMagicBytes(entry.content)`; saved with `sanitizeFilename(entry.name.split("/").pop() || "file")` under `extracted/${zipId}`; item `type` set to **detected MIME** (`detectedType`), not `entry.type`.
  - Response: `{ success, zipAnalysis: { uploadId, isSingleCreative, items, counts: { images, htmls } } }`.
- **Python malware scan:** Block commented out (TODO when checking model is ready); `PYTHON_SERVICE_URL` fetch to `/scan` not executed.
- **Error handling:** 500 returns `error`, `details`, and optional `stack`.

### 2.2 `app/api/upload/process-zip/route.ts` (server-side ZIP from URL)

- **Input:** JSON body `{ url }` (ZIP blob URL).
- **Flow:** Fetches ZIP from `url`, converts to Buffer, parses with `ZipParserService.parseAndIdentifyDependencies()`, enforces 50-entry limit.
- **Validation:** Each extracted entry validated with `validateBufferMagicBytes(entry.content)` before save; invalid entry returns 415 with `file` and `reason`.
- **Saving:** Each entry saved via `saveBuffer(entry.content, entry.name.split("/").pop() || "file", "extracted/${zipId}")` (filename not passed through `sanitizeFilename` here; main upload route does use it for ZIP entries).
- **Types/counts:** Uses `detectedType` from validation for `type` and for image/html counts.
- **Response:** Same shape as main route ZIP branch, plus optional `mainCreative` when `htmlCount === 1`.

### 2.3 `app/api/upload/token/route.ts` (Vercel Blob client token)

- **Purpose:** Issues upload token for client-side Blob uploads (no auth check in this route; comment notes auth should be added).
- **allowedContentTypes:** image/jpeg, image/png, image/gif, image/webp, image/svg+xml, text/html, application/zip, application/x-zip-compressed. **application/octet-stream is not allowed** (commented out).
- **Options:** addRandomSuffix: true; tokenPayload optional.
- **onUploadCompleted:** Logs blob and tokenPayload (currently via console.error).

---

## 3. Use of security helpers elsewhere

### 3.1 `hooks/useFileUpload.ts`

- Imports `sanitizeFilename` and `validateFile` from `@/lib/security`.
- Before upload: `validateFile(file)`; if invalid, toast and skip.
- Uses `sanitizeFilename(file.name)` as the name sent to Blob upload.
- Uses admin upload URL: `handleUploadUrl: "/api/admin/uploads/auth"`.

### 3.2 `app/api/admin/uploads/auth/route.ts`

- Imports `ALLOWED_MIME_TYPES` and `MAX_FILE_SIZE` from `@/lib/security`.
- Session required (Better Auth); returns 401 if no session.
- Rate limit enforced via `getRateLimitKey` and `ratelimit`.
- `onBeforeGenerateToken`: passes `allowedContentTypes: ALLOWED_MIME_TYPES`, `maximumSizeInBytes: MAX_FILE_SIZE`, and tokenPayload (userId, email, role).
- So admin uploads use the same allowed types and 50MB limit as the rest of the security layer.

---

## 4. Publisher form page

### 4.1 `app/(publisher)/form/page.tsx`

- **Role:** Publisher form landing page.
- **Layout:** Centered column, min-height screen, gap-2; background from `getVariables().colors.background`.
- **Logo:** Image from `variables.logo.path`, alt from `variables.logo.alt`, responsive width (190px / 220px / 260px), object-contain.
- **Form:** Renders `PublisherForm` from `@/features/publisher/components/form/PublisherForm`.

---

## 5. Environment

### 5.1 `env.js` (T3 env schema)

- **Server vars:** DATABASE*URL, BETTER_AUTH*_, CORS*ALLOWED_ORIGINS, VERCEL_URL, ADMIN*_, ADVERTISER*\*, EVERFLOW*_, CRON*SECRET, ALERT_WEBHOOK_URL, BLOB_READ_WRITE_TOKEN, PYTHON_SERVICE_URL, GRAMMAR_AI_URL, TELEGRAM_BOT_TOKEN, UPSTASH_REDIS*_.
- **Client vars:** NEXT_PUBLIC_BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_BLOB_URL, NEXT_PUBLIC_TELEGRAM_BOT_URL.
- **Options:** skipValidation when SKIP_ENV_VALIDATION is set; emptyStringAsUndefined: true.
- All of the above are used across the app for DB, auth, blob, grammar, Telegram, Redis, etc.

---

## 6. Git and remote (operational)

- **Remote:** Kept as Big-Drops-MG/Assets-Exchange (origin URL correct).
- **Config:** user.name and user.email set as desired for commits (e.g. swapnaja-bigdrops, swapnaja@bigdropsmarketing.com).
- **Permission denied "Swapnaja27":** Caused by **GitHub authentication** (credentials), not git config. Windows was using the Swapnaja27 account for GitHub. **Fix:** Remove stored GitHub credential (e.g. Credential Manager or `cmdkey /delete:git:https://github.com`) and sign in with the account that has push access to the repo when Git prompts.
