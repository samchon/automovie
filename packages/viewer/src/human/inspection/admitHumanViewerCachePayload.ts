import { isHumanViewerPreviewProjection } from "./isHumanViewerPreviewProjection.js";

/** The members of the numerical preview projection the page persists. */
const CACHE_FIELDS: ReadonlySet<string> = new Set<string>([
  "operation",
  "model",
  "articulation",
  "contact",
  "crossings",
  "extras",
  "anatomy",
]);

/**
 * Admit one numerical cache upload: a JSON object holding only the numerical preview projection, with `operation` "preview" and a non-null object model. This checks the envelope and top-level fields, not the model's inner schema. Any other top-level member could carry display or photograph data onto disk, so it refuses rather than being dropped or re-encoded. Throws the reason; the caller stores the bytes as received.
 *
 * @evidence contracts/common.md#principled-implementation JSON object admission requires the preview discriminator and a non-null object model, then rejects top-level keys outside the declared numerical projection before storage.
 * @evidence contracts/common.md#clear-and-simple-design This disk-boundary guard checks projection membership; domain numerical owners remain responsible for complete model-schema and construction admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extra top-level display or photograph fields refuse rather than being stripped; arbitrary nested model schema is not certified by this shallow projection check.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies preview/object-model requirements, refusal effects, received-byte preservation and the limited projection check.
 * @evidence contracts/performance.md#efficient-algorithms Parsing is O(B) in UTF-8 JSON bytes and top-level membership checking is O(K) using a fixed seven-key Set; parsed data and rejected-key reporting use O(B + K) temporary memory.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each uploaded byte sequence is admitted independently; matching cache keys do not prove equal uploaded projection bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The guard borrows the upload Buffer and retains no parsed model or disk handle after return or rejection.
 */
export function admitHumanViewerCachePayload(body: Buffer): void {
  const payload: unknown = JSON.parse(body.toString("utf8"));
  if (payload === null || typeof payload !== "object" || Array.isArray(payload))
    throw new Error("the payload is not a JSON object");
  const extra: string[] = Object.keys(payload).filter((name: string): boolean => !CACHE_FIELDS.has(name));
  if (extra.length !== 0)
    throw new Error(
      "members outside the numerical projection: " + extra.join(", "),
    );
  if (!isHumanViewerPreviewProjection(payload))
    throw new Error("expected a numerical preview with a model");
}
