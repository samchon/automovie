/**
 * One human-readable sample taken from metadata after a bulk rewrite.
 *
 * @evidence contracts/common.md#principled-implementation A record identifies exact declaration text by normalized path, one-based line, language and confirmer.
 * @evidence contracts/common.md#clear-and-simple-design Explicit audit data can be matched against parsed candidate declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record does not independently prove a render was viewed; validation checks identity and text consistency.
 * @evidence contracts/common.md#meaningful-documentation Properties define normalization, source-line units, excluded delimiters and confirmer identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
 */
export interface IEvidenceMetadataRenderedSample {
  /** Slash-normalized protected path containing the sampled declaration. */
  file: string;

  /** One-based source line of the sampled declaration. */
  line: number;

  /** Language in which the sample was visually checked. */
  language: string;

  /** Exact declaration or heading section with its reason, without delimiters. */
  text: string;

  /** Durable identity of the person or agent that confirmed readability. */
  confirmedBy: string;
}
