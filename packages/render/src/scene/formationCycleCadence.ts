import type { IAutoMovieFormationCadenceSegment } from "@automovie/interface";

import type { IAutoMovieFormationCadence } from "./IAutoMovieFormationCadence.js";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake.js";

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
 * is the difference between a crowd standing at ease and a crowd frozen. This
 * integration uses the bake's stride estimate; it does not prove exact foot
 * contact or no-slip motion for arbitrary gait paths.
 */
export const formationCycleCadence: (
  cycle: IAutoMovieFormationCycle,
  segments: readonly IAutoMovieFormationCadenceSegment[],
) => IAutoMovieFormationCadence = (
  cycle: IAutoMovieFormationCycle,
  segments: readonly IAutoMovieFormationCadenceSegment[],
): IAutoMovieFormationCadence => {
  let take: IAutoMovieFormationCycleTake = cycle.fallback;
  let advance: number = 0;
  let turn: number = 0;
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
