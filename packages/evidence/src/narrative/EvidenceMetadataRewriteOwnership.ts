/**
 * Exact structural metadata bytes one scoped operation may change.
 *
 * `comments` owns complete grammar-valid evidence comments between their HTML
 * delimiters. `acknowledgements` and `reviews` own only the corresponding
 * declaration text, including the reason paragraphs of H2–H4 evidence sections,
 * leaving delimiters, inter-section blank lines, and the other declaration
 * family protected. `fingerprints` owns only the structural hash token in a
 * review header, never an identical token in its target or reason.
 */
export type EvidenceMetadataRewriteOwnership =
  | "comments"
  | "acknowledgements"
  | "reviews"
  | "fingerprints";
