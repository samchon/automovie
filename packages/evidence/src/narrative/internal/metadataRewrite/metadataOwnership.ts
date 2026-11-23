import type { EvidenceMetadataRewriteOwnership } from "../../EvidenceMetadataRewriteOwnership";

/** Rejects an untyped caller that did not declare one exact mutable region. */
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
