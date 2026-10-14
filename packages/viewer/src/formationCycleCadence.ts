import type { IAutoMovieFormationCadenceSegment } from "@automovie/engine";

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
 * is the difference between a crowd standing at ease and a crowd frozen.
 * This integration uses the bake's stride estimate; it does not prove exact
 * foot contact or no-slip motion for arbitrary gait paths.
 *
 * @evidence contracts/common.md#principled-implementation Folds engine cue segments in order using each selected take's distance/turn per estimated stride, or elapsed seconds per period for zero-stride takes; finite admitted segment quantities and positive take periods are premises, with absent/unknown gait using this tier's declared fallback and stride remaining a contact heuristic.
 * @evidence contracts/common.md#clear-and-simple-design Keeps two absolute accumulators and final selected take together so cue changes preserve prior integrated phase without per-member animation clocks or a duplicated gait table selector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero-stride period playback and fallback take are explicit movement/repertoire policies, not asset-name exceptions; no external clock, frame-history compensation or fixture travel distance is read.
 * @evidence contracts/common.md#meaningful-documentation Explains distance versus period integration, turn-radius composition, cross-cue continuity and the stride approximation rather than claiming arbitrary exact contact.
 * @evidence contracts/performance.md#efficient-algorithms Visits S segments once with constant-time take Map lookups and two scalar accumulators, O(S) CPU and constant adapter storage independent of anonymous member count.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the cycle's existing take records/textures and folds once per tier update for all members; changed absolute segment input requires reintegration, with no previous-frame accumulation cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a small record borrowing one cycle-owned take and retains no segment/cycle after return; this arithmetic acquires no texture, native task or animation timer.
 */
export const formationCycleCadence: (cycle: IAutoMovieFormationCycle, segments: readonly IAutoMovieFormationCadenceSegment[]) => IAutoMovieFormationCadence = (
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
