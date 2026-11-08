import type { IAutoMovieConstructionOutlineRange } from "@automovie/interface";

import type { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";
import { rootsAutoMovieViewPolynomial } from "./rootsAutoMovieViewPolynomial";

/**
 * Explicit C2 source jets and sufficient scalar-range filtering of shared quintic Hermite knot jets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States normalized source-jet units, sufficient hull filtering, extension limits and its explicit flattening convention.
 * @evidence contracts/development/design.md#principled-representation Represents Explicit C2 source jets and sufficient scalar-range filtering of shared quintic Hermite knot jets: companion namespace of 8 members (`ICurve`, `create`, `value`, `derivative`, `read`, `critical`, ...); units and frames named in its text: second, degree, local, byte. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieViewHermite` in packages/engine/src/geometry/construction/AutoMovieViewHermite.ts; its surface is the 8 members listed and the text shows 9 other files naming it, mostly packages/human (6), packages/engine (2), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieViewHermite {
  /**
   * Prepared spans in the selected unnormalized source parameter.
   *
   * @evidence contracts/development/design.md#principled-representation Retains one shared first/second jet per source knot and fixed-degree coefficients on each positive interval.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Existing abscissae/ordinates and three derived arrays suffice for all source reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds no emitted sections or fitted source points.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish parameter jets from normalized per-span polynomial coefficients.
   */
  export interface ICurve {
    /** Source parameter knots, shared with the owning admitted natural source. */
    xs: readonly number[];
    /** Source values, shared with the same owner. */
    ys: readonly number[];
    /** First derivatives in the selected source parameter at every knot. */
    first: readonly number[];
    /** Second derivatives in that same parameter at every knot. */
    second: readonly number[];
    /** Increment coefficients c1..c5 on each unit span, with the left source value as c0. */
    coefficients: readonly (readonly number[])[];
  }

  /**
   * Admit requested normalized source jets and an optional sufficient scalar hull bound.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Converts normalized jets by the whole parameter span and retains natural components for nulls; a node shares both derivatives across incident quintics. Each unauthored natural jet starts at its largest linear-constraint factor in [0,1]; at most 64 inward adjacent binary64 factors resolve rounded control arithmetic, otherwise preparation reports representability failure.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One linear preparation produces coefficients or a named source failure, with no alternate curve after refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range knots, nonfinite jets/arithmetic and conflicting authored hulls are explicit failures; a zero factor is a documented flattening convention, not a least-bending claim.
   * @evidence contracts/development/common.md#meaningful-documentation States jet normalization, null components, sufficient hull semantics and closed-knot-span scope.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear passes derive natural jets, admit four controls per knot with at most 64 adjacent-factor rounding attempts, and build fixed-degree coefficients; no per-knot spline scan is repeated.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the admitted natural curvature solve and stores one final jet/coefficient preparation for all value, derivative and critical reads.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Successful sources own O(n) arrays; failed local preparation is released and no global cache retains input records.
   */
  export function create(
    spline: AutoMovieNaturalSpline.ISpline,
    knots: readonly IAutoMovieViewPart.IKnot[],
    range: IAutoMovieConstructionOutlineRange | undefined,
  ): ICurve | string {
    const { xs, ys, curvatures }: AutoMovieNaturalSpline.ISpline = spline;
    const n: number = xs.length;
    const span: number = xs[n - 1]! - xs[0]!;
    const first: number[] = [];
    const second: number[] = [];
    if (!(Number.isFinite(span) && span > 0))
      return "normalized source jets need a finite positive whole parameter span";
    if (
      range !== undefined &&
      ((range.minimum !== null && !Number.isFinite(range.minimum)) ||
        (range.maximum !== null && !Number.isFinite(range.maximum)) ||
        (range.minimum !== null &&
          range.maximum !== null &&
          range.minimum > range.maximum))
    )
      return "source range needs finite ordered bounds or null unbounded sides";
    const minimum: number = range?.minimum ?? -Infinity;
    const maximum: number = range?.maximum ?? Infinity;
    for (let i: number = 0; i < n; i++) {
      if (ys[i]! < minimum || ys[i]! > maximum)
        return `source knot ${knots[i]!.site}=${ys[i]} is outside its declared range [${minimum}, ${maximum}]`;
      const k: number = i + 1 < n ? i : i - 1;
      const h: number = xs[k + 1]! - xs[k]!;
      const natural: number =
        (ys[k + 1]! - ys[k]!) / h -
        (h * (2 * curvatures[k]! + curvatures[k + 1]!)) / 6 +
        (i + 1 < n ? 0 : (h * (curvatures[k]! + curvatures[k + 1]!)) / 2);
      const jet: IAutoMovieViewPart.IKnot["jet"] = knots[i]!.jet;
      if (
        jet !== undefined &&
        ![jet.first, jet.second].every(
          (v: number | null): boolean => v === null || Number.isFinite(v),
        )
      )
        return `source knot ${knots[i]!.site} has a nonfinite authored jet`;
      first.push(
        jet?.first === null || jet?.first === undefined
          ? natural
          : jet.first / span,
      );
      second.push(
        jet?.second === null || jet?.second === undefined
          ? curvatures[i]!
          : jet.second / span / span,
      );
      if (![first[i]!, second[i]!].every(Number.isFinite))
        return `source knot ${knots[i]!.site} has an unrepresentable parameter jet`;
    }
    for (let i: number = 0; range !== undefined && i < n; i++) {
      const displacement: number[] = [];
      for (const sign of [-1, 1]) {
        const neighbour: number = i + sign;
        if (neighbour < 0 || neighbour >= n) continue;
        const h: number = Math.abs(xs[neighbour]! - xs[i]!);
        displacement.push(
          (sign * h * first[i]!) / 5,
          (sign * 2 * h * first[i]!) / 5 + (h * (h * second[i]!)) / 20,
        );
      }
      if (!displacement.every(Number.isFinite))
        return `source knot ${knots[i]!.site} has unrepresentable Bezier controls`;
      const authored: boolean =
        knots[i]!.jet !== undefined &&
        (knots[i]!.jet!.first !== null || knots[i]!.jet!.second !== null);
      let factor: number = 1;
      for (const d of displacement)
        factor = Math.min(
          factor,
          d > 0 ? (maximum - ys[i]!) / d : d < 0 ? (minimum - ys[i]!) / d : 1,
        );
      if (authored && factor < 1)
        return `source knot ${knots[i]!.site}: authored jet has no admitted range control hull; this sufficient hull refusal does not prove an actual curve violation`;

      // The parameter jets are multiplied before the control arithmetic;
      // recheck that actual arithmetic rather than assuming associativity.
      const inside: (f: number) => boolean = (f: number): boolean => {
        for (const sign of [-1, 1]) {
          const neighbour: number = i + sign;
          if (neighbour < 0 || neighbour >= n) continue;
          const h: number = Math.abs(xs[neighbour]! - xs[i]!);
          const m: number = first[i]! * f;
          const a: number = second[i]! * f;
          const controls: number[] = [
            ys[i]! + (sign * h * m) / 5,
            ys[i]! + (sign * 2 * h * m) / 5 + (h * (h * a)) / 20,
          ];
          if (
            !controls.every(
              (v: number): boolean =>
                Number.isFinite(v) && v >= minimum && v <= maximum,
            )
          )
            return false;
        }
        return true;
      };
      for (
        let step: number = 0;
        !authored && !inside(factor) && step < 64;
        step++
      )
        factor = lower(factor);
      if (!inside(factor))
        return `source knot ${knots[i]!.site}: parameter jets have no representable in-range control hull within 64 inward binary64 steps`;
      first[i] = first[i]! * factor;
      second[i] = second[i]! * factor;
    }
    const coefficients: number[][] = [];
    for (let i: number = 0; i + 1 < n; i++) {
      const h: number = xs[i + 1]! - xs[i]!;
      const c1: number = h * first[i]!;
      const c2: number = (h * (h * second[i]!)) / 2;
      const a: number = ys[i + 1]! - ys[i]! - c1 - c2;
      const b: number = h * first[i + 1]! - c1 - 2 * c2;
      const c: number = h * (h * second[i + 1]!) - 2 * c2;
      const polynomial: number[] = [
        c1,
        c2,
        10 * a - 4 * b + c / 2,
        -15 * a + 7 * b - c,
        6 * a - 3 * b + c / 2,
      ];
      if (!polynomial.every(Number.isFinite))
        return `source interval ${i} has unrepresentable quintic coefficients`;
      coefficients.push(polynomial);
    }
    return { xs, ys, first, second, coefficients };
  }

  /**
   * Scalar value, with the endpoint tangent beyond the closed source knot span.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the unique admitted Hermite polynomial on a span and its first-order parameter tangent outside the source knots.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A value-only query allocates no derivative or reading record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Returns the original exact knot ordinate at a knot and never clamps a range or extension value.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the closed-span hull guarantee from open tangent extension.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(log n) span search plus constant Horner arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads already prepared coefficients and endpoint jets.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no query state.
   */
  export function value(curve: ICurve, x: number): number {
    const last: number = curve.xs.length - 1;
    if (x <= curve.xs[0]!)
      return curve.ys[0]! + (x - curve.xs[0]!) * curve.first[0]!;
    if (x >= curve.xs[last]!)
      return curve.ys[last]! + (x - curve.xs[last]!) * curve.first[last]!;
    const k: number = interval(curve.xs, x);
    if (x === curve.xs[k]!) return curve.ys[k]!;
    const t: number = (x - curve.xs[k]!) / (curve.xs[k + 1]! - curve.xs[k]!);
    const c: readonly number[] = curve.coefficients[k]!;
    return (
      curve.ys[k]! +
      t * (c[0]! + t * (c[1]! + t * (c[2]! + t * (c[3]! + t * c[4]!))))
    );
  }

  /**
   * First/second derivatives in the selected source parameter.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Differentiates the same quintic polynomial analytically, retaining the shared authored knot jets and zero second derivative on tangent extension.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One two-number result supplies the outline's existing station chain rule.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses no finite differences or fabricated endpoint jet; derivatives outside the knot span belong to the stated tangent extension.
   * @evidence contracts/development/common.md#meaningful-documentation States derivative parameter and extension behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(log n) search and two constant-degree Horner evaluations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the prepared shared jets and coefficients.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one pair and retains no query state.
   */
  export function derivative(curve: ICurve, x: number): [number, number] {
    const last: number = curve.xs.length - 1;
    if (x < curve.xs[0]!) return [curve.first[0]!, 0];
    if (x > curve.xs[last]!) return [curve.first[last]!, 0];
    const k: number = interval(curve.xs, x);
    if (x === curve.xs[k]!) return [curve.first[k]!, curve.second[k]!];
    if (x === curve.xs[last]!) return [curve.first[last]!, curve.second[last]!];
    const h: number = curve.xs[k + 1]! - curve.xs[k]!;
    const t: number = (x - curve.xs[k]!) / h;
    const c: readonly number[] = curve.coefficients[k]!;
    return [
      (c[0]! +
        t * (2 * c[1]! + t * (3 * c[2]! + t * (4 * c[3]! + t * 5 * c[4]!)))) /
        h,
      (2 * c[1]! + t * (6 * c[2]! + t * (12 * c[3]! + t * 20 * c[4]!))) / h / h,
    ];
  }

  /**
   * Value and both parameter derivatives from one selected original span.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the identical prepared quintic Horner expressions and authored knot jets as value/derivative, including each original endpoint and exterior tangent rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup supplies a consumer that needs all three values; the separate scalar/derivative APIs remain available.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No new polynomial, clamp, finite-difference derivative, failed-value replacement or retained query is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation Returns value, first and second derivatives in the source parameter, with the existing NaN/infinite-input arithmetic.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(log n) search and the existing constant-degree Horner expressions replace two searches in a combined consumer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the same span, normalized coordinate and coefficients for value and both derivatives within this query; no generic algebra callbacks or cross-input cache are involved.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh three-number tuple and retains no input, cursor or query state.
   */
  export function read(curve: ICurve, x: number): [number, number, number] {
    const last: number = curve.xs.length - 1;
    if (x <= curve.xs[0]!)
      return [
        curve.ys[0]! + (x - curve.xs[0]!) * curve.first[0]!,
        curve.first[0]!,
        x < curve.xs[0]! ? 0 : curve.second[0]!,
      ];
    if (x >= curve.xs[last]!)
      return [
        curve.ys[last]! + (x - curve.xs[last]!) * curve.first[last]!,
        curve.first[last]!,
        x > curve.xs[last]! ? 0 : curve.second[last]!,
      ];
    const k: number = interval(curve.xs, x);
    if (x === curve.xs[k]!)
      return [curve.ys[k]!, curve.first[k]!, curve.second[k]!];
    const h: number = curve.xs[k + 1]! - curve.xs[k]!;
    const t: number = (x - curve.xs[k]!) / h;
    const c: readonly number[] = curve.coefficients[k]!;
    return [
      curve.ys[k]! +
        t * (c[0]! + t * (c[1]! + t * (c[2]! + t * (c[3]! + t * c[4]!)))),
      (c[0]! +
        t * (2 * c[1]! + t * (3 * c[2]! + t * (4 * c[3]! + t * 5 * c[4]!)))) /
        h,
      (2 * c[1]! + t * (6 * c[2]! + t * (12 * c[3]! + t * 20 * c[4]!))) / h / h,
    ];
  }

  /**
   * Additional isolated zero-slope parameters strictly inside each source span.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads every quintic derivative polynomial through the bounded-degree monotone-partition root owner, excluding named knots and constant spans.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Produces only additional source observations for the existing knot-plus-critical renderer workflow.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not infer extrema from emitted sections or assert interval certification for binary64 roots.
   * @evidence contracts/development/common.md#meaningful-documentation States root meaning, excluded knots and the numerical observation limit.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n) spans with bounded degree-four root work; near-zero partition candidates can add observations beyond the four mathematical roots, with at most fifteen candidates per span from the bounded recursion.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One inspection reads a fixed prepared source; the caller can retain its resulting sampling stations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The invocation-local output holds at most fifteen binary64 candidates per source span and retains no additional source owner.
   */
  export function critical(curve: ICurve): number[] {
    return curve.coefficients.flatMap(
      (c: readonly number[], i: number): number[] => {
        const scale: number = Math.max(...c.map(Math.abs));
        return scale === 0
          ? []
          : rootsAutoMovieViewPolynomial(
              c.map((v: number, j: number): number => (j + 1) * (v / scale)),
            ).map(
              (t: number): number =>
                curve.xs[i]! + t * (curve.xs[i + 1]! - curve.xs[i]!),
            );
      },
    );
  }

  /** Binary search in an admitted increasing knot list; outside queries use an end interval. No query state survives. */
  function interval(xs: readonly number[], x: number): number {
    let lo: number = 0;
    let hi: number = xs.length - 1;
    while (hi - lo > 1) {
      const middle: number = (lo + hi) >> 1;
      if (xs[middle]! <= x) lo = middle;
      else hi = middle;
    }
    return lo;
  }

  /** The adjacent smaller nonnegative binary64 factor; an eight-byte local view is released immediately and no scalar ordinate is changed. */
  function lower(factor: number): number {
    if (factor === 0) return 0;
    const bits: DataView = new DataView(new ArrayBuffer(8));
    bits.setFloat64(0, factor, false);
    bits.setBigUint64(0, bits.getBigUint64(0, false) - 1n, false);
    return bits.getFloat64(0, false);
  }
}
