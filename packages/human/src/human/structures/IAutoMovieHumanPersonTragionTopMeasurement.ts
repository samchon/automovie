/**
 * The vertical distance from a named tragion to the top of the head view
 * skin, read on the person's skin at rest (`readHumanPersonTragionTop`).
 * The top is the highest head view vertex: on a triangle mesh the highest
 * point is a vertex.
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 * @evidence contracts/common.md#principled-implementation The rule is data; its reader owns the instrument.
 * @evidence contracts/common.md#clear-and-simple-design A kind, one skin point name and the source sample range.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The range is a report, never a hidden clamp of the request; a missing name refuses.
 * @evidence contracts/common.md#meaningful-documentation States the instrument, the names it reads and the meaning of the recorded range.
 * @evidence contracts/modeling.md#spatial-conventions Metres of the person frame at rest.
 * @evidence contracts/anatomy.md#anatomical-source Carries the observed range of the population its definition cites.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The rule defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The rule defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The rule emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The rule builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The rule is not displayed; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The recorded range is a source population, not an admission bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The rule converts no input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonTragionTopMeasurement {
  /** Tragion to the top of the head, vertically. */
  kind: "tragion-top";

  /** The head view's skin landmark the height is taken from. */
  tragion: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
