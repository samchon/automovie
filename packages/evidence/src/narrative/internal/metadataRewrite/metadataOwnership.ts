import type { EvidenceMetadataRewriteOwnership } from "../../EvidenceMetadataRewriteOwnership";

/**
 * Rejects an untyped caller that did not declare one exact mutable region.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Equality checks accept only the four declared regions even from untyped callers.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One boundary check precedes projection ownership selection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unsupported values throw without broader ownership or default behavior.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states runtime validation; errors enumerate allowed regions.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four scalar comparisons require constant time and auxiliary space.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed vocabulary needs no cached request work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No state or resources are retained.
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
