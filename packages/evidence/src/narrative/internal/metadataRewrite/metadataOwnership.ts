import type { EvidenceMetadataRewriteOwnership } from "../../EvidenceMetadataRewriteOwnership";

/**
 * Rejects an untyped caller that did not declare one exact mutable region.
 *
 * @evidence contracts/common.md#principled-implementation Equality checks accept only the four declared regions even from untyped callers.
 * @evidence contracts/common.md#clear-and-simple-design One boundary check precedes projection ownership selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported values throw without broader ownership or default behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states runtime validation; errors enumerate allowed regions.
 * @evidence contracts/performance.md#efficient-algorithms Four scalar comparisons require constant time and auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work The fixed vocabulary needs no cached request work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No state or resources are retained.
 */
export function metadataOwnership(
  ownership: EvidenceMetadataRewriteOwnership,
): EvidenceMetadataRewriteOwnership {
  if (
    ownership === "comments" ||
    ownership === "acknowledgements" ||
    ownership === "reviews" ||
    ownership === "fingerprints"
  )
    return ownership;
  throw new Error(
    "ownership: expected comments, acknowledgements, reviews, or fingerprints.",
  );
}
