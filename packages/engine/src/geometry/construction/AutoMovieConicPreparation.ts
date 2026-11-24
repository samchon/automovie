import type {
  IAutoMovieConicFieldJet,
  IAutoMovieConicHermite,
  IAutoMovieViewConic,
} from "@automovie/interface";

import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";

/** Eight invocation-local endpoint values, indexed by their guide and side. */
interface Own<T> {
  /** Curvature from the previous quarter's reflected final end. */
  before: T[];

  /** Curvature from the next quarter's initial end. */
  after: T[];
}

/** Internal conic assembly shared by the existing public preparation wrappers. */
export namespace AutoMovieConicPreparation {
  /**
   * Prepare copied station tuples with the fixed pure source-Hessian algebra.
   * The caller supplies fresh ordinary numerical tuples from fromStation.
   */
  export function source(
    extents: readonly IAutoMovieConicFieldJet.IJet[],
    shoulders: readonly IAutoMovieConicFieldJet.IJet[],
  ): IAutoMovieViewConic.ICurve<IAutoMovieConicFieldJet.IJet> {
    const own: Own<IAutoMovieConicFieldJet.IJet> = { before: [], after: [] };
    const ops: IAutoMovieConicFieldJet.IAlgebra<IAutoMovieConicFieldJet.IJet> =
      AutoMovieConicFieldJet.AD;
    const shared: [
      IAutoMovieConicFieldJet.IJet,
      IAutoMovieConicFieldJet.IJet,
      IAutoMovieConicFieldJet.IJet,
      IAutoMovieConicFieldJet.IJet,
    ] = policy(ops, extents, shoulders, own);
    return build(ops, extents, shoulders, shared, own);
  }

  /** Preserve independent generic guide calculations and callback order. */
  export function curvatures<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
  ): [T, T, T, T] {
    return policy(ops, extents, shoulders, null);
  }

  /** Preserve public generic quarter admission and end callback sequencing. */
  export function geometry<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
    curvatures: readonly T[],
  ): IAutoMovieViewConic.ICurve<T> {
    return build(ops, extents, shoulders, curvatures, null);
  }

  /**
   * Apply the existing G2 formula to the own curvature computed by this
   * invocation. Internal callers either just computed own or use source's fixed
   * pure AD plan.
   */
  export function end<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    a: T,
    b: T,
    r: T,
    shared: T,
    own: T,
  ): IAutoMovieConicHermite.IPatch<T> | string | null {
    if (
      ![a, b, own, shared].every((value: T): boolean => ops.value(value) > 0) ||
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
        (value: T): boolean => ops.value(value) > 0,
      ) ||
      !(angle > 0) ||
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

  /**
   * Retain own values only for the fixed-AD assembly; generic calls preserve
   * their original effects.
   */
  function policy<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
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
      return ops.value(a) <= ops.value(b) ? a : b;
    }) as [T, T, T, T];
  }

  /**
   * Build one invocation's quarters; null own preserves independent generic end
   * calculations.
   */
  function build<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
    curvatures: readonly T[],
    own: Own<T> | null,
  ): IAutoMovieViewConic.ICurve<T> {
    if (
      extents.length !== 4 ||
      shoulders.length !== 4 ||
      curvatures.length !== 4 ||
      !extents.every((v: T): boolean => ops.value(v) > 0) ||
      !shoulders.every(
        (v: T): boolean => ops.value(v) > 0 && ops.value(v) < 1,
      ) ||
      !curvatures.every((v: T): boolean => ops.value(v) > 0)
    )
      return {
        quarters: [],
        failure:
          "conic quarters need four finite positive extents/curvatures and shoulders inside (0,1)",
      };
    const quarters: IAutoMovieViewConic.IQuarter<T>[] = [];
    for (let q: number = 0; q < 4; q++) {
      const a: T = extents[q]!;
      const b: T = extents[(q + 1) % 4]!;
      const r: T = shoulders[q]!;
      const start: IAutoMovieConicHermite.IPatch<T> | string | null =
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
      const end: IAutoMovieConicHermite.IPatch<T> | string | null =
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
