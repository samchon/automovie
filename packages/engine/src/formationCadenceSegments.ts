import { IAutoMovieFormationMotion } from "@automovie/interface";

import { IAutoMovieFormationCadenceSegment } from "./IAutoMovieFormationCadenceSegment";
import { ease } from "./motion/ease";

/**
 * Cut one unit's cue sequence over `[0, time]` into the intervals its cadence
 * is made of.
 *
 * Each cue interpolates its unit from `from` to `to`, so the ground covered
 * inside a cue is its straight-line x-z displacement scaled by the same eased
 * progress `sampleFormationMotion` places the unit by: the two read one law,
 * and a member's feet cannot disagree with where its unit stands. Every easing
 * a formation cue allows is monotone, so an interval never covers negative
 * ground.
 *
 * A gap between cues covers nothing. The state a unit holds between two cues
 * is the earlier cue's exact `to`, and a jump from that state to the next
 * cue's `from` is a discontinuity the sampler already permits rather than
 * travel a member could walk, so it contributes seconds and no distance. The
 * gait is retained across it, because a unit that has stopped is still doing
 * whatever its last cue had it doing.
 *
 * Turning is reported apart from travel because the two reach a member
 * differently: every member of a unit covers the unit's translation, while the
 * ground a turn carries a member over is that member's own distance from the
 * pivot. A consumer that knows a member's radius composes them; one that does
 * not still gets the unit's travel exactly.
 *
 * Cues are ordered by start alone. The builder refuses overlapping or
 * zero-length cues inside one unit, so no two starts tie in valid input; in
 * malformed input the input's own order is kept. A negative `time` yields no
 * segments.
 *
 * @evidence contracts/common.md#principled-implementation A piecewise integral over `[0, time]`: each cue's distance is its displacement times the difference of eased progress at the interval's ends, using the sampler's own `ease` and its rule that a finished cue sits at progress one, so a `step` cue's displacement lands at its end; it relies on formation easings being monotone.
 * @evidence contracts/common.md#clear-and-simple-design One pass emitting gap and cue intervals through a local `hold`, leaving the per-tier stride folding to the viewer's `applyFormationCycleCadence`, which knows each figure's stride.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Gaps carry no distance because the sampler's jump between cues is not walked travel, a stated rule rather than a correction, and no gait or cue is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the distance law and its shared progress, the gap rule and gait retention, why turn is separate, the cue order and its malformed-input behavior, and the negative-time result.
 * @evidence contracts/performance.md#efficient-algorithms One filter over all motions and one sort of the unit's `m` cues, `O(M + m log m)`, then a single pass that stops at the first cue starting after `time`; the viewer calls it once per formation per frame, and recomputing from the cue list is what keeps a seek exact.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shares nothing across calls by design: every frame derives the segments from the cue list and the time alone so nothing accumulates between frames.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned list holds at most two segments per cue started before `time` plus one trailing gap and belongs to the caller.
 */
export const formationCadenceSegments = (
  motions: readonly IAutoMovieFormationMotion[],
  formation: string,
  time: number,
): IAutoMovieFormationCadenceSegment[] => {
  const cues: IAutoMovieFormationMotion[] = motions
    .filter((cue: IAutoMovieFormationMotion): boolean => cue.formation === formation)
    .sort(
      (left: IAutoMovieFormationMotion, right: IAutoMovieFormationMotion): number =>
        left.start - right.start,
    );
  const end: number = Math.max(0, time);
  const segments: IAutoMovieFormationCadenceSegment[] = [];
  let cursor: number = 0;
  let gait: string | null = null;
  const hold = (until: number): void => {
    if (until <= cursor) return;
    segments.push({ gait, seconds: until - cursor, distance: 0, turn: 0 });
    cursor = until;
  };
  for (const cue of cues) {
    if (cue.start >= end) break;
    hold(cue.start);
    const closed: number = Math.min(cue.end, end);
    // `at >= cue.end` is the sampler's own rule that a finished cue sits at its
    // exact `to` state, which is what carries a `step` cue's whole displacement
    // at its end instead of losing it to a curve that never reaches one.
    const progress = (at: number): number =>
      at >= cue.end
        ? 1
        : ease(
            cue.easing,
            Math.max(0, Math.min(1, (at - cue.start) / (cue.end - cue.start))),
          );
    const covered: number = progress(closed) - progress(cursor);
    const cueGait: string = cue.gait ?? cue.action;
    segments.push({
      gait: cueGait,
      seconds: closed - cursor,
      distance:
        Math.hypot(
          cue.to.translation.x - cue.from.translation.x,
          cue.to.translation.z - cue.from.translation.z,
        ) * covered,
      turn:
        (Math.abs(cue.to.facingOffsetDeg - cue.from.facingOffsetDeg) *
          Math.PI *
          covered) /
        180,
    });
    cursor = closed;
    gait = cueGait;
  }
  hold(end);
  return segments;
};
