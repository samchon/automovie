/**
 * Own IEEE binary64 decomposition and correctly rounded rational conversion.
 * These numerical operations have no anatomical unit or source-role rule.
 *
 *
 * @evidence contracts/common.md#principled-implementation ECMA binary64 bit fields provide adjacent-value and exact dyadic operations; rational conversion rounds an integer quotient to nearest even on the normal/subnormal grid, requiring positive denominators and integer exponents from exact arithmetic callers.
 * @evidence contracts/common.md#clear-and-simple-design This static numerical owner separates representation arithmetic from concha, head, ocular and body solver semantics, so those consumers reuse one decomposition/rounding implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Representation constants follow IEEE fields and Number's minimum exponent; no anatomical epsilon, specimen branch or foreign numeric implementation is substituted.
 * @evidence contracts/common.md#meaningful-documentation The class prose distinguishes binary64 decomposition/rounding from anatomical units, and each method describes nonfinite handling or its rational-input premises.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-width decomposition/adjacency use constant work; rational conversion scales with numerator/denominator bit widths, including binary strings and shifted integer division, rather than anatomical mesh dimensions.
 * @evidence contracts/performance.md#reuse-equivalent-work Exact fraction, ocular predicates and exceptional Jacobian rows reuse these stateless numeric methods; no cross-call cache equates different rational inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The class holds no instances or persistent state; each method's temporary bit buffer or BigInts is call-local and bounded by represented width or supplied rational magnitude.
 */
export class HumanBinary64Arithmetic {
  /** Adjacent represented value towards positive infinity; NaN and positive infinity return unchanged, and either zero returns the minimum positive subnormal.
   *
   * @evidence contracts/common.md#principled-implementation Incrementing the ordered binary64 encoding moves a positive value upward and decrements a negative encoding; zero maps to the minimum positive subnormal, while NaN and positive infinity retain their specified outcomes.
   * @evidence contracts/common.md#clear-and-simple-design The method owns one adjacent-value primitive through DataView; callers such as square-root bracketing and ocular error bounds retain their geometric decisions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero/infinity branches are representation boundary cases, and the eight-byte buffer is the binary64 width rather than a measurement tolerance.
   * @evidence contracts/common.md#meaningful-documentation The method comment gives upward direction, unchanged NaN/positive infinity and the minimum-positive-subnormal result for either signed zero.
   * @evidence contracts/performance.md#efficient-algorithms One eight-byte encoding read/write and fixed-width BigInt step use O(1) work and storage for a represented Number.
   * @evidence contracts/performance.md#reuse-equivalent-work No repeated work is coordinated: a fresh local view avoids sharing mutable bit storage between independent adjacency calls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The eight-byte ArrayBuffer and DataView are invocation-owned and become unreachable after the scalar return or failure; no state, handle or task survives.
   */
  static nextUp(value: number): number {
    if (Number.isNaN(value) || value === Infinity) return value;
    if (value === 0) return Number.MIN_VALUE;
    const buffer: ArrayBuffer = new ArrayBuffer(8);
    const view: DataView = new DataView(buffer);
    view.setFloat64(0, value);
    view.setBigUint64(0, view.getBigUint64(0) + (value > 0 ? 1n : -1n));
    return view.getFloat64(0);
  }

