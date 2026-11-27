import type {
  IAutoMovieAlgebra,
  IAutoMovieConicArc,
  IAutoMovieConicArcField,
  IAutoMovieConicFieldJet,
} from "@automovie/interface";

import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";

/** Invocation-local normalized positive Bernstein terms, before velocity work. */
interface Basis<T> {
  /** Normalized first extent. */ a: T;
  /** Normalized second extent. */ b: T;
  /** Frozen primal scaling gauge. */ gauge: T;
  /** First coordinate numerator basis. */ left: T;
  /** Second coordinate numerator basis. */ right: T;
  /** Shared positive rational denominator. */ denominator: T;
}

/** Shared rational-quadratic algebra and fixed-clock source readings. */
export namespace AutoMovieConicArcField {
  /** The original dimensionless shoulder-to-weight map. */
  export function weight<T>(ops: IAutoMovieAlgebra<T>, r: T): T {
    return ops.divide(r, ops.subtract(ops.constant(1), r));
  }

  /** Original endpoint geometric curvature, inverse source length. */
  export function curvature<T>(ops: IAutoMovieAlgebra<T>, a: T, b: T, r: T): T {
    const w: T = weight(ops, r);
    const divisor: T = ops.multiply(
      ops.multiply(ops.multiply(ops.multiply(ops.constant(2), w), w), b),
      b,
    );
    return ops.divide(a, divisor);
  }

  /** Regular Euclidean norm with a frozen numerical scaling gauge. */
  export function norm<T>(ops: IAutoMovieAlgebra<T>, a: T, b: T): T {
    const scale: number = Math.max(
      Math.abs(ops.value(a)),
      Math.abs(ops.value(b)),
    );
    const gauge: T = ops.constant(scale);
    const x: T = ops.divide(a, gauge);
    const y: T = ops.divide(b, gauge);
    return ops.multiply(
      gauge,
      ops.sqrt(ops.add(ops.multiply(x, x), ops.multiply(y, y))),
    );
  }

  /** Positive magnitudes of the quadratic's native velocity. */
  export function velocity<T>(
    ops: IAutoMovieAlgebra<T>,
    a: T,
    b: T,
    w: T,
    t: T,
  ): readonly [T, T] {
    const s: T = ops.subtract(ops.constant(1), t);
    const middle: T = ops.multiply(
      ops.multiply(ops.multiply(ops.constant(2), w), t),
      s,
    );
    const denominator: T = ops.add(
      ops.add(ops.multiply(s, s), middle),
      ops.multiply(t, t),
    );
    return [
      ops.divide(
        ops.divide(
          ops.multiply(
            ops.multiply(ops.multiply(ops.constant(2), a), t),
            ops.add(s, ops.multiply(w, t)),
          ),
          denominator,
        ),
        denominator,
      ),
      ops.divide(
        ops.divide(
          ops.multiply(
            ops.multiply(ops.multiply(ops.constant(2), b), s),
            ops.add(t, ops.multiply(w, s)),
          ),
          denominator,
        ),
        denominator,
      ),
    ];
  }

  /**
   * Original rational point and unit tangent at an algebra-valued native
   * parameter.
   */
  export function evaluate<T>(
    ops: IAutoMovieAlgebra<T>,
    a: T,
    b: T,
    w: T,
    t: T,
  ): IAutoMovieConicArcField.IGeometry<T> {
    const basis: Basis<T> = pointBasis(ops, a, b, w, t);
    const speed: readonly [T, T] = velocity(ops, basis.a, basis.b, w, t);
    const length: T = norm(ops, speed[0], speed[1]);
    return {
      point: restorePoint(ops, basis),
      tangent: [
        ops.divide(ops.subtract(ops.constant(0), speed[0]), length),
        ops.divide(speed[1], length),
      ],
    };
  }

  /** Original Cartesian point without preparing velocity or a unit tangent. */
  export function point<T>(
    ops: IAutoMovieAlgebra<T>,
    a: T,
    b: T,
    w: T,
    t: T,
  ): readonly [T, T] {
    return restorePoint(ops, pointBasis(ops, a, b, w, t));
  }

