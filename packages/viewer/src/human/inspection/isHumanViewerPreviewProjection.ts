import type { IHumanViewerPreviewProjection } from "./IHumanViewerPreviewProjection.js";

/**
 * Recognize the numerical preview envelope shared by cache encoding, upload admission and decoding. The model must be a non-null object, excluding an array. This shallow guard does not validate model members or construction admission; the numerical domain owner remains responsible for those facts.
 *
 * @evidence contracts/common.md#principled-implementation Structural envelope admission checks an object preview discriminator and an object model before codec or storage consumers use the result; nested numerical schema remains outside this predicate.
 * @evidence contracts/common.md#clear-and-simple-design One shared predicate defines the common preview boundary for encoder, decoder and upload admission without combining their separate byte/projection responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cache key, subject id or expected geometry changes admission; malformed primitive/array models cannot masquerade as numerical previews.
 * @evidence contracts/common.md#meaningful-documentation Documentation gives the object-model requirement, supported consumers and the explicit limitation that nested schema and numerical admission are not certified.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed number of structural property checks chooses no traversal or allocation strategy and never scans model contents.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless predicate retains no cross-request result; matching object identity alone does not establish numerical source or basis authority.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The guard borrows its unknown value without retaining it or acquiring buffers, worker sessions or disk handles.
 */
export function isHumanViewerPreviewProjection(
  value: unknown,
): value is IHumanViewerPreviewProjection & {
  operation: "preview";
  model: object;
} {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    "operation" in value && value.operation === "preview" &&
    "model" in value && value.model !== null && typeof value.model === "object" &&
    !Array.isArray(value.model);
}
