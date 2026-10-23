/** One human-readable sample taken from metadata after a bulk rewrite. */
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
