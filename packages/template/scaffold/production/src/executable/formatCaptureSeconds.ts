/**
 * Write a film second as it appears in capture file and folder names: milliseconds, zero-padded to seven characters, such as `002.400`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the precision, the padding and one example.
 * @evidence contracts/development/implementation.md#principled-implementation Fixed width makes names sort in time order below a thousand seconds, past which a name grows by a digit instead of being cut, and three decimals separate neighbouring frames of any film up to a thousand frames per second.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A second that is negative or not finite throws instead of producing a name that does not sort.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Frames, sheets and folders are all named through this one function, so a still's name and the sheet that holds it agree.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a string and keeps nothing.
 */
export function formatCaptureSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new Error(`Capture second ${seconds} is not a film time`);
  return seconds.toFixed(3).padStart(7, "0");
}
