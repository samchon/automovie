/**
 * Read a native worker failure without assuming that every error event is an
 * ErrorEvent. A module that could not load can dispatch a plain Event with no
 * message; its transport must still retire the connection and settle callers.
 * The caller supplies the domain's fallback. ErrorEvent details and ordinary
 * errors keep their available message.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Reads a nonempty trimmed string, message property or nested Error message in that order and otherwise returns the caller's fallback; unknown null/plain events remain valid failure inputs.
 * @evidence contracts/common.md#clear-and-simple-design Portable error text extraction stays separate from transport termination and request fan-out in createHumanResidentWorker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing browser details do not become success or an invented domain-specific event. The caller supplies its fallback; getters/proxies can still throw while properties are inspected.
 * @evidence contracts/common.md#meaningful-documentation The comment explains plain Event/module-load failures, domain fallback and available-message preservation; original stack/location/Error identity are not promised.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of type/property checks and trimming operations costs time proportional to the inspected message length, without walking nested arbitrary objects.
 * @evidence contracts/performance.md#reuse-equivalent-work The same extractor serves body and face transport with caller-specific fallback; events are evaluated independently and equal text does not mean equal failures.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns text and retains no event, connection or callback; the transport owner handles termination and pending request retention.
 */
export function humanWorkerErrorMessage(
  value: unknown,
  fallback: string,
): string {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value !== "object" || value === null) return fallback;
  if (
    "message" in value &&
    typeof value.message === "string" &&
    value.message.trim() !== ""
  )
    return value.message.trim();
  if ("error" in value && value.error instanceof Error)
    return value.error.message.trim() || fallback;
  return fallback;
}
