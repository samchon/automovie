import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { StaggerPendulum } from "./StaggerPendulum";
import type { staggerRecover } from "./staggerRecover";

/**
 * Read the pendulum's existing held-pressure spans at action-local seconds.
 *
 * @param phases The same phase array the original reader retains.
 * @param w The pendulum frequency, radians per second.
 * @param centre The entry centre, world metres.
 * @returns Individual and paired readers of travel, pressure and extrapolation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phase lifetime, common clock, frequency, world centre and the paired/individual outputs.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the original latest-from<=seconds scan, before-first clamp and closed-form cosh/sinh/exp pendulum expressions, including duplicate-start selection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One phase selector and the original three formulas serve both independent readers and paired same-instant sampling.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not require sorted immutable phases, reduce phase samples or introduce time memoization; optional extrapolation is omitted only when unrequested.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each individual or paired read scans P phases once; the paired sample shares phase selection for two or three requested values with constant result size.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A paired sample shares only its same selected span and local time, while all current values are calculated from the retained original phase records.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader closures retain the phase array, centre and frequency until their owning recovery releases them; each result is fresh and no time/query history is kept.
 */
export function staggerPendulumCourses(
  phases: readonly staggerRecover.IPhase[],
  w: number,
  centre: IAutoMovieVector3,
): staggerRecover.ICourses {
  const phaseAt: (seconds: number) => { phase: staggerRecover.IPhase; u: number } = (seconds: number): { phase: staggerRecover.IPhase; u: number } => {
    let phase: staggerRecover.IPhase = phases[0]!;
    for (const q of phases) if (q.from <= seconds) phase = q;
    return { phase, u: Math.max(0, seconds - phase.from) };
  };
  const course: (phase: staggerRecover.IPhase, u: number) => IAutoMovieVector3 = (phase: staggerRecover.IPhase, u: number): IAutoMovieVector3 =>
    Vector3.add(
      Vector3.add(
        phase.p,
        Vector3.scale(Vector3.subtract(phase.s, phase.p), Math.cosh(w * u)),
      ),
      Vector3.scale(phase.v, Math.sinh(w * u) / w),
    );
  const pressure: (phase: staggerRecover.IPhase) => IAutoMovieVector3 = (phase: staggerRecover.IPhase): IAutoMovieVector3 =>
    StaggerPendulum.flat(Vector3.add(centre, phase.p));
  const extrapolated: (phase: staggerRecover.IPhase, u: number) => IAutoMovieVector3 = (phase: staggerRecover.IPhase, u: number): IAutoMovieVector3 =>
    StaggerPendulum.flat(
      Vector3.add(
        centre,
        Vector3.add(
          phase.p,
          Vector3.scale(
            Vector3.subtract(
              Vector3.add(phase.s, Vector3.scale(phase.v, 1 / w)),
              phase.p,
            ),
            Math.exp(w * u),
          ),
        ),
      ),
    );
  return {
    course: (seconds: number): IAutoMovieVector3 => {
      const { phase, u }: ReturnType<typeof phaseAt> = phaseAt(seconds);
      return course(phase, u);
    },
    pressure: (seconds: number): IAutoMovieVector3 =>
      pressure(phaseAt(seconds).phase),
    extrapolated: (seconds: number): IAutoMovieVector3 => {
      const { phase, u }: ReturnType<typeof phaseAt> = phaseAt(seconds);
      return extrapolated(phase, u);
    },
    sample: (seconds: number, withExtrapolated: boolean): staggerRecover.IReading => {
      const { phase, u }: ReturnType<typeof phaseAt> = phaseAt(seconds);
      return {
        course: course(phase, u),
        pressure: pressure(phase),
        ...(withExtrapolated ? { extrapolated: extrapolated(phase, u) } : {}),
      };
    },
  };
}
