/** An exact finite binary64 value as a signed integer times 2^exponent. */
interface IDyadic {
  /** Signed significand, including zero. */
  integer: bigint;

  /** Binary exponent; subnormal significands use -1074. */
  exponent: number;
}

/**
 * Create a call-local exact binary64 reader shared by fracture and mass arithmetic.
 * A finite value's normal significand includes the hidden 2^52 bit; subnormals
 * use their fraction directly, with exponent -1074. No value is rounded here.
 *
 * @param view An exclusively owned call-local view of at least eight bytes; omitted, this reader owns a new eight-byte buffer. A supplied larger view retains its backing buffer for the reader's lifetime.
 * @returns A synchronous signed reader reusing that view for all finite values in the operation.
 * @throws {Error} For a view shorter than eight bytes or a non-finite value supplied to the reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States IEEE binary64 significand/exponent rules, finite domain, caller-owned view premise, return and resource lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation DataView reads the same 64-bit encoding written by setFloat64. Masking fraction/exponent and restoring the normal hidden bit gives value=integer*2^exponent exactly, with bias 1023, 52 fraction bits and an independent sign bit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit one view, then return a finite-input reader with one write and bit decomposition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No magnitude cap, tolerance, decimal conversion, physical default or shared global view changes a value; the caller owns the exclusive view during synchronous reads.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each read handles one fixed-width encoding and a significand of at most 53 bits in constant time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One representation owner serves fracture's exact inequality and mass's exceptional rational arithmetic; one view is reused across every term of that operation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader closes over only its own eight-byte view or the explicitly supplied view/backing buffer. No numeric input, history, task or external handle is retained; consumers keep the reader only for one synchronous calculation.
 */
export function ArchetypeBinary64(
  view: DataView = new DataView(new ArrayBuffer(8)),
): (value: number) => IDyadic {
  if (view.byteLength < 8)
    throw new Error("Binary64 decomposition needs an eight-byte view");

  /** Keep only the exact signed significand and exponent after a synchronous read. */
  return (value: number): IDyadic => {
    if (!Number.isFinite(value))
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
