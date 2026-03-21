import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { helpArticles } from "../drizzle/schema";
import { helpCenterSeedArticles } from "./helpCenterSeed";

async function run() {
  const db = await getDb();

  let inserted = 0;
  let updated = 0;

  for (const article of helpCenterSeedArticles) {
    const existing = await db
      .select({ id: helpArticles.id })
      .from(helpArticles)
      .where(eq(helpArticles.slug, article.slug))
      .limit(1);

    const payload = {
      ...article,
      tags: JSON.stringify(article.tags ?? []),
      contentAr: article.contentAr ?? null,
      titleAr: article.titleAr ?? null,
      version: article.version ?? null,
      authorId: article.authorId ?? null,
    };

    if (existing[0]) {
      await db
        .update(helpArticles)
        .set(payload)
        .where(eq(helpArticles.id, existing[0].id));
      updated += 1;
    } else {
      await db.insert(helpArticles).values(payload);
      inserted += 1;
    }
  }

  console.log(`Help Center seed complete. Inserted: ${inserted}, Updated: ${updated}`);
}

run().catch(error => {
  console.error("Help Center seed failed:", error);
  process.exit(1);
});
