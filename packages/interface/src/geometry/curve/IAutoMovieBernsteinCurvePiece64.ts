import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Polynomial, positive-weight rational, or rational-XZ/polynomial-Y coefficients over local t in [0,1]. Rational numerators and weights are authoritative; an optional Euclidean control cache is checked against their quotient.
 *
 * @evidence contracts/development/design.md#principled-representation The discriminated branches preserve separate numerator, denominator and hybrid longitudinal degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A single union exposes the exact coefficient representation used by the evaluator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Derived controls do not replace rational authority, and hybrid Y does not inherit the rational denominator.
 * @evidence contracts/development/common.md#meaningful-documentation Documents branch selection, optional cache status and independent hybrid Y degree.
 */
export type IAutoMovieBernsteinCurvePiece64 = IAutoMovieCurve64.PieceMetadata &
  (
    | {
        /** Selects a polynomial position field. */
        primitive: "polynomialBezier";

        /** Polynomial degree; controls has exactly degree plus one entries. */
        degree: number;

        /** Position coefficients in millimetres and Bernstein order. */
        controls: readonly Readonly<AutoMovieVector3Tuple>[];
      }
    | {
        /** Selects a rational position field for every coordinate. */
        primitive: "rationalBezier";

        /** Common numerator and denominator degree. */
        degree: number;

        /** Weighted position coefficients, millimetres times the dimensionless weight. */
        homogeneousNumerator: readonly Readonly<AutoMovieVector3Tuple>[];

        /** Strictly positive dimensionless denominator coefficients. */
        weights: readonly number[];

        /** Optional Euclidean quotient cache in millimetres, checked against numerator divided by weight. */
        controls?: readonly Readonly<AutoMovieVector3Tuple>[];
      }
    | {
        /** Selects rational transverse X/Z and independent polynomial longitudinal Y. */
        primitive: "rationalXZPolynomialYBezier";

        /** Numerator/denominator degree; it does not set polynomialYControls degree. */
        degree: number;

        /** Weighted XYZ coefficients; rational Y is evaluated but replaced by the independent polynomial Y result. */
        homogeneousNumerator: readonly Readonly<AutoMovieVector3Tuple>[];

        /** Positive dimensionless weights shared by the rational coordinates. */
        weights: readonly number[];

        /** Longitudinal millimetre coefficients; their count minus one is this polynomial's independent degree. */
        polynomialYControls: readonly number[];

        /** Optional quotient cache for the homogeneous field before hybrid Y replacement. */
        controls?: readonly Readonly<AutoMovieVector3Tuple>[];
      }
  );
