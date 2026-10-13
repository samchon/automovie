import { IAutoMovieFormationMotionState } from "@automovie/interface";

import { IAutoMovieFormationReform } from "./IAutoMovieFormationReform";

/**
 * One sampled unit state, with the arrangement it is travelling toward.
 *
 * With no cue, or before the first cue, `sampleFormationMotion` returns the
 * identity state (zero translation and facing offset, unit spacing) with
 * `reform` null; between cues it holds the last finished cue's `to` state.
 *
 * @evidence contracts/common.md#principled-implementation Extends the per-cue motion state with a nullable reform, so the sampled value is the cue's eased interpolation between `from` and `to` and the identity state before any cue, both pure functions of the cue list and time.
 * @evidence contracts/common.md#clear-and-simple-design Adds one member to the interface's motion state instead of a parallel record, so every consumer of a motion state also accepts a sampled one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Distinguishes no target from an identity target by null rather than by fabricating an identity re-form, so consumers never compare layouts to detect the absence.
 * @evidence contracts/common.md#meaningful-documentation States the identity state returned before any cue, the held state between cues, and why the reform is null rather than an identity re-form.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result type; sampling sorts and scans the unit's cues once per call inside `sampleFormationMotion`, answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each sample is recomputed from the cue list and time; the type exposes no key under which a sample could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds new vectors plus an optional reform referencing the cue's layout; the caller owns the record and the cue list owns the layout.
 * @author Samchon
 */
export interface IAutoMovieSampledFormationMotion extends IAutoMovieFormationMotionState {
  /**
   * The re-form under way, or null when the unit keeps its designed
   * arrangement. Null rather than an identity re-form, because "no target" and
   * "a target identical to the design" are different statements and only the
   * first is what a unit with no cue is doing.
   */
  reform: IAutoMovieFormationReform | null;
}
