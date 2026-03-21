import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import {
  helpArticles,
  helpArticleViews,
  helpFeedback,
  helpChatSessions,
  helpChatMessages,
  type HelpArticle,
  type InsertHelpArticle,
  type HelpChatSession,
  type HelpChatMessage,
} from "../drizzle/schema";

export type Article = Omit<HelpArticle, "tags"> & { tags: string[] };
export type InsertArticle = Omit<InsertHelpArticle, "tags"> & { tags?: string[] };
export type Session = HelpChatSession;
export type Message = Omit<HelpChatMessage, "sources"> & { sources: number[] };

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseNumberArray(value: string | null | undefined): number[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map(item => Number(item)).filter(item => Number.isFinite(item))
      : [];
  } catch {
    return [];
  }
}

function serializeJsonArray(values?: string[] | number[]): string | null {
  if (!values || values.length === 0) return null;
  return JSON.stringify(values);
}

function normalizeArticle(article: HelpArticle): Article {
  return {
    ...article,
    tags: parseJsonArray(article.tags),
  };
}

function normalizeMessage(message: HelpChatMessage): Message {
  return {
    ...message,
    sources: parseNumberArray(message.sources),
  };
}

function extractInsertId(result: unknown): number {
  if (Array.isArray(result) && result[0] && typeof result[0] === "object" && "insertId" in result[0]) {
    return Number((result[0] as { insertId: number }).insertId);
  }

  if (result && typeof result === "object" && "insertId" in result) {
    return Number((result as { insertId: number }).insertId);
  }

  throw new Error("Unable to determine insert id from database response.");
}

// Article CRUD
export async function getAllArticles(filters?: {
  category?: string;
  published?: boolean;
}): Promise<Article[]> {
  const db = await getDb();
  const conditions = [];

  if (filters?.category) {
    conditions.push(eq(helpArticles.category, filters.category));
  }

  if (typeof filters?.published === "boolean") {
    conditions.push(eq(helpArticles.isPublished, filters.published));
  }

  const rows = await db
    .select()
    .from(helpArticles)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(helpArticles.isPinned), desc(helpArticles.updatedAt), desc(helpArticles.createdAt));

  return rows.map(normalizeArticle);
}

export async function getArticleById(id: number): Promise<Article | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(helpArticles)
    .where(eq(helpArticles.id, id))
    .limit(1);

  return rows[0] ? normalizeArticle(rows[0]) : null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(helpArticles)
    .where(eq(helpArticles.slug, slug))
    .limit(1);

  return rows[0] ? normalizeArticle(rows[0]) : null;
}

export async function searchArticles(query: string): Promise<Article[]> {
  const db = await getDb();
  const search = `%${query.trim()}%`;

  const rows = await db
    .select()
    .from(helpArticles)
    .where(
      and(
        eq(helpArticles.isPublished, true),
        or(
          like(helpArticles.title, search),
          like(helpArticles.titleAr, search),
          like(helpArticles.content, search),
          like(helpArticles.contentAr, search),
          like(helpArticles.tags, search),
        ),
      ),
    )
    .orderBy(desc(helpArticles.isPinned), desc(helpArticles.updatedAt));

  return rows.map(normalizeArticle);
}

export async function createArticle(data: InsertArticle): Promise<Article> {
  const db = await getDb();
  const result = await db.insert(helpArticles).values({
    ...data,
    tags: serializeJsonArray(data.tags),
  });

  const id = extractInsertId(result);
  const article = await getArticleById(id);

  if (!article) {
    throw new Error("Article was created but could not be loaded.");
  }

  return article;
}

export async function updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article> {
  const db = await getDb();
  const updatePayload: Partial<InsertHelpArticle> = {
    ...data,
  };

  if (data.tags !== undefined) {
    updatePayload.tags = serializeJsonArray(data.tags);
  }

  await db.update(helpArticles).set(updatePayload).where(eq(helpArticles.id, id));

  const article = await getArticleById(id);
  if (!article) {
    throw new Error(`Article ${id} not found after update.`);
  }

  return article;
}

