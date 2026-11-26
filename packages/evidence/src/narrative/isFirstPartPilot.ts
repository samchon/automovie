import type { AutoMovieEvidenceNarrativeScope } from "./AutoMovieEvidenceNarrativeScope";

/** Returns whether the selected narrative population is one pilot slice. */
export function isFirstPartPilot(scope: AutoMovieEvidenceNarrativeScope): boolean {
  return scope.mode === "first-part-pilot";
}
