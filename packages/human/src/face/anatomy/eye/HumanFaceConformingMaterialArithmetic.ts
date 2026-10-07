import { HumanBinary64Arithmetic } from "../../../common/measure/HumanBinary64Arithmetic";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 *
 * @evidence contracts/common.md#principled-implementation A positive denominator preserves determinant signs when coordinates are divided by it.
 * @evidence contracts/common.md#clear-and-simple-design Three integers carry one rational point without separate rounded coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tuple records an exact point and does not alias nearby samples.
 * @evidence contracts/common.md#meaningful-documentation States homogeneous denominator ownership rather than treating integer UV as metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The MaterialPoint representation does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The MaterialPoint representation adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The MaterialPoint representation does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates share the overlay's common dimensionless power-of-two unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The MaterialPoint representation does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this MaterialPoint representation carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The MaterialPoint representation supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The MaterialPoint representation defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The MaterialPoint representation exposes no personal shaping input.
 */
type MaterialPoint = [bigint, bigint, bigint];

/**
 * Exact twice-area as a signed rational, used before any output rounding.
 *
 * @evidence contracts/common.md#principled-implementation A rational numerator and denominator preserve addition and exact coverage comparison.
 * @evidence contracts/common.md#clear-and-simple-design Two integers carry only the signed area required by coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No floating tolerance replaces equality of the covered and original area.
 * @evidence contracts/common.md#meaningful-documentation States the signed twice-area convention used by the coverage owner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The MaterialArea representation does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The MaterialArea representation adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The MaterialArea representation does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Area is expressed in squared common material units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The MaterialArea representation does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this MaterialArea representation carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The MaterialArea representation supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The MaterialArea representation defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The MaterialArea representation exposes no personal shaping input.
 */
type MaterialArea = [bigint, bigint];

/**
 * Own exact material predicates, rational coverage arithmetic and the single binary64 output conversion. Geometry and anatomical dimensions remain with the overlay and tissue owners.
 *
 * @evidence contracts/common.md#principled-implementation The dyadic input decomposition, homogeneous determinant and rational conversion keep one exact arithmetic basis until the final output boundary.
 * @evidence contracts/common.md#clear-and-simple-design Static operations share no mutable state and are consumed by the material overlay.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Output rounding follows nearest-even quotient arithmetic, not tolerance-dependent repair.
 * @evidence contracts/common.md#meaningful-documentation Each operation documents its denominator, unit and precision preconditions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The exact arithmetic owner does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The exact arithmetic owner adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The exact arithmetic owner does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions The material unit is dimensionless; conversion exponents identify powers of two, never head-metre scales.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The exact arithmetic owner does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this exact arithmetic owner carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The exact arithmetic owner supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The exact arithmetic owner defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The exact arithmetic owner exposes no personal shaping input.
 */
export class HumanFaceConformingMaterialArithmetic {
  /**
   * Decompose a finite binary64 into its exact signed integer significand and power-of-two exponent.
   *
   * @evidence contracts/common.md#principled-implementation IEEE binary64 stores a 52-bit fraction and an implicit leading bit for normal values; subnormals use exponent -1074.
   * @evidence contracts/common.md#clear-and-simple-design DataView reads the original bits without decimal conversion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No approximate log or fitted scale determines the input representation.
   * @evidence contracts/common.md#meaningful-documentation States finite-input refusal and the exact normal, subnormal and signed-zero cases.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The dyadic arithmetic does not define an anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The dyadic arithmetic adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The dyadic arithmetic does not choose a mesh population.
   * @evidence contracts/modeling.md#spatial-conventions The exponent scales dimensionless material coordinates; no metric conversion occurs.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The dyadic arithmetic does not construct a part join.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this dyadic arithmetic carries no independent rendered form.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The dyadic arithmetic supplies no anatomical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range The dyadic arithmetic defines no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The dyadic arithmetic exposes no personal shaping input.
   */
  static dyadic(value: number): [bigint, number] {
    return HumanBinary64Arithmetic.dyadic(value);
  }

