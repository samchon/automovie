import type {
  AutoMovieVector2Tuple,
  IAutoMovieConstructionProfileLoop,
  IAutoMovieConstructionProfilePiece,
  IAutoMovieConstructionProfileSource,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftWorldJetWorld,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionProfileTopology } from "../AutoMovieConstructionProfileTopology";
import { AutoMovieLoftAdmissionError } from "../AutoMovieLoftAdmissionError";
import { AutoMovieLoftWorldJet } from "./AutoMovieLoftWorldJet";

/**
 * Exact world chart of one original interval, retained or in its actual
 * neighborhood.
 *
 * The default physical domain is the loop's retained metre interval converted
 * once to kernel mm. An explicit domain reads the same original curve/plane on
 * their actual supported neighborhood; it extends no function by fitting or
 * Taylor data. A complete periodic original permits its actual phase aliases.
 * Other piece charts retain their bounded normalized interval.
 */
export function AutoMovieConstructionProfileSurface(
  source: IAutoMovieConstructionProfileSource,
  family: string,
  loop: IAutoMovieConstructionProfileLoop,
  piece: IAutoMovieConstructionProfilePiece,
  curve: IAutoMovieConstructionProfileSource.ICurve,
  originalDomain?: readonly [number, number],
): IAutoMovieSolidSurface {
  const domain: [number, number] =
    originalDomain === undefined
      ? [1000 * loop.domain[0], 1000 * loop.domain[1]]
      : [...originalDomain];
  const period: number | undefined =
    originalDomain === undefined
      ? AutoMovieConstructionProfileTopology.period(loop, piece, curve)
      : curve.period === undefined
        ? undefined
        : curve.period / (piece.clock[1] - piece.clock[0]);
  if (period !== undefined && !(period > 0))
    fail("Original profile period is not representable in this piece clock.");
  const factor: number = piece.direction * (piece.clock[1] - piece.clock[0]);
  const clock: (station: number, phase: number) => number = (
    station: number,
    phase: number,
  ): number => {
    const value: number =
      piece.clock[piece.direction === 1 ? 0 : 1] + factor * phase;
    const outside: boolean =
      originalDomain === undefined
        ? period === undefined && (phase < 0 || phase > 1)
        : curve.period === undefined &&
          (value < curve.clock[0] || value > curve.clock[1]);
    if (station < domain[0] || station > domain[1] || outside)
      fail(`Original piece ${piece.id} query is outside its actual chart.`);
    return value;
  };
  return {
    name: `${family}/${piece.id}`,
    domain,
    period,
    orientation: loop.surfaceOrientation ?? 1,
    point: (station: number, phase: number): [number, number, number] => {
      const local: AutoMovieVector2Tuple = curve.point(
        station,
        clock(station, phase),
      );
      pair(local);
      const frame: IAutoMovieLoftSectionFrame = source.plane.axis.at(station);
      frameRow(frame);
      const point: [number, number, number] = [0, 1, 2].map(
        (k: number): number =>
          frame.origin[k]! + local[0] * frame.u[k]! + local[1] * frame.v[k]!,
      ) as [number, number, number];
      return point;
    },
    jet: (station: number, phase: number): IAutoMovieSolidSurface.IJet => {
      const local: IAutoMovieConstructionProfileSource.IJet | null = curve.jet(
        station,
        clock(station, phase),
      );
      if (local === null)
        fail(`Original piece ${piece.id} has unavailable physical total2.`);
      for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
        pair(local![key]);
      const frame: ReturnType<NonNullable<typeof source.plane.axis.jet>> =
        source.plane.axis.jet?.(station) ?? null;
      if (frame === null)
        fail("Original profile requires actual complete plane2.");
      const rows: number[][] = [frame!.value, frame!.first, frame!.second].map(
        frameRow,
      );
      const scaled: IAutoMovieConstructionProfileSource.IJet = {
        ...local!,
        t: scale(local!.t, factor),
        st: scale(local!.st, factor),
        tt: scale(local!.tt, factor * factor),
      };
      const world: IAutoMovieLoftWorldJetWorld = AutoMovieLoftWorldJet(
        scaled,
        rows,
      );
      const normal: number[] = [
        world.s[1] * world.t[2] - world.s[2] * world.t[1],
        world.s[2] * world.t[0] - world.s[0] * world.t[2],
        world.s[0] * world.t[1] - world.s[1] * world.t[0],
      ];
      const size: number = Math.hypot(...normal);
      if (!(size > 0))
        fail(
          `Original piece ${piece.id} has no finite regular world chart at this query.`,
        );
      return {
        p: world.p,
        u: world.s,
        v: world.t,
        uu: world.ss,
        uv: world.st,
        vv: world.tt,
      };
    },
  };
}

/** Every supplied local value or derivative has two genuine finite components. */
function pair(value: readonly number[]): void {
  if (value.length !== 2)
    fail("Original profile requires two finite local components.");
}

/**
 * Copy actual frame value/first/second operands without manufacturing absent
 * data.
 */
function frameRow(frame: IAutoMovieLoftSectionFrame): number[] {
  const row: number[] = [];
  for (const key of ["origin", "u", "v"] as const) {
    if (frame[key].length !== 3)
      fail("Original profile has incomplete or nonfinite plane data.");
    row.push(...frame[key]);
  }
  return row;
}

/**
 * Actual affine clock scaling applies only to the corresponding derivative
 * order.
 */
function scale(
  value: AutoMovieVector2Tuple,
  factor: number,
): AutoMovieVector2Tuple {
  return [factor * value[0], factor * value[1]];
}

/**
 * Numerical/unavailable admission leaves exceptions from original owners
 * unchanged.
 */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}
