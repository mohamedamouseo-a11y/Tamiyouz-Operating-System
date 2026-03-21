import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, Link2, AlertCircle, Clock, Unlink, Save, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Service → Integration map ────────────────────────────────────────────
export const SERVICES = ["SEO", "Media Buying", "Social Media", "Web Development", "Other"] as const;
export type ServiceName = typeof SERVICES[number];

export const SERVICE_INTEGRATIONS: Record<ServiceName, { type: string; label: string; placeholder: string; required: boolean }[]> = {
  SEO: [
    { type: "google_search_console", label: "Google Search Console", placeholder: "sc-domain:example.com", required: true },
    { type: "google_analytics_4",    label: "Google Analytics 4",    placeholder: "G-XXXXXXXXXX",           required: true },
    { type: "google_tag_manager",    label: "Google Tag Manager",    placeholder: "GTM-XXXXXXX",             required: false },
    { type: "google_business_profile", label: "Google Business Profile", placeholder: "Business ID or URL", required: false },
  ],
  "Media Buying": [
    { type: "meta_ads",    label: "Meta Ads Account",    placeholder: "act_XXXXXXXXXX",  required: true },
    { type: "google_ads",  label: "Google Ads Account",  placeholder: "XXX-XXX-XXXX",    required: true },
    { type: "tiktok_ads",  label: "TikTok Ads Account",  placeholder: "Advertiser ID",   required: false },
  ],
  "Social Media": [
    { type: "facebook_page",    label: "Facebook Page",     placeholder: "Page ID or username",      required: true },
    { type: "instagram",        label: "Instagram Account", placeholder: "@username",                 required: true },
    { type: "tiktok_account",   label: "TikTok Account",   placeholder: "@username",                 required: false },
    { type: "linkedin_page",    label: "LinkedIn Page",     placeholder: "Company page ID or URL",   required: false },
    { type: "youtube_channel",  label: "YouTube Channel",  placeholder: "Channel ID or handle",      required: false },
  ],
  "Web Development": [
    { type: "website_url",       label: "Website URL",        placeholder: "https://client.com",   required: true },
    { type: "hosting_provider",  label: "Hosting Provider",   placeholder: "AWS, Namecheap…",       required: false },
    { type: "github_repo",       label: "GitHub Repository",  placeholder: "github.com/org/repo",  required: false },
    { type: "gtm_container",     label: "GTM Container",      placeholder: "GTM-XXXXXXX",           required: false },
  ],
  Other: [
    { type: "other_integration", label: "Account / Integration", placeholder: "ID, URL, or reference", required: false },
  ],
};

export const SERVICE_COLORS: Record<ServiceName, string> = {
  SEO:              "bg-blue-100 text-blue-700 border-blue-200",
  "Media Buying":   "bg-orange-100 text-orange-700 border-orange-200",
  "Social Media":   "bg-purple-100 text-purple-700 border-purple-200",
  "Web Development":"bg-green-100 text-green-700 border-green-200",
  Other:            "bg-gray-100 text-gray-600 border-gray-200",
};

// ── Status helpers ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  connected:    { label: "Connected",    icon: Check,         class: "text-green-600" },
  pending:      { label: "Pending",      icon: Clock,         class: "text-yellow-600" },
  failed:       { label: "Failed",       icon: AlertCircle,   class: "text-red-600" },
  disconnected: { label: "Disconnected", icon: Unlink,        class: "text-gray-400" },
};

type Status = keyof typeof STATUS_CONFIG;

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.class)}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

