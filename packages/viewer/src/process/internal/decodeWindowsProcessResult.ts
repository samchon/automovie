/**
 * Decode the fixed Windows host's JSON transport result. Spawn failure retains its original Error, a failed or signal-ended command reports stderr, and a successful command must supply JSON. This interprets typed operation results; it neither creates a process nor establishes native handle correctness.
 *
 * @evidence contracts/common.md#principled-implementation Interprets the fixed native program transport by preserving spawn Error, refusing nonzero/null status with stderr and parsing successful stdout as JSON before the typed host consumes it.
 * @evidence contracts/common.md#clear-and-simple-design A pure result decoder stays separate from PowerShell process acquisition, native process handles and controller-owned stop permission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No failed command becomes null absence or fabricated authority; parsed JSON is not independently shape-validated here because each actual caller owns a fixed native producer and its expected result cast.
 * @evidence contracts/common.md#meaningful-documentation Documents original spawn-error priority, signal/nonzero status refusal, required JSON and the distinction between decoding and native handle correctness.
 * @evidence contracts/performance.md#efficient-algorithms Status checks are fixed and trim/JSON parse work and storage scale with actual stdout bytes; the transport owner separately caps buffered command output.
 * @evidence contracts/performance.md#reuse-equivalent-work Each supplied result is parsed independently; an earlier successful native result cannot replace a fresh identity or stop operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This function borrows value fields and returns a parsed value, acquiring no child, pipe or native process handle; the transport owns their completion.
 */
export function decodeWindowsProcessResult(result: {
  error?: Error;
  status: number | null;
  stdout: string;
  stderr: string;
}): unknown {
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      "Process ownership operation failed: " + result.stderr.trim(),
    );
  return JSON.parse(result.stdout.trim());
}
