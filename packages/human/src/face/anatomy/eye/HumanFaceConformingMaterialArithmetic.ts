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
 *
 * @evidence contracts/common.md#principled-implementation Exact homogeneous BigInt predicates and rational areas preserve represented dyadic material incidence until the single binary64 conversion boundary.
 * @evidence contracts/common.md#clear-and-simple-design A stateless arithmetic owner separates signs/areas/output rounding from source overlay identity and metric tissue geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive denominators and nondegenerate original triangles are admitted caller premises; no epsilon changes a predicate or source/anatomical dimensions.
 * @evidence contracts/common.md#meaningful-documentation The class and aliases state exact material representation, area meaning and geometry ownership.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size determinants and fraction operations have cost determined by integer bit widths, with Euclidean reduction and binary64 conversion delegated to their numeric owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Polygon/refinement/sheet consumers share these same exact predicates and nearest-even conversion instead of maintaining divergent arithmetic rules.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Static operations retain no state; returned fractions/coordinates are caller-owned and temporary BigInts expire without caches or resources.
 */
export class HumanFaceConformingMaterialArithmetic {
  /**
   * Decompose a finite binary64 into its exact signed integer significand and power-of-two exponent.
   *
   * @evidence contracts/common.md#principled-implementation Finite binary64 is decomposed into its exact signed significand and power-of-two exponent by the common binary arithmetic owner.
   * @evidence contracts/common.md#clear-and-simple-design This adapter exposes the canonical material-input representation without implementing another IEEE-754 decomposition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-finite admission remains delegated and no decimal/tolerance fit substitutes for the represented input.
   * @evidence contracts/common.md#meaningful-documentation The member states finite binary64 input and exact significand/exponent result.
   * @evidence contracts/performance.md#efficient-algorithms Binary64 decomposition reads a fixed eight-byte representation and creates bounded integer/exponent output.
   * @evidence contracts/performance.md#reuse-equivalent-work Every material input uses HumanBinary64Arithmetic.dyadic; this single-value adapter coordinates no cache or in-flight work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned pair is owned and no source array, handle or mutable arithmetic buffer survives the delegated call.
   */
  static dyadic(value: number): [bigint, number] {
    return HumanBinary64Arithmetic.dyadic(value);
  }

  /**
   * Evaluate the homogeneous 3-by-3 determinant exactly; positive denominators retain affine orientation signs.
   *
   * @evidence contracts/common.md#principled-implementation The exact homogeneous 3-by-3 determinant retains affine orientation sign when all three denominators are positive.
   * @evidence contracts/common.md#clear-and-simple-design One scalar predicate is shared by polygon containment, intersections, hull order, area and refinement admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Integer arithmetic replaces neither source incidence identity nor a zero determinant with an epsilon-selected orientation.
   * @evidence contracts/common.md#meaningful-documentation The member identifies the determinant and positive-denominator affine-sign premise.
   * @evidence contracts/performance.md#efficient-algorithms The determinant uses a fixed number of BigInt multiplications/additions whose cost depends on represented integer bit widths.
   * @evidence contracts/performance.md#reuse-equivalent-work All overlay consumers share the same determinant implementation, while each current triple is evaluated without a stale point-identity cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one BigInt result escapes and no point population or resource is retained by the stateless method.
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
   *
   * @evidence contracts/common.md#principled-implementation Cross-multiplied signed rational twice-areas are added and reduced by Euclid's exact greatest common divisor under positive denominator premises.
   * @evidence contracts/common.md#clear-and-simple-design Area accumulation stays with one arithmetic owner while polygon/sheet owners determine the actual oriented face population.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No output rounding or tolerance can erase a missing/overlapping source area; denominator positivity belongs to admitted material fractions.
   * @evidence contracts/common.md#meaningful-documentation The member states signed rational addition, exact reduction and positive input denominators.
   * @evidence contracts/performance.md#efficient-algorithms Two cross-products and a Euclidean remainder loop dominate; both time and temporary integer size depend on numerator/denominator bit widths.
   * @evidence contracts/performance.md#reuse-equivalent-work Each caller reuses the returned reduced sum for its next fan/coverage term; this operation has no cross-request mutable cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the reduced pair and all multiplication/GCD temporaries expire, acquiring no task or handle.
   */
  static addArea(a: MaterialArea, b: MaterialArea): MaterialArea {
    const numerator: bigint = a[0] * b[1] + b[0] * a[1],
      denominator: bigint = a[1] * b[1];
    let x: bigint = numerator < 0n ? -numerator : numerator,
      y: bigint = denominator;
    while (y !== 0n) [x, y] = [y, x % y];
    return [numerator / x, denominator / x];
  }

  /**
   * Round an exact rational times a power of two to nearest-even binary64, including subnormal results. Requires a positive denominator and an integer power-of-two exponent.
   *
   * @evidence contracts/common.md#principled-implementation The common numeric owner rounds an exact rational times an integer power of two to nearest-even binary64, including subnormal output.
   * @evidence contracts/common.md#clear-and-simple-design A small adapter leaves all conversion/error/refusal behavior with HumanBinary64Arithmetic.numberAt.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive denominator and integer exponent remain the conversion contract; no alternate tolerance or adjusted material value forces a desired output.
   * @evidence contracts/common.md#meaningful-documentation The member states scaling, nearest-even/subnormal behavior and denominator/exponent premises.
   * @evidence contracts/performance.md#efficient-algorithms Cost includes operand-bit-length analysis, integer shifts/division and bounded final IEEE packing; it is not assumed constant for arbitrary BigInt inputs.
   * @evidence contracts/performance.md#reuse-equivalent-work Material UV and barycentric output share the same common conversion owner without retaining changed-rational results.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned number survives; rational input remains caller-owned and no numeric buffer/resource is retained.
   */
  static numberAt(
    numerator: bigint,
    denominator: bigint,
    exponent: number = 0,
  ): number {
    return HumanBinary64Arithmetic.numberAt(numerator, denominator, exponent);
  }

  /**
   * Read a rational point's three affine coordinates in one original nondegenerate material triangle. Original triangle points have unit denominators; the rational point's denominator is positive.
   *
   * @evidence contracts/common.md#principled-implementation Exact oriented subareas divided by original triangle area and the query's positive denominator give three affine weights before nearest-even output conversion.
   * @evidence contracts/common.md#clear-and-simple-design Orientation and numberAt own predicate/rounding rules while this method owns one original triangle's barycentric correspondence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The original triangle must be nondegenerate with unit denominators; weights are not clamped or renormalized to manufacture incidence.
   * @evidence contracts/common.md#meaningful-documentation The member states original unit-denominator triangle, positive rational query and all three coordinate outputs.
   * @evidence contracts/performance.md#efficient-algorithms One area and three subdeterminants/conversions use fixed operation counts with cost driven by BigInt bit widths.
   * @evidence contracts/performance.md#reuse-equivalent-work One original area/denominator is reused for all three weights and the shared arithmetic owner performs every output conversion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Three returned numbers are owned; exact determinant/fraction temporaries expire without retaining the triangle or query.
   */
  static barycentric(
    triangle: readonly MaterialPoint[],
    point: MaterialPoint,
  ): [number, number, number] {
    const area: bigint = HumanFaceConformingMaterialArithmetic.orientation(
      triangle[0],
      triangle[1],
      triangle[2],
    );
    const denominator: bigint = area * point[2];
    const sign: 1n | -1n = denominator < 0n ? -1n : 1n;
    return [0, 1, 2].map((at: number): number =>
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
