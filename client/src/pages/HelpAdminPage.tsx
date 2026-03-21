import { useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  "getting-started",
  "clients",
  "employees",
  "tasks",
  "trello-integration",
  "analytics",
  "settings",
  "updates",
  "other",
] as const;

const TAG_OPTIONS = [
  "login",
  "dashboard",
  "roles",
  "clients",
  "services",
  "employees",
  "departments",
  "tasks",
  "reports",
  "trello",
  "analytics",
  "troubleshooting",
  "permissions",
  "settings",
  "updates",
];

type ArticleRow = {
  id: number;
  title: string;
  titleAr?: string | null;
  slug: string;
  content: string;
  contentAr?: string | null;
  category: string;
  tags: string[];
  isPublished: boolean;
  isPinned: boolean;
  version?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  viewCount: number;
  helpfulPercentage: number;
};

type ArticleFormState = {
  title: string;
  titleAr: string;
  slug: string;
  content: string;
  contentAr: string;
  category: string;
  tags: string[];
  version: string;
  isPublished: boolean;
  isPinned: boolean;
};

const EMPTY_FORM: ArticleFormState = {
  title: "",
  titleAr: "",
  slug: "",
  content: "",
  contentAr: "",
  category: "getting-started",
  tags: [],
  version: "",
  isPublished: true,
  isPinned: false,
};

