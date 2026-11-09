/**
 * Selects the exact narrative population being authored and reviewed.
 *
 * The two narrative axes are selected separately because they are different
 * axes. `treatments` is a flat sequence of event units and never partitions the
 * work for release, so nothing selects it: during a pilot the layer holds only
 * the pilot's events, and after the complete-work reset it holds every event.
 * `scripts` and `screenplay` carry the part and episode partition that `scripts`
 * designs, so a pilot names the one part it authors.
 *
 * @evidence contracts/development/design.md#principled-representation The discriminated union selects all authored parts or one explicitly named first part; flat treatments retain the events currently authored rather than a fictitious release partition.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant selects full work or one exact first part while leaving treatments unpartitioned.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The template literal fixes only the 001 prefix; createNarrativeUnitFiles validates the remaining lower-kebab spelling.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains separate narrative axes, pilot treatments content and exact named script/screenplay part.
 */
export type NarrativeScope =
  | {
      /** Authors and reviews every currently declared narrative part. */
      mode: "complete-work";
    }
  | {
      /** Authors and reviews only the exact first part named below. */
      mode: "first-part-pilot";

      /** Selects the one script and screenplay part directory the pilot authors. */
      part: `001-${string}`;
    };
