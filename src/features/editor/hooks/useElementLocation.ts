import { useEffect, useRef, useState } from "react";

export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface LocateMessage {
  source?: string;
  type?: string;
  selector?: string;
  found?: boolean;
  rect?: ElementRect;
  invalidSelector?: boolean;
}

/**
 * Tracks the live position of a CSS selector inside an iframe running
 * picker.js, so a step overlay can be positioned over the iframe (not
 * inside it — a cross-origin parent can never inject DOM into the iframe
 * itself, only overlay on top of it using coordinates the target page
 * reports back via postMessage).
 */
export function useElementLocation(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  selector: string | null,
  snippetReady: boolean,
) {
  const [rect, setRect] = useState<ElementRect | null>(null);
  const [found, setFound] = useState<boolean | null>(null);
  const lastSelectorRef = useRef<string | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent<LocateMessage>) {
      const data = event.data;
      if (!data || data.source !== "onboardflow-picker" || data.type !== "locate-result") return;
      if (data.selector !== lastSelectorRef.current) return;
      setFound(data.found ?? false);
      setRect(data.rect ?? null);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    lastSelectorRef.current = selector;
    setRect(null);
    setFound(null);

    if (!win || !snippetReady) return;

    if (selector) {
      win.postMessage({ target: "onboardflow-target-page", type: "locate-element", selector }, "*");
    }

    return () => {
      win.postMessage({ target: "onboardflow-target-page", type: "stop-locate" }, "*");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, snippetReady]);

  return { rect, found };
}
