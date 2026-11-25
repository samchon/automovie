import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * A constant posture curve: the posture copied once, and each read a fresh
 * mutable copy of it, so neither the input nor a read owns the curve's record.
 *
 * @param posture The posture the curve holds.
 * @returns The curve's reader, the same posture at every second.
 */
export function createHumanPostureCurve(
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanActionPlan["posture"] {
  const saved: IAutoMovieMotionHumanPosture = structuredClone(posture);
  return (): IAutoMovieMotionHumanPosture => structuredClone(saved);
}