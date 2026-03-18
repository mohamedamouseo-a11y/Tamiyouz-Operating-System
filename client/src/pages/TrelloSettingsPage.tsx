import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function TrelloSettingsPage() {
  const { data: settings, isLoading, refetch } = trpc.trelloSettings.get.useQuery();
  const [apiKey, setApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");

  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey || "");
      setApiToken("");
    }
  }, [settings]);

  const saveMutation = trpc.trelloSettings.save.useMutation({
    onSuccess: () => { toast.success("Trello settings saved"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.trelloSettings.testConnection.useMutation({
    onSuccess: (data) => {
      if (data.success) toast.success("Connection successful!");
      else toast.error("Connection failed");
    },
    onError: (err) => toast.error(err.message),
  });

  const syncMutation = trpc.trelloSettings.syncNow.useMutation({
    onSuccess: (data) => toast.success(`Synced ${data.synced} boards`),
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trello Settings</h1>
        <p className="text-muted-foreground">Configure Trello API integration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5" /> API Configuration
          </CardTitle>
          <CardDescription>
            Enter your Trello API key and token. Get them from{" "}
            <a href="https://trello.com/power-ups/admin" target="_blank" rel="noopener" className="text-primary underline">
              Trello Power-Ups Admin
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input id="apiKey" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter Trello API Key" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiToken">API Token</Label>
            <Input id="apiToken" type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="Enter Trello API Token" />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => saveMutation.mutate({ apiKey, apiToken })} disabled={!apiKey || !apiToken || saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Settings
            </Button>
            <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
              {testMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-5 w-5" /> Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Status: {settings ? (
                <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
              ) : (
                <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Not Configured</Badge>
              )}</p>
              {settings?.lastSyncAt && <p className="text-xs text-muted-foreground mt-1">Last sync: {new Date(settings.lastSyncAt).toLocaleString()}</p>}
            </div>
            <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={!settings || syncMutation.isPending}>
              {syncMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
