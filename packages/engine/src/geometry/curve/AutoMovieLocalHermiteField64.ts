import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieBernsteinGrid64 as G } from "./AutoMovieBernsteinGrid64";
import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";
import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
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
   * Exact analytic cell; rows run along station t, columns along normalized phase u.
   *
   * @evidence contracts/development/design.md#principled-representation Four complete cubic rows retain the local tensor coefficients in millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Phase extent accompanies its coefficient grid.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No sample or source topology substitutes for coefficients.
   * @evidence contracts/development/common.md#meaningful-documentation States grid direction and units.
   */
  export type Cell = {
    /** First normalized course phase. */
    u0: number;
    /** Last normalized course phase, strictly greater than u0. */
    u1: number;
    /** Millimetre bicubic coefficient rows, station first and course second. */
    grid: B.Grid;
  };

  /**
   * Millimetre position and full partials per normalized phase and physical station mm.
   *
   * @evidence contracts/development/design.md#principled-representation Complete evaluated first derivatives retain their chart scale.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One jet supplies positions and analytic normals.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Partials are not unit tangent hints.
   * @evidence contracts/development/common.md#meaningful-documentation States units of both independent parameters.
   */
  export type Jet = {
    /** Source curve position in millimetres. */
    position: B.Vec;
    /** Derivative per normalized course phase, millimetres. */
    coursePartial: B.Vec;
    /** Derivative per physical station millimetre. */
    stationPartial: B.Vec;
  };

  /**
   * Admitted field closures. Inputs must stay immutable until the caller releases this
   * object; only partitions and derivative weights are retained in addition to inputs.
   *
   * @evidence contracts/development/design.md#principled-representation Interval cells use at most four contributing courses and station jets use the same fixed derivative weights.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two operations expose analytic cells and authoritative station-edge jets.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shared boundaries are evaluated from the original course rather than adjacent rounded restrictions.
   * @evidence contracts/development/common.md#meaningful-documentation States immutable lifetime and right-sided knot derivatives, with the final endpoint left-sided.
   */
  export type Prepared = {
    /**
     * Increasing local phase cells for one admitted physical station interval.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Exact restrictions and fixed physical derivative weights construct bicubic cells from admitted courses.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One interval address returns caller-owned coefficient cells without observation or topology inference.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source face, sampled replacement curve or limiter changes the prepared field.
     * @evidence contracts/development/common.md#meaningful-documentation The prepared owner states station indexing, millimetres, immutable course lifetime and unsupported geometric guarantees.
     * @evidence contracts/development/implementation.md#efficient-algorithms Work sorts the at-most-four incident course partitions and performs constant-degree restriction per resulting cell.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Admitted partitions and station derivative weights are reused by every interval call.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh cell arrays belong to the caller; no additional process-wide state is retained.
     */
    interval: (index: number) => Cell[];
    /**
     * Authoritative saved-course value and right-sided partials; u=1 uses the left span.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The stored course evaluates position once while the same physical station stencil supplies its transverse derivative.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One normalized phase query returns a complete analytic jet from the prepared field.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unit tangent hints, source normals and coordinate-based neighbor matching do not supply derivatives.
     * @evidence contracts/development/common.md#meaningful-documentation States one-sided knot convention, physical versus normalized derivatives and saved-curve authority.
     * @evidence contracts/development/implementation.md#efficient-algorithms Binary span lookup and constant-degree evaluation visit at most four incident course spans.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepared partitions and physical derivative weights serve every station query.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned jet is newly owned and no query cache or source mesh is retained.
     */
    station: (index: number, u: number) => Jet;
  };

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
    courses: readonly C.Cubic[],
    interpolation: "quadratic" | "ruled" = "quadratic",
  ): Prepared {
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
    const knots: number[][] = courses.map((course: C.Cubic): number[] => {
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
    });
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
    const coefficients: (j: number, k: number) => B.Poly = (
      j: number,
      k: number,
    ): B.Poly =>
      courses[j]!.spans[k]!.map((p: C.Vector): B.Vec => [p[0], p[1], p[2]]);
    const combine: (j: number, values: Map<number, B.Poly>) => B.Poly = (
      j: number,
      values: Map<number, B.Poly>,
    ): B.Poly => {
      const out: B.Poly = Array.from({ length: 4 }, (): B.Vec => [0, 0, 0]);
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
      interval: (index: number): Cell[] => {
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
        return partition.slice(0, -1).map((a: number, k: number): Cell => {
          const b: number = partition[k + 1]!,
            values: Map<number, B.Poly> = new Map();
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
          const first: B.Poly = values.get(index)!,
            last: B.Poly = values.get(index + 1)!;
          const grid: B.Grid =
            interpolation === "ruled"
              ? [
                  first,
                  first.map(
                    (p: B.Vec, c: number): B.Vec => V.mix(p, last[c]!, 1 / 3),
                  ),
                  first.map(
                    (p: B.Vec, c: number): B.Vec => V.mix(p, last[c]!, 2 / 3),
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
            grid.some((row: B.Poly): boolean =>
              row.some((p: B.Vec): boolean => !p.every(Number.isFinite)),
            )
          )
            throw new Error("Unresolved local Hermite coefficients");
          return { u0: a, u1: b, grid };
        });
      },
      station: (index: number, u: number): Jet => {
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= count ||
          !Number.isFinite(u) ||
          u < 0 ||
          u > 1
        )
          throw new Error("Station jet outside admitted chart");
        const point: (j: number) => B.Vec = (j: number): B.Vec => {
          const k: number = locate(j, u),
            width: number = knots[j]![k + 1]! - knots[j]![k]!;
          return B.value(coefficients(j, k), (u - knots[j]![k]!) / width);
        };
        const k: number = locate(index, u),
          width: number = knots[index]![k + 1]! - knots[index]![k]!,
          stationPartial: B.Vec = [0, 0, 0];
        if (interpolation === "ruled") {
          const incident: number = Math.min(index, count - 2),
            first: B.Vec = point(incident),
            last: B.Vec = point(incident + 1);
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
        const evaluated: Map<number, B.Vec> = new Map();
        for (const { interval, factor } of stencils[index]!) {
          for (const j of [interval, interval + 1])
            if (!evaluated.has(j)) evaluated.set(j, point(j));
          const a: B.Vec = evaluated.get(interval)!,
            b: B.Vec = evaluated.get(interval + 1)!;
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
