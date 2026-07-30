import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Crosshair, ExternalLink, RotateCcw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstallSnippetDialog } from "@/features/editor/components/InstallSnippetDialog";
import { StepOverlayPreview } from "@/features/editor/components/StepOverlayPreview";
import { useElementLocation } from "@/features/editor/hooks/useElementLocation";
import { useElementPicker } from "@/features/editor/hooks/useElementPicker";
import { stepSupportsTargeting } from "@/features/editor/types";
import type { Step } from "@/features/editor/api/stepQueries";
import type { StepContent, StepType } from "@/features/editor/types";

interface EditorCanvasProps {
  step: (Step & { liveContent?: StepContent; liveStepType?: StepType; liveTitle?: string }) | null;
  stepIndex: number;
  totalSteps: number;
  onPick: (selector: string) => void;
  pickRequestToken: number;
  previewMode: boolean;
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

export function EditorCanvas({
  step,
  stepIndex,
  totalSteps,
  onPick,
  pickRequestToken,
  previewMode,
}: EditorCanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const { status, snippetDetected, startPicking, stopPicking, resetForNewUrl } =
    useElementPicker(iframeRef);

  const stepType = step?.liveStepType ?? step?.step_type ?? null;
  const targetSelector = stepType && stepSupportsTargeting(stepType) ? step?.target_selector ?? null : null;
  const { rect: targetRect } = useElementLocation(iframeRef, targetSelector, snippetDetected);

  useEffect(() => {
    function handleMessage(event: MessageEvent<{ source?: string; type?: string; selector?: string }>) {
      if (
        event.data?.source === "onboardflow-picker" &&
        event.data.type === "element-picked" &&
        event.data.selector
      ) {
        onPick(event.data.selector);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onPick]);

  useEffect(() => {
    if (pickRequestToken > 0) startPicking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickRequestToken]);

  useEffect(() => {
    function updateSize() {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [loadedUrl]);

  function handleLoadUrl() {
    const normalized = normalizeUrl(urlInput);
    if (!normalized) return;
    resetForNewUrl();
    setLoadedUrl(normalized);
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {!previewMode && (
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoadUrl()}
          placeholder="https://your-app.com/dashboard"
          className="h-8 flex-1 border-zinc-700 bg-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500"
        />
        <Button variant="secondary" size="sm" onClick={handleLoadUrl}>
          Load
        </Button>
        {loadedUrl && (
          <Button variant="ghost" size="icon" className="size-8 text-zinc-400" aria-label="Open in new tab" asChild>
            <a href={loadedUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
        {loadedUrl && (
          <div className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs">
            {snippetDetected ? (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400">Snippet installed</span>
              </>
            ) : (
              <>
                <XCircle className="size-3.5 text-amber-400" />
                <span className="text-amber-400">Snippet not detected</span>
              </>
            )}
          </div>
        )}
        {loadedUrl && snippetDetected && (
          <Button
            size="sm"
            variant={status === "picking" ? "destructive" : "outline"}
            onClick={status === "picking" ? stopPicking : startPicking}
          >
            {status === "picking" ? (
              <>
                <RotateCcw className="size-4" />
                Cancel
              </>
            ) : (
              <>
                <Crosshair className="size-4" />
                Pick element
              </>
            )}
          </Button>
        )}
        <InstallSnippetDialog />
      </div>
      )}

      <div ref={canvasRef} className="relative flex-1 overflow-hidden">
        {!loadedUrl ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-500">
            Enter your site&apos;s URL above to see this step positioned on the real page.
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={loadedUrl}
            title="Target page preview"
            className="size-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}

        {loadedUrl && step && stepType && (
          <StepOverlayPreview
            stepType={stepType}
            title={step.liveTitle ?? step.title ?? ""}
            content={step.liveContent as StepContent}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            targetRect={targetRect}
            canvasSize={canvasSize}
            hasTargetSelector={!!targetSelector}
            snippetDetected={snippetDetected}
            hideEditorChrome={previewMode}
          />
        )}
      </div>
    </div>
  );
}
