import { HumanBinary64Arithmetic } from "./HumanBinary64Arithmetic";
import type { IHumanExactFraction } from "./IHumanExactFraction";

/**
 * Exact rational operations retain represented inputs through polynomial
 * construction. Binary64 decomposition and rounding reuse their existing
 * bit-arithmetic owner; no anatomical tolerance enters these operations.
 *
 * @evidence contracts/common.md#principled-implementation Rational operations and positive-denominator reduction preserve exact signs before binary64 output rounding.
 * @evidence contracts/common.md#clear-and-simple-design One arithmetic owner supplies conversion and four scalar operations to polynomial consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No magnitude threshold drops a coefficient or changes an input.
 * @evidence contracts/common.md#meaningful-documentation Numerical arithmetic is separate from source and anatomical admission.
 *
 * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
 */
export class HumanExactFraction {
  /**
   * Reduce a rational to a positive denominator; a zero denominator refuses.
   *
   * @evidence contracts/common.md#principled-implementation Euclidean reduction and sign normalization preserve the rational value and denominator invariant.
   * @evidence contracts/common.md#clear-and-simple-design create keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts create retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Reduce a rational to a positive denominator; a zero denominator refuses.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  static create(numerator: bigint, denominator = 1n): IHumanExactFraction {
    if (denominator === 0n)
      throw new Error("An exact fraction needs a nonzero denominator.");
    if (denominator < 0n) {
      numerator = -numerator;
      denominator = -denominator;
    }
    let a = numerator < 0n ? -numerator : numerator,
      b = denominator;
    while (b !== 0n) [a, b] = [b, a % b];
    return { numerator: numerator / a, denominator: denominator / a };
  }

  /**
   * Convert a finite represented binary64 value to its exact rational value through the shared dyadic decomposition.
   *
   * @evidence contracts/common.md#principled-implementation Exact dyadic decomposition prevents decimal or floating approximation during input conversion.
   * @evidence contracts/common.md#clear-and-simple-design from keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts from retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Convert a finite represented binary64 value to its exact rational value through the shared dyadic decomposition.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  static from(value: number): IHumanExactFraction {
    const [n, power] = HumanBinary64Arithmetic.dyadic(value);
    return power >= 0
      ? this.create(n << BigInt(power))
      : this.create(n, 1n << BigInt(-power));
  }

  /**
   * Add exact values; interval addition applies the same operation to ordered bounds.
   *
   * @evidence contracts/common.md#principled-implementation Common-denominator sums preserve exact scalar values and interval endpoint order.
   * @evidence contracts/common.md#clear-and-simple-design add keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts add retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Add exact values; interval addition applies the same operation to ordered bounds.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  static add(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    return this.create(
      a.numerator * b.denominator + b.numerator * a.denominator,
      a.denominator * b.denominator,
    );
  }

  /**
   * Subtract exact rationals without a rounded intermediate value.
   *
   * @evidence contracts/common.md#principled-implementation Exact addition of the additive inverse preserves the rational difference.
   * @evidence contracts/common.md#clear-and-simple-design Reuses the existing scalar addition and negation owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No magnitude cutoff or numerical tolerance changes subtraction.
   * @evidence contracts/common.md#meaningful-documentation States the exact arithmetic meaning and absence of intermediate rounding.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Scalar arithmetic defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The geometric caller owns its joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical quantity.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical ranges remain with callers.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Exposes no personal geometry control.
   */
  static subtract(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    return this.add(a, this.negate(b));
  }

