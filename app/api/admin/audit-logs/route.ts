import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAuditLogs } from "@/features/admin/services/auditLogs.service";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withRequestContext } from "@/lib/requestContext";

export const dynamic = "force-dynamic";

function requireAdmin(
  session: Awaited<ReturnType<typeof auth.api.getSession>>
) {
  if (!session?.user) {
    return { authorized: false, error: "Unauthorized" };
  }

  const role = session.user.role;

  if (role !== "admin" && role !== "administrator") {
    return { authorized: false, error: "Unauthorized" };
  }

  return { authorized: true, session };
}

function parseQueryParams(searchParams: URLSearchParams):
  | {
      success: true;
      data: {
        adminId?: string;
        actionType?: "APPROVE" | "REJECT";
        startDate?: Date;
        endDate?: Date;
        page: number;
        limit: number;
      };
    }
  | {
      success: false;
      error: string;
      status: number;
    } {
  try {
    const adminId = searchParams.get("adminId") || searchParams.get("adminID");
    const actionParam =
      searchParams.get("actionType") || searchParams.get("action");
    const startDateParam =
      searchParams.get("startDate") ||
      searchParams.get("dateFrom") ||
      searchParams.get("from");
    const endDateParam =
      searchParams.get("endDate") ||
      searchParams.get("dateTo") ||
      searchParams.get("to");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const result: {
      adminId?: string;
      actionType?: "APPROVE" | "REJECT";
      startDate?: Date;
      endDate?: Date;
      page: number;
      limit: number;
    } = {
      page: 1,
      limit: 20,
    };

    if (adminId && adminId.trim()) {
      result.adminId = adminId.trim();
    }

    if (actionParam && actionParam.trim()) {
      const actionUpper = actionParam.trim().toUpperCase();
      if (actionUpper !== "APPROVE" && actionUpper !== "REJECT") {
        return {
          success: false,
          error: "Invalid action type. Must be APPROVE or REJECT",
          status: 400,
        };
      }
      result.actionType = actionUpper as "APPROVE" | "REJECT";
    }

    if (startDateParam && startDateParam.trim()) {
      const startDate = new Date(startDateParam.trim());
      if (isNaN(startDate.getTime())) {
        return {
          success: false,
          error: "Invalid startDate format. Expected ISO 8601 date string.",
          status: 400,
        };
      }
      if (!startDateParam.includes("T") && !startDateParam.includes(" ")) {
        startDate.setHours(0, 0, 0, 0);
      }
      result.startDate = startDate;
    }

    if (endDateParam && endDateParam.trim()) {
      const endDate = new Date(endDateParam.trim());
      if (isNaN(endDate.getTime())) {
        return {
          success: false,
          error: "Invalid endDate format. Expected ISO 8601 date string.",
          status: 400,
        };
      }
      if (!endDateParam.includes("T") && !endDateParam.includes(" ")) {
        endDate.setHours(23, 59, 59, 999);
      }
      result.endDate = endDate;
    }

    if (
      result.startDate &&
      result.endDate &&
      result.startDate > result.endDate
    ) {
      return {
        success: false,
        error: "startDate must be less than or equal to endDate",
        status: 400,
      };
    }

    if (pageParam) {
      const page = Number.parseInt(pageParam, 10);
      if (isNaN(page) || page < 1) {
        return {
          success: false,
          error: "Invalid page. Must be a positive integer.",
          status: 400,
        };
      }
      result.page = page;
    }

    if (limitParam) {
      const limit = Number.parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return {
          success: false,
          error: "Invalid limit. Must be between 1 and 100.",
          status: 400,
        };
      }
      result.limit = limit;
    }

    return { success: true, data: result };
  } catch (_error) {
    return {
      success: false,
      error: "Failed to parse query parameters",
      status: 400,
    };
  }
}

export async function GET(req: Request) {
  return withRequestContext(async () => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      const authResult = requireAdmin(session);
      if (!authResult.authorized) {
        try {
          logger.warn({
            action: "audit-logs.list",
            error: authResult.error,
            userId: session?.user?.id,
            role: session?.user?.role,
          });
        } catch (_logError) {
          // Logging error shouldn't block the request
          console.error(
            "Error logging audit-logs.list auth warning:",
            _logError
          );
        }
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      const authorizedSession = authResult.session;
      if (!authorizedSession?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const validationResult = parseQueryParams(searchParams);

      if (validationResult.success === false) {
        return NextResponse.json(
          { error: validationResult.error },
          { status: validationResult.status }
        );
      }

      const params = validationResult.data;

      try {
        logger.info({
          action: "audit-logs.list",
          actorId: authorizedSession.user.id,
          filters: {
            adminId: params.adminId,
            actionType: params.actionType,
            startDate: params.startDate?.toISOString(),
            endDate: params.endDate?.toISOString(),
            page: params.page,
            limit: params.limit,
          },
        });
      } catch (_logError) {
        // Logging error shouldn't block the request
        console.error("Error logging audit-logs.list request:", _logError);
      }

      const result = await getAuditLogs({
        adminId: params.adminId,
        actionType: params.actionType,
        startDate: params.startDate,
        endDate: params.endDate,
        page: params.page,
        limit: params.limit,
      });

      try {
        logger.info({
          action: "audit-logs.list",
          actorId: authorizedSession.user.id,
          count: result.data.length,
          page: params.page,
          total: result.meta.total,
        });
      } catch (_logError) {
        // Logging error shouldn't block the request
        console.error("Error logging audit-logs.list response:", _logError);
      }

      return NextResponse.json(result);
    } catch (error: unknown) {
      logger.error({
        action: "audit-logs.list",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        { error: "Failed to fetch audit logs" },
        { status: 500 }
      );
    }
  });
}
