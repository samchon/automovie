/**
 * Preserve the message of a failed census build without truncating its cause.
 * Maintained builders throw Error objects; a foreign failure value still has
 * an explicit string representation rather than causing message access itself
 * to fail. The coordinator records this text as an unmeasured refusal, never
 * as a numeric result or anatomical acceptance. Reads and mutates no input.
 *
 * @evidence contracts/common.md#principled-implementation Error messages preserve their original cause text; other failure values use the language's String conversion instead of assuming an unchecked message property.
 * @evidence contracts/common.md#clear-and-simple-design One failure-to-text conversion is shared by rest and pose refusal handling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cause is truncated or replaced by a passing measurement.
 * @evidence contracts/common.md#meaningful-documentation States the caller, supported Error/foreign-value cases and the distinction between a refusal and acceptance.
 */
export function bodyPoseCensusRefusalMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
