import type { NarrativeLayer } from "./NarrativeLayer";
import type { AutoMovieEvidenceNarrativeScope } from "./AutoMovieEvidenceNarrativeScope";

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
 */
export function createNarrativeUnitFiles(props: {
  /** The narrative layer whose unit files are selected. */
  layer: NarrativeLayer;

  /** The complete work, or the exact first part a pilot authors. */
  scope: AutoMovieEvidenceNarrativeScope;
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
