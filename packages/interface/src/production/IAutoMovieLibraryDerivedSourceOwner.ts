/**
 * A library owner whose complete contribution was explicitly precomputed.
 *
 * The builder reads the declared, current UTF-8 artifact after admitting this
 * source export against its design owner. It applies the same contribution and
 * spatial validation as a build result. No generator executes during compile,
 * and payload decoding does not consume the authored module's execution budget.
 * A registration must choose this path or a build function, never both.
 *
 * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-derived-artifact Selects a verified precomputed contribution without copying its payload through authored execution.
 */
export interface IAutoMovieLibraryDerivedSourceOwner {
  /** Exact active design-document and H2 address this export realizes. */
  design: string;

  /**
   * Current UTF-8 ledger output path containing one IAutoMovieLibraryContribution
   * as JSON whose objects never repeat a member name.
   */
  derivedArtifact: string;
}
