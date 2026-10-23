/**
 * Selects the exact narrative population being authored and reviewed.
 *
 * The two narrative axes are selected separately because they are different
 * axes. `treatments` is a flat sequence of event units and never partitions the
 * work for release, so nothing selects it: during a pilot the layer holds only
 * the pilot's events, and after the complete-work reset it holds every event.
 * `scripts` and `screenplay` carry the part and episode partition that `scripts`
 * designs, so a pilot names the one part it authors.
 */
export type NarrativeScope =
  | {
      mode: "complete-work";
    }
  | {
      mode: "first-part-pilot";

      /** Selects the one script and screenplay part directory the pilot authors. */
      part: `001-${string}`;
    };
