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

type LogEvent = { type: "log" | "progress" | "success" | "error"; message: string; progress?: number };

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
  const [logs, setLogs] = useState<LogEvent[]>([]);
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
    onSuccess: () => { toast.success("Developer Hub settings saved"); setGithubToken(""); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    saveMutation.mutate({ repoPath, githubRepo, githubToken: githubToken || undefined, defaultBranch, isEnabled });
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
        const event = JSON.parse(e.data) as LogEvent;
        setLogs(prev => [...prev, event]);
        if (event.progress !== undefined) setSyncProgress(event.progress);
        if (event.type === "success" || event.type === "error") {
          es.close();
          setSyncing(false);
          if (event.type === "success") { toast.success("Sync complete!"); refetch(); }
          else toast.error("Sync failed");
        }
      } catch { /* ignore parse errors */ }
    };
    es.onerror = () => {
      es.close();
      setSyncing(false);
      toast.error("Connection to sync stream lost");
    };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
              <p className="text-muted-foreground text-xs mb-1">Configuration</p>
              {status?.configured
                ? <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Configured</Badge>
                : <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Not Configured</Badge>}
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">GitHub Token</p>
              {status?.hasToken
                ? <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Token Set</Badge>
                : <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />No Token</Badge>}
            </div>
            {status?.currentBranch && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Current Branch</p>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{status.currentBranch}</code>
              </div>
            )}
            {status?.lastCommitSha && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Last Commit</p>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{status.lastCommitSha}</code>
              </div>
            )}
            {status?.gitStatus && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs mb-1">Working Tree</p>
                <pre className="text-xs bg-muted p-2 rounded max-h-24 overflow-auto">{status.gitStatus}</pre>
              </div>
            )}
            {status?.lastPushAt && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Last sync: {new Date(status.lastPushAt).toLocaleString()}</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh Status
          </Button>
        </CardContent>
      </Card>

      {/* ── Config Card ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repository Configuration</CardTitle>
          <CardDescription>Set local path, GitHub repo, and access token</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Local Repository Path</Label>
            <Input value={repoPath} onChange={e => setRepoPath(e.target.value)} placeholder="/var/www/tamiyouz_tos" />
          </div>
          <div className="space-y-2">
            <Label>GitHub Repository (owner/repo)</Label>
            <Input value={githubRepo} onChange={e => setGithubRepo(e.target.value)} placeholder="myorg/my-repo" />
          </div>
          <div className="space-y-2">
            <Label>Default Branch</Label>
            <Input value={defaultBranch} onChange={e => setDefaultBranch(e.target.value)} placeholder="main" />
          </div>
          <div className="space-y-2">
            <Label>GitHub Token {status?.hasToken && <span className="text-xs text-muted-foreground">(leave blank to keep existing)</span>}</Label>
            <div className="flex gap-2">
              <Input
                type={showToken ? "text" : "password"}
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                placeholder={status?.hasToken ? "Token already set – enter new to replace" : "ghp_xxx..."}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => setShowToken(v => !v)}>
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isEnabled" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} className="h-4 w-4" />
            <label htmlFor="isEnabled" className="text-sm">Enabled</label>
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
            <Input value={commitMsg} onChange={e => setCommitMsg(e.target.value)} placeholder="chore: automated sync" />
          </div>
          <Button onClick={handleSync} disabled={syncing || !status?.configured}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {syncing ? "Syncing…" : "Sync Now"}
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
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.type === "error" ? "text-destructive" :
                        log.type === "success" ? "text-green-600 dark:text-green-400" :
                        log.type === "progress" ? "text-primary font-semibold" :
                        "text-muted-foreground"
                      }
                    >
                      {log.message}
                    </div>
                  ))}
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
