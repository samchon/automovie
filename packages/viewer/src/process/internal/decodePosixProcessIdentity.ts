/**
 * Interpret ps creation-date output without performing a process query. The
 * host's status 0 or 1 can describe a present or absent PID; an empty birth
 * string is absence, not stop authority. Other statuses and spawn errors
 * retain discovery failure. Date precision remains that of the supplied ps
 * format and does not make subsequent PID signalling atomic.
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
