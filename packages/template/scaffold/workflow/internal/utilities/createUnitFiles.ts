import type { AuthoredLayer } from "../../AuthoredLayer";
import type { NarrativeScope } from "../../NarrativeScope";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { createSettingsFiles } from "../../createSettingsFiles";

/**
 * Selects authored unit files relative to body, revision, or the naturalness working tree.
 *
 * Settings accepts the legacy flat layout or numbered subject folders. Its
 * dedicated outline remains outside canon selectors. Narrative layers retain
 * their release partition and delegate to their own selector.
 * `referenceLocation` qualifies lineage targets against the revision snapshot;
 * both logical passes host the same current manuscript paths.
 */
export function createUnitFiles(
  layer: AuthoredLayer,
  scope: NarrativeScope,
): string[] {
  if (layer === "settings") return createSettingsFiles();
  return createNarrativeUnitFiles(layer, scope);
}
