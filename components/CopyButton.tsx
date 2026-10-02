"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  value,
  label,
  compact = false,
}: {
  value: string;
  label?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-sm text-ink hover:bg-sage-soft"
      aria-label={label ? `העתק ${label}` : "העתק"}
    >
      {copied ? (
        <Check className="size-3.5 text-ok" aria-hidden />
      ) : (
        <Copy className="size-3.5 text-ink-muted" aria-hidden />
      )}
      {!compact && (
        <span className="font-medium">{copied ? "הועתק" : (label ?? value)}</span>
      )}
      {compact && <span className="font-medium">{copied ? "הועתק" : value}</span>}
    </button>
  );
}
