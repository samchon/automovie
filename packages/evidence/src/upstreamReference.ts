import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import { sharedReference } from "./sharedReference";

/**
 * An upstream duty is an exclusion-permitted checklist for each child unit.
 *
 * @evidence contracts/common.md#principled-implementation An upstream family route creates a per-host checklist with explicit exclusion permission.
 * @evidence contracts/common.md#clear-and-simple-design The wrapper fixes upstream cardinality while sharedReference owns physical inventory resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The allow-exclusion choice belongs to the supported upstream contract family, not a caller-specific pass condition.
 * @evidence contracts/common.md#meaningful-documentation The caller supplies root, basename and native review flag; current graph construction passes false.
 * @evidence contracts/performance.md#efficient-algorithms The fixed inventory lookup dominates the constant-sized reference construction.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared route resolution is reused instead of duplicating inventory spelling here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned reference is caller-owned and the wrapper retains no target state.
 */
export function upstreamReference(shared: string, file: string, review: boolean): ITtscEvidenceGraphReference {
  return sharedReference(shared, "upstream", file, review, true, true);
}
