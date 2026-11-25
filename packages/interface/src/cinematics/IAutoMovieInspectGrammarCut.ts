/** Numerical policy thresholds for inspecting adjacent editorial shots. */
export namespace IAutoMovieInspectGrammarCut {
  /**
   * Resolved jump-cut and displacement thresholds, applied to outgoing-end and
   * incoming-start observations of the same primary subject.
   *
   * ReadFilmGrammar supplies defaults of 30 degrees and 10 metres and rejects
   * non-finite or non-positive values. inspectGrammarCut accepts this record
   * directly without repeating admission. These thresholds classify
   * observations; they establish neither audience perception nor rendered
   * continuity.
   */
  export type IThresholds = {
    /**
     * Positive finite degrees: a same-size cut warns only when its bearing
     * change is strictly less than this value. No 180-degree ceiling is
     * enforced.
     */
    minimumCutAngleDegrees: number;

    /**
     * Positive finite world metres: displacement strictly greater than this
     * value requests re-establishing when the incoming measured size is neither
     * null nor wide.
     */
    reestablishDistance: number;
  };
}
