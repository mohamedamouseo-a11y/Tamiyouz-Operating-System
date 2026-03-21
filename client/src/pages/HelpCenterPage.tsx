import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  Loader2,
  Pin,
  Search,
  Sparkles,
  ThumbsUp,
} from "lucide-react";

const ALL_CATEGORY = "all";

type HelpArticleCard = {
  id: number;
  title: string;
  slug: string;
  category: string;
  content: string;
  updatedAt: string | Date;
  createdAt: string | Date;
  isPinned: boolean;
  viewCount: number;
  helpful: number;
  notHelpful: number;
  helpfulPercentage: number;
};

type HelpCategory = {
  category: string;
  count: number;
};

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s/g, "")
    .replace(/[>*_~\-]/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(markdown: string, max = 150): string {
  const clean = stripMarkdown(markdown);
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
}

function prettyCategory(category: string): string {
  return category.replace(/-/g, " ");
}

export default function HelpCenterPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatesOpen, setUpdatesOpen] = useState(false);

  const normalizedSearch = searchTerm.trim();
  const searching = normalizedSearch.length >= 2;

  const articlesQuery = trpc.helpCenter.listArticles.useQuery(
    {
      category: selectedCategory === ALL_CATEGORY ? undefined : selectedCategory,
      published: true,
    },
    {
      enabled: !searching,
    },
  );

  const searchQuery = trpc.helpCenter.searchArticles.useQuery(
    { query: normalizedSearch },
    { enabled: searching },
  );

  const pinnedQuery = trpc.helpCenter.getPinnedArticles.useQuery(undefined, {
    enabled: !searching,
  });

  const categoriesQuery = trpc.helpCenter.getCategories.useQuery();
  const updatesQuery = trpc.helpCenter.getRecentUpdates.useQuery({ limit: 10 });

  const categories = useMemo<HelpCategory[]>(() => {
    const serverCategories = (categoriesQuery.data ?? []) as HelpCategory[];
    const total = serverCategories.reduce((sum, item) => sum + item.count, 0);
    return [{ category: ALL_CATEGORY, count: total }, ...serverCategories];
  }, [categoriesQuery.data]);

  const articles = ((searching ? searchQuery.data : articlesQuery.data) ?? []) as HelpArticleCard[];
  const pinnedArticles = ((pinnedQuery.data ?? []) as HelpArticleCard[]).filter(article =>
    selectedCategory === ALL_CATEGORY ? true : article.category === selectedCategory,
  );

  const pinnedIds = new Set(pinnedArticles.map(article => article.id));
  const regularArticles = articles.filter(article => !pinnedIds.has(article.id));

  const loading = articlesQuery.isLoading || searchQuery.isLoading || categoriesQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
          <p className="text-sm text-muted-foreground">
            Search guides, onboarding steps, troubleshooting notes, and product updates.
          </p>
        </div>

        <Button onClick={() => setUpdatesOpen(true)} className="w-full lg:w-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          What&apos;s New
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder="Search the Help Center"
          className="h-12 pl-10 text-base"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {categories.map(item => {
                const active = selectedCategory === item.category;
                return (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => setSelectedCategory(item.category)}
                    className={`flex min-w-fit items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors lg:w-full ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className="capitalize">{prettyCategory(item.category)}</span>
                    <Badge variant={active ? "default" : "secondary"}>{item.count}</Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!searching && pinnedArticles.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">Pinned Articles</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {pinnedArticles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    pinned
                    onOpen={() => setLocation(`/help/${article.slug}`)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {searching ? "Search Results" : "All Articles"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {articles.length} article{articles.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : regularArticles.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {regularArticles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onOpen={() => setLocation(`/help/${article.slug}`)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex min-h-40 flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                  <Search className="h-8 w-8" />
                  <p>No articles matched your current filter.</p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>

      <Dialog open={updatesOpen} onOpenChange={setUpdatesOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>What&apos;s New</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-4">
              {updatesQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : ((updatesQuery.data ?? []) as HelpArticleCard[]).length > 0 ? (
                ((updatesQuery.data ?? []) as HelpArticleCard[]).map(article => (
                  <Card key={article.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => {
                    setUpdatesOpen(false);
                    setLocation(`/help/${article.slug}`);
                  }}>
                    <CardHeader className="space-y-2 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <Badge>{article.category}</Badge>
                        {(article as { version?: string | null }).version ? (
                          <Badge variant="outline">{(article as { version?: string | null }).version}</Badge>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>{excerpt(article.content, 220)}</p>
                      <p>
                        Published {new Date(article.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No recent update articles yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArticleCard({
  article,
  onOpen,
  pinned = false,
}: {
  article: HelpArticleCard;
  onOpen: () => void;
  pinned?: boolean;
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={onOpen}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {prettyCategory(article.category)}
          </Badge>
          {pinned ? (
            <Badge>
              <Pin className="mr-1 h-3 w-3" /> Pinned
            </Badge>
          ) : null}
        </div>
        <CardTitle className="line-clamp-2 text-base leading-6">{article.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p className="line-clamp-4">{excerpt(article.content)}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {article.viewCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" /> {article.helpfulPercentage}% helpful
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
