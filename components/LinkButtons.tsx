import { ExternalLink, Link2, Mail, MessageSquare, ReceiptText } from "lucide-react";
import type { ShipmentLink } from "@/lib/shipments/status";
import { normalizeHttpUrl } from "@/lib/validation/url";

const KIND_ICON = {
  email: Mail,
  order: ReceiptText,
  tracking: ExternalLink,
  message: MessageSquare,
  other: Link2,
};

export function LinkButtons({ links }: { links: ShipmentLink[] }) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const href = normalizeHttpUrl(link.url);
        if (!href) return null;
        const Icon = KIND_ICON[link.kind] ?? Link2;
        return (
          <a
            key={`${link.kind}-${href}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-sm font-medium text-ink hover:bg-sage-soft"
          >
            <Icon className="size-3.5 text-ink-muted" aria-hidden />
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
