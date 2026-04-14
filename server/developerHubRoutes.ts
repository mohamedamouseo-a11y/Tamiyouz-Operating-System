import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { triggerGithubSync, type SseEvent } from "./developerHub";

function isAdminOrSuperAdmin(user: { role: string }): boolean {
  return user.role === "admin" || user.role === "super_admin";
}

export function registerDeveloperHubRoutes(app: Express) {
  app.get("/api/developer-hub/sync", async (req: Request, res: Response) => {
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null = null;
    try { user = await sdk.authenticateRequest(req); } catch { /* ignore */ }
    if (!user || !isAdminOrSuperAdmin(user)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const message = String(req.query["message"] || "Automated sync");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (obj: SseEvent) => {
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
    };

    try {
      await triggerGithubSync(message, send);
    } catch (err: unknown) {
      // Unexpected error not caught inside triggerGithubSync
      const msg = err instanceof Error ? err.message : "Unknown error";
      send({ type: "complete", ok: false, message: msg });
    } finally {
      res.end();
    }
  });
}
