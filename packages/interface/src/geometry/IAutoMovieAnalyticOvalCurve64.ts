import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Analytic ellipse in a millimetre frame. One turn traces the closed curve from
 * the positive U endpoint through the positive V endpoint. The declared axes
 * are orthonormal and the finite semiaxes are strictly positive.
 */
export interface IAutoMovieAnalyticOvalCurve64 {
  /**
   * Closed representation tag selecting the actual coefficient evaluator and
   * its units.
   */
  type: "analyticOval";

  /** Nonblank curve identity used for source attribution and inspection. */
  name: string;

  /** Required closed topology of the analytic oval. */
  closed: true;

  /**
   * Explicit spatial unit of the generated primitive; exact coordinates remain
   * millimetres until display conversion.
   */
  unit: "mm";

  /**
   * A turn is the independent parameter unit. Derivatives use millimetres per
   * turn.
   */
  phaseUnit: "turn";

  /** Centre in the owning spatial chart; exact primitives use millimetres. */
  center: Readonly<AutoMovieVector3Tuple>;

  /** First declared unit axis of the owning transverse chart. */
  u: Readonly<AutoMovieVector3Tuple>;

  /** Second declared unit axis of the owning transverse chart. */
  v: Readonly<AutoMovieVector3Tuple>;

  /** Positive ellipse semiaxis length along u, millimetres. */
  radiusU: number;

  /** Positive ellipse semiaxis length along v, millimetres. */
  radiusV: number;
}
