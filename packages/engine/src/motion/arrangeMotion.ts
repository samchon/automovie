import { IAutoMovieKeyframe, IAutoMovieMotion } from "@automovie/interface";

import { addPositiveModulo } from "../math/addPositiveModulo";
import { IAutoMoviePlacement } from "./IAutoMoviePlacement";


/**
 * Arrange admitted clips on one actor's shot clock in stable start order. Keyframes shift by placement start, gaps hold the previous tail, and coincident or overlapping later frames are dropped rather than layered; empty placements return an empty zero-duration clip.
 *
 * @evidence contracts/common.md#principled-implementation Stable start sorting followed by strictly increasing insertion implements sequential placement; a gap repeats the previous tail at the next start, and the final placement's gait clock is shifted by positive modulo for beat-end handoff. Individual clips must already have ordered finite keyframes on one skeleton.
 * @evidence contracts/common.md#clear-and-simple-design The composer owns timeline offset, gap holding and final-cycle propagation; interpolation remains sampleMotion's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Start/duration/keyframe-population admission throws on invalid placement data; documented overlap dropping preserves the existing sequential contract instead of pretending to blend concurrent clips.
 * @evidence contracts/common.md#meaningful-documentation States start ordering, gap hold, overlap dropping, non-looping output, empty result and the admitted same-rig clip premise.
 * @evidence contracts/performance.md#efficient-algorithms Sorts P placements in O(P log P), then processes K input keyframes once with O(P+K) temporary/output storage; no per-frame resampling is needed.
 * @evidence contracts/performance.md#reuse-equivalent-work Shifted frames share their existing pose/expression records; the last placement's completed gait metadata is reused with only its clock offset changed, and no cross-call cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new clip/keyframe array; nested pose/expression data remain shared with input clips, and sorted/shifted temporary arrays become collectible on completion or throw.
 */
export const arrangeMotion: (id: string, placements: IAutoMoviePlacement [ ]) => IAutoMovieMotion = (
  id: string,
  placements: IAutoMoviePlacement[],
): IAutoMovieMotion => {
  for (const placement of placements) {
    if (!Number.isFinite(placement.start))
      throw new Error("motion placement start must be finite");
    if (placement.start < 0)
      throw new Error("motion placement start must be non-negative");
    if (placement.motion.keyframes.length === 0)
      throw new Error(
        `motion placement "${placement.motion.id}" must have keyframes`,
      );
    if (
      !Number.isFinite(placement.motion.duration) ||
      placement.motion.duration <= 0
    )
      throw new Error(
        `motion placement "${placement.motion.id}" duration must be finite and positive`,
      );
  }

  const sorted: IAutoMoviePlacement[] = [...placements].sort((a: IAutoMoviePlacement, b: IAutoMoviePlacement): number => a.start - b.start);
  const keyframes: IAutoMovieKeyframe[] = [];
  const push: (k: IAutoMovieKeyframe) => void = (k: IAutoMovieKeyframe): void => {
    const last: IAutoMovieKeyframe | undefined = keyframes[keyframes.length - 1];
    if (last !== undefined && k.time <= last.time) return; // keep strictly increasing
    keyframes.push(k);
  };

  for (let i: number = 0; i < sorted.length; ++i) {
    const p: IAutoMoviePlacement = sorted[i]!;
    const shifted: IAutoMovieKeyframe[] = p.motion.keyframes.map((k: IAutoMovieKeyframe): IAutoMovieKeyframe => ({
      ...k,
      time: k.time + p.start,
    }));
    for (const k of shifted) push(k);

    const end: number = p.start + p.motion.duration;
    const next: IAutoMoviePlacement | undefined = sorted[i + 1];
    if (next !== undefined && next.start > end) {
      // hold this clip's final pose until the next clip begins
      const tail: IAutoMovieKeyframe = shifted[shifted.length - 1]!;
      push({ ...tail, time: next.start });
    }
  }

  // The composite's stride clock: the timeline ends inside (or holding) its
  // LAST placement, which is exactly where the beat-end handoff samples, so
  // the composite carries that placement's gait cycle, phase-shifted by its
  // start (`phaseAt' = (phaseAt - start) mod period`), and none when the last
  // placement carries no cycle (the actor is not striding at the end). A
  // mid-timeline cycle followed by a cycle-less action is deliberately NOT
  // carried. The end state is what the handoff resumes.
  const last: IAutoMoviePlacement | undefined = sorted[sorted.length - 1];
  const lastCycle: NonNullable<IAutoMovieMotion["gaitCycle"]> | null = last?.motion.gaitCycle ?? null;
  const gaitCycle: NonNullable<IAutoMovieMotion["gaitCycle"]> | null =
    lastCycle === null
      ? null
      : {
          period: lastCycle.period,
          phaseAt: addPositiveModulo(
            lastCycle.phaseAt,
            -last!.start,
            lastCycle.period,
          ),
        };

  return {
    id,
    skeleton: sorted[0]?.motion.skeleton ?? "",
    duration: keyframes.length ? keyframes[keyframes.length - 1]!.time : 0,
    loop: false,
    keyframes,
    gaitCycle,
  };
};
