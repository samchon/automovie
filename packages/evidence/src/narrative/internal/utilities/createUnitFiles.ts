import type { AuthoredLayer } from "../../AuthoredLayer";
import type { AutoMovieEvidenceNarrativeScope } from "../../AutoMovieEvidenceNarrativeScope";
import { createBriefFiles } from "../../createBriefFiles";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { createSettingsFiles } from "../../createSettingsFiles";

/**
 * Selects authored unit files relative to the body root.
 *
 * Settings accepts the legacy flat layout, numbered subject folders or the
 * scaffold's domain folders, and a short's brief the domain folders. The
 * settings outline remains outside canon selectors. Narrative layers retain
 * their release partition or film folders and delegate to their own selector.
 */
export function createUnitFiles(
  layer: AuthoredLayer,
  scope: AutoMovieEvidenceNarrativeScope,
): string[] {
  if (layer === "settings") return createSettingsFiles();
  if (layer === "brief") return createBriefFiles();
  return createNarrativeUnitFiles({ layer, scope });
}
