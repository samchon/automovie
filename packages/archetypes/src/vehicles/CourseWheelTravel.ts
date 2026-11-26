import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeCourse } from "../core";
import { ArchetypeCourseTimed } from "../core/ArchetypeCourseTimed";

/** Deterministic interval prefixes for signed wheel material travel. */
export namespace CourseWheelTravel {
  /** A scalar or vector in a prepared course interval's own units. */
  export type Reader = (
    state: AutoMovieArchetypeCourse.IState,
    seconds: number,
  ) => readonly number[];

  /** Read a contiguous leg prefix and the current leg's linear contribution. */
  export function legs(
    spans: readonly AutoMovieArchetypeCourse.ILegSpan[],
    totals: readonly (readonly number[])[],
  ): Reader {
    const boundaries: number[] = spans.map(
      ({ from }: AutoMovieArchetypeCourse.ILegSpan): number => from,
    );
    const accumulated: readonly number[][] = prefixes(totals);
    return (state: AutoMovieArchetypeCourse.IState): readonly number[] => {
      const i: number = interval(boundaries, state.distance);
      const { from, span }: AutoMovieArchetypeCourse.ILegSpan = spans[i]!;
      const fraction: number = Math.min(1, (state.distance - from) / span);
      return accumulated[i]!.map(
        (value: number, axis: number): number =>
          value + fraction * totals[i]![axis]!,
      );
    };
  }

  /** Integrate a continuous rate over the timed course's own piece grid. */
  export function timed(
    plan: AutoMovieArchetypeCourse.IPlan & {
      course: AutoMovieArchetypeCourse.ITimed;
    },
    rate: (state: AutoMovieArchetypeCourse.IState) => readonly number[],
  ): Reader {
    const times: readonly number[] = knots(plan.course);
    const integrate = (from: number, to: number): number[] => {
      const half: number = (to - from) / 2;
      const middle: number = (from + to) / 2;
      const total: number[] = [];
      for (const [node, weight] of ArchetypeCourseTimed.GAUSS)
        rate(plan.at(middle + half * node)).forEach(
          (value: number, axis: number): void => {
            total[axis] = (total[axis] ?? 0) + weight * value * half;
          },
        );
      return total;
    };
    const pieces: number[][] = times
      .slice(0, -1)
      .map((from: number, i: number): number[] =>
        integrate(from, times[i + 1]!),
      );
    const accumulated: readonly number[][] = prefixes(pieces);
    return (
      _state: AutoMovieArchetypeCourse.IState,
      seconds: number,
    ): number[] => {
      const time: number = Math.min(
        times.at(-1)!,
        Math.max(times[0]!, seconds),
      );
      const i: number = Math.min(times.length - 2, interval(times, time));
      const remainder: number[] = integrate(times[i]!, time);
      return accumulated[i]!.map(
        (value: number, axis: number): number => value + remainder[axis]!,
      );
    };
  }

  /** Continuous unwrapped yaw swept over a timed course, in radians. */
  export function heading(
    plan: AutoMovieArchetypeCourse.IPlan & {
      course: AutoMovieArchetypeCourse.ITimed;
    },
  ): Reader {
    const times: readonly number[] = knots(plan.course);
    const directions: IAutoMovieVector3[] = times.map(
      (seconds: number): IAutoMovieVector3 => forward(plan.at(seconds)),
    );
    const accumulated: number[] = [0];
    for (let i: number = 1; i < times.length; ++i)
      accumulated.push(
        accumulated[i - 1]! + sweep(directions[i - 1]!, directions[i]!),
      );
    return (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
    ): number[] => {
      const i: number = interval(times, seconds);
      return [accumulated[i]! + sweep(directions[i]!, forward(state))];
    };
  }
}

/** Timed integration splits at the same points as the course's arc length. */
function knots(course: AutoMovieArchetypeCourse.ITimed): number[] {
  const times: number[] = [];
  const pieces: number = ArchetypeCourseTimed.PIECES;
  for (let i: number = 1; i < course.samples.length; ++i) {
    const from: number = course.samples[i - 1]!.seconds;
    const to: number = course.samples[i]!.seconds;
    for (let step: number = 0; step < pieces; ++step)
      times.push(from + ((to - from) * step) / pieces);
  }
  times.push(course.samples.at(-1)!.seconds);
  return times;
}

/** The start of the interval containing this clock or path coordinate. */
function interval(boundaries: readonly number[], value: number): number {
  let low: number = 0;
  let high: number = boundaries.length;
  while (high - low > 1) {
    const middle: number = (low + high) >>> 1;
    if (boundaries[middle]! <= value) low = middle;
    else high = middle;
  }
  return low;
}

/** Accumulated component totals at the start of each interval. */
function prefixes(totals: readonly (readonly number[])[]): number[][] {
  const result: number[][] = [totals[0]!.map((): number => 0)];
  for (const add of totals)
    result.push(
      result
        .at(-1)!
        .map((prior: number, axis: number): number => prior + add[axis]!),
    );
  return result;
}

/** Model-forward direction, including the course's pitch. */
function forward(state: AutoMovieArchetypeCourse.IState): IAutoMovieVector3 {
  return Quaternion.rotateVector(state.placement.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
}

/** Signed heading change between two successive horizontally projected axes. */
function sweep(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.atan2(a.z * b.x - a.x * b.z, a.x * b.x + a.z * b.z);
}
