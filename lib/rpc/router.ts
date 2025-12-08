import { os } from "@orpc/server";
import { z } from "zod";

export const health = os
  .output(
    z.object({
      status: z.string(),
      timestamp: z.string(),
    })
  )
  .handler(async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });

export const router = {
  health,
};

export type Router = typeof router;

