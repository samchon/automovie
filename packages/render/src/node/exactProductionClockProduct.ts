/**
 * The exact product of two MP4 clock terms as a BigInt.
 *
 * Both terms must be positive safe integers, such as a track duration in
 * ticks and the other track's timescale in ticks per second; anything else
 * throws `MP4 presentation clocks must be positive safe integers.` Two track
 * runtimes are equal exactly when `durationA * timescaleB` equals
 * `durationB * timescaleA`, which callers decide by comparing two products.
 * `muxProductionFeatureMp4` uses it to prove its two inputs share a runtime
 * and `probeProductionRenderedMedia` to prove a delivered feature's tracks do,
 * each with its own refusal text for an unequal result.
 *
 * @evidence contracts/common.md#principled-implementation Cross-multiplication decides equality of two duration-over-timescale ratios without division, and BigInt makes the product exact although it can exceed 2^53; refusing non-positive terms keeps the products meaningful, since a zero timescale would make every runtime look equal.
 * @evidence contracts/common.md#clear-and-simple-design The mux and the feature probe need the same admission and product, so the arithmetic lives here once while each caller keeps the comparison and the message that names what it failed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid terms throw instead of being clamped, rounded or treated as equal, and no clock value or caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the admitted inputs and their units, the refusal message, the runtime-equality identity callers build from two products, and which callers use it for what.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One validation and one BigInt multiplication run in constant time with no algorithm choice.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time product of two numbers is cheaper to recompute than any cache lookup, and each caller forms different products.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned BigInt is the caller's value, and the function holds no state or handle.
 */
export const exactProductionClockProduct = (
  left: number,
  right: number,
): bigint => {
  if (
    Number.isSafeInteger(left) === false ||
    left <= 0 ||
    Number.isSafeInteger(right) === false ||
    right <= 0
  )
    throw new Error("MP4 presentation clocks must be positive safe integers.");
  return BigInt(left) * BigInt(right);
};