  /** Adjacent represented value towards negative infinity; NaN and negative infinity return unchanged, and either zero returns the minimum negative subnormal.
   *
   * @evidence contracts/common.md#principled-implementation Negating nextUp of the negated Number gives the adjacent value toward negative infinity, retaining the same represented boundary and NaN behavior.
   * @evidence contracts/common.md#clear-and-simple-design The downward operation delegates its bit manipulation to nextUp rather than adding a second encoding implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sign duality applies to the supported Number representation without a consumer-specific correction or alternate precision rule.
   * @evidence contracts/common.md#meaningful-documentation The public method comment names the downward direction; nextUp supplies documented bit-boundary behavior for this delegation.
   * @evidence contracts/performance.md#efficient-algorithms A single nextUp call and two scalar negations use constant time/space, including its fixed eight-byte temporary view.
   * @evidence contracts/performance.md#reuse-equivalent-work The canonical upward primitive is reused for negative-direction adjacency; no memoized result assumes repeated numeric requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The method retains only its returned scalar; nextUp's temporary buffer is call-local, with no retained view, native handle or pending task.
   */
  static nextDown(value: number): number {
    return -this.nextUp(-value);
  }
  /**
   * Decompose a finite binary64 value as an exact signed integer times a power of two; nonfinite inputs refuse and both signed zeros become the same BigInt zero.
   *
   * @evidence contracts/common.md#principled-implementation The sign, exponent field and 52-bit fraction reconstruct a finite Number exactly as signed integer times 2^power; subnormals use exponent -1074 and normals restore the implicit leading bit. Nonfinite values refuse.
   * @evidence contracts/common.md#clear-and-simple-design One DataView decomposition exposes the canonical integer/power pair reused by exact fractions, material predicates and exceptional solver arithmetic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Masks and exponent offsets are binary64 field definitions; zero and subnormal behavior introduce no anatomical or expected-value epsilon.
   * @evidence contracts/common.md#meaningful-documentation The tuple preserves the exact finite numerical value and power; BigInt zero erases the distinction between positive and negative zero. Nonfinite inputs refuse.
   * @evidence contracts/performance.md#efficient-algorithms One fixed-width view and several 64-bit shifts/masks require constant represented-width work and space.
   * @evidence contracts/performance.md#reuse-equivalent-work All consumers reuse this bit-field owner instead of rounding an intermediate fraction; no shared mutable view or input cache is required.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The eight-byte temporary view becomes unreachable after returning a two-scalar tuple; no persistent buffers, handles or tasks are acquired.
   */
  static dyadic(value: number): [bigint, number] {
    if (!Number.isFinite(value))
      throw new Error("Binary64 inputs must be finite.");
    const view: DataView = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, value);
    const bits: bigint = view.getBigUint64(0);
    const field: number = Number((bits >> 52n) & 2047n);
    const fraction: bigint = bits & ((1n << 52n) - 1n);
    const mantissa: bigint = field === 0 ? fraction : fraction | (1n << 52n);
    return [
      bits >> 63n === 0n ? mantissa : -mantissa,
      field === 0 ? -1074 : field - 1075,
    ];
  }

  /**
   * Round numerator / positive denominator times 2^exponent to binary64, with integer exponent and nearest-even quotient rounding.
   *
   * @evidence contracts/common.md#principled-implementation The exact ratio's binary binade chooses a 53-bit normal grid or exponent -1074 subnormal grid; quotient/remainder comparison rounds ties to even before applying the sign. Callers supply a positive denominator and integer exponent; binary64 underflow/overflow remain representational limits.
   * @evidence contracts/common.md#clear-and-simple-design Binade selection, integer shifting and one rounded conversion stay in this numeric owner; polynomial roots and exact-fraction/solver consumers keep their own semantics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The -1074 and 52 constants follow binary64 spacing, and even-quotient ties preserve nearest-even behavior without tolerance, specimen cases or retrying a different formula.
   * @evidence contracts/common.md#meaningful-documentation The method comment gives the ratio-times-power input, positive denominator, integer exponent and nearest-even rounding; no anatomical accuracy is promised.
   * @evidence contracts/performance.md#efficient-algorithms For B-bit inputs and shift S, binary string lengths and shifted BigInt division dominate work and temporary space; the scalar quotient rounding avoids scanning any geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work Divisor and quotient are computed once per rational conversion, and the common method is reused across callers; no cache treats changing exponents or fractions as equivalent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Binary strings, shifted BigInts and remainders remain call-local with size driven by input magnitudes/exponent; only a Number escapes, with no retained numeric registry or handle.
   */
  static numberAt(
    numerator: bigint,
    denominator: bigint,
    exponent: number = 0,
  ): number {
    if (numerator === 0n) return 0;
    const negative: boolean = numerator < 0n;
    const n: bigint = negative ? -numerator : numerator;
    let binade: number = n.toString(2).length - denominator.toString(2).length;
    if (
      binade >= 0
        ? n < denominator << BigInt(binade)
        : n << BigInt(-binade) < denominator
    )
      binade--;
    const power: number = Math.max(-1074, exponent + binade - 52);
    const shift: number = exponent - power;
    const dividend: bigint = shift >= 0 ? n << BigInt(shift) : n;
    const divisor: bigint =
      shift >= 0 ? denominator : denominator << BigInt(-shift);
    const quotient: bigint = dividend / divisor;
    const remainder: bigint = dividend % divisor;
    const twice: bigint = 2n * remainder;
    const rounded: bigint =
      quotient +
      (twice > divisor || (twice === divisor && quotient % 2n !== 0n)
        ? 1n
        : 0n);
    const value: number = Number(rounded) * 2 ** power;
    return negative ? -value : value;
  }
}
