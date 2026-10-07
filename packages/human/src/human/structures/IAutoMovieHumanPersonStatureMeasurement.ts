/**
 * The person's stature: the standing floor-to-vertex height of the closed
 * skin at rest (`readHumanPersonRest`). The observed range of the cited
 * source sample is recorded for reporting, not as a bound.
 *
 * @evidence contracts/common.md#principled-implementation The rule is data; the rest reader owns the instrument.
 * @evidence contracts/common.md#clear-and-simple-design A kind and the source sample range.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The range is a report, never a hidden clamp of the request.
 * @evidence contracts/common.md#meaningful-documentation States the definition and the meaning of the recorded range.
 * @evidence contracts/modeling.md#spatial-conventions Metres along +Y of the person frame.
 * @evidence contracts/anatomy.md#anatomical-source Carries the observed range of the population its definition cites.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The rule defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The rule is keyed by the channel its consumers solve, but defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The rule emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The rule builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The rule is not displayed.
 * @evidenceExclude contracts/anatomy.md#permitted-range The recorded range is a source population, not an admission bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The rule converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonStatureMeasurement {
  /** The standing floor-to-vertex height at rest. */
  kind: "stature";

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
