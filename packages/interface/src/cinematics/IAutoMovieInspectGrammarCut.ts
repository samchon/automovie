

/**
 * Numerical policy thresholds for inspecting adjacent editorial shots.
 *
 * @evidence contracts/development/design.md#principled-representation IThresholds separates bearing degrees from world-metre displacement; readFilmGrammar validates both as finite positive numbers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two thresholds that inspectGrammarCut reads are exposed; camera and subject observations remain separate canonical inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Policy thresholds remain data without encoding a particular film or promising perceptual continuity.
 * @evidence contracts/development/common.md#meaningful-documentation IThresholds states defaults, units, comparison boundaries and admission ownership.
 */
export namespace IAutoMovieInspectGrammarCut {
  /**
   * Resolved jump-cut and displacement thresholds, applied to outgoing-end and incoming-start observations of the same primary subject.
   *
   * readFilmGrammar supplies defaults of 30 degrees and 10 metres and rejects non-finite or non-positive values. inspectGrammarCut accepts this record directly without repeating admission. These thresholds classify observations; they establish neither audience perception nor rendered continuity.
   *
   * @evidence contracts/development/design.md#principled-representation The angle is degrees between subject-to-camera bearings and displacement is Euclidean world metres. Both are finite positive runtime premises checked by readFilmGrammar, with no enforced upper bound on the angle.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two cut-rule thresholds vary; shot-size measurement and shot observations are supplied separately to inspectGrammarCut.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Thresholds remain caller data rather than constants tied to a film, and equality belongs to the non-finding side of both strict comparisons.
   * @evidence contracts/development/common.md#meaningful-documentation Gives units, default/admission owner, strict comparison boundaries and the observation-only scope.
   */
  export type IThresholds = {
    /** Positive finite degrees: a same-size cut warns only when its bearing change is strictly less than this value. No 180-degree ceiling is enforced. */
    minimumCutAngleDegrees: number;

    /** Positive finite world metres: displacement strictly greater than this value requests re-establishing when the incoming measured size is neither null nor wide. */
    reestablishDistance: number;
  };
}
