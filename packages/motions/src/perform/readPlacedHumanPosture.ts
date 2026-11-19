import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import type { AutoMovieMotionHumanBendRepeat } from "../compose/AutoMovieMotionHumanBendRepeat";
import { HumanBendRead } from "../compose/HumanBendRead";
import { HumanSegmentSelection } from "./HumanSegmentSelection";

/**
 * Read the raw active posture of an already resolved person, before layers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines raw channel and projectile-root reads before display layers.
 * @evidence contracts/development/implementation.md#principled-implementation The existing last-segment selector and exact clamped local second identify the original action. Only a genuinely native loan selects the full writer's contextual counterpart.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One selector, guarded optional loan, and original raw fallback.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original plan, posture accessor, duration, receiver and explicit channels argument.
 * @evidence contracts/development/implementation.md#efficient-algorithms The last-segment lookup owns cost. The contextual branch inserts a constant-cost provenance check.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same raw phase and native writer are shared with the original evaluator.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No posture or source state is retained.
 */
export function readPlacedHumanPosture(
  person: IAutoMovieMotionHumanSegment.IPerson,
  seconds: number,
  channels?: readonly AutoMovieMotionHumanChannel[],
  trial?: readonly [
    IAutoMovieMotionHumanPerformanceState,
    AutoMovieMotionHumanBendRepeat,
  ],
): IAutoMovieMotionHumanPosture {
  const active: IAutoMovieMotionHumanSegment | undefined =
    HumanSegmentSelection.last(person.segments, seconds);
  if (trial !== undefined && active !== undefined) {
    const posture: IAutoMovieMotionHumanPosture | undefined =
      HumanBendRead.sample(trial[0], active, seconds, trial[1]);
    if (posture !== undefined) return posture;
  }
  return active === undefined
    ? person.initial
    : active.plan.posture(
        Math.min(active.plan.duration, Math.max(0, seconds - active.start)),
        channels,
      );
}
