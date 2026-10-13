import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import { projectAutoMovieNativeReference } from "./projectAutoMovieNativeReference";


/** Apply the native companion policy in the declared reference order.
 *
 * @evidence contracts/common.md#principled-implementation Ordered map applies the scalar companion policy to every supplied reference, including an empty population.
 * @evidence contracts/common.md#clear-and-simple-design One array projection preserves declared reference order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No placeholder target is inserted for empty inputs and original records remain unmodified.
 * @evidence contracts/common.md#meaningful-documentation The comment states ordered application of the native companion policy.
 * @evidence contracts/performance.md#efficient-algorithms For R references, mapping costs O(R) time and O(R) new records and array storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The scalar helper owns the shared field policy; complete projected arrays are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned array and records; no input array is mutated or retained internally.
 */
export const projectAutoMovieNativeReferences: (references: readonly ITtscEvidenceGraphReference[]) => ITtscEvidenceGraphReference[] = (
  references: readonly ITtscEvidenceGraphReference[],
): ITtscEvidenceGraphReference[] =>
  references.map(projectAutoMovieNativeReference);
