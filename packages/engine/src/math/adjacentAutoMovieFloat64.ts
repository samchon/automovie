/** Eight scratch bytes every call overwrites before it reads them back. */
const bits: DataView = new DataView(new ArrayBuffer(8));

/**
 * The binary64 number adjacent to a finite value, one unit in the last place
 * toward positive or negative infinity.
 *
 * Callers widen a rounded result outward by one representable step so a
 * computed bound encloses the exact one, as interval and enclosure code does
 * after a rounded subtraction or division; no spatial tolerance or unit is
 * involved. Zero of either sign steps to the signed smallest subnormal, and a
 * smallest subnormal stepping toward zero returns a zero carrying its sign.
 *
 * @param value Finite value to step from; `NaN` and either infinity throw.
 * @param upper True for the neighbour toward positive infinity, false for the
 *   one toward negative infinity.
 * @returns The adjacent finite value. Stepping beyond `Number.MAX_VALUE` in
 *   either direction throws instead of returning an infinity.
 *
 * @evidence contracts/common.md#principled-implementation IEEE 754 binary64 orders positive values by their bit patterns read as unsigned integers and negative values in reverse, so the neighbour is the 64-bit pattern plus or minus one, toward larger magnitude when the sign agrees with the direction; the pattern is written big-endian through a `DataView`, so the high and low 32-bit words are the same on every platform, and the low word's wrap carries or borrows into the high word, which `setUint32` reduces modulo 2^32, without BigInt.
 * @evidence contracts/common.md#clear-and-simple-design One direction flag instead of separate up and down functions, because the projection separation, triangle attachment contact and barycentric seating bounds, the quadratic polisher's dual rounding and the hair exterior interval each pick the direction from a sign at the call site.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero is the only special case, because a zero's neighbour toward the opposite sign lies across the sign bit, where decrementing the zero magnitude would wrap to a NaN pattern; an overflow refuses rather than returning the infinity the bit pattern reaches.
 * @evidence contracts/common.md#meaningful-documentation States the one-ulp meaning and the direction flag, why callers use it, the signed-zero and subnormal results, and both refusals: a non-finite input and a step past the largest finite value.
 * @evidence contracts/performance.md#efficient-algorithms Constant time with no allocation per call: one float write, two word reads, two word writes and one float read on a buffer allocated once at module load, instead of a `Float64Array` view pair that would depend on platform endianness.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar function that coordinates no work across calls; the scratch buffer is reused storage, not a reused result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module retains one 8-byte buffer for its lifetime; every call writes it before reading and finishes synchronously, so no state survives a call and concurrent callers cannot interleave inside it.
 */
export function adjacentAutoMovieFloat64(
  value: number,
  upper: boolean,
): number {
  if (!Number.isFinite(value))
    throw new Error("Adjacent binary64 needs a representable finite value.");
  if (value === 0) return upper ? Number.MIN_VALUE : -Number.MIN_VALUE;
  bits.setFloat64(0, value);
  const high: number = bits.getUint32(0);
  const low: number = bits.getUint32(4);
  if (value > 0 === upper) {
    bits.setUint32(0, high + (low === 0xffffffff ? 1 : 0));
    bits.setUint32(4, low + 1);
  } else {
    bits.setUint32(0, high - (low === 0 ? 1 : 0));
    bits.setUint32(4, low - 1);
  }
  const result: number = bits.getFloat64(0);
  if (!Number.isFinite(result))
    throw new Error(
      "Adjacent binary64 beyond the largest finite magnitude is an overflowing infinity.",
    );
  return result;
}
