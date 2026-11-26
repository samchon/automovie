import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionTakeAnchor,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanContinuation,
  HumanPerformance,
} from "@automovie/motions";

import type { IMotionTakeSource } from "./IMotionTakeSource";

/**
 * Prepare the Human owner once for reads on either side of an admitted anchor.
 * A branch retains its original runtime before the owner's continuation seam.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the admitted anchor and the transition between prepared Human runtimes.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the same Human compiler for reopen and the owner's continuation gate for a changed suffix. Rejects inconsistent shot ownership or duration instead of adjusting either clock.
 * @evidence contracts/development/implementation.md#efficient-algorithms Selects the named owner input once and returns the compiled runtime along with its source-time selector. Only the selected shot is compiled; each later selector call tests one seam. All renderer or authoring reads share the prepared original and branch runtimes. The caller owns the returned Human performance and its preparation lifetime.
 */
export function replayMotionTake(
  source: IMotionTakeSource,
  anchor: IAutoMovieMotionTakeAnchor,
  parent?: IMotionTakeSource,
): {
  source: HumanPerformance;
  branch?: HumanPerformance;
  branchStart?: number;
  performanceAt: (seconds: number, entry?: number) => HumanPerformance;
} {
  const owner: IMotionTakeSource = parent ?? source;
  const input: IAutoMovieMotionHumanPerformance.IInput | undefined =
    owner.human[anchor.shot];
  if (!input || !Object.hasOwn(owner.human, anchor.shot))
    throw new Error(
      `take-provider: no Human source registered for shot ${anchor.shot}`,
    );
  const authoredDuration: number | undefined = owner.shots.find(
    (shot: IAutoMovieShot): boolean => shot.id === anchor.shot,
  )?.duration;
  if (source.branch === undefined) {
    const performance: HumanPerformance = new HumanPerformance(input);
    if (performance.duration !== authoredDuration)
      throw new Error(
        `take-anchor: Human and editorial durations differ for ${anchor.shot}`,
      );
    return {
      source: performance,
      performanceAt: (): HumanPerformance => performance,
    };
  }
  if (!parent)
    throw new Error("take-provenance: branch requires its original source");

  const continuation: AutoMovieMotionHumanContinuation.IResult =
    AutoMovieMotionHumanContinuation.compile(
      input,
      anchor.sourceSeconds,
      source.branch.retainedParts,
      source.branch.suffix,
    );
  const branchDuration: number | undefined = source.shots.find(
    (shot: IAutoMovieShot): boolean => shot.id === anchor.shot,
  )?.duration;
  if (
    continuation.source.duration !== authoredDuration ||
    continuation.branch.duration !== branchDuration
  )
    throw new Error(
      `take-anchor: Human and editorial durations differ for ${anchor.shot}`,
    );
  return {
    ...continuation,
    performanceAt: (
      seconds: number,
      entry: number = anchor.entry,
    ): HumanPerformance =>
      entry < anchor.entry || seconds < continuation.branchStart
        ? continuation.source
        : continuation.branch,
  };
}
