import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import type { AutoMovieConicHermite } from "./AutoMovieConicHermite";
import type { AutoMovieViewConic } from "./AutoMovieViewConic";

/** Eight invocation-local endpoint values, indexed by their guide and side. */
interface Own<T> {
  /** Curvature from the previous quarter's reflected final end. */
  before: T[];

  /** Curvature from the next quarter's initial end. */
  after: T[];
}

/**
 * Internal conic assembly shared by the existing public preparation wrappers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes generic callback effects from the fixed pure AD caller and states temporary ownership.
 * @evidence contracts/development/design.md#principled-representation Represents Internal conic assembly shared by the existing public preparation wrappers: companion namespace of 6 members (`source`, `curvatures`, `geometry`, `end`, `policy`, `build`); units and frames named in its text: local, rational. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConicPreparation` in packages/engine/src/geometry/construction/AutoMovieConicPreparation.ts; its surface is the 6 members listed and the text shows 3 other files naming it, mostly packages/engine (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieConicPreparation {
  /**
   * Prepare copied station tuples with the fixed pure source-Hessian algebra.
   * The caller supplies fresh ordinary numerical tuples from fromStation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same AD policy and end arithmetic; own curvature tuples are unchanged inputs to the same G2 formula.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This internal fixed-algebra entry is the sole optimized assembly path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not accept or reuse arbitrary effectful algebra callbacks, change admission or create a geometry fallback.
   * @evidence contracts/development/common.md#meaningful-documentation Requires copied station tuples and distinguishes auxiliary selected curvature jets from derivatives of min at a tie.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight endpoint computations and eight constant-size end assemblies; no integration, source traversal or native partition.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The before/after tuples calculated for this call's shared guides also supply its own endpoint curvature, with the same operands and operation order.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Own arrays retain eight tuple references only through synchronous assembly; returned quarter controls remain caller-owned.
   */
  export function source(
    extents: readonly AutoMovieConicFieldJet.IJet[],
    shoulders: readonly AutoMovieConicFieldJet.IJet[],
  ): AutoMovieViewConic.ICurve<AutoMovieConicFieldJet.IJet> {
    const own: Own<AutoMovieConicFieldJet.IJet> = { before: [], after: [] };
    const ops: AutoMovieConicFieldJet.IAlgebra<AutoMovieConicFieldJet.IJet> =
      AutoMovieConicFieldJet.AD;
    const shared: [
      AutoMovieConicFieldJet.IJet,
      AutoMovieConicFieldJet.IJet,
      AutoMovieConicFieldJet.IJet,
      AutoMovieConicFieldJet.IJet,
    ] = policy(ops, extents, shoulders, own);
    return build(ops, extents, shoulders, shared, own);
  }

  /**
   * Preserve independent generic guide calculations and callback order.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Computes previous then next own curvature at each guide, selecting the previous value on a primal tie exactly as before.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The existing public curvature wrapper delegates to one policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No own tuple reuse crosses public calls or user-supplied algebra effects.
   * @evidence contracts/development/common.md#meaningful-documentation Values have inverse source-length units and auxiliary tie jets do not differentiate min.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight endpoint calculations and four constant-time primal selections.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the formula with source while keeping each generic invocation independent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns four scalars and allocates no own-curvature retention arrays.
   */
  export function curvatures<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
  ): [T, T, T, T] {
    return policy(ops, extents, shoulders, null);
  }

  /**
   * Preserve public generic quarter admission and end callback sequencing.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original finite-positive admission and prepares start then end before selecting either named failure.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The public geometry wrapper delegates without supplying cached endpoint values.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Arbitrary algebra callbacks still compute every own end independently and original thrown values propagate.
   * @evidence contracts/development/common.md#meaningful-documentation Shared curvatures remain caller-supplied inverse-length values; failure releases partial quarters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight constant-size own/end preparations after a fixed input scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the sole assembly formula, without sharing effectful calls across operations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns four fixed-size caller-owned quarters or an empty named failure; no local state survives separately.
   */
  export function geometry<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
    curvatures: readonly T[],
  ): AutoMovieViewConic.ICurve<T> {
    return build(ops, extents, shoulders, curvatures, null);
  }

  /**
   * Apply the existing G2 formula to the own curvature computed by this invocation.
   * Internal callers either just computed own or use source's fixed pure AD plan.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the original quadratic subdivision, rational cubic weights, finite-positive admission and exact null branch for equal shared/own curvature.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One end formula serves public independent preparation and call-local source reuse.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The internal own argument is not a public admission bypass; public prepare computes it and source passes the same pure formula result.
   * @evidence contracts/development/common.md#meaningful-documentation Extents use one length unit; own/shared are inverse lengths, r is dimensionless, null means unchanged and a string is original admission failure.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic, fixed four controls/weights and one cube root after the supplied endpoint calculation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same own value serves admission, ratio and contrast; only source shares its prior pure endpoint calculation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fixed local temporaries die on return or throw; a successful patch owns its controls and weights.
   */
  export function end<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    a: T,
    b: T,
    r: T,
    shared: T,
    own: T,
  ): AutoMovieConicHermite.IPatch<T> | string | null {
    if (
      ![a, b, own, shared].every(
        (value: T): boolean =>
          Number.isFinite(ops.value(value)) && ops.value(value) > 0,
      ) ||
      !(
        ops.value(r) > 0 &&
        ops.value(r) < 1 &&
        ops.value(shared) <= ops.value(own)
      )
    )
      return "G2 conic end needs finite positive extents/curvatures and shared curvature no greater than own";
    if (ops.value(shared) === ops.value(own)) return null;

    const one: T = ops.constant(1);
    const two: T = ops.constant(2);
    const tau: T = ops.divide(shared, own);
    const contrast: T = ops.divide(ops.subtract(own, shared), own);
    const scale: T = AutoMovieConicArcField.norm(ops, a, b);
    const A: T = ops.divide(a, scale);
    const B: T = ops.divide(b, scale);
    const budget: T = ops.divide(
      ops.multiply(ops.multiply(ops.constant(1e-7), A), B),
      ops.add(A, B),
    );
    const x: T = ops.sqrt(ops.divide(budget, ops.constant(4)));
    const native: T = ops.multiply(
      ops.divide(x, ops.add(one, ops.multiply(two, x))),
      contrast,
    );
    const u: T = ops.subtract(one, native);
    const w: T = AutoMovieConicArcField.weight(ops, r);
    const middleTerm: T = ops.multiply(
      ops.multiply(ops.multiply(two, w), native),
      u,
    );
    const denominator: T = ops.add(
      ops.add(ops.multiply(u, u), middleTerm),
      ops.multiply(native, native),
    );
    const firstWeight: T = ops.add(u, ops.multiply(w, native));
    const middle: T = ops.divide(firstWeight, ops.sqrt(denominator));
    const divisor: T = ops.add(one, ops.multiply(two, middle));
    const elevated: T = ops.divide(divisor, ops.constant(3));
    const vertical: T = ops.add(ops.multiply(ops.multiply(two, w), u), native);
    const p: T = ops.divide(
      ops.multiply(w, denominator),
      ops.multiply(firstWeight, vertical),
    );
    const root: T = ops.cbrt(tau);
    const deficit: T = ops.divide(
      ops.multiply(ops.multiply(a, native), native),
      denominator,
    );
    const height: T = ops.divide(
      ops.multiply(ops.multiply(b, native), vertical),
      denominator,
    );
    const weightedP: T = ops.multiply(ops.multiply(two, middle), p);
    const points: readonly (readonly [T, T])[] = [
      [ops.constant(0), ops.constant(0)],
      [ops.constant(0), ops.divide(weightedP, divisor)],
      [ops.divide(one, divisor), ops.divide(ops.add(weightedP, one), divisor)],
      [one, one],
    ];
    const weights: readonly T[] = [
      one,
      ops.divide(elevated, ops.multiply(root, root)),
      ops.divide(elevated, root),
      one,
    ];
    const angle: number = Math.atan2(
      ops.value(height),
      ops.value(ops.subtract(a, deficit)),
    );
    if (
      ![native, deficit, height, ...weights].every(
        (value: T): boolean =>
          Number.isFinite(ops.value(value)) && ops.value(value) > 0,
      ) ||
      !(Number.isFinite(angle) && angle > 0) ||
      !points
        .flat()
        .every((value: T): boolean => Number.isFinite(ops.value(value))) ||
      !(
        ops.value(p) > 0 &&
        ops.value(p) < 1 &&
        ops.value(points[1]![1]) > 0 &&
        ops.value(points[1]![1]) < ops.value(points[2]![1]) &&
        ops.value(points[2]![1]) < 1 &&
        ops.value(points[2]![0]) > 0 &&
        ops.value(points[2]![0]) < 1 &&
        ops.value(deficit) < ops.value(a)
      )
    )
      return "G2 conic end has no finite positive native/angular extent or rational weights";
    return {
      extent: a,
      deficit,
      height,
      native,
      angle,
      curvature: shared,
      points,
      weights,
    };
  }

  /** Retain own values only for the fixed-AD assembly; generic calls preserve their original effects. */
  function policy<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
    own: Own<T> | null,
  ): [T, T, T, T] {
    return [0, 1, 2, 3].map((g: number): T => {
      const before: number = (g + 3) % 4;
      const a: T = AutoMovieConicArcField.curvature(
        ops,
        extents[g]!,
        extents[before]!,
        shoulders[before]!,
      );
      const b: T = AutoMovieConicArcField.curvature(
        ops,
        extents[g]!,
        extents[(g + 1) % 4]!,
        shoulders[g]!,
      );
      if (own !== null) {
        own.before.push(a);
        own.after.push(b);
      }
      return Number.isNaN(ops.value(a)) || Number.isNaN(ops.value(b))
        ? ops.constant(NaN)
        : ops.value(a) <= ops.value(b)
          ? a
          : b;
    }) as [T, T, T, T];
  }

  /** Build one invocation's quarters; null own preserves independent generic end calculations. */
  function build<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
    curvatures: readonly T[],
    own: Own<T> | null,
  ): AutoMovieViewConic.ICurve<T> {
    if (
      extents.length !== 4 ||
      shoulders.length !== 4 ||
      curvatures.length !== 4 ||
      !extents.every(
        (v: T): boolean => Number.isFinite(ops.value(v)) && ops.value(v) > 0,
      ) ||
      !shoulders.every(
        (v: T): boolean =>
          Number.isFinite(ops.value(v)) && ops.value(v) > 0 && ops.value(v) < 1,
      ) ||
      !curvatures.every(
        (v: T): boolean => Number.isFinite(ops.value(v)) && ops.value(v) > 0,
      )
    )
      return {
        quarters: [],
        failure:
          "conic quarters need four finite positive extents/curvatures and shoulders inside (0,1)",
      };
    const quarters: AutoMovieViewConic.IQuarter<T>[] = [];
    for (let q: number = 0; q < 4; q++) {
      const a: T = extents[q]!;
      const b: T = extents[(q + 1) % 4]!;
      const r: T = shoulders[q]!;
      const start: AutoMovieConicHermite.IPatch<T> | string | null =
        AutoMovieConicPreparation.end(
          ops,
          a,
          b,
          r,
          curvatures[q]!,
          own === null
            ? AutoMovieConicArcField.curvature(ops, a, b, r)
            : own.after[q]!,
        );
      const end: AutoMovieConicHermite.IPatch<T> | string | null =
        AutoMovieConicPreparation.end(
          ops,
          b,
          a,
          r,
          curvatures[(q + 1) % 4]!,
          own === null
            ? AutoMovieConicArcField.curvature(ops, b, a, r)
            : own.before[(q + 1) % 4]!,
        );
      if (typeof start === "string" || typeof end === "string")
        return {
          quarters: [],
          failure: `quarter ${q}: ${typeof start === "string" ? start : end}`,
        };

      // A positive local support can be smaller than one global-angle ulp.
      // It is still a valid rational piece: keep its native length and exact
      // guide jet. A rounded global query outside it reads the original conic.
      const guides: [T, T] = [
        ops.subtract(a, ops.multiply(ops.multiply(curvatures[q]!, a), a)),
        ops.subtract(
          b,
          ops.multiply(ops.multiply(curvatures[(q + 1) % 4]!, b), b),
        ),
      ];
      if (!guides.every((v: T): boolean => Number.isFinite(ops.value(v))))
        return {
          quarters: [],
          failure: `quarter ${q}: shared guide jet is not finitely representable`,
        };
      quarters.push({
        extents: [a, b],
        shoulder: r,
        start,
        end,
        guides,
        parameters: [],
        curvatures: [curvatures[q]!, curvatures[(q + 1) % 4]!],
      });
    }
    return { quarters, failure: null };
  }
}
