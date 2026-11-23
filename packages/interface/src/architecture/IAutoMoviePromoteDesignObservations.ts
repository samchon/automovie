import type { IAutoMovieDesignReference } from "./IAutoMovieDesignReference";

/**
 * Data and callback contracts shared by the PromoteDesignObservations
 * operations.
 */
export namespace IAutoMoviePromoteDesignObservations {
  /**
   * Ask one reference for metric geometry, and get back what it can honestly
   * give.
   *
   * This gated promotion path refuses by default. A candidate promotes only
   * with a settled frame scale, an `observed` producing analysis, no competing
   * reading or open issue, confidence at the caller's floor and geometric
   * primitives. Other candidates land in `withheld` with the first failing
   * reason; non-observed analyses land in `skipped` with their `unsupported` or
   * `not-run` status. The lower-level point mapper remains separately
   * callable.
   *
   * The result is therefore never a design. It is a proposal the authored
   * building source may accept, reject, or contradict; the source of truth
   * stays the TypeScript that a human and a coding agent wrote.
   *
   * Gates run in a fixed order and the first failing one names the withholding:
   * `unobserved`, `ambiguous-candidate`, `open-issue`, `low-confidence`,
   * `unsupported-geometry` (only line, polyline and region carry an outline),
   * then `unknown-scale`. A promoted candidate carries one world-metre outline
   * per primitive it reads, in the candidate's primitive order. Candidates,
   * withholdings and skips keep the reference's declaration order. An invalid
   * reference, refused by {@link validateDesignReference}, or a floor outside
   * [0, 1] throws an `Error` naming the first defect.
   */
  export type IProps = {
    /** Observed reference whose candidates are judged; validated before use. */
    reference: IAutoMovieDesignReference;

    /**
     * Inclusive confidence floor in `[0, 1]`. Defaults to `1`, so nothing but a
     * certain reading promotes unless the caller consciously lowers the bar.
     */
    minimumConfidence?: number;
  };
}
