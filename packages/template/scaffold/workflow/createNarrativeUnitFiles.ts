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
