import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Github, GitBranch, CheckCircle, XCircle, Upload, RefreshCw, Terminal, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type SseEvent =
  | { type: "progress"; message: string; progress: number }
  | { type: "log"; level: "info" | "warning" | "error"; message: string }
  | { type: "complete"; ok: boolean; message: string; progress?: number };

export default function DeveloperHubSettingsPage() {
  const { data: status, isLoading, refetch } = trpc.developerHub.get.useQuery();
  const [repoPath, setRepoPath] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [isEnabled, setIsEnabled] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [commitMsg, setCommitMsg] = useState("chore: automated sync");
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [logs, setLogs] = useState<SseEvent[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status) {
      setRepoPath(status.repoPath ?? "");
      setGithubRepo(status.githubRepo ?? "");
      setDefaultBranch(status.defaultBranch ?? "main");
      setIsEnabled(status.isEnabled ?? true);
    }
  }, [status]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const saveMutation = trpc.developerHub.save.useMutation({
    onSuccess: () => {
      toast.success("Developer Hub settings saved");
      setGithubToken("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    saveMutation.mutate({
      repoPath,
      githubRepo,
      githubToken: githubToken || undefined,
      defaultBranch,
      isEnabled,
    });
  };

  const handleSync = () => {
    if (syncing) return;
    setSyncing(true);
    setSyncProgress(0);
    setLogs([]);

    const url = `/api/developer-hub/sync?message=${encodeURIComponent(commitMsg)}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SseEvent;
        setLogs((prev) => [...prev, event]);

        if (event.type === "progress") {
          setSyncProgress(event.progress);
        }

        if (event.type === "complete") {
          // Close the stream before updating state
          es.close();
          setSyncing(false);

          if (event.ok) {
            setSyncProgress(event.progress ?? 100);
            toast.success(event.message || "Sync complete!");
            refetch();
          } else {
            toast.error(event.message || "Sync failed");
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    };

    es.onerror = () => {
      // Connection lost — do NOT infer success from this
      es.close();
      setSyncing(false);
      toast.error("Sync connection lost. Please try again.");
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Github className="h-6 w-6" /> Developer Hub
        </h1>
        <p className="text-muted-foreground">Manage repository sync and GitHub integration</p>
      </div>

      {/* ── Status Card ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Repository Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Status</span>
              <div className="mt-1">
                {status?.configured ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" /> Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" /> Not configured
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Branch</span>
              <div className="mt-1 font-mono text-xs">{status?.currentBranch ?? "—"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Git Status</span>
              <div className="mt-1 font-mono text-xs">{status?.gitStatus ?? "—"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Commit</span>
              <div className="mt-1 font-mono text-xs">{status?.lastCommitSha ?? "—"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Push</span>
              <div className="mt-1 text-xs">
                {status?.lastPushAt ? new Date(status.lastPushAt).toLocaleString() : "Never"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Token</span>
              <div className="mt-1">
                {status?.hasToken ? (
                  <Badge variant="outline" className="text-xs">Set</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">Missing</Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 gap-1" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </CardContent>
      </Card>

      {/* ── Config Card ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Github className="h-5 w-5" /> Configuration
          </CardTitle>
          <CardDescription>Connect your local repo to a GitHub repository</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Local Repo Path</Label>
            <Input
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              placeholder="/var/www/my-project"
            />
          </div>
          <div className="space-y-2">
            <Label>GitHub Repo</Label>
            <Input
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="owner/repo-name"
            />
          </div>
          <div className="space-y-2">
            <Label>GitHub Token {status?.hasToken && <span className="text-muted-foreground text-xs">(already set — leave blank to keep)</span>}</Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder={status?.hasToken ? "Leave blank to keep current token" : "ghp_..."}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowToken((v) => !v)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Default Branch</Label>
            <Input
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              placeholder="main"
            />
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* ── Sync Card ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-5 w-5" /> Sync to GitHub
          </CardTitle>
          <CardDescription>Stage, record, and upload changes to GitHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sync Message</Label>
            <Input
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="chore: automated sync"
            />
          </div>
          <Button onClick={handleSync} disabled={syncing || !status?.configured}>
            {syncing
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <Upload className="h-4 w-4 mr-2" />}
            {syncing ? "Syncing\u2026" : "Sync Now"}
          </Button>
          {syncing && <Progress value={syncProgress} className="h-2" />}
          {logs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Live Output</span>
              </div>
              <ScrollArea className="h-48 rounded border bg-muted/40 p-3">
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, i) => {
                    if (log.type === "complete") {
                      return (
                        <div
                          key={i}
                          className={log.ok
                            ? "text-green-600 dark:text-green-400 font-semibold"
                            : "text-destructive font-semibold"}
                        >
                          {log.ok ? "\u2713 " : "\u2717 "}{log.message}
                        </div>
                      );
                    }
                    if (log.type === "progress") {
                      return (
                        <div key={i} className="text-primary font-semibold">
                          {log.message}
                        </div>
                      );
                    }
                    if (log.type === "log") {
                      return (
                        <div
                          key={i}
                          className={
                            log.level === "error"
                              ? "text-destructive"
                              : log.level === "warning"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-muted-foreground"
                          }
                        >
                          {log.message}
                        </div>
                      );
                    }
                    return null;
                  })}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
