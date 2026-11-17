import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanWebCurve; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanWebCurve exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups SampledCurve, SampledResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanWebCurve; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the SampledCurve, SampledResult contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanWebCurve {
  /** The curve argument of AutoMovieHumanWebCurve.sampled. A curve read by its depth along a direction from its start: the point where
  it first reaches a depth, so a web's rows are level sets of that depth. A
  curve that leaves its start across the direction (a saddle's own column)
  reaches its first depths at their square root. Past its ends it runs on
  along its end tangents.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A curve read by its depth along a direction from its start: the point where it first reaches a depth, so a web's rows are level sets of that depth.
 * @evidence contracts/development/design.md#principled-representation A curve read by its depth along a direction from its start: the point where it first reaches a depth, so a web's rows are level sets of that depth. The callable takes u and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanWebCurve.SampledCurve is the canonical exchange used by AutoMovieHumanWebCurve.sampled.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanWebCurve.sampled for a curve read by its depth along a direction from its start: the point where it first reaches a depth, so a web's rows are level sets of that depth.
 */
  export type SampledCurve = (u: number) => AutoMovieVector3Tuple;

  /** Result of AutoMovieHumanWebCurve.sampled. A curve read by its depth along a direction from its start: the point where
  it first reaches a depth, so a web's rows are level sets of that depth. A
  curve that leaves its start across the direction (a saddle's own column)
  reaches its first depths at their square root. Past its ends it runs on
  along its end tangents.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A curve read by its depth along a direction from its start: the point where it first reaches a depth, so a web's rows are level sets of that depth.
 * @evidence contracts/development/design.md#principled-representation A curve read by its depth along a direction from its start: the point where it first reaches a depth, so a web's rows are level sets of that depth. The callable takes depth and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanWebCurve.SampledResult is the canonical exchange used by AutoMovieHumanWebCurve.sampled.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanWebCurve.sampled for a curve read by its depth along a direction from its start: the point where it first reaches a depth, so a web's rows are level sets of that depth.
 */
  export type SampledResult = (depth: number) => AutoMovieVector3Tuple;
}
