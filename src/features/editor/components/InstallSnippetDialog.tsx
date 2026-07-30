import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function getSnippet(): string {
  return `<script src="${window.location.origin}/picker.js"></script>`;
}

export function InstallSnippetDialog() {
  const [copied, setCopied] = useState(false);
  const snippet = getSnippet();

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
          Why can&apos;t I click elements?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable the element picker</DialogTitle>
          <DialogDescription>
            Click-to-pick only works on pages that have the OnboardFlow picker snippet installed
            &mdash; browsers block scripts from reaching into pages from other origins, so this
            page has to load the snippet itself. Paste this into the target page&apos;s{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;head&gt;</code> (remove it before
            going to production &mdash; the full tracking SDK snippet will replace this later):
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-md border bg-muted px-3 py-2 text-xs">
            {snippet}
          </code>
          <Button variant="outline" size="icon" onClick={() => void handleCopy()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Without the snippet, the page may still load in the preview below (if it allows
          framing), but you&apos;ll need to type a CSS selector manually instead of clicking.
        </p>
      </DialogContent>
    </Dialog>
  );
}
