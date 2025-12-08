"use client";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { Router } from "./router";

export const rpc = createORPCClient<Router>(
  new RPCLink({
    url: "/api/rpc",
  })
);

