import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MessageCircleQuestion,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Streamdown } from "streamdown";

const SESSION_KEY_STORAGE = "tos-help-center-chat-session-key";
const VIEWED_ARTICLE_IDS_KEY = "tos-help-center-viewed-article-ids";

type HelpChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources: number[];
  createdAt: string | Date;
};

type HelpArticleSummary = {
  id: number;
  title: string;
  slug: string;
  category: string;
  content: string;
  createdAt: string | Date;
};

function getViewedIds(): number[] {
  try {
    return JSON.parse(localStorage.getItem(VIEWED_ARTICLE_IDS_KEY) || "[]") as number[];
  } catch {
    return [];
  }
}

function isWithinDays(dateValue: string | Date, days: number): boolean {
  const date = new Date(dateValue);
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= threshold;
}

export default function HelpChatWidget() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionKey, setSessionKey] = useState<string | null>(() =>
    localStorage.getItem(SESSION_KEY_STORAGE),
  );
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [viewedIds, setViewedIds] = useState<number[]>(() => getViewedIds());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const articlesQuery = trpc.helpCenter.listArticles.useQuery({ published: true });
  const updatesQuery = trpc.helpCenter.getRecentUpdates.useQuery({ limit: 20 });

  const startChatMutation = trpc.helpCenter.startChat.useMutation({
    onSuccess: data => {
      localStorage.setItem(SESSION_KEY_STORAGE, data.sessionKey);
      setSessionKey(data.sessionKey);
    },
    onError: error => toast.error(error.message),
  });

  const historyQuery = trpc.helpCenter.getChatHistory.useQuery(
    { sessionKey: sessionKey ?? "" },
    {
      enabled: open && Boolean(sessionKey),
      retry: false,
    },
  );

  const sendMessageMutation = trpc.helpCenter.sendMessage.useMutation({
    onSuccess: data => {
      setMessages(data.history as HelpChatMessage[]);
      setInput("");
    },
    onError: async error => {
      if (error.message.toLowerCase().includes("session")) {
        localStorage.removeItem(SESSION_KEY_STORAGE);
        setSessionKey(null);
        const fresh = await startChatMutation.mutateAsync();
        localStorage.setItem(SESSION_KEY_STORAGE, fresh.sessionKey);
        setSessionKey(fresh.sessionKey);
        return;
      }
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (historyQuery.data) {
      setMessages(historyQuery.data as HelpChatMessage[]);
    }
  }, [historyQuery.data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, sendMessageMutation.isPending]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string }>;
      setOpen(true);
      if (customEvent.detail?.prompt) {
        setInput(customEvent.detail.prompt);
      }
    };

    const handleViewedUpdate = () => setViewedIds(getViewedIds());

    window.addEventListener("help-chat-open", handleOpen);
    window.addEventListener("help-center-viewed-updated", handleViewedUpdate);
    window.addEventListener("storage", handleViewedUpdate);

    return () => {
      window.removeEventListener("help-chat-open", handleOpen);
      window.removeEventListener("help-center-viewed-updated", handleViewedUpdate);
      window.removeEventListener("storage", handleViewedUpdate);
    };
  }, []);

  useEffect(() => {
    if (open && !sessionKey && !startChatMutation.isPending) {
      startChatMutation.mutate();
    }
  }, [open, sessionKey, startChatMutation]);

  const articleMap = useMemo(() => {
    const map = new Map<number, HelpArticleSummary>();
    (((articlesQuery.data ?? []) as HelpArticleSummary[]) || []).forEach(article => {
      map.set(article.id, article);
    });
    return map;
  }, [articlesQuery.data]);

  const hasUnreadRecentUpdates = useMemo(() => {
    const viewed = new Set(viewedIds);
    return (((updatesQuery.data ?? []) as HelpArticleSummary[]) || []).some(article =>
      isWithinDays(article.createdAt, 7) && !viewed.has(article.id),
    );
  }, [updatesQuery.data, viewedIds]);

  const displayMessages = messages.length > 0
    ? messages
    : [
        {
          id: 0,
          role: "assistant" as const,
          content:
            "Hi! I'm your TOS assistant. Ask me anything about the system, integrations, or how to use any feature.",
          sources: [],
          createdAt: new Date(),
        },
      ];

  const handleSend = async () => {
    const message = input.trim();
    if (!message || sendMessageMutation.isPending || startChatMutation.isPending) return;

    let activeSessionKey = sessionKey;
    if (!activeSessionKey) {
      const fresh = await startChatMutation.mutateAsync();
      activeSessionKey = fresh.sessionKey;
      localStorage.setItem(SESSION_KEY_STORAGE, activeSessionKey);
      setSessionKey(activeSessionKey);
    }

    await sendMessageMutation.mutateAsync({
      sessionKey: activeSessionKey,
      message,
    });
  };

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setOpen(current => !current)}
        aria-label="Toggle AI help assistant"
      >
        <MessageCircleQuestion className="h-6 w-6" />
        {hasUnreadRecentUpdates ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            New
          </span>
        ) : null}
      </Button>

      {open ? (
        <Card className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[350px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Help Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0">
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-4">
                {displayMessages.map(message => {
                  const sourceArticles = message.sources
                    .map(sourceId => articleMap.get(sourceId))
                    .filter(Boolean) as HelpArticleSummary[];

                  return (
                    <div
                      key={`${message.id}-${message.createdAt}`}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[85%] space-y-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <Streamdown>{message.content}</Streamdown>
                          ) : (
                            <p>{message.content}</p>
                          )}
                        </div>

                        {message.role === "assistant" && sourceArticles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {sourceArticles.map(source => (
                              <Badge
                                key={source.id}
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => {
                                  setOpen(false);
                                  setLocation(`/help/${source.slug}`);
                                }}
                              >
                                {source.title}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {historyQuery.isLoading || sendMessageMutation.isPending ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="space-y-3 border-t p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Ask about TOS, Trello, roles, or reports"
                  maxLength={1000}
                />
                <Button
                  size="icon"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <button
                type="button"
                className="text-xs text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setOpen(false);
                  setLocation("/help");
                }}
              >
                Open the full Help Center
              </button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