  /** Preserve the original pre-velocity operation order and normalization. */
  function pointBasis<T>(
    ops: IAutoMovieAlgebra<T>,
    a: T,
    b: T,
    w: T,
    t: T,
  ): Basis<T> {
    const scale: number = Math.max(
      Math.abs(ops.value(a)),
      Math.abs(ops.value(b)),
    );
    const gauge: T = ops.constant(scale);
    const A: T = ops.divide(a, gauge);
    const B: T = ops.divide(b, gauge);
    const s: T = ops.subtract(ops.constant(1), t);
    const middle: T = ops.multiply(
      ops.multiply(ops.multiply(ops.constant(2), w), t),
      s,
    );
    const left: T = ops.add(ops.multiply(s, s), middle);
    const right: T = ops.add(middle, ops.multiply(t, t));
    const denominator: T = ops.add(left, ops.multiply(t, t));
    return { a: A, b: B, gauge, left, right, denominator };
  }

  /** The same final point operations occur after velocity work in evaluate. */
  function restorePoint<T>(
    ops: IAutoMovieAlgebra<T>,
    basis: Basis<T>,
  ): readonly [T, T] {
    return [
      ops.multiply(
        ops.divide(ops.multiply(basis.a, basis.left), basis.denominator),
        basis.gauge,
      ),
      ops.multiply(
        ops.divide(ops.multiply(basis.b, basis.right), basis.denominator),
        basis.gauge,
      ),
    ];
  }

  /** Reflect a selected end back to its original quarter chart. */
  export function orient<T>(
    ops: IAutoMovieAlgebra<T>,
    geometry: IAutoMovieConicArcField.IGeometry<T>,
    reverse: boolean,
  ): IAutoMovieConicArcField.IGeometry<T> {
    if (!reverse) return geometry;
    return {
      point: [geometry.point[1], geometry.point[0]],
      tangent: [
        ops.subtract(ops.constant(0), geometry.tangent[1]),
        ops.subtract(ops.constant(0), geometry.tangent[0]),
      ],
    };
  }

  /** Admit and copy exactly the required source derivative orders. */
  export function finish(
    geometry: IAutoMovieConicArcField.IGeometry<IAutoMovieConicFieldJet.IJet>,
    ray: IAutoMovieConicArc.IRay,
  ): IAutoMovieConicArcField.IReading | IAutoMovieConicArcField.IFailure {

    return {
      kind: "reading",
      point: [[...geometry.point[0]], [...geometry.point[1]]],
      tangent: [
        [
          geometry.tangent[0][0],
          geometry.tangent[0][1],
          geometry.tangent[0][2],
        ],
        [
          geometry.tangent[1][0],
          geometry.tangent[1][1],
          geometry.tangent[1][2],
        ],
      ],
      radial: [...ray.radial],
      logCurvature: ray.logCurvature,
    };
  }

  /** Read quadratic source partials only at the already selected numeric clock. */
  export function read(
    extents: readonly [
      IAutoMovieConicFieldJet.IJet,
      IAutoMovieConicFieldJet.IJet,
    ],
    shoulder: IAutoMovieConicFieldJet.IJet,
    ray: IAutoMovieConicArc.IRay,
  ): IAutoMovieConicArcField.IReading | IAutoMovieConicArcField.IFailure {
    if (
      ray.native === null ||
      !(
        extents[0][0] > 0 &&
        extents[1][0] > 0 &&
        shoulder[0] > 0 &&
        shoulder[0] < 1
      )
    )
      return {
        kind: "failure",
        detail:
          "Raw conic reading requires supplied source jets and a selected native clock.",
      };

    const ops: IAutoMovieAlgebra<IAutoMovieConicFieldJet.IJet> =
      AutoMovieConicFieldJet.AD;
    const a: IAutoMovieConicFieldJet.IJet = extents[ray.reverse ? 1 : 0];
    const b: IAutoMovieConicFieldJet.IJet = extents[ray.reverse ? 0 : 1];
    const geometry: IAutoMovieConicArcField.IGeometry<IAutoMovieConicFieldJet.IJet> =
      evaluate(ops, a, b, weight(ops, shoulder), ops.constant(ray.native));
    return finish(orient(ops, geometry, ray.reverse), ray);
  }
}
