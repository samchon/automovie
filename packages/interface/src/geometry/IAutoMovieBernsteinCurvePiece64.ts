import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Describe one Bernstein curve piece on the normalized local interval `[0, 1]`.
 *
 * The Engine evaluates positions in millimetres and derivatives per local
 * parameter unit from the saved coefficients. The available fields are a
 * polynomial, a positive-weight rational curve, or rational XZ with an
 * independent polynomial Y. Source metadata records provenance while the local
 * parameter still controls evaluation.
 */
export type IAutoMovieBernsteinCurvePiece64 =
  | IAutoMovieBernsteinCurvePiece64.IPolynomial
  | IAutoMovieBernsteinCurvePiece64.IRational
  | IAutoMovieBernsteinCurvePiece64.IRationalXZPolynomialY;

/** Bernstein coefficient layouts selected by `primitive`. */
export namespace IAutoMovieBernsteinCurvePiece64 {
  /** A polynomial position and derivative on all three axes. */
  export interface IPolynomial extends IAutoMovieCurve64.PieceMetadata {
    /** Selects polynomial evaluation. */
    primitive: "polynomialBezier";

    /** Nonnegative integer degree. */
    degree: number;

    /** `degree + 1` position coefficients in millimetres and Bernstein order. */
    controls: readonly Readonly<AutoMovieVector3Tuple>[];
  }

  /**
   * Weighted position coefficients and denominator for rational evaluation.
   *
   * Both arrays have `degree + 1` entries in Bernstein order. An optional
   * derived cache describes the quotient of corresponding coefficient pairs.
   */
  export interface IRationalCoefficients
    extends IAutoMovieCurve64.PieceMetadata {
    /** Shared nonnegative integer degree of the numerator and denominator. */
    degree: number;

    /** XYZ positions in millimetres multiplied by their dimensionless weights. */
    homogeneousNumerator: readonly Readonly<AutoMovieVector3Tuple>[];

    /** Strictly positive finite dimensionless denominator coefficients. */
    weights: readonly number[];

    /**
     * Optional Euclidean XYZ cache in millimetres. The Engine checks each
     * component against its numerator divided by its weight.
     */
    controls?: readonly Readonly<AutoMovieVector3Tuple>[];
  }

  /** Rational position and quotient-rule derivative on all three axes. */
  export interface IRational extends IRationalCoefficients {
    /** Selects rational evaluation on XYZ. */
    primitive: "rationalBezier";
  }

  /** Rational XZ with an independently evaluated polynomial Y. */
  export interface IRationalXZPolynomialY extends IRationalCoefficients {
    /** Selects rational evaluation on XZ and polynomial evaluation on Y. */
    primitive: "rationalXZPolynomialYBezier";

    /**
     * Nonempty longitudinal Bernstein coefficients in millimetres. Their count
     * minus one gives the Y degree. The evaluator uses this field for the final
     * Y position and derivative, while the optional cache describes the XYZ
     * numerator and weight quotient before Y replacement.
     */
    polynomialYControls: readonly number[];
  }
}
