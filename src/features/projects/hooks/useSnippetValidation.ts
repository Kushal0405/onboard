import { useCallback, useEffect, useRef, useState } from "react";

export type ValidationStatus = "idle" | "checking" | "verified" | "failed";

const VALIDATION_TIMEOUT_MS = 8000;

/**
 * Loads a URL in a hidden iframe and waits for picker.js's "picker-ready"
 * postMessage to confirm the OnboardFlow snippet is actually installed
 * there, before letting a project be created against that site.
 */
export function useSnippetValidation() {
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent<{ source?: string; type?: string }>) {
      if (event.data?.source === "onboardflow-picker" && event.data.type === "picker-ready") {
        setStatus("verified");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const validate = useCallback((url: string) => {
    setStatus("checking");

    const iframe = document.createElement("iframe");
    iframe.src = url;
    // Some browsers pause or never start script execution inside
    // `display: none` iframes, which would mean picker.js never runs and
    // never posts picker-ready - so instead of hiding it, position it
    // off-screen but still laid out/rendered (1x1, clipped, but "visible"
    // as far as the layout/script engine is concerned).
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    iframe.sandbox.add("allow-scripts", "allow-same-origin");
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "failed" : current));
    }, VALIDATION_TIMEOUT_MS);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    iframeRef.current?.remove();
    iframeRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      iframeRef.current?.remove();
    };
  }, []);

  return { status, validate, reset };
}