function prettyCategory(category: string): string {
  return category.replace(/-/g, " ");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function HelpAdminPage() {
  const { user, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleRow | null>(null);
  const [form, setForm] = useState<ArticleFormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const articlesQuery = trpc.helpCenter.listArticles.useQuery({ published: undefined });

  const utils = trpc.useUtils();

  const createMutation = trpc.helpCenter.createArticle.useMutation({
    onSuccess: async () => {
      toast.success("Article created");
      await utils.helpCenter.listArticles.invalidate();
      await utils.helpCenter.getPinnedArticles.invalidate();
      await utils.helpCenter.getRecentUpdates.invalidate();
      closeDialog();
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = trpc.helpCenter.updateArticle.useMutation({
    onSuccess: async () => {
      toast.success("Article updated");
      await utils.helpCenter.listArticles.invalidate();
      await utils.helpCenter.getPinnedArticles.invalidate();
      await utils.helpCenter.getRecentUpdates.invalidate();
      closeDialog();
    },
    onError: error => toast.error(error.message),
  });

  const deleteMutation = trpc.helpCenter.deleteArticle.useMutation({
    onSuccess: async () => {
      toast.success("Article deleted");
      await utils.helpCenter.listArticles.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const articles = ((articlesQuery.data ?? []) as ArticleRow[]) || [];

  const allSelected = articles.length > 0 && selectedIds.length === articles.length;

  useEffect(() => {
    if (!slugTouched && form.title) {
      setForm(current => ({ ...current, slug: slugify(current.title) }));
    }
  }, [form.title, slugTouched]);

  const canManage = user && ["admin", "super_admin"].includes(user.role);

  const sortedArticles = useMemo(
    () => [...articles].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [articles],
  );

  if (loading || articlesQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <Card>
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 py-10 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Admin access required</h1>
            <p className="mt-2 text-muted-foreground">
              Only admin and super admin users can manage help center articles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingArticle(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setCustomTag("");
  }

  function openNewDialog() {
    setEditingArticle(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setCustomTag("");
    setDialogOpen(true);
  }

  function openEditDialog(article: ArticleRow) {
    setEditingArticle(article);
    setForm({
      title: article.title,
      titleAr: article.titleAr || "",
      slug: article.slug,
      content: article.content,
      contentAr: article.contentAr || "",
      category: article.category,
      tags: article.tags || [],
      version: article.version || "",
      isPublished: article.isPublished,
      isPinned: article.isPinned,
    });
    setSlugTouched(true);
    setDialogOpen(true);
  }

  function toggleSelected(id: number, checked: boolean) {
    setSelectedIds(current =>
      checked ? Array.from(new Set([...current, id])) : current.filter(item => item !== id),
    );
  }

  async function handleSave() {
    const payload = {
      title: form.title,
      titleAr: form.titleAr || undefined,
      slug: form.slug,
      content: form.content,
      contentAr: form.contentAr || undefined,
      category: form.category,
      tags: form.tags,
      isPublished: form.isPublished,
      isPinned: form.isPinned,
      version: form.version || undefined,
    };

    if (editingArticle) {
      await updateMutation.mutateAsync({ id: editingArticle.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  }

  async function handleBulkPublish() {
    if (selectedIds.length === 0) return;
    await Promise.all(
      selectedIds.map(id => updateMutation.mutateAsync({ id, data: { isPublished: true } })),
    );
    toast.success("Selected articles marked as published");
    setSelectedIds([]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help Center Admin</h1>
          <p className="text-sm text-muted-foreground">
            Manage published articles, drafts, translations, and update notes.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => void handleBulkPublish()} disabled={selectedIds.length === 0}>
            <Upload className="mr-2 h-4 w-4" />
            Mark as Published
          </Button>
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={checked => {
                      setSelectedIds(checked ? articles.map(article => article.id) : []);
                    }}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Helpful %</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedArticles.map(article => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(article.id)}
                      onCheckedChange={checked => toggleSelected(article.id, Boolean(checked))}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[280px] space-y-1">
                      <p className="truncate font-medium">{article.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{article.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{prettyCategory(article.category)}</TableCell>
                  <TableCell>
                    <Badge variant={article.isPublished ? "default" : "secondary"}>
                      {article.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{article.viewCount}</TableCell>
                  <TableCell>{article.helpfulPercentage}%</TableCell>
                  <TableCell>{new Date(article.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" onClick={() => openEditDialog(article)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => deleteMutation.mutate(article.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={open => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="h-[95vh] max-w-[95vw] overflow-hidden p-0">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>{editingArticle ? "Edit Article" : "New Article"}</DialogTitle>
            </DialogHeader>

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[420px_minmax(0,1fr)]">
              <ScrollArea className="border-r">
                <div className="space-y-5 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titleAr">Arabic Title</Label>
                    <Input
                      id="titleAr"
                      value={form.titleAr}
                      onChange={event => setForm(current => ({ ...current, titleAr: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={form.slug}
                      onChange={event => {
                        setSlugTouched(true);
                        setForm(current => ({ ...current, slug: slugify(event.target.value) }));
                      }}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={form.category}
                        onValueChange={value => setForm(current => ({ ...current, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map(option => (
                            <SelectItem key={option} value={option} className="capitalize">
                              {prettyCategory(option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        placeholder="v1.0.0"
                        value={form.version}
                        onChange={event => setForm(current => ({ ...current, version: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {TAG_OPTIONS.map(tag => {
                        const active = form.tags.includes(tag);
                        return (
                          <Button
                            key={tag}
                            type="button"
                            size="sm"
                            variant={active ? "default" : "outline"}
                            onClick={() => {
                              setForm(current => ({
                                ...current,
                                tags: active
                                  ? current.tags.filter(item => item !== tag)
                                  : [...current.tags, tag],
                              }));
                            }}
                          >
                            {tag}
                          </Button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Custom tag"
                        value={customTag}
                        onChange={event => setCustomTag(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const value = customTag.trim();
                          if (!value) return;
                          if (!form.tags.includes(value)) {
                            setForm(current => ({ ...current, tags: [...current.tags, value] }));
                          }
                          setCustomTag("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    {form.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {form.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                setForm(current => ({
                                  ...current,
                                  tags: current.tags.filter(item => item !== tag),
                                }))
                              }
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label>Published</Label>
                        <p className="text-xs text-muted-foreground">Visible to users</p>
                      </div>
                      <Switch
                        checked={form.isPublished}
                        onCheckedChange={checked => setForm(current => ({ ...current, isPublished: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label>Pinned</Label>
                        <p className="text-xs text-muted-foreground">Show at top</p>
                      </div>
                      <Switch
                        checked={form.isPinned}
                        onCheckedChange={checked => setForm(current => ({ ...current, isPinned: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="min-h-0 p-6">
                <Tabs defaultValue="english-editor" className="h-full">
                  <TabsList>
                    <TabsTrigger value="english-editor">English</TabsTrigger>
                    <TabsTrigger value="english-preview">English Preview</TabsTrigger>
                    <TabsTrigger value="arabic-editor">Arabic</TabsTrigger>
                    <TabsTrigger value="arabic-preview">Arabic Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="english-editor" className="h-[calc(95vh-180px)]">
                    <Textarea
                      value={form.content}
                      onChange={event => setForm(current => ({ ...current, content: event.target.value }))}
                      className="h-full resize-none font-mono text-sm"
                      placeholder="Write markdown content"
                    />
                  </TabsContent>

                  <TabsContent value="english-preview" className="h-[calc(95vh-180px)] rounded-lg border">
                    <ScrollArea className="h-full p-4">
                      <div className="prose prose-sm max-w-none dark:prose-invert sm:prose-base">
                        <Streamdown>{form.content || "Nothing to preview yet."}</Streamdown>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="arabic-editor" className="h-[calc(95vh-180px)]">
                    <Textarea
                      value={form.contentAr}
                      onChange={event => setForm(current => ({ ...current, contentAr: event.target.value }))}
                      className="h-full resize-none font-mono text-sm"
                      placeholder="Optional Arabic markdown content"
                      dir="rtl"
                    />
                  </TabsContent>

                  <TabsContent value="arabic-preview" className="h-[calc(95vh-180px)] rounded-lg border">
                    <ScrollArea className="h-full p-4">
                      <div className="prose prose-sm max-w-none dark:prose-invert sm:prose-base" dir="rtl">
                        <Streamdown>{form.contentAr || "لا يوجد محتوى عربي بعد."}</Streamdown>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button
                onClick={() => void handleSave()}
                disabled={!form.title || !form.slug || !form.content || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingArticle ? "Save Changes" : "Create Article"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
