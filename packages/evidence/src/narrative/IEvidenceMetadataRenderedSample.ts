/**
 * One human-readable sample taken from metadata after a bulk rewrite.
 *
 * @evidence contracts/development/design.md#principled-representation A record identifies exact declaration text by normalized path, one-based line, language and confirmer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Explicit audit data can be matched against parsed candidate declarations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This record does not independently prove a render was viewed; validation checks identity and text consistency.
 * @evidence contracts/development/common.md#meaningful-documentation Properties define normalization, source-line units, excluded delimiters and confirmer identity.
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
