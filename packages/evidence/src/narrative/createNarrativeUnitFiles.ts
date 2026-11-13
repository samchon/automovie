import type { NarrativeLayer } from "./NarrativeLayer";
import type { NarrativeScope } from "./NarrativeScope";

/**
 * Selects the authored unit files of one narrative layer.
 *
 * `treatments` is flat and carries no release partition, so its population is
 * every numbered event file it holds — during a pilot the layer contains only
 * the pilot's events, so the same selector serves both modes. `scripts` holds
 * one file per episode in its part folders, `NNN-part/NNN-episode.md`.
 * `screenplay` holds one file per scene in a film folder: a short's
 * `<film>/NNN-scene.md`, or long work's `NNN-part/NNN-episode/NNN-scene.md`,
 * whose episode folder takes the place of the script's episode file. A pilot
 * narrows scripts and screenplay to the one part it authors. The layer's
 * topology selector still reaches every other file under it, so the H2s of a
 * misplaced scene file owe their answers instead of silently losing them.
 *
 * The selector is relative to the body root.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Layer-specific globs select flat numbered treatments, episode files of scripts, and screenplay scene files in a short's film folder or long work's episode folders, narrowing scripts and screenplay to an exact first part for a pilot.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The selector owns only relative narrative population paths; callers add the body root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Short film folders and numbered long partitions are supported production layouts; no file or production name controls selection, and first-part pilots remain confined to their exact directory.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states each layer's partition, the scene-file screenplay layout, pilot behavior and root relativity.
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
  if (layer === "screenplay")
    return scope.mode === "complete-work"
      ? [`${layer}/*/???-*.md`, `${layer}/*/*/???-*.md`]
      : [`${layer}/${scope.part}/*/???-*.md`];
  return scope.mode === "complete-work"
    ? [`${layer}/*/???-*.md`]
    : [`${layer}/${scope.part}/???-*.md`];
}
