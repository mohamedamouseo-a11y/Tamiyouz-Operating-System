import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, CheckCircle, XCircle, Key } from "lucide-react";
import { toast } from "sonner";

const MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recommended)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];

export default function AISettingsPage() {
  const { data: settings, isLoading, refetch } = trpc.aiSettings.get.useQuery();
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("https://generativelanguage.googleapis.com/v1beta/openai");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (settings) {
      setApiKey("");
      setApiUrl(settings.apiUrl || "https://generativelanguage.googleapis.com/v1beta/openai");
      setModel(settings.model || "gemini-2.5-flash");
    }
  }, [settings]);

  const saveMutation = trpc.aiSettings.save.useMutation({
    onSuccess: () => { toast.success("AI settings saved successfully"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.aiSettings.test.useMutation({
    onSuccess: (data) => {
      setTesting(false);
      if (data.success) {
        setTestResult("success");
        toast.success("AI connection working! Response: " + data.response);
      } else {
        setTestResult("error");
        toast.error("Connection failed: " + data.error);
      }
    },
    onError: (err) => {
      setTesting(false);
      setTestResult("error");
      toast.error(err.message);
    },
  });

  const handleTest = () => {
    setTesting(true);
    setTestResult(null);
    testMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Settings</h1>
        <p className="text-muted-foreground">Configure Google Gemini AI for reports and chat</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-5 w-5" /> API Configuration
          </CardTitle>
          <CardDescription>
            Get your API key from{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-primary underline">
              Google AI Studio
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={settings ? "••••••••••••••• (key saved)" : "AIzaSy..."}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <select
              id="model"
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL (Advanced)</Label>
            <Input
              id="apiUrl"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              placeholder="https://generativelanguage.googleapis.com/v1beta/openai"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => saveMutation.mutate({ apiKey: apiKey || undefined, apiUrl, model })}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing || testMutation.isPending}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
          </div>
          {testResult && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${testResult === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {testResult === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult === "success" ? "AI is working correctly" : "Connection failed - check your API key"}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5" /> Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {settings ? (
              <>
                <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />AI Active</Badge>
                <span className="text-sm text-muted-foreground">Model: <strong>{settings.model}</strong></span>
              </>
            ) : (
              <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Not Configured</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
