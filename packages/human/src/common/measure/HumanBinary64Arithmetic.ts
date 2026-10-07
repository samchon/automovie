/**
 * Own IEEE binary64 decomposition and correctly rounded rational conversion.
 * These numerical operations have no anatomical unit or source-role rule.
 *
 * @evidence contracts/common.md#principled-implementation Exact significands and quotient remainders retain represented inputs until nearest-even output conversion.
 * @evidence contracts/common.md#clear-and-simple-design One bit-arithmetic owner is shared by material predicates and metric polynomial consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate epsilon, magnitude cutoff or source identifier changes rounding.
 * @evidence contracts/common.md#meaningful-documentation Decomposition and output conversion are numerical representation operations, independent of geometry units.
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
export class HumanBinary64Arithmetic {
  /** Adjacent represented value towards positive infinity.
   *
   * @evidence contracts/common.md#principled-implementation Ordered IEEE bit neighbours and explicit zero/infinity cases determine the represented successor.
   * @evidence contracts/common.md#clear-and-simple-design nextUp keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts nextUp retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Read the adjacent binary64 value toward positive infinity; NaN and positive infinity retain their represented result.
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
  static nextUp(value: number): number {
    if (Number.isNaN(value) || value === Infinity) return value;
    if (value === 0) return Number.MIN_VALUE;
    const buffer = new ArrayBuffer(8),
      view = new DataView(buffer);
    view.setFloat64(0, value);
    view.setBigUint64(0, view.getBigUint64(0) + (value > 0 ? 1n : -1n));
    return view.getFloat64(0);
  }

  /** Adjacent represented value towards negative infinity.
   *
   * @evidence contracts/common.md#principled-implementation Sign reversal maps the shared positive neighbour operation to the represented predecessor.
   * @evidence contracts/common.md#clear-and-simple-design nextDown keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts nextDown retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Read the adjacent binary64 value toward negative infinity by the shared signed neighbour operation.
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
  static nextDown(value: number): number {
    return -this.nextUp(-value);
  }
  /**
   * Decompose a finite binary64 value as an exact signed integer times a power of two; nonfinite inputs refuse.
   *
   * @evidence contracts/common.md#principled-implementation Sign, exponent and significand bit fields reconstruct the exact represented dyadic value.
   * @evidence contracts/common.md#clear-and-simple-design dyadic keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts dyadic retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Decompose a finite binary64 value as an exact signed integer times a power of two; nonfinite inputs refuse.
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
  static dyadic(value: number): [bigint, number] {
    if (!Number.isFinite(value))
      throw new Error("Binary64 inputs must be finite.");
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, value);
    const bits = view.getBigUint64(0),
      field = Number((bits >> 52n) & 2047n);
    const fraction = bits & ((1n << 52n) - 1n);
    const mantissa = field === 0 ? fraction : fraction | (1n << 52n);
    return [
      bits >> 63n === 0n ? mantissa : -mantissa,
      field === 0 ? -1074 : field - 1075,
    ];
  }

  /**
   * Round numerator / positive denominator times 2^exponent to binary64, with integer exponent and nearest-even quotient rounding.
   *
   * @evidence contracts/common.md#principled-implementation Integer quotient and remainder compare the halfway case before nearest-even output conversion.
   * @evidence contracts/common.md#clear-and-simple-design numberAt keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts numberAt retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Round numerator / positive denominator times 2^exponent to binary64, with integer exponent and nearest-even quotient rounding.
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
  static numberAt(
    numerator: bigint,
    denominator: bigint,
    exponent = 0,
  ): number {
    if (numerator === 0n) return 0;
    const negative = numerator < 0n;
    const n = negative ? -numerator : numerator;
    let binade = n.toString(2).length - denominator.toString(2).length;
    if (
      binade >= 0
        ? n < denominator << BigInt(binade)
        : n << BigInt(-binade) < denominator
    )
      binade--;
    const power = Math.max(-1074, exponent + binade - 52);
    const shift = exponent - power;
    const dividend = shift >= 0 ? n << BigInt(shift) : n;
    const divisor = shift >= 0 ? denominator : denominator << BigInt(-shift);
    const quotient = dividend / divisor,
      remainder = dividend % divisor;
    const twice = 2n * remainder;
    const rounded =
      quotient +
      (twice > divisor || (twice === divisor && quotient % 2n !== 0n)
        ? 1n
        : 0n);
    const value = Number(rounded) * 2 ** power;
    return negative ? -value : value;
  }
}
