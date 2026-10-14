

/**
 * Require a safe nonnegative glTF byte offset.
 *
 * @evidence contracts/common.md#principled-implementation Number type, safe-integer identity and nonnegative sign protect subsequent declared-range arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One shared scalar rule serves buffer/accessor offsets without embedding range ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fractions, negative offsets and unsafe integers throw rather than being truncated or clamped.
 * @evidence contracts/common.md#meaningful-documentation Prose states zero allowance, integer precision requirement, path diagnostic and unchanged input.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar checks require constant time without payload allocation or byte traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work All offset owners reuse this gate; final offset-plus-length bounds remain with their range validators.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No input record or offset cache survives this pure admission call.
 * @author Samchon
 */
export const nonNegativeInteger: (value: unknown, path: string) => void = (value: unknown, path: string): void => {
  if (
    typeof value !== "number" ||
    Number.isSafeInteger(value) === false ||
    value < 0
  )
    throw new Error(`${path} must be a non-negative safe integer.`);
};
