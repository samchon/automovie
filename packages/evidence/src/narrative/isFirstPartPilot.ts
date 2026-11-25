import type { NarrativeScope } from "./NarrativeScope";

/** Returns whether the selected narrative population is one pilot slice. */
export function isFirstPartPilot(scope: NarrativeScope): boolean {
  return scope.mode === "first-part-pilot";
}
