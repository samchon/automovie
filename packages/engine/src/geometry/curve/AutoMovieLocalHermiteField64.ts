import type {
  AutoMovieBernsteinGrid64,
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieLocalHermiteField64,
} from "@automovie/interface";

import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieBernsteinGrid64 as G } from "./AutoMovieBernsteinGrid64";
import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";
import { compileAutoMovieNormalizedPhases64 } from "./compileAutoMovieNormalizedPhases64";

/**
 * Local physical-station cubic Hermite fields from complete normalized open courses.
 * Fixed linear nonuniform quadratic derivative stencils commute with exact Bernstein
 * restriction. This is a different field from coefficientwise monotone PCHIP: scalar
 * overshoot, zero Jacobians and intersections remain possible. The explicit ruled
 * alternative uses two-course convex interpolation with station C0 only. Source corners survive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents physical derivatives, partition invariance, mutable-input lifetime and unsupported geometric guarantees.
 * @evidence contracts/development/design.md#principled-representation Represents Local physical-station cubic Hermite fields from complete normalized open courses: companion namespace of 4 members (`Cell`, `Jet`, `Prepared`, `prepare`); units and frames named in its text: local, second, degree. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLocalHermiteField64` in packages/engine/src/geometry/curve/AutoMovieLocalHermiteField64.ts; its surface is the 4 members listed and the text shows 6 other files naming it, mostly packages/engine (3), test (2), packages/recovery (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieLocalHermiteField64 {
  /**
   * Admit continuous open cubic courses and prepare linear physical derivative weights.
   * Source curves must already share a normalized correspondence chart and orientation.
   * Interior derivatives use the nonuniform quadratic stencil; endpoints use unclipped
   * one-sided quadratic derivatives, or the common secant for exactly two courses.
   * This preserves station positions and physical dP/ds, not monotonicity or injectivity.
   * Explicit ruled interpolation instead uses only the two incident courses and their
   * convex blend. Its station jet chooses the right incident secant, or the last left
   * secant, as one normal authority; station continuity is C0 rather than C1.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Quadratic mode uses fixed nonuniform physical secant stencils before Hermite construction. Ruled mode directly elevates the two-course convex blend to a bicubic tensor; exact restriction commutes with both definitions before binary64 rounding.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A single admitted partition and derivative stencil per station feed local cells and authoritative edge jets.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No anatomical branch, source point copying, tolerance repair or nonlinear limiter is used.
   * @evidence contracts/development/common.md#meaningful-documentation States immutable source lifetime, normalized correspondence, physical units, one-sided corner behavior and geometric limitations.
   * @evidence contracts/development/implementation.md#efficient-algorithms Admission is O(N+S); an interval sorts at most four course partitions in quadratic mode and two in ruled mode, then restricts each contributing curve per cell with logarithmic span lookup. Each input knot participates at most four times, without a global Cartesian partition.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Partitions and station-only derivative weights are prepared once; source station jets provide one shared authority to neighboring tessellation intervals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closures retain O(N+S) partitions, weights and caller-owned source references; interval cells are fresh caller-owned arrays and no process-wide cache exists.
   */
  export function prepare(
    stations: readonly number[],
    courses: readonly IAutoMovieCubicBezierCurve64[],
    interpolation: "quadratic" | "ruled" = "quadratic",
  ): IAutoMovieLocalHermiteField64.Prepared {
    if (interpolation !== "quadratic" && interpolation !== "ruled")
      throw new Error(
        "An explicit supported station interpolation is required",
      );
    const count: number = courses.length;
    if (
      count < 2 ||
      stations.length !== count ||
      stations.some(
        (s: number, i: number): boolean =>
          !Number.isFinite(s) || (i > 0 && !(s > stations[i - 1]!)),
      )
    )
      throw new Error(
        "Increasing finite physical stations and corresponding courses required",
      );
    const knots: number[][] = courses.map(
      (course: IAutoMovieCubicBezierCurve64): number[] => {
        assertAutoMovieCurve64(course);
        if (
          course.type !== "cubicBezier" ||
          course.closed ||
          course.phaseUnit !== "normalized" ||
          course.unit !== "mm"
        )
          throw new Error("Open normalized millimetre cubic courses required");
        const out: number[] = compileAutoMovieNormalizedPhases64(
          course.phaseIntervals,
          course.spans.length,
        );
        for (let k: number = 1; k < course.spans.length; k++)
          if (
            course.spans[k - 1]![3].some(
              (x: number, axis: number): boolean =>
                x !== course.spans[k]![0][axis],
            )
          )
            throw new Error(
              "A source course must have continuous span endpoints",
            );
        return out;
      },
    );
    const h: number[] = stations
      .slice(1)
      .map((s: number, i: number): number => s - stations[i]!);
    if (h.some((x: number): boolean => !Number.isFinite(x)))
      throw new Error("Representable station widths required");
    const stencils: { interval: number; factor: number }[][] = stations.map(
      (_: number, j: number): { interval: number; factor: number }[] => {
        if (count === 2) return [{ interval: 0, factor: 1 }];
        const left: number = j === 0 ? 0 : j === count - 1 ? j - 2 : j - 1;
        const right: number = left + 1,
          scale: number = Math.max(h[left]!, h[right]!);
        // Equivalent dimensionless ratios avoid overflowing hLeft+hRight.
        const a: number = h[left]! / scale,
          b: number = h[right]! / scale;
        const leftShare: number = a / (a + b),
          rightShare: number = b / (a + b);
        return j === 0
          ? [
              { interval: left, factor: 1 + leftShare },
              { interval: right, factor: -leftShare },
            ]
          : j === count - 1
            ? [
                { interval: right, factor: 1 + rightShare },
                { interval: left, factor: -rightShare },
              ]
            : [
                { interval: left, factor: rightShare },
                { interval: right, factor: leftShare },
              ];
      },
    );
    const locate: (j: number, u: number) => number = (
      j: number,
      u: number,
    ): number => {
      let lo: number = 0,
        hi: number = knots[j]!.length - 2;
      while (lo < hi) {
        const m: number = Math.floor((lo + hi + 1) / 2);
        if (knots[j]![m]! <= u) lo = m;
        else hi = m - 1;
      }
      return lo;
    };
    const coefficients: (
      j: number,
      k: number,
    ) => AutoMovieBernsteinPolynomial64 = (
      j: number,
      k: number,
    ): AutoMovieBernsteinPolynomial64 =>
      courses[j]!.spans[k]!.map(
        (p: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple => [
          p[0],
          p[1],
          p[2],
        ],
      );
    const combine: (
      j: number,
      values: Map<number, AutoMovieBernsteinPolynomial64>,
    ) => AutoMovieBernsteinPolynomial64 = (
      j: number,
      values: Map<number, AutoMovieBernsteinPolynomial64>,
    ): AutoMovieBernsteinPolynomial64 => {
      const out: AutoMovieBernsteinPolynomial64 = Array.from(
        { length: 4 },
        (): AutoMovieVector3Tuple => [0, 0, 0],
      );
      // Form secants before weighting so a common spatial translation cancels first.
      for (const { interval, factor } of stencils[j]!)
        for (let k: number = 0; k < 4; k++)
          for (let axis: number = 0; axis < 3; axis++)
            out[k]![axis]! +=
              factor *
              ((values.get(interval + 1)![k]![axis]! -
                values.get(interval)![k]![axis]!) /
                h[interval]!);
      return out;
    };
    return {
      interval: (index: number): IAutoMovieLocalHermiteField64.Cell[] => {
        if (!Number.isInteger(index) || index < 0 || index >= count - 1)
          throw new Error("Station interval index outside field");
        const support: number[] =
          interpolation === "ruled"
            ? [index, index + 1]
            : [
                ...new Set([
                  index,
                  index + 1,
                  ...[...stencils[index]!, ...stencils[index + 1]!].flatMap(
                    (s: { interval: number; factor: number }): number[] => [
                      s.interval,
                      s.interval + 1,
                    ],
                  ),
                ]),
              ].sort((a: number, b: number): number => a - b);
        const partition: number[] = [
          ...new Set(support.flatMap((j: number): number[] => knots[j]!)),
        ].sort((a: number, b: number): number => a - b);
        return partition
          .slice(0, -1)
          .map((a: number, k: number): IAutoMovieLocalHermiteField64.Cell => {
            const b: number = partition[k + 1]!,
              values: Map<number, AutoMovieBernsteinPolynomial64> = new Map();
            for (const j of support) {
              const piece: number = locate(j, a),
                start: number = knots[j]![piece]!,
                width: number = knots[j]![piece + 1]! - start;
              values.set(
                j,
                S.restrict(
                  coefficients(j, piece),
                  (a - start) / width,
                  (b - start) / width,
                ),
              );
            }
            const first: AutoMovieBernsteinPolynomial64 = values.get(index)!,
              last: AutoMovieBernsteinPolynomial64 = values.get(index + 1)!;
            const grid: AutoMovieBernsteinGrid64 =
              interpolation === "ruled"
                ? [
                    first,
                    first.map(
                      (
                        p: AutoMovieVector3Tuple,
                        c: number,
                      ): AutoMovieVector3Tuple => V.mix(p, last[c]!, 1 / 3),
                    ),
                    first.map(
                      (
                        p: AutoMovieVector3Tuple,
                        c: number,
                      ): AutoMovieVector3Tuple => V.mix(p, last[c]!, 2 / 3),
                    ),
                    last,
                  ]
                : G.hermite(
                    first,
                    last,
                    combine(index, values),
                    combine(index + 1, values),
                    h[index]!,
                  );
            if (
              grid.some((row: AutoMovieBernsteinPolynomial64): boolean =>
                row.some(
                  (p: AutoMovieVector3Tuple): boolean =>
                    !p.every(Number.isFinite),
                ),
              )
            )
              throw new Error("Unresolved local Hermite coefficients");
            return { u0: a, u1: b, grid };
          });
      },
      station: (
        index: number,
        u: number,
      ): IAutoMovieLocalHermiteField64.Jet => {
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= count ||
          !Number.isFinite(u) ||
          u < 0 ||
          u > 1
        )
          throw new Error("Station jet outside admitted chart");
        const point: (j: number) => AutoMovieVector3Tuple = (
          j: number,
        ): AutoMovieVector3Tuple => {
          const k: number = locate(j, u),
            width: number = knots[j]![k + 1]! - knots[j]![k]!;
          return B.value(coefficients(j, k), (u - knots[j]![k]!) / width);
        };
        const k: number = locate(index, u),
          width: number = knots[index]![k + 1]! - knots[index]![k]!,
          stationPartial: AutoMovieVector3Tuple = [0, 0, 0];
        if (interpolation === "ruled") {
          const incident: number = Math.min(index, count - 2),
            first: AutoMovieVector3Tuple = point(incident),
            last: AutoMovieVector3Tuple = point(incident + 1);
          for (let axis: number = 0; axis < 3; axis++)
            stationPartial[axis] = (last[axis]! - first[axis]!) / h[incident]!;
          return {
            position: point(index),
            coursePartial: B.value(
              B.tangent(coefficients(index, k), 1 / width),
              (u - knots[index]![k]!) / width,
            ),
            stationPartial,
          };
        }
        const evaluated: Map<number, AutoMovieVector3Tuple> = new Map();
        for (const { interval, factor } of stencils[index]!) {
          for (const j of [interval, interval + 1])
            if (!evaluated.has(j)) evaluated.set(j, point(j));
          const a: AutoMovieVector3Tuple = evaluated.get(interval)!,
            b: AutoMovieVector3Tuple = evaluated.get(interval + 1)!;
          for (let axis: number = 0; axis < 3; axis++)
            stationPartial[axis]! +=
              factor * ((b[axis]! - a[axis]!) / h[interval]!);
        }
        return {
          position: point(index),
          coursePartial: B.value(
            B.tangent(coefficients(index, k), 1 / width),
            (u - knots[index]![k]!) / width,
          ),
          stationPartial,
        };
      },
    };
  }
}
