import type { IAutoMovieContourLoftCurves64 } from "./IAutoMovieContourLoftCurves64";

/**
 * Closed-curve sampling outcome, including construction retained after refusal.
 *
 * @evidence contracts/development/design.md#principled-representation Millimetre knots retain generating phases and an admitted period, or a zero-period construction-only fallback on sampling refusal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IResult feeds sampled ring creation and local unsupported-group reporting in contour loft generation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a trusted finite source endpoint survives representation refusal; no replacement contour is generated.
 * @evidence contracts/development/common.md#meaningful-documentation The result distinguishes sampling failure, rank failure and valid sampled boundary storage.
 */
export namespace IAutoMovieSampleContourRing64 {
  /**
   * Samples of one declared closed polynomial with any local refusal preserved.
   * An admitted curve retains its exact name and complete phase period. A failed
   * millimetre cubic retains its actual dense finite first endpoint as construction
   * only; an absent or untrusted physical endpoint produces empty construction.
   * Failed metadata is never evaluated again to obtain a period or geometry.
   *
   * @evidence contracts/development/design.md#principled-representation Knots retain generating phases and millimetre positions; zero period distinguishes tessellation refusal from an admitted period with a rank failure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface sampleAutoMovieContourRing64 supplies name, knots and period for contour ring construction and a local refusal reason for incident groups.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Failure retains only a trusted source endpoint, never an invented replacement ring or recovered period.
   * @evidence contracts/development/common.md#meaningful-documentation Defines name fallback, construction-only knots, period units and unsupported semantics.
   */
  export type IResult = {
    /** Original string curve name, or the empty string when metadata supplies no string. It is not generated from geometry. */
    name: string;

    /** Sampled source restrictions in millimetres. A tessellation refusal returns one copied trusted first endpoint at phase zero, or an empty array; these are construction only. Rank refusal may retain the full sampled array. */
    knots: IAutoMovieContourLoftCurves64.Knot[];

    /** Sum of admitted phaseIntervals in the curve's declared phase unit. Zero after tessellation refusal, without consulting invalid phase metadata again. */
    period: number;

    /** Local representation or sampled-rank failure. Absent only when sampling and noncollapsed two-dimensional boundary checks pass; absence is no embedding certificate. */
    unsupported?: string;
  };
}
