/**
 * One numerical face operation. The document is admitted by the runtime for
 * preview, export and explicit construction inspection; optional measurements
 * and occlusion are explicit.
 *
 * @evidence contracts/common.md#principled-implementation A serialized numerical document, explicit preview/export/construct operation and opt-in bake/census flags route the same resident numerical owner; construction inspection does not grant ordinary admission.
 * @evidence contracts/common.md#clear-and-simple-design One closed operation vocabulary and two independent optional flags expose the existing runtime choices without transport-specific asset fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The request supplies no external asset URL, default anatomical measurement or viewer verdict; parsing and physical admission remain runtime responsibilities.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish admitted preview, serialized export and separately qualified construction, and describe optional work.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This request schema executes no document parse, bake or crossing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no prepared-basis cache or repeated-request equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the serialized document and request lifetime; the type creates no resident worker or task.
 *
 * @author Samchon
 */
export interface ConnectedFaceRequest {
  /** Serialized numerical face document to admit and evaluate. */
  document: string;

  /** Preview admits geometry, export encodes it, and construction retains a separate full admission report. */
  operation: "preview" | "export" | "construct";

  /** Whether a preview or explicit construction asks for the surface crossing census. */
  measure?: boolean;

  /** Whether to bake ambient occlusion into the evaluated materials. */
  occlusion?: boolean;
}
