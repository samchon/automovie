/**
 * Read a native worker failure without assuming that every error event is an
 * ErrorEvent. A module that could not load can dispatch a plain Event with no
 * message; its transport must still retire the connection and settle callers.
 * The caller supplies the domain's fallback. ErrorEvent details and ordinary
 * errors keep their available message.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supplies a worker failure reason even when a module-load event has no message, allowing the transport to reject pending edits while retaining the committed face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Normalizes the native failure at the request transport boundary before it retires the failed connection.
 * @author Samchon
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
