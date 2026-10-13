/**
 * Decode the fixed Windows host's JSON transport result. Spawn failure retains
 * its original Error, a failed or signal-ended command reports stderr, and a
 * successful command must supply JSON. This interprets typed operation results;
 * it neither creates a process nor establishes native handle correctness.
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
