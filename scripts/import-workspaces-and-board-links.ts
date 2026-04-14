import seedData from "../server/data/trello-board-seed.json" assert { type: "json" };
import { getDb } from "../server/db";
import { departmentWorkspaces, employees } from "../drizzle/schema";
import { and, eq, or, sql } from "drizzle-orm";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database connection is not available.");

  const workspaceMap = new Map<string, { id: number; name: string }>();
  const uniqueWorkspaces = new Map<string, typeof seedData[number]>();

  for (const row of seedData) {
    if (!uniqueWorkspaces.has(row.workspaceName)) {
      uniqueWorkspaces.set(row.workspaceName, row);
    }
  }

  let createdWorkspaces = 0;
  for (const row of uniqueWorkspaces.values()) {
    const existing = await db
      .select({ id: departmentWorkspaces.id, name: departmentWorkspaces.name })
      .from(departmentWorkspaces)
      .where(eq(departmentWorkspaces.name, row.workspaceName))
      .limit(1);

    if (existing[0]) {
      workspaceMap.set(row.workspaceName, existing[0]);
      continue;
    }

    const result = await db.insert(departmentWorkspaces).values({
      departmentId: null,
      name: row.workspaceName,
      apiKey: row.apiKey,
      apiToken: row.apiToken,
      trelloWorkspaceId: null,
      isActive: true,
    });

    const id = Number((result as any)[0].insertId);
    workspaceMap.set(row.workspaceName, { id, name: row.workspaceName });
    createdWorkspaces++;
  }

  const currentEmployees = await db.select().from(employees);
  let linkedBoards = 0;

  for (const row of seedData) {
    const normalizedBoardName = normalize(row.boardName);
    const match = currentEmployees.find((employee) => normalize(employee.name) === normalizedBoardName);
    if (!match) continue;

    const workspace = workspaceMap.get(row.workspaceName);
    await db
      .update(employees)
      .set({
        trelloBoardId: row.boardId,
        trelloBoardUrl: row.postmanUrl || null,
        departmentWorkspaceId: workspace?.id ?? null,
      })
      .where(eq(employees.id, match.id));
    linkedBoards++;
  }

  console.log(JSON.stringify({ createdWorkspaces, linkedBoards, seedRows: seedData.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
