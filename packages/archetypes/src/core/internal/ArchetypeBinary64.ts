/**
 * Create a call-local exact binary64 reader shared by fracture and mass
 * arithmetic. A finite value's normal significand includes the hidden 2^52 bit;
 * subnormals use their fraction directly, with exponent -1074. No value is
 * rounded here.
 *
 * @param view An exclusively owned call-local view of at least eight bytes;
 *   omitted, this reader owns a new eight-byte buffer. A supplied larger view
 *   retains its backing buffer for the reader's lifetime.
 * @returns A synchronous signed reader reusing that view for all finite values
 *   in the operation.
 * @throws {Error} For a view shorter than eight bytes or a non-finite value
 *   supplied to the reader.
 */
export function ArchetypeBinary64(
  view: DataView = new DataView(new ArrayBuffer(8)),
): (value: number) => IDyadic {
  if (view.byteLength < 8)
    throw new Error("Binary64 decomposition needs an eight-byte view");

  /**
   * Keep only the exact signed significand and exponent after a synchronous
   * read.
   */
  return (value: number): IDyadic => {
    if (value === Infinity || value === -Infinity)
      throw new Error("Binary64 decomposition needs a finite value");
    view.setFloat64(0, value, false);
    const bits: bigint = view.getBigUint64(0, false);
    const exponent: number = Number((bits >> 52n) & 2047n);
    const fraction: bigint = bits & ((1n << 52n) - 1n);
    const integer: bigint = exponent === 0 ? fraction : fraction + (1n << 52n);
    return {
      integer: bits >> 63n === 0n ? integer : -integer,
      exponent: exponent === 0 ? -1074 : exponent - 1075,
    };
  };
}

/** An exact finite binary64 value as a signed integer times 2^exponent. */
interface IDyadic {
  /** Signed significand, including zero. */
  integer: bigint;

  /** Binary exponent; subnormal significands use -1074. */
  exponent: number;
}
