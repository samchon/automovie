/**
 * Interpret ps creation-date output without performing a process query. The
 * host's status 0 or 1 can describe a present or absent PID; an empty birth
 * string is absence, not stop authority. Other statuses and spawn errors
 * retain discovery failure. Date precision remains that of the supplied ps
 * format and does not make subsequent PID signalling atomic.
 *
 * @evidence contracts/common.md#principled-implementation Distinguishes supported ps outcomes from spawn/exit failure before accepting a nonempty creation date.
 * @evidence contracts/common.md#clear-and-simple-design Owns discovery-result interpretation independently of executing ps or signalling a PID.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the actual reported creation string rather than guessed age or executable names.
 * @evidence contracts/common.md#meaningful-documentation States absence, failure precedence and retained date precision.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Keeps absent or failed process discovery from becoming termination authority.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Interprets the native POSIX creation-date transport separately from its signal effect.
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
