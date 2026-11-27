import { overflowsBinary64 } from "./overflowsBinary64";

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
 * @param value Finite value to step from; either infinity throws.
 * @param upper True for the neighbour toward positive infinity, false for the
 *   one toward negative infinity.
 * @returns The adjacent finite value. Stepping beyond `Number.MAX_VALUE` in
 *   either direction throws instead of returning an infinity.
 */
export function adjacentAutoMovieFloat64(
  value: number,
  upper: boolean,
): number {
  // A rounded operand that already overflowed has no adjacent finite value.
  if (overflowsBinary64(value))
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
  if (overflowsBinary64(result))
    throw new Error(
      "Adjacent binary64 beyond the largest finite magnitude is an overflowing infinity.",
    );
  return result;
}

/** Eight scratch bytes every call overwrites before it reads them back. */
const bits: DataView = new DataView(new ArrayBuffer(8));
