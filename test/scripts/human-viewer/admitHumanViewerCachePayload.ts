/** The members of the numerical preview projection the page persists. */
const CACHE_FIELDS = new Set(["operation", "model", "articulation", "contact", "crossings", "extras", "anatomy"]);

/**
 * Admit one numerical cache upload: a JSON object holding only the numerical
 * preview projection, with `operation` "preview" and a model. Any other member
 * could carry display or photograph data onto disk, so it refuses rather than
 * being dropped or re-encoded. Throws the reason; the caller stores the bytes
 * as received.
 *
 * @evidence contracts/common.md#principled-implementation Refuses any member outside the numerical projection instead of filtering it.
 * @evidence contracts/common.md#clear-and-simple-design One validator owns cache payload admission; storage stays with the route.
 * @evidence contracts/common.md#meaningful-documentation States the accepted members and why others refuse.
 */
export function admitHumanViewerCachePayload(body: Buffer): void {
  const payload: unknown = JSON.parse(body.toString("utf8"));
  if (payload === null || typeof payload !== "object" || Array.isArray(payload))
    throw new Error("the payload is not a JSON object");
  const extra = Object.keys(payload).filter((name) => !CACHE_FIELDS.has(name));
  if (extra.length !== 0)
    throw new Error("members outside the numerical projection: " + extra.join(", "));
  if (!("operation" in payload) || payload.operation !== "preview" ||
      !("model" in payload) || payload.model === undefined)
    throw new Error("expected a numerical preview with a model");
}
