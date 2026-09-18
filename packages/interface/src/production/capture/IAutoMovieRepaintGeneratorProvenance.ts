/**
 * Descriptive metadata and cost basis for the generator behind repaint.
 *
 * The cost basis and production consumer accompany the selected runtime.
 *
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types the cost basis and production consumer accompanying the selected generator.
 */
export interface IAutoMovieRepaintGeneratorProvenance {
  /** Optional descriptive source location. */
  source?: string;

  /** Optional descriptive license metadata. */
  license?: string;

  /** Optional descriptive date metadata. */
  termsCheckedAt?: string;

  /** Authored cost basis, including an explicit local-compute basis. */
  cost: string;

  /** Typed production consumer and authored reason for this adoption. */
  consumer: {
    /** Exact generated-content lane. */
    kind: "repaint";

    /** Why this production needs a repainted appearance rendition. */
    reason: string;
  };
}
