import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  Loader2,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

const VIEWED_ARTICLE_IDS_KEY = "tos-help-center-viewed-article-ids";

type HelpArticle = {
  id: number;
  title: string;
  titleAr?: string | null;
  slug: string;
  category: string;
  content: string;
  contentAr?: string | null;
  version?: string | null;
  updatedAt: string | Date;
  createdAt: string | Date;
  viewCount: number;
  helpful: number;
  notHelpful: number;
  helpfulPercentage: number;
};

function prettyCategory(category: string): string {
  return category.replace(/-/g, " ");
}

function markArticleAsViewed(id: number) {
  const current = new Set<number>(
    JSON.parse(localStorage.getItem(VIEWED_ARTICLE_IDS_KEY) || "[]") as number[],
  );
  current.add(id);
  localStorage.setItem(VIEWED_ARTICLE_IDS_KEY, JSON.stringify(Array.from(current)));
  window.dispatchEvent(new Event("help-center-viewed-updated"));
}

export default function HelpArticlePage() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [comment, setComment] = useState("");

  const articleQuery = trpc.helpCenter.getArticle.useQuery(
    { slug: params.slug },
    { enabled: Boolean(params.slug) },
  );

  const article = articleQuery.data as HelpArticle | undefined;

  const relatedQuery = trpc.helpCenter.listArticles.useQuery(
    {
      category: article?.category,
      published: true,
    },
    {
      enabled: Boolean(article?.category),
    },
  );

  const feedbackMutation = trpc.helpCenter.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Thanks for your feedback");
      setComment("");
      articleQuery.refetch();
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (article?.id) {
      markArticleAsViewed(article.id);
      if (article.contentAr && !article.titleAr) {
        setLanguage("en");
      }
    }
  }, [article?.id, article?.contentAr, article?.titleAr]);

  const relatedArticles = useMemo(() => {
    const items = ((relatedQuery.data ?? []) as HelpArticle[]).filter(
      item => item.slug !== article?.slug,
    );
    return items.slice(0, 5);
  }, [article?.slug, relatedQuery.data]);

  const displayedContent = language === "ar" && article?.contentAr ? article.contentAr : article?.content;
  const isArabic = language === "ar" && Boolean(article?.contentAr);

  if (articleQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <Card>
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 py-10 text-center">
          <p className="text-lg font-medium">Article not found</p>
          <Button onClick={() => setLocation("/help")}>Back to Help Center</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="-ml-3" onClick={() => setLocation("/help") }>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Help Center
      </Button>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button type="button" onClick={() => setLocation("/help")}>Help Center</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button type="button" onClick={() => setLocation("/help") } className="capitalize">
                {prettyCategory(article.category)}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{article.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="capitalize">{prettyCategory(article.category)}</Badge>
                {article.version ? <Badge variant="outline">{article.version}</Badge> : null}
                {article.contentAr ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLanguage(current => (current === "en" ? "ar" : "en"))}
                  >
                    عربي / English
                  </Button>
                ) : null}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {language === "ar" && article.titleAr ? article.titleAr : article.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Updated {new Date(article.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.viewCount} views
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="max-w-none prose prose-sm sm:prose-base dark:prose-invert"
                dir={isArabic ? "rtl" : "ltr"}
              >
                <Streamdown>{displayedContent ?? ""}</Streamdown>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Was this helpful?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => feedbackMutation.mutate({ articleId: article.id, helpful: true, comment: comment || undefined })}
                  disabled={feedbackMutation.isPending}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" /> Yes
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => feedbackMutation.mutate({ articleId: article.id, helpful: false, comment: comment || undefined })}
                  disabled={feedbackMutation.isPending}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" /> No
                </Button>
              </div>
              <Textarea
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder="Optional comment"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {article.helpfulPercentage}% helpful based on {article.helpful + article.notHelpful} responses.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related articles</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64 pr-4">
                <div className="space-y-3">
                  {relatedQuery.isLoading ? (
                    <div className="flex h-24 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : relatedArticles.length > 0 ? (
                    relatedArticles.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLocation(`/help/${item.slug}`)}
                        className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                      >
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground capitalize">
                          {prettyCategory(item.category)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No related articles found.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ask the AI Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Open the help assistant with this article as context.
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("help-chat-open", {
                      detail: {
                        prompt: `Explain this article simply: ${article.title}`,
                      },
                    }),
                  );
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Ask AI
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
