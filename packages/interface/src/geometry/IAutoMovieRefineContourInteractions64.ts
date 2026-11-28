/**
 * Qualification and measured work of contour interaction refinement.
 *
 * Refinement chooses a coordinate projection from the first selected ring and
 * classifies its represented chords by exact dyadic orientation signs.
 * Contacted curved restrictions can be split at their source phases. Linear
 * contact and exhausted refinement remain unresolved. Supply admitted rings in
 * a common planar section and source callbacks. Surrounding preparation records
 * callback and arithmetic failures.
 */
export namespace IAutoMovieRefineContourInteractions64 {
  /**
   * Newly owned trace and scalar observations after one refinement call. Fewer
   * than two selected rings returns qualified:true, empty diagnostics and zero
   * counters; requested timing can still report that invocation's duration.
   */
  export type IResult = {
    /**
     * No unresolved chord contact remained in the chosen projection. The trace
     * can still record contact that was subsequently separated.
     */
    qualified: boolean;
    /**
     * Contact witnesses, successful projected separation and unresolved-contact
     * reasons in encounter order. Nonempty does not imply qualified:false.
     */
    diagnostics: string[];
    /** Actual retained source-restriction splits, a nonnegative integer count. */
    refinements: number;
    /**
     * Candidate chord pairs visited, including revisits after source
     * refinement.
     */
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
