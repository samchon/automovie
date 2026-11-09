import type { IAutoMovieConstructionProfile } from "@automovie/interface";

import { AutoMovieConstructionProfileTopology } from "./AutoMovieConstructionProfileTopology";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftWorldJet } from "./AutoMovieLoftWorldJet";
import type { IAutoMovieConstructionProfileSource } from "./IAutoMovieConstructionProfileSource";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Exact world chart of one original interval, retained or in its actual neighborhood.
 *
 * The default physical domain is the loop's retained metre interval converted
 * once to kernel mm. An explicit domain reads the same original curve/plane
 * on their actual supported neighborhood; it extends no function by fitting
 * or Taylor data. A complete periodic original permits its actual phase
 * aliases. Other piece charts retain their bounded normalized interval.
 *
 * @evidence contracts/common.md#principled-implementation The original clock pullback and unchanged frame product-rule owner preserve every local/world total2 term; retained and original neighborhood views borrow the same function owners.
 * @evidence contracts/common.md#clear-and-simple-design One evaluator creates ordinary SolidSurface Point0/physical2 readers with qualified domain/period metadata instead of another geometric representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No resampling, fit, input adjustment, extrapolation or missing derivative appears. Finite regularity is checked at each jet query and supplies no whole-domain simplicity or cross-face certificate.
 * @evidence contracts/common.md#meaningful-documentation States m/mm conversion, normalized versus original clocks, actual neighborhood support, independent Point0 and unchanged foreign callback/getter exceptions.
 * @evidence contracts/performance.md#efficient-algorithms Preparation is constant-size; Point0 reads one original curve/plane value and physical2 reads one actual local/frame jet plus fixed arithmetic, including each original owner's evaluation cost.
 * @evidence contracts/performance.md#reuse-equivalent-work All queries borrow the same immutable original closures; no compatibility chain or duplicate source geometry is prepared, and normalized clock factors are computed once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each reader retains fixed chart metadata and borrowed source owners until released; result vectors are fresh and no global cache or handle exists.
 */
export function AutoMovieConstructionProfileSurface(
  source: IAutoMovieConstructionProfileSource,
  family: string,
  loop: IAutoMovieConstructionProfile.ILoop,
  piece: IAutoMovieConstructionProfile.IPiece,
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
  return {
    name: `${family}/${piece.id}`,
    domain,
    period,
    orientation: loop.surfaceOrientation ?? 1,
    point: (station: number, phase: number): [number, number, number] => {
      const local: IAutoMovieConstructionProfileSource.Vector = curve.point(
        station,
        clock(station, phase),
      );
      pair(local);
      const frame: AutoMovieLoftFrame.IFrame = source.plane.axis.at(station);
      frameRow(frame);
      const point: [number, number, number] = [0, 1, 2].map(
        (k: number): number =>
          frame.origin[k]! + local[0] * frame.u[k]! + local[1] * frame.v[k]!,
      ) as [number, number, number];
      if (!point.every(Number.isFinite))
        fail("Original profile Point0 is not finite.");
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
      const world: ReturnType<typeof AutoMovieLoftWorldJet> =
        AutoMovieLoftWorldJet(scaled, rows);
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
    },
  };
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

/** Copy actual frame value/first/second operands without manufacturing absent data. */
function frameRow(frame: AutoMovieLoftFrame.IFrame): number[] {
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

/** Actual affine clock scaling applies only to the corresponding derivative order. */
function scale(
  value: IAutoMovieConstructionProfileSource.Vector,
  factor: number,
): IAutoMovieConstructionProfileSource.Vector {
  return [factor * value[0], factor * value[1]];
}

/** Numerical/unavailable admission leaves exceptions from original owners unchanged. */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}
