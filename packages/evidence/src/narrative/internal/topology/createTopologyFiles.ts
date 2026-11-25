import type { NarrativeLayer } from "../../NarrativeLayer";
import type { NarrativeScope } from "../../NarrativeScope";

/** Captures indexes and misplaced files without widening an exact pilot slice. */
export function createTopologyFiles(
  layer: NarrativeLayer,
  scope: NarrativeScope,
): string[] {
  return layer !== "treatments" && scope.mode === "first-part-pilot"
    ? [`${layer}/${scope.part}/**/*`]
    : [`${layer}/**/*`];
}
