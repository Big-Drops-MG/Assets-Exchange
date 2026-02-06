/* eslint-disable no-console */
import "dotenv/config";

async function testAuditLogsAPI() {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const adminEmail = "admin@assets-exchange.com";
  const adminPassword = "Admin@123";

  console.log("Testing Audit Logs API...");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Admin Email: ${adminEmail}\n`);

  try {
    console.log("Step 1: Seeding admin user (if not exists)...");
    const seedResponse = await fetch(`${baseUrl}/api/admin/seed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!seedResponse.ok) {
      const seedError = await seedResponse.text();
      console.log(`Seed response: ${seedResponse.status} - ${seedError}`);
    } else {
      const seedData = await seedResponse.json();
      console.log(`✓ Admin user ready: ${seedData.message || "OK"}\n`);
    }

    console.log("Step 2: Signing in as admin...");
    const signInResponse = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
        Referer: baseUrl,
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });

    if (!signInResponse.ok) {
      const errorText = await signInResponse.text();
      throw new Error(
        `Sign in failed: ${signInResponse.status} - ${errorText}`
      );
    }

    const setCookieHeader = signInResponse.headers.get("set-cookie");
    if (!setCookieHeader) {
      throw new Error("No session cookie received from sign in");
    }

    const cookies = setCookieHeader.split(",").map((c) => c.trim());
    const sessionCookie = cookies.find((c) =>
      c.includes("better-auth.session_token")
    );

    if (!sessionCookie) {
      console.log("Available cookies:", cookies);
      throw new Error("Session cookie not found in response");
    }

    const cookieValue = sessionCookie.split(";")[0];
    console.log(`✓ Signed in successfully\n`);
    console.log(`Session cookie: ${cookieValue.substring(0, 50)}...\n`);

    console.log(
      "Step 3: Testing audit-logs API without authentication (should fail)..."
    );
    const unauthenticatedResponse = await fetch(
      `${baseUrl}/api/admin/audit-logs`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Status: ${unauthenticatedResponse.status}`);
    const unauthenticatedData = await unauthenticatedResponse.json();
    console.log(`Response: ${JSON.stringify(unauthenticatedData, null, 2)}\n`);

    if (unauthenticatedResponse.status !== 401) {
      console.warn(
        "⚠ Warning: Expected 401 Unauthorized, got different status"
      );
    } else {
      console.log("✓ Unauthenticated request correctly rejected\n");
    }

    console.log("Step 4: Testing audit-logs API with authentication...");
    const authenticatedResponse = await fetch(
      `${baseUrl}/api/admin/audit-logs?page=1&limit=10`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieValue,
        },
      }
    );

    console.log(`Status: ${authenticatedResponse.status}`);

    if (!authenticatedResponse.ok) {
      const errorText = await authenticatedResponse.text();
      throw new Error(
        `Audit logs API failed: ${authenticatedResponse.status} - ${errorText}`
      );
    }

    const auditLogsData = await authenticatedResponse.json();
    console.log(`✓ Audit logs retrieved successfully!\n`);
    console.log("Response structure:");
    console.log(`  - success: ${auditLogsData.success}`);
    console.log(`  - data length: ${auditLogsData.data?.length || 0}`);
    console.log(`  - meta.page: ${auditLogsData.meta?.page}`);
    console.log(`  - meta.limit: ${auditLogsData.meta?.limit}`);
    console.log(`  - meta.total: ${auditLogsData.meta?.total}`);
    console.log(`  - meta.totalPages: ${auditLogsData.meta?.totalPages}\n`);

    if (auditLogsData.data && auditLogsData.data.length > 0) {
      console.log("Sample audit log entry:");
      console.log(JSON.stringify(auditLogsData.data[0], null, 2));
    } else {
      console.log(
        "No audit logs found in database (this is OK if the database is empty)"
      );
    }

    console.log("\nStep 5: Testing with query parameters...");
    const filteredResponse = await fetch(
      `${baseUrl}/api/admin/audit-logs?page=1&limit=5&actionType=APPROVE`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieValue,
        },
      }
    );

    if (filteredResponse.ok) {
      const filteredData = await filteredResponse.json();
      console.log(`✓ Filtered request successful`);
      console.log(
        `  - Total filtered results: ${filteredData.meta?.total || 0}`
      );
    } else {
      const errorText = await filteredResponse.text();
      console.log(
        `⚠ Filtered request failed: ${filteredResponse.status} - ${errorText}`
      );
    }

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testAuditLogsAPI();
