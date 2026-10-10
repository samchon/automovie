/**
 * Own IEEE binary64 decomposition and correctly rounded rational conversion.
 * These numerical operations have no anatomical unit or source-role rule.
 *
 */
export class HumanBinary64Arithmetic {
  /** Adjacent represented value towards positive infinity.
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
   */
  static nextDown(value: number): number {
    return -this.nextUp(-value);
  }
  /**
   * Decompose a finite binary64 value as an exact signed integer times a power of two; nonfinite inputs refuse.
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
