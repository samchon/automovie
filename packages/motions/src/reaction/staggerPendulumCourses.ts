import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { StaggerPendulum } from "./StaggerPendulum";
import type { staggerRecover } from "./staggerRecover";
import { staggerTransfer } from "./staggerTransfer";

/**
 * Read the pendulum's held-pressure spans at action-local seconds.
 *
 * @param phases The pendulum's spans, in the order it integrated them, their starts nondecreasing.
 * @param w The pendulum frequency, radians per second.
 * @param centre The entry centre, world metres.
 * @returns Readers of travel, pressure and extrapolation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phase order premise, common clock, frequency, world centre and the outputs.
 * @evidence contracts/development/implementation.md#principled-implementation Selects the last span starting at or before the second, the first before every start, and evaluates the closed-form held-pressure pendulum: x - p as cosh/sinh, xi - p growing as exp(omega t).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One span selector and three formulas.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every span is the pendulum's own; no sample, table or time memo replaces the formulas.
 * @evidence contracts/development/implementation.md#efficient-algorithms A binary search over P spans per read, O(log P), valid because the pendulum appends spans at its advancing clock; equal starts resolve to the last, as a linear scan of the latest would.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each read computes from the retained span records; nothing is cached by time.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned readers retain the span array, centre and frequency until their owning recovery releases them; each result is fresh.
 */
export function staggerPendulumCourses(
  phases: readonly staggerRecover.IPhase[],
  w: number,
  centre: IAutoMovieVector3,
): staggerRecover.ICourses {
  // The last span whose start is at or before the second: the spans' starts
  // never decrease, as the pendulum appends each at its own clock.
  const phaseAt: (seconds: number) => { phase: staggerRecover.IPhase; u: number } = (seconds: number): { phase: staggerRecover.IPhase; u: number } => {
    let lo: number = 0;
    let hi: number = phases.length - 1;
    while (lo < hi) {
      const mid: number = (lo + hi + 1) >> 1;
      if (phases[mid]!.from <= seconds) lo = mid;
      else hi = mid - 1;
    }
    const phase: staggerRecover.IPhase = phases[lo]!;
    return { phase, u: Math.max(0, seconds - phase.from) };
  };

  // A span's state u seconds in: a weight shift's closed form up to its
  // end (`staggerTransfer`), then the held pressure at its end; a held span
  // in closed form throughout.
  const stateAt: (seconds: number) => { s: IAutoMovieVector3; v: IAutoMovieVector3; p: IAutoMovieVector3 } = (
    seconds: number,
  ): { s: IAutoMovieVector3; v: IAutoMovieVector3; p: IAutoMovieVector3 } => {
    const { phase, u }: ReturnType<typeof phaseAt> = phaseAt(seconds);
    let start: { s: IAutoMovieVector3; v: IAutoMovieVector3; p: IAutoMovieVector3 } = phase;
    let rest: number = u;
    if (phase.to !== undefined && phase.span !== undefined) {
      if (u <= phase.span) return staggerTransfer(phase, phase.to, phase.span, w, u);
      start = staggerTransfer(phase, phase.to, phase.span, w, phase.span);
      rest = u - phase.span;
    }
    const ch: number = Math.cosh(w * rest);
    const sh: number = Math.sinh(w * rest);
    const off: IAutoMovieVector3 = Vector3.subtract(start.s, start.p);
    return {
      p: start.p,
      s: Vector3.add(Vector3.add(start.p, Vector3.scale(off, ch)), Vector3.scale(start.v, sh / w)),
      v: Vector3.add(Vector3.scale(off, w * sh), Vector3.scale(start.v, ch)),
    };
  };
  return {
    course: (seconds: number): IAutoMovieVector3 => stateAt(seconds).s,
    pressure: (seconds: number): IAutoMovieVector3 =>
      StaggerPendulum.flat(Vector3.add(centre, stateAt(seconds).p)),
    extrapolated: (seconds: number): IAutoMovieVector3 => {
      const { s, v }: ReturnType<typeof stateAt> = stateAt(seconds);
      return StaggerPendulum.flat(Vector3.add(centre, Vector3.add(s, Vector3.scale(v, 1 / w))));
    },
  };
}
