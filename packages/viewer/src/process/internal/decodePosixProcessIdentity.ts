/**
 * Interpret ps creation-date output without performing a process query. The host's status 0 or 1 can describe a present or absent PID; an empty birth string is absence, not stop authority. Other statuses and spawn errors retain discovery failure. Date precision remains that of the supplied ps format and does not make subsequent PID signalling atomic.
 *
 * @evidence contracts/common.md#principled-implementation Interprets actual ps result status/error and nonempty creation-date text, preserving null absence and rejecting failed transports without native effects.
 * @evidence contracts/common.md#clear-and-simple-design A small pure result decoder separates ps output semantics from process spawning and subsequent stop admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original spawn errors win, unexpected status refuses and ps date precision does not make later pid signalling atomic or guarantee every within-precision reuse is distinguished.
 * @evidence contracts/common.md#meaningful-documentation Documentation names supported 0/1 statuses, empty absence, operational failure and date/signal precision limits.
 * @evidence contracts/performance.md#efficient-algorithms Fixed status checks and stdout trim are linear in the small output text, with no extra process scan or date-number conversion.
 * @evidence contracts/performance.md#reuse-equivalent-work The decoder caches no previous birth string and treats each native result as a new observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned text is retained; subprocess lifetime and native process ownership remain outside this pure decoder.
 */
export function decodePosixProcessIdentity(result: {
  error?: Error;
  status: number | null;
  stdout: string;
  stderr: string;
}): string | null {
  if (result.error) throw result.error;
  if (result.status !== 0 && result.status !== 1)
    throw new Error("Could not read the process creation date: " + result.stderr);
  return result.stdout.trim() || null;
}
