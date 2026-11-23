/**
 * Untrusted parsed sample-entry children and their enclosing audio identity.
 * productionOpusDescription inspects unknown box values at the parser boundary,
 * validates the supported dOps fields and channel mapping, and throws for a
 * non-Opus codec, missing/duplicate dOps boxes, or malformed field/mapping
 * data. Unknown represents external parser data, not a hidden SDK contract.
 */
export interface IAutoMovieProductionOpusDescriptionProps {
  /** Parsed sample-entry children; absence is treated as no dOps box. */
  boxes: readonly unknown[] | undefined;

  /** Sample-entry codec spelling; the Opus family is matched case-insensitively. */
  codec: string;

  /** Channel count read from the enclosing audio sample entry. */
  trackChannels: number;
}
