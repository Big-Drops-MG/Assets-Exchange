import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("fileUrl");
    const fileId = searchParams.get("fileId");
    const processAssets = searchParams.get("processAssets") === "true";

    const urlToFetch = fileUrl || fileId;

    if (!urlToFetch) {
      return NextResponse.json(
        { error: "fileUrl or fileId is required" },
        { status: 400 }
      );
    }

    // Check if this is a Vercel Blob Storage URL
    const isVercelBlobUrl = urlToFetch.includes("blob.vercel-storage.com");

    let response: Response;

    if (isVercelBlobUrl) {
      // For Vercel Blob Storage, try fetching directly
      // If server-side fetch fails, return early to let client handle it
      try {
        response = await fetch(urlToFetch, {
          method: "GET",
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        // If server-side fetch fails with 403, return early to let client handle it
        if (!response.ok && response.status === 403) {
          return NextResponse.json(
            {
              error: "File access requires client-side fetch",
              requiresClientFetch: true,
              url: urlToFetch,
            },
            { status: 200 } // Return 200 so client can handle it
          );
        }
      } catch (_error) {
        // If fetch fails, return URL for client-side fetch
        return NextResponse.json(
          {
            error: "File access requires client-side fetch",
            requiresClientFetch: true,
            url: urlToFetch,
          },
          { status: 200 }
        );
      }
    } else {
      response = await fetch(urlToFetch, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file content" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "text/html";
    const content = await response.text();

    let processedContent = content;

    if (processAssets && contentType.includes("text/html")) {
      const baseUrl = new URL(urlToFetch);
      const basePath = baseUrl.pathname.substring(
        0,
        baseUrl.pathname.lastIndexOf("/")
      );

      processedContent = content
        .replace(/href=["']([^"']+)["']/gi, (match, url) => {
          if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("//")
          ) {
            return match;
          }
          if (url.startsWith("/")) {
            return `href="${baseUrl.origin}${url}"`;
          }
          return `href="${baseUrl.origin}${basePath}/${url}"`;
        })
        .replace(/src=["']([^"']+)["']/gi, (match, url) => {
          if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("//")
          ) {
            return match;
          }
          if (url.startsWith("/")) {
            return `src="${baseUrl.origin}${url}"`;
          }
          return `src="${baseUrl.origin}${basePath}/${url}"`;
        })
        .replace(/url\(["']?([^"')]+)["']?\)/gi, (match, url) => {
          if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("//")
          ) {
            return match;
          }
          if (url.startsWith("/")) {
            return `url("${baseUrl.origin}${url}")`;
          }
          return `url("${baseUrl.origin}${basePath}/${url}")`;
        });
    }

    return new NextResponse(processedContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching file content:", error);
    return NextResponse.json(
      { error: "Failed to fetch file content" },
      { status: 500 }
    );
  }
}
