import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { StaggerPendulum } from "./StaggerPendulum";
import type { staggerRecover } from "./staggerRecover";
import { staggerTransfer } from "./staggerTransfer";

/*
 * Read the pendulum's held-pressure spans at action-local seconds.
 * Parameter phases: The pendulum's spans, in the order it integrated them, their
 * starts nondecreasing.
 * Parameter w: The pendulum frequency, radians per second.
 * Parameter centre: The entry centre, world metres.
 * Returns: Readers of travel, pressure and extrapolation.
 */
export function staggerPendulumCourses(
  phases: readonly staggerRecover.IPhase[],
  w: number,
  centre: IAutoMovieVector3,
): staggerRecover.ICourses {
  // The last span whose start is at or before the second: the spans' starts
  // never decrease, as the pendulum appends each at its own clock.
  const phaseAt: (seconds: number) => IStaggerPendulumCoursesPhaseAt = (
    seconds: number,
  ): IStaggerPendulumCoursesPhaseAtResult => {
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
  const stateAt: (seconds: number) => IStaggerPendulumCoursesStateAt = (
    seconds: number,
  ): IStaggerPendulumCoursesStateAtResult => {
    const { phase, u }: ReturnType<typeof phaseAt> = phaseAt(seconds);
    let start: IStaggerPendulumCoursesStateAtStart = phase;
    let rest: number = u;
    if (phase.to !== undefined && phase.span !== undefined) {
      if (u <= phase.span)
        return staggerTransfer(phase, phase.to, phase.span, w, u);
      start = staggerTransfer(phase, phase.to, phase.span, w, phase.span);
      rest = u - phase.span;
    }
    const ch: number = Math.cosh(w * rest);
    const sh: number = Math.sinh(w * rest);
    const off: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(start.s, start.p);
    return {
      p: start.p,
      s: AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.add(start.p, AutoMovieEngineVector3.scale(off, ch)),
        AutoMovieEngineVector3.scale(start.v, sh / w),
      ),
      v: AutoMovieEngineVector3.add(AutoMovieEngineVector3.scale(off, w * sh), AutoMovieEngineVector3.scale(start.v, ch)),
    };
  };
  return {
    course: (seconds: number): IAutoMovieVector3 => stateAt(seconds).s,
    pressure: (seconds: number): IAutoMovieVector3 =>
      StaggerPendulum.flat(AutoMovieEngineVector3.add(centre, stateAt(seconds).p)),
    extrapolated: (seconds: number): IAutoMovieVector3 => {
      const { s, v }: ReturnType<typeof stateAt> = stateAt(seconds);
      return StaggerPendulum.flat(
        AutoMovieEngineVector3.add(centre, AutoMovieEngineVector3.add(s, AutoMovieEngineVector3.scale(v, 1 / w))),
      );
    },
  };
}

/*
 * The record of `IStaggerPendulumCoursesStateAtStart`'s site.
 */
type IStaggerPendulumCoursesStateAtStart = {
  s: IAutoMovieVector3;
  v: IAutoMovieVector3;
  p: IAutoMovieVector3;
};

/*
 * The record of `IStaggerPendulumCoursesStateAtResult`'s site.
 */
type IStaggerPendulumCoursesStateAtResult = {
  s: IAutoMovieVector3;
  v: IAutoMovieVector3;
  p: IAutoMovieVector3;
};

/*
 * The record of `IStaggerPendulumCoursesStateAt`'s site.
 */
type IStaggerPendulumCoursesStateAt = {
  s: IAutoMovieVector3;
  v: IAutoMovieVector3;
  p: IAutoMovieVector3;
};

/*
 * The record of `IStaggerPendulumCoursesPhaseAtResult`'s site.
 */
type IStaggerPendulumCoursesPhaseAtResult = {
  phase: staggerRecover.IPhase;
  u: number;
};

/*
 * The record of `IStaggerPendulumCoursesPhaseAt`'s site.
 */
type IStaggerPendulumCoursesPhaseAt = {
  phase: staggerRecover.IPhase;
  u: number;
};
