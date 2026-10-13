/**
 * Admit an actual process selector before any host effect. A fractional,
 * nonpositive or unsafe integer cannot identify an owned operating-system
 * process and must never reach discovery or termination.
 *
 * @evidence contracts/common.md#principled-implementation Uses positive safe integers for the PID selector before native host operations.
 * @evidence contracts/common.md#clear-and-simple-design One admission owns the selector rule shared by discovery, trees and termination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses malformed selectors rather than coercing them into another process ID.
 * @evidence contracts/common.md#meaningful-documentation States refusal timing and the supported selector domain.
 */
export function requireProcessId(pid: number): void {
  if (!Number.isSafeInteger(pid) || pid <= 0)
    throw new Error("A positive integer process ID is required");
}
