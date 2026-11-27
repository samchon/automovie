import type { NarrativeLayer } from "../../NarrativeLayer";
import type { AutoMovieEvidenceNarrativeScope } from "../../AutoMovieEvidenceNarrativeScope";

/*
 * Captures indexes and misplaced files without widening an exact pilot slice.
 */
export function createTopologyFiles(
  layer: NarrativeLayer,
  scope: AutoMovieEvidenceNarrativeScope,
): string[] {
  return layer !== "treatments" && scope.mode === "first-part-pilot"
    ? [`${layer}/${scope.part}/**/*`]
    : [`${layer}/**/*`];
}
