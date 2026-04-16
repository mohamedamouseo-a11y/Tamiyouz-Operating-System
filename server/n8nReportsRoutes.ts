import type { Express, Request, Response } from "express";
import { z } from "zod";
import { createOrUpdateDailyReport, createAlert } from "./db";

const payloadSchema = z.object({
  employeeId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  totalHours: z.union([z.string(), z.number()]).transform((v) => String(v)),
  tasksCompleted: z.number().int().min(0),
  tasksInProgress: z.number().int().min(0),
  summary: z.string(),
  status: z.enum(["draft", "generated", "approved"]).default("generated"),
  source: z.string().optional(),
  externalRunId: z.string().optional(),
  createAlert: z.boolean().optional().default(false),
  alertTitle: z.string().optional(),
  alertMessage: z.string().optional(),
  severity: z.enum(["info", "warning", "critical"]).optional().default("info"),
});

export function registerN8nReportsRoutes(app: Express) {
  app.post("/api/integrations/n8n/reports", async (req: Request, res: Response) => {
    const apiKey = process.env.N8N_REPORTS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "N8N_REPORTS_API_KEY is not configured" });
      return;
    }
    const provided = req.headers["x-api-key"];
    if (!provided || provided !== apiKey) {
      res.status(401).json({ error: "Unauthorized: invalid or missing x-api-key" });
      return;
    }

    const parsed = payloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    const {
      employeeId, date, totalHours, tasksCompleted, tasksInProgress,
      summary, status, createAlert: shouldCreateAlert, alertTitle,
      alertMessage, severity,
    } = parsed.data;

    try {
      const report = await createOrUpdateDailyReport({
        employeeId,
        date,
        totalHours,
        tasksCompleted,
        tasksInProgress,
        summary,
        status,
        generatedAt: new Date(),
      });

      let alertCreated = false;
      if (shouldCreateAlert && alertTitle) {
        await createAlert({
          employeeId,
          type: "system",
          title: alertTitle,
          message: alertMessage ?? null,
          severity: severity ?? "info",
          isRead: false,
          targetRole: "admin",
        });
        alertCreated = true;
      }

      res.status(200).json({ success: true, reportId: (report as any).id ?? null, alertCreated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      console.error("[n8n reports] Failed to process report:", message);
      res.status(500).json({ error: message });
    }
  });
}
