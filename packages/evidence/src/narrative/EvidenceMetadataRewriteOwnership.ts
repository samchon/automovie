/**
 * Exact structural metadata bytes one scoped operation may change.
 *
 * `comments` owns complete grammar-valid evidence comments between their HTML
 * delimiters. `acknowledgements` and `reviews` own only the corresponding
 * declaration text, including the reason paragraphs of H2–H4 evidence sections,
 * leaving delimiters, inter-section blank lines, and the other declaration
 * family protected. `fingerprints` owns only the structural hash token in a
 * review header, never an identical token in its target or reason.
 *
 * @evidence contracts/development/design.md#principled-representation A closed union limits mutations to comments, acknowledgements, reviews or fingerprint tokens.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This vocabulary is shared by runtime validation and projection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These alternatives are structural protocol regions, not consumer exceptions.
 * @evidence contracts/development/common.md#meaningful-documentation The comment defines delimiters, reasons and surrounding bytes protected for each ownership.
 */
export type EvidenceMetadataRewriteOwnership =
  | "comments"
  | "acknowledgements"
  | "reviews"
  | "fingerprints";
