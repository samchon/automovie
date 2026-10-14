/**
 * The vertical distance from a named tragion to the top of the head view
 * skin, read on the person's skin at rest (`readHumanTragionTop`).
 * The top is the highest head view vertex: on a triangle mesh the highest
 * point is a vertex.
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 *
 * @evidence contracts/common.md#principled-implementation The rule measures vertical distance from a named tragion to the highest rest-head vertex; triangle linearity makes a vertex sufficient, while cited extrema are reporting-only.
 * @evidence contracts/common.md#clear-and-simple-design The discriminant and source landmark configure a height reader without embedding a second head-top search.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sample limits are not physiological admission or replacement readings, and no fixed tragion identifier is forced by this type.
 * @evidence contracts/common.md#meaningful-documentation The prose gives mesh-vertex top semantics, named-source refusal, rest state and metre sample context.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This height configuration performs no scan of head positions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The rule retains no prior top or distance cache for changing skin.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source-name/sample fields remain caller-owned ordinary data without collections, handles or asynchronous work.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTragionTopMeasurement {
  /** Tragion to the top of the head, vertically. */
  kind: "tragion-top";

  /** The head view's skin landmark the height is taken from. */
  tragion: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