  /**
   * Evaluate the homogeneous 3-by-3 determinant exactly; positive denominators retain affine orientation signs.
   *
   * @evidence contracts/common.md#principled-implementation Dividing the determinant by the product of positive homogeneous denominators gives the ordinary oriented twice-area.
   * @evidence contracts/common.md#clear-and-simple-design One determinant formula serves containment, hull ordering, ears and barycentric weights.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts BigInt sign determines degeneracy without epsilon or normal fallback.
   * @evidence contracts/common.md#meaningful-documentation Documents why the denominator sign is a representation precondition.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The orientation arithmetic does not define an anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The orientation arithmetic adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The orientation arithmetic does not choose a mesh population.
   * @evidence contracts/modeling.md#spatial-conventions The determinant uses squared common material units multiplied by homogeneous denominators.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The orientation arithmetic does not construct a part join.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this orientation arithmetic carries no independent rendered form.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The orientation arithmetic supplies no anatomical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range The orientation arithmetic defines no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The orientation arithmetic exposes no personal shaping input.
   */
  static orientation(a: MaterialPoint, b: MaterialPoint, c: MaterialPoint): bigint {
    return a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) +
      a[2] * (b[0] * c[1] - b[1] * c[0]);
  }

  /**
   * Add signed rational twice-areas and reduce numerator and denominator by their exact greatest common divisor. Both input denominators are positive.
   *
   * @evidence contracts/common.md#principled-implementation Cross multiplication adds the fractions; Euclid reduction preserves the exact quotient and positive denominator.
   * @evidence contracts/common.md#clear-and-simple-design One rational addition is shared by polygon fans and grid coverage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact zero remains zero instead of being classified by a small-area threshold.
   * @evidence contracts/common.md#meaningful-documentation States signed numerator and positive denominator ownership.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The addArea arithmetic does not define an anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The addArea arithmetic adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The addArea arithmetic does not choose a mesh population.
   * @evidence contracts/modeling.md#spatial-conventions Both inputs use the same squared common material unit.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The addArea arithmetic does not construct a part join.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this addArea arithmetic carries no independent rendered form.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The addArea arithmetic supplies no anatomical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range The addArea arithmetic defines no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The addArea arithmetic exposes no personal shaping input.
   */
  static addArea(a: MaterialArea, b: MaterialArea): MaterialArea {
    const numerator = a[0] * b[1] + b[0] * a[1], denominator = a[1] * b[1];
    let x = numerator < 0n ? -numerator : numerator, y = denominator;
    while (y !== 0n) [x, y] = [y, x % y];
    return [numerator / x, denominator / x];
  }

  /**
   * Round an exact rational times a power of two to nearest-even binary64, including subnormal results. Requires a positive denominator and an integer power-of-two exponent.
   *
   * @evidence contracts/common.md#principled-implementation Exact bit lengths select the binade; integer quotient and remainder decide rounding, with half-way cases choosing an even significand.
   * @evidence contracts/common.md#clear-and-simple-design One conversion owns all material UV and barycentric output rounding.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Low significand bits remain available to rounding instead of being truncated before the quotient.
   * @evidence contracts/common.md#meaningful-documentation States positive denominator, signed numerator and binary64 normal/subnormal output ownership.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The numberAt arithmetic does not define an anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The numberAt arithmetic adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The numberAt arithmetic does not choose a mesh population.
   * @evidence contracts/modeling.md#spatial-conventions The exponent restores the original dimensionless material unit or is zero for weights.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The numberAt arithmetic does not construct a part join.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this numberAt arithmetic carries no independent rendered form.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The numberAt arithmetic supplies no anatomical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range The numberAt arithmetic defines no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The numberAt arithmetic exposes no personal shaping input.
   */
  static numberAt(numerator: bigint, denominator: bigint, exponent = 0): number {
    return HumanBinary64Arithmetic.numberAt(numerator, denominator, exponent);
  }

  /**
   * Read a rational point's three affine coordinates in one original nondegenerate material triangle. Original triangle points have unit denominators; the rational point's denominator is positive.
   *
   * @evidence contracts/common.md#principled-implementation Each opposite-edge determinant divided by the triangle area and point denominator is its exact barycentric coordinate.
   * @evidence contracts/common.md#clear-and-simple-design One orientation owner and one nearest-even output owner determine all three weights.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No weight clamp, sum normalization or nearest-host substitution changes the point.
   * @evidence contracts/common.md#meaningful-documentation States the original unit-denominator triangle premise and preserves zero edge weights.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The barycentric arithmetic does not define an anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The barycentric arithmetic adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The barycentric arithmetic does not choose a mesh population.
   * @evidence contracts/modeling.md#spatial-conventions The common material area cancels, leaving dimensionless barycentric weights.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The barycentric arithmetic does not construct a part join.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this barycentric arithmetic carries no independent rendered form.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The barycentric arithmetic supplies no anatomical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range The barycentric arithmetic defines no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The barycentric arithmetic exposes no personal shaping input.
   */
  static barycentric(triangle: readonly MaterialPoint[], point: MaterialPoint): [number, number, number] {
    const area = HumanFaceConformingMaterialArithmetic.orientation(triangle[0], triangle[1], triangle[2]);
    const denominator = area * point[2];
    const sign = denominator < 0n ? -1n : 1n;
    return [0, 1, 2].map((at) => HumanFaceConformingMaterialArithmetic.numberAt(
      sign * HumanFaceConformingMaterialArithmetic.orientation(triangle[(at + 1) % 3], triangle[(at + 2) % 3], point),
      sign * denominator,
    )) as [number, number, number];
  }

}
