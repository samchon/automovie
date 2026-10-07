import type { IAutoMovieFormationCadenceSegment } from "@automovie/engine";

import type { IAutoMovieFormationCadence } from "./IAutoMovieFormationCadence";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle";

/**
 * Fold one unit's cue segments into the cycles its members have turned over.
 *
 * The two accumulators are what a member needs and all it needs: everyone in a
 * unit covers the unit's travel, while a turn carries a member over ground
 * proportional to its own distance from the pivot, so the outer file of a
 * wheeling unit steps as many times as the ground under it requires and the
 * inner file steps fewer. A member composes them from its own radius.
 *
 * Segments are folded rather than sampled because stride belongs to the take:
 * where a unit walks one cue and runs the next, the second cue's ground is
 * counted in the second cue's strides. That is also what keeps a change of
 * action from jumping the cycle, since everything already turned over stays
 * turned over.
 *
 * A take that carries a body nowhere is played on its own period instead, which
 * is the difference between a crowd standing at ease and a crowd frozen.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Folds each cue interval using its take stride or idle period, retaining accumulated translation and radius-scaled turn across gait changes.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Folds each cue interval using its take stride or idle period, retaining accumulated translation and radius-scaled turn across gait changes.
 */
export const formationCycleCadence = (
  cycle: IAutoMovieFormationCycle,
  segments: readonly IAutoMovieFormationCadenceSegment[],
): IAutoMovieFormationCadence => {
  let take = cycle.fallback;
  let advance = 0;
  let turn = 0;
  for (const segment of segments) {
    take =
      (segment.gait === null ? undefined : cycle.takes.get(segment.gait)) ??
      cycle.fallback;
    if (take.strideMeters > 0) {
      advance += segment.distance / take.strideMeters;
      turn += segment.turn / take.strideMeters;
    } else advance += segment.seconds / take.periodSeconds;
  }
  return { take, advance, turn };
};
