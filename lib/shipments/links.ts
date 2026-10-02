import {
  LINK_KINDS,
  type LinkKind,
  type ShipmentLink,
} from "@/lib/shipments/status";
import { normalizeHttpUrl } from "@/lib/validation/url";

export function parseLinkText(raw: string): ShipmentLink[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const [label, urlText, kind] = line.split("|").map((part) => part.trim());
      if (!label || !urlText) return [];
      const url = normalizeHttpUrl(urlText);
      if (!url) return [];
      const linkKind: LinkKind = LINK_KINDS.includes(kind as LinkKind)
        ? (kind as LinkKind)
        : "other";
      return [{ label, url, kind: linkKind }];
    });
}
