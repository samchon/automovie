/**
 * Decode the fixed Windows host's JSON transport result. Spawn failure retains
 * its original Error, a failed or signal-ended command reports stderr, and a
 * successful command must supply JSON. This interprets typed operation results;
 * it neither creates a process nor establishes native handle correctness.
 *
 * @evidence contracts/common.md#principled-implementation Spawn and exit outcomes are interpreted before JSON payload admission, preserving the original operational failure.
 * @evidence contracts/common.md#clear-and-simple-design Owns result interpretation separately from actual subprocess creation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Consumes host results without replacing spawn or native process methods.
 * @evidence contracts/common.md#meaningful-documentation Defines failure precedence and the successful JSON transport requirement.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Preserves failures from the actual process-ownership host transport.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Admits JSON only after successful native-host execution.
 */
export function decodeWindowsProcessResult(result: {
  error?: Error;
  status: number | null;
  stdout: string;
  stderr: string;
}): unknown {
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error("Process ownership operation failed: " + result.stderr.trim());
  return JSON.parse(result.stdout.trim());
}
