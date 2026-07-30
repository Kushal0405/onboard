import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateProjectInstallStatus } from "@/features/projects/api/projectQueries";
import { useProject } from "@/features/projects/hooks/useProject";
import { useApiKeyMutations, useApiKeys } from "@/features/projects/hooks/useApiKeys";
import { useSnippetValidation } from "@/features/projects/hooks/useSnippetValidation";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border bg-muted px-4 py-3 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-2 size-7"
        onClick={() => void handleCopy()}
        aria-label="Copy code"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

export function InstallPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: apiKeys, isLoading: isKeysLoading } = useApiKeys(projectId);
  const { create } = useApiKeyMutations(projectId);
  const { status, validate } = useSnippetValidation();

  const activeKey = apiKeys?.find((k) => k.is_active);

  async function handleCreateKey() {
    if (!projectId || !user) return;
    try {
      await create.mutateAsync({ projectId, createdBy: user.id });
      toast.success("API key created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create API key");
    }
  }

  async function handleRecheck() {
    if (!project?.site_url || !projectId) return;
    validate(project.site_url);
  }

  useEffect(() => {
    if (status === "verified" && projectId && project && !project.is_installed) {
      void updateProjectInstallStatus(projectId, true).then(() => {
        void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      });
    }
  }, [status, projectId, project, queryClient]);

  const cdnOrigin = window.location.origin;
  const publicKey = activeKey?.public_key ?? "pk_...";

  const cdnSnippet = `<script>
  (function (o, n) {
    o.OnboardFlow || (o.OnboardFlow = { _q: [], init: function () { this._q.push(["init", arguments]); } });
  })(window);
</script>
<script async src="${cdnOrigin}/sdk/onboardflow.iife.js"></script>
<script>
  window.OnboardFlow.init({ publicKey: "${publicKey}" });
</script>`;

  const npmSnippet = `import OnboardFlow from "@onboardflow/sdk";

OnboardFlow.init({ publicKey: "${publicKey}" });

// Once you know who the visitor is:
OnboardFlow.identify(currentUser.id, { email: currentUser.email });`;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to={`/dashboard/projects/${projectId}`}>
            <ArrowLeft className="size-4" />
            Back to project
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isProjectLoading ? <Skeleton className="h-8 w-48" /> : `Install — ${project?.name}`}
        </h1>
        <p className="text-muted-foreground">
          Add this snippet to your site to start showing published tours to your users.
        </p>
      </div>

      {!isProjectLoading && project?.site_url && (
        <Card className="max-w-2xl">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">{project.site_url}</p>
              <p className="text-xs text-muted-foreground">
                {project.is_installed || status === "verified"
                  ? "Snippet verified on this site"
                  : "Not yet verified"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {project.is_installed || status === "verified" ? (
                <CheckCircle2 className="size-5 text-emerald-500" />
              ) : status === "checking" ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <AlertTriangle className="size-5 text-amber-500" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRecheck()}
                disabled={status === "checking"}
              >
                Recheck
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isKeysLoading ? (
        <Skeleton className="h-32 w-full max-w-2xl" />
      ) : !activeKey ? (
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <KeyRound className="size-5 text-muted-foreground" />
            </div>
            <CardTitle>No API key yet</CardTitle>
            <CardDescription>
              Generate a public key to embed OnboardFlow on your site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void handleCreateKey()} disabled={create.isPending}>
              {create.isPending ? "Generating..." : "Generate API key"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Public key</CardTitle>
              <CardDescription>
                Safe to expose client-side — it can only fetch published tour content, not modify anything.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={activeKey.public_key} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Option 1 — CDN script tag</CardTitle>
              <CardDescription>Paste this before the closing &lt;/body&gt; tag of every page.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={cdnSnippet} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Option 2 — npm package</CardTitle>
              <CardDescription>
                <code className="rounded bg-muted px-1 py-0.5">npm install @onboardflow/sdk</code>, then:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={npmSnippet} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
