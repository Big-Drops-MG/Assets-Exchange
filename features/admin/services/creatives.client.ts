export interface ResetStuckScanningResponse {
  found: number;
  reset: number;
  ids?: string[];
  batchLimited?: boolean;
  maxBatchSize?: number;
}

export async function resetStuckScanningAssets(): Promise<ResetStuckScanningResponse> {
  const res = await fetch("/api/admin/creatives/reset-stuck-scanning", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || "Failed to reset stuck scanning assets");
  }

  return res.json();
}