// ── Single integration row ───────────────────────────────────────────────
function IntegrationRow({
  clientId, service, definition, existing, onSaved, onDeleted, canEdit,
}: {
  clientId: number;
  service: string;
  definition: { type: string; label: string; placeholder: string; required: boolean };
  existing?: { id: number; externalId?: string; displayName?: string; status: Status };
  onSaved: () => void;
  onDeleted: () => void;
  canEdit: boolean;
}) {
  const [externalId, setExternalId] = useState(existing?.externalId || "");
  const [displayName, setDisplayName] = useState(existing?.displayName || "");
  const [status, setStatus] = useState<Status>((existing?.status as Status) || "pending");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setExternalId(existing?.externalId || "");
    setDisplayName(existing?.displayName || "");
    setStatus((existing?.status as Status) || "pending");
    setDirty(false);
  }, [existing?.externalId, existing?.displayName, existing?.status]);

  const upsert = trpc.clientIntegrations.upsert.useMutation({
    onSuccess: () => { toast.success(`${definition.label} saved`); setDirty(false); onSaved(); },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.clientIntegrations.delete.useMutation({
    onSuccess: () => { toast.success(`${definition.label} removed`); onDeleted(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    upsert.mutate({
      clientId, service, integrationType: definition.type,
      displayName: displayName || undefined,
      externalId: externalId || undefined,
      status: externalId ? "connected" : status,
    });
  };

  const isConnected = !!externalId;

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2 transition-colors",
      isConnected ? "border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/10" : "border-border bg-muted/30"
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link2 className={cn("h-3.5 w-3.5 shrink-0", isConnected ? "text-green-500" : "text-muted-foreground/40")} />
          <span className="text-sm font-medium truncate">{definition.label}</span>
          {definition.required && <span className="text-[10px] text-muted-foreground">(required)</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={isConnected ? "connected" : status} />
          {existing && canEdit && (
            <button
              onClick={() => del.mutate(existing.id)}
              disabled={del.isPending}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Remove integration"
            >
              {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="space-y-1.5">
          <input
            value={externalId}
            onChange={e => { setExternalId(e.target.value); setDirty(true); }}
            placeholder={definition.placeholder}
            className="w-full h-8 px-2.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
          <div className="flex items-center gap-2">
            <input
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setDirty(true); }}
              placeholder="Label / nickname (optional)"
              className="flex-1 h-7 px-2.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {!externalId && (
              <Select value={status} onValueChange={(v) => { setStatus(v as Status); setDirty(true); }}>
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleSave}
              disabled={!dirty || upsert.isPending}
            >
              {upsert.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}

      {!canEdit && externalId && (
        <p className="text-xs font-mono text-muted-foreground">{externalId}</p>
      )}
    </div>
  );
}

// ── Service section ──────────────────────────────────────────────────────
function ServiceSection({
  service, clientId, integrations, onRefresh, canEdit,
}: {
  service: ServiceName;
  clientId: number;
  integrations: any[];
  onRefresh: () => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(true);
  const definitions = SERVICE_INTEGRATIONS[service] || [];
  const connectedCount = definitions.filter(d => integrations.find(i => i.integrationType === d.type && i.externalId)).length;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", SERVICE_COLORS[service])}>
            {service}
          </span>
          <span className="text-xs text-muted-foreground">
            {connectedCount}/{definitions.length} connected
          </span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-3 space-y-2 bg-background">
          {definitions.map(def => (
            <IntegrationRow
              key={def.type}
              clientId={clientId}
              service={service}
              definition={def}
              existing={integrations.find(i => i.integrationType === def.type)}
              onSaved={onRefresh}
              onDeleted={onRefresh}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dialog ──────────────────────────────────────────────────────────
export function ClientIntegrationsDialog({
  client,
  open,
  onOpenChange,
  canEdit,
}: {
  client: { id: number; name: string; services?: string[] };
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canEdit: boolean;
}) {
  const { data: integrations, refetch, isLoading } = trpc.clientIntegrations.list.useQuery(client.id, {
    enabled: open,
  });

  const services = (client.services || []) as ServiceName[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Integrations — {client.name}
          </DialogTitle>
          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {services.map(s => (
                <span key={s} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", SERVICE_COLORS[s as ServiceName] || "bg-gray-100 text-gray-600")}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No services selected for this client.</p>
              <p className="text-xs text-muted-foreground">Edit the client to add services first.</p>
            </div>
          ) : (
            services.map(service => (
              <ServiceSection
                key={service}
                service={service as ServiceName}
                clientId={client.id}
                integrations={integrations || []}
                onRefresh={refetch}
                canEdit={canEdit}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
