import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        // Generate a client token for the browser to upload the file
        // 🚧 SECURITY WARNING:
        // Ensure you authenticate the user here if you haven't already.
        // For now, we allow uploads as per existing application logic,
        // but normally you'd check session/auth here.

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "text/html",
            "application/zip",
            "application/x-zip-compressed",
            // "application/octet-stream",
          ],
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
            // userEmail: user.email,
          }),
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        console.error("Blob upload completed", blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
