import type { NarrativeLayer } from "../../NarrativeLayer";
import type { NarrativeScope } from "../../NarrativeScope";

/**
 * Captures indexes and misplaced files without widening an exact pilot slice.
 *
 * @evidence contracts/common.md#principled-implementation Topology captures all descendants of a layer so indexes and malformed paths remain visible, narrowing scripts/screenplay only to the exact declared pilot part; treatments stay flat at validation time.
 * @evidence contracts/common.md#clear-and-simple-design One selector helper separates the broad topology capture from the numbered authored-unit selector used by ordinary evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The first-part pilot is a declared production scope, so the selector retains that exact slice instead of widening to other parts.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why indexes and misplaced files are included while an exact pilot slice stays narrow.
 * @evidence contracts/performance.md#efficient-algorithms One conditional constructs one glob string; work and returned storage scale only with layer and optional part text lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work The selector is derived from the current scope each call, while downstream native inventory capture supplies reuse across topology inspections.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The one-element returned array and string belong to the caller; no filesystem traversal, handle or retained cache is created.
 */
export function createTopologyFiles(
  layer: NarrativeLayer,
  scope: NarrativeScope,
): string[] {
  return layer !== "treatments" && scope.mode === "first-part-pilot"
    ? [`${layer}/${scope.part}/**/*`]
    : [`${layer}/**/*`];
}
