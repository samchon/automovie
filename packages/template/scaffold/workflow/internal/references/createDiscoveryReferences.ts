import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import { createLanguageDiscoveryReferences } from "./createLanguageDiscoveryReferences";
import { createSharedReference } from "./createSharedReference";

/**
 * Creates the open-world discovery duties one layer's population covers.
 *
 * Settings searches its own directives, promise, and subject, and backcasts the
 * planned narrative to find what those layers would otherwise have to invent.
 * That backcast is how settings anticipates the cross-layer narrative contract,
 * so `discovery/narratives.md` is not selected here: it is the duty each
 * narrative layer answers when it rechecks that contract against what it
 * actually authored.
 *
 * Exclusion is permitted throughout the family. A duty that requires a search
 * must be able to record that the search found nothing, which is what makes
 * requiring it honest.
 */
export function createDiscoveryReferences(
  location: string,
  layer: AuthoredLayer,
): IEvidenceReference[] {
  return [
    ...[
      "common.md",
      ...(layer === "settings" ? [] : ["narratives.md"]),
      `${layer}.md`,
    ].map(
      (file: string): IEvidenceMarkdownReference =>
        createSharedReference({
          location,
          file: `discovery/${file}`,
          checklist: false,
          exclusion: true,
        }),
    ),
    ...createLanguageDiscoveryReferences(location),
  ];
}
