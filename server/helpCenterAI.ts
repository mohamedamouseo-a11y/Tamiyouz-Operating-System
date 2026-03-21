import { invokeLLM } from "./_core/llm";
import {
  getAllArticles,
  getChatHistory,
  getChatSession,
  saveChatMessage,
} from "./helpCenterDb";

const HELP_CENTER_SYSTEM_PROMPT =
  "You are a helpful assistant for the Tamiyouz TOS platform. Answer questions based ONLY on the help center articles provided below. If the answer is not in the articles, say 'I don't have information about that in the help center yet.' Always be concise, friendly, and specific. Format answers with bullet points when listing steps.";

type HelpAnswerSource = {
  id: number;
  title: string;
  slug: string;
};

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 2);
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;

  const normalizedHaystack = haystack.toLowerCase();
  const normalizedNeedle = needle.toLowerCase();
  let count = 0;
  let position = 0;

  while (true) {
    const foundAt = normalizedHaystack.indexOf(normalizedNeedle, position);
    if (foundAt === -1) break;
    count += 1;
    position = foundAt + normalizedNeedle.length;
  }

  return count;
}

function getTopSources(
  question: string,
  articles: Awaited<ReturnType<typeof getAllArticles>>,
): HelpAnswerSource[] {
  const tokens = tokenize(question);

  const scored = articles.map(article => {
    const tagsText = article.tags.join(" ");
    const corpus = `${article.title} ${article.category} ${tagsText} ${article.content.slice(0, 2000)}`;

    let score = 0;
    for (const token of tokens) {
      score += countOccurrences(article.title, token) * 5;
      score += countOccurrences(tagsText, token) * 4;
      score += countOccurrences(article.category, token) * 3;
      score += Math.min(countOccurrences(corpus, token), 6);
    }

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      score,
      pinned: article.isPinned ? 1 : 0,
      updatedAt: article.updatedAt?.getTime?.() ?? 0,
    };
  });

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.pinned !== a.pinned) return b.pinned - a.pinned;
      return b.updatedAt - a.updatedAt;
    })
    .slice(0, 3)
    .map(({ id, title, slug }) => ({ id, title, slug }));
}

function buildContext(articles: Awaited<ReturnType<typeof getAllArticles>>): string {
  return articles
    .map(article => {
      const tags = article.tags.length > 0 ? article.tags.join(", ") : "none";
      return [
        `ARTICLE ID: ${article.id}`,
        `TITLE: ${article.title}`,
        `SLUG: ${article.slug}`,
        `CATEGORY: ${article.category}`,
        `TAGS: ${tags}`,
        "CONTENT:",
        article.content,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function buildConversationHistory(history: Awaited<ReturnType<typeof getChatHistory>>): string {
  const recent = history.slice(-6);
  if (recent.length === 0) return "No previous chat history.";

  return recent
    .map(message => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

export async function answerHelpQuestion(
  question: string,
  sessionKey: string,
  userId?: number,
): Promise<{ answer: string; sources: HelpAnswerSource[] }> {
  const session = await getChatSession(sessionKey);
  if (!session) {
    throw new Error(`Help chat session ${sessionKey} was not found.`);
  }

  if (userId && session.userId && session.userId !== userId) {
    throw new Error("This help chat session does not belong to the current user.");
  }

  const articles = await getAllArticles({ published: true });
  const sources = getTopSources(question, articles);
  const history = await getChatHistory(sessionKey);

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: HELP_CENTER_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          "Help center articles:",
          buildContext(articles),
          "",
          "Conversation history:",
          buildConversationHistory(history),
          "",
          `User question: ${question}`,
        ].join("\n"),
      },
    ],
  });

  const answer =
    typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "I don't have information about that in the help center yet.";

  await saveChatMessage(session.id, "user", question);
  await saveChatMessage(
    session.id,
    "assistant",
    answer,
    sources.map(source => source.id),
  );

  return { answer, sources };
}
