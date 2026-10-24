import type { NarrativeLayer } from "./NarrativeLayer";
import type { NarrativeScope } from "./NarrativeScope";

/**
 * Selects the authored unit files of one narrative layer.
 *
 * `treatments` is flat and carries no release partition, so its population is
 * every numbered event file it holds — during a pilot the layer contains only
 * the pilot's events, so the same selector serves both modes. `scripts` and
 * `screenplay` carry the part partition, so a pilot narrows them to the one part
 * it authors.
 *
 * The selector is relative to the authored pass root. A naturalness comparison uses the
 * same relative file identity under `docs/revision`.
 *
 * @evidence contracts/common.md#principled-implementation Layer-specific glob construction preserves flat treatments and part-scoped scripts/screenplay; an exact 001-lower-kebab-case pilot name is validated before interpolation.
 * @evidence contracts/common.md#clear-and-simple-design The selector owns only relative narrative population paths; callers choose body, frozen or working roots independently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 001 pilot prefix and numbered Markdown globs are narrative layout contracts used for every production, not special consumer paths.
 * @evidence contracts/common.md#meaningful-documentation The prose states layer partition differences, pilot behavior, root relativity and frozen-snapshot identity.
 * @evidence contracts/performance.md#efficient-algorithms The complete-work result has constant-size globs; pilot validation and interpolation take time and output space proportional to the selected part string length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This selector builds one result from supplied values and coordinates no cross-request work; independent arrays avoid shared mutable selector state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned small selector array survives the call; no descriptor, task or module cache is acquired.
 */
export function createNarrativeUnitFiles(
  layer: NarrativeLayer,
  scope: NarrativeScope,
): string[] {
  if (
    scope.mode !== "complete-work" &&
    (scope.mode !== "first-part-pilot" ||
      !/^001-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(scope.part))
  )
    throw new Error(
      "A first-part pilot requires one exact 001-lower-kebab-case part directory.",
    );
  if (layer === "treatments") return [`${layer}/???-*.md`];
  if (scope.mode === "complete-work") return [`${layer}/*/???-*.md`];
  return [`${layer}/${scope.part}/???-*.md`];
}
