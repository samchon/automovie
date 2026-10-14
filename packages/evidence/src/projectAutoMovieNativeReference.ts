import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";


/**
 * Preserve a native reference's structural policy without companion rows.
 *
 * File-parentage and native claim projection share this boundary, including caller-authored extensions. A new record protects the original declaration.
 *
 *
 * @evidence contracts/common.md#principled-implementation Object spread copies the native reference and replaces only companion-review enforcement with false.
 * @evidence contracts/common.md#clear-and-simple-design One reference boundary is shared by direct parentage and claim projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Caller-authored target selectors and all structural fields survive unchanged; no empty target inventory is invented.
 * @evidence contracts/common.md#meaningful-documentation The comment explains nonmutation and the companion policy; the return keeps the native reference representation.
 * @evidence contracts/performance.md#efficient-algorithms Copying K enumerable own fields takes O(K) field operations, including caller extensions; selector arrays and nested values remain shared by identity rather than traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work Scalar and array claim consumers use this same policy rather than duplicate field rewrites.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One K-field shallow record transfers to the caller and retains referenced nested values; the helper acquires no source bytes, descriptor or result cache.
 */
export const projectAutoMovieNativeReference: (reference: ITtscEvidenceGraphReference) => ITtscEvidenceGraphReference = (
  reference: ITtscEvidenceGraphReference,
): ITtscEvidenceGraphReference => ({ ...reference, requireReview: false });
