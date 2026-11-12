import type { NarrativeLayer } from "./NarrativeLayer";
import type { NarrativeScope } from "./NarrativeScope";

/**
 * Selects the authored unit files of one narrative layer.
 *
 * `treatments` is flat and carries no release partition, so its population is
 * every numbered event file it holds — during a pilot the layer contains only
 * the pilot's events, so the same selector serves both modes. `scripts` and
 * long-form `screenplay` carry the part partition, so a pilot narrows them to
 * the one part it authors. Complete-work screenplay also selects flat Markdown
 * for short productions. Route topology validation rejects flat files in long
 * work rather than silently omitting their evidence.
 *
 * The selector is relative to the authored pass root. A naturalness comparison uses the
 * same relative file identity under `docs/revision`.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Layer-specific globs preserve flat numbered treatments, partitioned scripts and exact first-part pilots; complete-work screenplay also captures flat short-film documents, with route-specific admission owned by topology validation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The selector owns only relative narrative population paths; callers choose body, frozen or working roots independently.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Flat short screenplays and numbered long partitions are supported production layouts; no file or production name controls selection, and first-part pilots remain confined to their exact directory.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states layer partition differences, pilot behavior, root relativity and frozen-snapshot identity.
 * @evidence contracts/development/implementation.md#efficient-algorithms Complete-work returns one or two fixed-size globs; pilot validation and interpolation take time and output space proportional to the selected part string length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This selector builds one result from supplied values and coordinates no cross-request work; independent arrays avoid shared mutable selector state.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned small selector array survives the call; no descriptor, task or module cache is acquired.
 */
export function createNarrativeUnitFiles(props: {
  /** The narrative layer whose unit files are selected. */
  layer: NarrativeLayer;

  /** The complete work, or the exact first part a pilot authors. */
  scope: NarrativeScope;
}): string[] {
  const { layer, scope } = props;
  if (
    scope.mode !== "complete-work" &&
    (scope.mode !== "first-part-pilot" ||
      !/^001-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(scope.part))
  )
    throw new Error(
      "A first-part pilot requires one exact 001-lower-kebab-case part directory.",
    );
  if (layer === "treatments") return [`${layer}/???-*.md`];
  if (scope.mode === "complete-work")
    return layer === "screenplay"
      ? [`${layer}/*.md`, `${layer}/*/???-*.md`]
      : [`${layer}/*/???-*.md`];
  return [`${layer}/${scope.part}/???-*.md`];
}
