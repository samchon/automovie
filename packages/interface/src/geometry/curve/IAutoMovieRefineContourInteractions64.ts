/**
 * Qualification and measured work of contour interaction refinement.
 *
 * refineAutoMovieContourInteractions64 projects a common planar section onto
 * its dominant coordinate plane and classifies represented binary64 chords by
 * exact dyadic orientation signs. Contacted curved source restrictions may be
 * split while preserving endpoint identity and the supplied physical tolerance.
 * Linear contacts and exhausted refinement remain explicit unresolved results.
 * Input rings and source callbacks must already be admitted; callback and
 * arithmetic failures can throw, and the surrounding preparation stage records
 * those failures separately instead of fabricating a successful result.
 *
 * @evidence contracts/development/design.md#principled-representation A qualification flag is separate from contact traces, exact-predicate work counts and optional elapsed time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This result records one invocation and carries no unused source-ring type parameter or retained geometry buffer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exact predicates certify represented chord signs, not source-curve simplicity, injectivity or exact floating-point subdivision.
 * @evidence contracts/development/common.md#meaningful-documentation Defines projection scope, unresolved contact, trace interpretation, count ownership and absent timing.
 */
export namespace IAutoMovieRefineContourInteractions64 {
  /**
   * Newly owned trace and scalar observations after one refinement call.
   * Fewer than two selected rings returns qualified:true, empty diagnostics and
   * zero counters; requested timing can still report that invocation's duration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Refinement qualification, ordered trace, split/predicate counts and nullable millisecond timing remain separate measurements. Nonempty diagnostics do not imply failure, and null elapsedMs means timing was not requested rather than zero work.
   * @evidence contracts/development/design.md#principled-representation Refinement qualification, ordered trace, split/predicate counts and nullable millisecond timing remain separate measurements.
   * @evidence contracts/development/design.md#minimal-and-owned-surface refineAutoMovieContourInteractions64 returns owned observations to boundary preparation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nonempty diagnostics do not imply failure, and null elapsedMs means timing was not requested rather than zero work.
   */
  export type IResult = {
    /**
     * No unresolved represented chord contact remained when refinement ended.
     * Successful separation after earlier contact can still leave trace messages.
     */
    qualified: boolean;
    /**
     * Contact witnesses, successful projected separation and unresolved-contact
     * reasons in encounter order. Nonempty does not imply qualified:false.
     */
    diagnostics: string[];
    /** Actual retained source-restriction splits, a nonnegative integer count. */
    refinements: number;
    /** Candidate chord pairs visited, including revisits after source refinement. */
    chordPairs: number;
    /** Exact dyadic orientation predicate calls made by this invocation. */
    exactOrientationTests: number;
    /**
     * Observed invocation duration in milliseconds when observeWork is true;
     * null otherwise. Timing never influences refinement or qualification.
     */
    elapsedMs: number | null;
  };
}
