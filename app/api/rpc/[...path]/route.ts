import { router } from "@/lib/rpc/router";
import { RPCHandler } from "@orpc/server/fetch";
import { NextRequest } from "next/server";

const handler = new RPCHandler(router);

export async function GET(request: NextRequest) {
  const result = await handler.handle(request);
  if (result.matched) {
    return result.response;
  }
  return new Response("Not Found", { status: 404 });
}

export async function POST(request: NextRequest) {
  const result = await handler.handle(request);
  if (result.matched) {
    return result.response;
  }
  return new Response("Not Found", { status: 404 });
}

