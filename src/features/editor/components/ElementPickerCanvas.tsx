import { useEffect, useRef, useState } from "react";
import { Crosshair, ExternalLink, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstallSnippetDialog } from "@/features/editor/components/InstallSnippetDialog";
import { useElementPicker } from "@/features/editor/hooks/useElementPicker";

interface ElementPickerCanvasProps {
  onPick: (selector: string) => void;
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).toString();
  } catch {
    return null;
  }
}

export function ElementPickerCanvas({ onPick }: ElementPickerCanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const { status, snippetDetected, startPicking, stopPicking, resetForNewUrl } =
    useElementPicker(iframeRef);

  useEffect(() => {
    function handleMessage(event: MessageEvent<{ source?: string; type?: string; selector?: string }>) {
      if (event.data?.source === "onboardflow-picker" && event.data.type === "element-picked" && event.data.selector) {
        onPick(event.data.selector);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onPick]);

  function handleLoadUrl() {
    const normalized = normalizeUrl(urlInput);
    if (!normalized) return;
    resetForNewUrl();
    setLoadFailed(false);
    setLoadedUrl(normalized);
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoadUrl()}
          placeholder="https://your-app.com/dashboard"
          className="flex-1"
        />
        <Button variant="outline" onClick={handleLoadUrl}>
          Load
        </Button>
        {loadedUrl && (
          <Button variant="ghost" size="icon" aria-label="Open in new tab" asChild>
            <a href={loadedUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <InstallSnippetDialog />
        {loadedUrl && snippetDetected && (
          <Button
            size="sm"
            variant={status === "picking" ? "destructive" : "default"}
            onClick={status === "picking" ? stopPicking : startPicking}
          >
            {status === "picking" ? (
              <>
                <RotateCcw className="size-4" />
                Cancel picking
              </>
            ) : (
              <>
                <Crosshair className="size-4" />
                Pick element
              </>
            )}
          </Button>
        )}
      </div>

      <div className="relative min-h-[380px] flex-1 overflow-hidden rounded-lg border bg-muted/30">
        {!loadedUrl ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Enter your site&apos;s URL above to preview it here and pick a target element.
          </div>
        ) : loadFailed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <p>This page can&apos;t be embedded here (its security policy blocks framing).</p>
            <p>Open it in a new tab and type the CSS selector manually below instead.</p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={loadedUrl}
            title="Target page preview"
            className="size-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onError={() => setLoadFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
