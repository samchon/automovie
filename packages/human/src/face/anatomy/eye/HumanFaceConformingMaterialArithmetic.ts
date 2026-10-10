import { HumanBinary64Arithmetic } from "../../../common/measure/HumanBinary64Arithmetic";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 */
type MaterialPoint = [bigint, bigint, bigint];

/**
 * Exact twice-area as a signed rational, used before any output rounding.
 */
type MaterialArea = [bigint, bigint];

/**
 * Own exact material predicates, rational coverage arithmetic and the single binary64 output conversion. Geometry and anatomical dimensions remain with the overlay and tissue owners.
 */
export class HumanFaceConformingMaterialArithmetic {
  /**
   * Decompose a finite binary64 into its exact signed integer significand and power-of-two exponent.
   */
  static dyadic(value: number): [bigint, number] {
    return HumanBinary64Arithmetic.dyadic(value);
  }

  /**
   * Evaluate the homogeneous 3-by-3 determinant exactly; positive denominators retain affine orientation signs.
   */
  static orientation(
    a: MaterialPoint,
    b: MaterialPoint,
    c: MaterialPoint,
  ): bigint {
    return (
      a[0] * (b[1] * c[2] - b[2] * c[1]) -
      a[1] * (b[0] * c[2] - b[2] * c[0]) +
      a[2] * (b[0] * c[1] - b[1] * c[0])
    );
  }

  /**
   * Add signed rational twice-areas and reduce numerator and denominator by their exact greatest common divisor. Both input denominators are positive.
   */
  static addArea(a: MaterialArea, b: MaterialArea): MaterialArea {
    const numerator = a[0] * b[1] + b[0] * a[1],
      denominator = a[1] * b[1];
    let x = numerator < 0n ? -numerator : numerator,
      y = denominator;
    while (y !== 0n) [x, y] = [y, x % y];
    return [numerator / x, denominator / x];
  }

  /**
   * Round an exact rational times a power of two to nearest-even binary64, including subnormal results. Requires a positive denominator and an integer power-of-two exponent.
   */
  static numberAt(
    numerator: bigint,
    denominator: bigint,
    exponent = 0,
  ): number {
    return HumanBinary64Arithmetic.numberAt(numerator, denominator, exponent);
  }

  /**
   * Read a rational point's three affine coordinates in one original nondegenerate material triangle. Original triangle points have unit denominators; the rational point's denominator is positive.
   */
  static barycentric(
    triangle: readonly MaterialPoint[],
    point: MaterialPoint,
  ): [number, number, number] {
    const area = HumanFaceConformingMaterialArithmetic.orientation(
      triangle[0],
      triangle[1],
      triangle[2],
    );
    const denominator = area * point[2];
    const sign = denominator < 0n ? -1n : 1n;
    return [0, 1, 2].map((at) =>
      HumanFaceConformingMaterialArithmetic.numberAt(
        sign *
          HumanFaceConformingMaterialArithmetic.orientation(
            triangle[(at + 1) % 3],
            triangle[(at + 2) % 3],
            point,
          ),
        sign * denominator,
      ),
    ) as [number, number, number];
  }
}
