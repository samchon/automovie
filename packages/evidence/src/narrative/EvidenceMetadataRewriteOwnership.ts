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
 * @evidence contracts/common.md#principled-implementation A closed union limits mutations to comments, acknowledgements, reviews or fingerprint tokens.
 * @evidence contracts/common.md#clear-and-simple-design This vocabulary is shared by runtime validation and projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These alternatives are structural protocol regions, not consumer exceptions.
 * @evidence contracts/common.md#meaningful-documentation The comment defines delimiters, reasons and surrounding bytes protected for each ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
 */
export type EvidenceMetadataRewriteOwnership =
  | "comments"
  | "acknowledgements"
  | "reviews"
  | "fingerprints";
