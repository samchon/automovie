import type {
  AutoMovieVector2Tuple,
  IAutoMovieConstructionProfileLoop,
  IAutoMovieConstructionProfilePiece,
  IAutoMovieConstructionProfileSource,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftWorldJetWorld,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionProfileTopology } from "./AutoMovieConstructionProfileTopology";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
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
  if (period !== undefined && !(Number.isFinite(period) && period > 0))
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
    if (
      !Number.isFinite(station) ||
      !Number.isFinite(phase) ||
      !Number.isFinite(value) ||
      station < domain[0] ||
      station > domain[1] ||
      outside
    )
      fail(`Original piece ${piece.id} query is outside its actual chart.`);
    return value;
  };
  /** Resolve actual frame2 once before placing multiple local jets at a station. */
  const jetFrame = (station: number): number[][] => {
    const frame: ReturnType<NonNullable<typeof source.plane.axis.jet>> =
      source.plane.axis.jet?.(station) ?? null;
    if (frame === null)
      fail("Original profile requires actual complete plane2.");
    return [frame.value, frame.first, frame.second].map(frameRow);
  };
  /** Transform one local physical jet into the piece's world chart. */
  const worldJet = (
    local: IAutoMovieConstructionProfileSource.IJet | null,
    frame: () => number[][],
  ): IAutoMovieSolidSurface.IJet => {
    if (local === null)
      fail(`Original piece ${piece.id} has unavailable physical total2.`);
    for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
      pair(local[key]);
    const scaled: IAutoMovieConstructionProfileSource.IJet = {
      ...local,
      t: scale(local.t, factor),
      st: scale(local.st, factor),
      tt: scale(local.tt, factor * factor),
    };
    const world: IAutoMovieLoftWorldJetWorld = AutoMovieLoftWorldJet(
      scaled,
      frame(),
    );
    const normal: number[] = [
      world.s[1] * world.t[2] - world.s[2] * world.t[1],
      world.s[2] * world.t[0] - world.s[0] * world.t[2],
      world.s[0] * world.t[1] - world.s[1] * world.t[0],
    ];
    const size: number = Math.hypot(...normal);
    if (!(Number.isFinite(size) && size > 0))
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
  };
  return {
    name: `${family}/${piece.id}`,
    domain,
    period,
    orientation: loop.surfaceOrientation ?? 1,
    point: (station: number, phase: number): [number, number, number] =>
      worldPoint(curve.point(station, clock(station, phase)), () =>
        frameRow(source.plane.axis.at(station)),
      ),
    pointAt: (
      station: number,
    ): ((phase: number) => [number, number, number]) => {
      clock(station, 0);
      const point =
        curve.pointAt?.(station) ??
        ((value: number) => curve.point(station, value));
      const frame: number[] = frameRow(source.plane.axis.at(station));
      return (phase: number): [number, number, number] =>
        worldPoint(point(clock(station, phase)), () => frame);
    },
    jet: (station: number, phase: number): IAutoMovieSolidSurface.IJet =>
      worldJet(curve.jet(station, clock(station, phase)), () =>
        jetFrame(station),
      ),
    jetAt: (
      station: number,
    ): ((phase: number) => IAutoMovieSolidSurface.IJet) => {
      clock(station, 0);
      const jet =
        curve.jetAt?.(station) ??
        ((value: number) => curve.jet(station, value));
      const frame: number[][] = jetFrame(station);
      return (phase: number): IAutoMovieSolidSurface.IJet =>
        worldJet(jet(clock(station, phase)), () => frame);
    },
  };
}

/** Place one finite local Point0 in its actual plane. */
function worldPoint(
  local: AutoMovieVector2Tuple,
  frame: () => number[],
): [number, number, number] {
  pair(local);
  const row: number[] = frame();
  const point: [number, number, number] = [0, 0, 0];
  for (let k: number = 0; k < 3; k++)
    point[k] = row[k]! + local[0] * row[3 + k]! + local[1] * row[6 + k]!;
  if (!point.every(Number.isFinite))
    fail("Original profile Point0 is not finite.");
  return point;
}

/** Every supplied local value or derivative has two genuine finite components. */
function pair(value: readonly number[]): void {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every(Number.isFinite)
  )
    fail("Original profile requires two finite local components.");
}

/**
 * Copy actual frame value/first/second operands without manufacturing absent
 * data.
 */
function frameRow(frame: IAutoMovieLoftSectionFrame): number[] {
  const row: number[] = [];
  for (const key of ["origin", "u", "v"] as const) {
    if (
      !Array.isArray(frame[key]) ||
      frame[key].length !== 3 ||
      !frame[key].every(Number.isFinite)
    )
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