  /**
   * Negate an exact rational while retaining its normalized denominator.
   *
   * @evidence contracts/common.md#principled-implementation Changing only the numerator sign preserves the exact denominator-normalized value.
   * @evidence contracts/common.md#clear-and-simple-design negate keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts negate retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Negate an exact rational while retaining its normalized denominator.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  static negate(a: IHumanExactFraction): IHumanExactFraction {
    return this.create(-a.numerator, a.denominator);
  }

  /**
   * Multiply exact rational values or take the extrema of all four products for ordered intervals.
   *
   * @evidence contracts/common.md#principled-implementation Exact products preserve values; interval extrema include every endpoint product.
   * @evidence contracts/common.md#clear-and-simple-design multiply keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts multiply retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Multiply exact rational values or take the extrema of all four products for ordered intervals.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  static multiply(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    return this.create(
      a.numerator * b.numerator,
      a.denominator * b.denominator,
    );
  }

  /**
   * Divide exact rationals; a zero divisor reaches the shared denominator refusal.
   *
   * @evidence contracts/common.md#principled-implementation Multiplication by the divisor reciprocal preserves the exact value and retains zero-denominator refusal.
   * @evidence contracts/common.md#clear-and-simple-design divide keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts divide retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Divide exact rationals; a zero divisor reaches the shared denominator refusal.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  static divide(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    return this.create(
      a.numerator * b.denominator,
      a.denominator * b.numerator,
    );
  }

  /**
   * Convert an exact positive-denominator rational through shared nearest-even binary64 rounding.
   *
   * @evidence contracts/common.md#principled-implementation The shared quotient-remainder conversion retains rounding ownership in one arithmetic implementation.
   * @evidence contracts/common.md#clear-and-simple-design number keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts number retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Convert an exact positive-denominator rational through shared nearest-even binary64 rounding.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  static number(a: IHumanExactFraction): number {
    return HumanBinary64Arithmetic.numberAt(a.numerator, a.denominator);
  }

  /**
   * Compare rational cross-products exactly and return their order without converting to binary64.
   *
   * @evidence contracts/common.md#principled-implementation Cross multiplication decides exact order without approximate subtraction or rounded conversion.
   * @evidence contracts/common.md#clear-and-simple-design compare keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts compare retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Compare rational cross-products exactly and return their order without converting to binary64.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  static compare(a: IHumanExactFraction, b: IHumanExactFraction): number {
    const difference =
      a.numerator * b.denominator - b.numerator * a.denominator;
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  }

  /** Binary64 lower and upper bounds whose squares bracket the exact value.
   *
   * @evidence contracts/common.md#principled-implementation Exact square comparisons correct the initial floating estimate until represented bounds enclose the real root.
   * @evidence contracts/common.md#clear-and-simple-design sqrtBounds keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts sqrtBounds retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Bracket a nonnegative rational square root using represented endpoints and exact squared comparisons.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  static sqrtBounds(a: IHumanExactFraction): [number, number] {
    if (a.numerator < 0n)
      throw new Error("A squared metric cannot be negative.");
    if (a.numerator === 0n) return [0, 0];
    let exponent =
      a.numerator.toString(2).length - a.denominator.toString(2).length;
    if (
      exponent >= 0
        ? a.numerator < a.denominator << BigInt(exponent)
        : a.numerator << BigInt(-exponent) < a.denominator
    )
      exponent--;
    const power = Math.floor(exponent / 2);
    const reduced =
      power >= 0
        ? this.create(a.numerator, a.denominator << BigInt(2 * power))
        : this.create(a.numerator << BigInt(-2 * power), a.denominator);
    let lower = Math.sqrt(this.number(reduced)) * 2 ** power;
    if (!Number.isFinite(lower))
      throw new Error("Metric magnitude exceeds binary64 coordinates.");
    const square = (value: number): IHumanExactFraction =>
      this.multiply(this.from(value), this.from(value));
    while (this.compare(square(lower), a) > 0)
      lower = HumanBinary64Arithmetic.nextDown(lower);
    let upper = HumanBinary64Arithmetic.nextUp(lower);
    while (Number.isFinite(upper) && this.compare(square(upper), a) < 0) {
      lower = upper;
      upper = HumanBinary64Arithmetic.nextUp(upper);
    }
    return this.compare(square(lower), a) === 0
      ? [lower, lower]
      : [lower, upper];
  }
}
