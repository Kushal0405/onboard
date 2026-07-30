import { useCallback, useEffect, useRef, useState } from "react";

export type PickerStatus = "idle" | "picking" | "ready-not-picking";

interface PickerMessage {
  source?: string;
  type?: string;
  selector?: string;
}

export function useElementPicker(iframeRef: React.RefObject<HTMLIFrameElement | null>) {
  const [status, setStatus] = useState<PickerStatus>("idle");
  const [snippetDetected, setSnippetDetected] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent<PickerMessage>) {
      const data = event.data;
      if (!data || data.source !== "onboardflow-picker") return;

      if (data.type === "picker-ready") {
        setSnippetDetected(true);
      } else if (data.type === "picker-started") {
        setStatus("picking");
      } else if (data.type === "element-picked" && data.selector) {
        setStatus("ready-not-picking");
      } else if (data.type === "picker-cancelled") {
        setStatus("ready-not-picking");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const startPicking = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ target: "onboardflow-target-page", type: "start-picker" }, "*");
  }, [iframeRef]);

  const stopPicking = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ target: "onboardflow-target-page", type: "stop-picker" }, "*");
    setStatus("ready-not-picking");
  }, [iframeRef]);

  function resetForNewUrl() {
    setSnippetDetected(false);
    setStatus("idle");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  return { status, snippetDetected, startPicking, stopPicking, resetForNewUrl };
}
