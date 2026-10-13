/**
 * Admit an actual process selector before any host effect. A fractional,
 * nonpositive or unsafe integer cannot identify an owned operating-system
 * process and must never reach discovery or termination.
 */
export function requireProcessId(pid: number): void {
  if (!Number.isSafeInteger(pid) || pid <= 0)
    throw new Error("A positive integer process ID is required");
}
