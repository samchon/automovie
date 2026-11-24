import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  type IAutoMoviePlacement,
} from "@automovie/interface";

import { addPositiveModulo } from "../math/addPositiveModulo";

/**
 * Arrange admitted clips on one actor's shot clock in stable start order.
 * Keyframes shift by placement start, gaps hold the previous tail, and
 * coincident or overlapping later frames are dropped rather than layered; empty
 * placements return an empty zero-duration clip.
 */
export const arrangeMotion: (
  id: string,
  placements: IAutoMoviePlacement[],
) => IAutoMovieMotion = (
  id: string,
  placements: IAutoMoviePlacement[],
): IAutoMovieMotion => {
  for (const placement of placements) {
    if (placement.start < 0)
      throw new Error("motion placement start must be non-negative");
    if (placement.motion.keyframes.length === 0)
      throw new Error(
        `motion placement "${placement.motion.id}" must have keyframes`,
      );
    if (placement.motion.duration <= 0)
      throw new Error(
        `motion placement "${placement.motion.id}" duration must be finite and positive`,
      );
  }

  const sorted: IAutoMoviePlacement[] = [...placements].sort(
    (a: IAutoMoviePlacement, b: IAutoMoviePlacement): number =>
      a.start - b.start,
  );
  const keyframes: IAutoMovieKeyframe[] = [];
  const push: (k: IAutoMovieKeyframe) => void = (
    k: IAutoMovieKeyframe,
  ): void => {
    const last: IAutoMovieKeyframe | undefined =
      keyframes[keyframes.length - 1];
    if (last !== undefined && k.time <= last.time) return; // keep strictly increasing
    keyframes.push(k);
  };

  for (let i: number = 0; i < sorted.length; ++i) {
    const p: IAutoMoviePlacement = sorted[i]!;
    const shifted: IAutoMovieKeyframe[] = p.motion.keyframes.map(
      (k: IAutoMovieKeyframe): IAutoMovieKeyframe => ({
        ...k,
        time: k.time + p.start,
      }),
    );
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
  const lastCycle: NonNullable<IAutoMovieMotion["gaitCycle"]> | null =
    last?.motion.gaitCycle ?? null;
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