export async function deleteArticle(id: number): Promise<void> {
  const db = await getDb();
  await db.delete(helpArticles).where(eq(helpArticles.id, id));
}

export async function getArticlesByCategory(category: string): Promise<Article[]> {
  return getAllArticles({ category, published: true });
}

export async function getPinnedArticles(): Promise<Article[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(helpArticles)
    .where(and(eq(helpArticles.isPublished, true), eq(helpArticles.isPinned, true)))
    .orderBy(desc(helpArticles.updatedAt), desc(helpArticles.createdAt));

  return rows.map(normalizeArticle);
}

export async function getRecentUpdates(limit: number = 10): Promise<Article[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(helpArticles)
    .where(and(eq(helpArticles.category, "updates"), eq(helpArticles.isPublished, true)))
    .orderBy(desc(helpArticles.createdAt))
    .limit(limit);

  return rows.map(normalizeArticle);
}

// Views
export async function recordView(articleId: number, userId?: number): Promise<void> {
  const db = await getDb();
  await db.insert(helpArticleViews).values({
    articleId,
    userId: userId ?? null,
  });
}

export async function getArticleViewCount(articleId: number): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({
      count: sql<number>`cast(count(*) as unsigned)`,
    })
    .from(helpArticleViews)
    .where(eq(helpArticleViews.articleId, articleId));

  return Number(rows[0]?.count ?? 0);
}

// Feedback
export async function addFeedback(data: {
  articleId: number;
  userId?: number;
  helpful: boolean;
  comment?: string;
}): Promise<void> {
  const db = await getDb();
  await db.insert(helpFeedback).values({
    articleId: data.articleId,
    userId: data.userId ?? null,
    helpful: data.helpful,
    comment: data.comment?.trim() ? data.comment.trim() : null,
  });
}

export async function getArticleFeedback(articleId: number): Promise<{
  helpful: number;
  notHelpful: number;
}> {
  const db = await getDb();
  const rows = await db
    .select({
      helpful: sql<number>`cast(coalesce(sum(case when ${helpFeedback.helpful} = 1 then 1 else 0 end), 0) as unsigned)`,
      notHelpful: sql<number>`cast(coalesce(sum(case when ${helpFeedback.helpful} = 0 then 1 else 0 end), 0) as unsigned)`,
    })
    .from(helpFeedback)
    .where(eq(helpFeedback.articleId, articleId));

  return {
    helpful: Number(rows[0]?.helpful ?? 0),
    notHelpful: Number(rows[0]?.notHelpful ?? 0),
  };
}

// Chat
export async function createChatSession(userId?: number): Promise<{
  id: number;
  sessionKey: string;
}> {
  const db = await getDb();
  const sessionKey = nanoid(24);
  const result = await db.insert(helpChatSessions).values({
    userId: userId ?? null,
    sessionKey,
  });

  return {
    id: extractInsertId(result),
    sessionKey,
  };
}

export async function getChatSession(sessionKey: string): Promise<Session | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(helpChatSessions)
    .where(eq(helpChatSessions.sessionKey, sessionKey))
    .limit(1);

  return rows[0] ?? null;
}

export async function saveChatMessage(
  sessionId: number,
  role: "user" | "assistant",
  content: string,
  sources?: number[],
): Promise<void> {
  const db = await getDb();
  await db.insert(helpChatMessages).values({
    sessionId,
    role,
    content,
    sources: serializeJsonArray(sources),
  });
}

export async function getChatHistory(sessionKey: string): Promise<Message[]> {
  const db = await getDb();
  const session = await getChatSession(sessionKey);

  if (!session) {
    return [];
  }

  const rows = await db
    .select()
    .from(helpChatMessages)
    .where(eq(helpChatMessages.sessionId, session.id))
    .orderBy(helpChatMessages.createdAt, helpChatMessages.id);

  return rows.map(normalizeMessage);
}
