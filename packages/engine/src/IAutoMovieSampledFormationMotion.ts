import { IAutoMovieFormationMotionState } from "@automovie/interface";

import { IAutoMovieFormationReform } from "./IAutoMovieFormationReform";

/**
 *
 * One sampled unit state, with the arrangement it is travelling toward.
 *
 * With no cue, or before the first cue, `sampleFormationMotion` returns the
 * identity state (zero translation and facing offset, unit spacing) with
 * `reform` null; between cues it holds the last finished cue's `to` state.
 *
 * @evidence contracts/common.md#principled-implementation Extends `IAutoMovieFormationMotionState` with a nullable reform, so the sampler interpolates translation, facing and spacing on the cue's eased progress and carries the target layout beside them.
 * @evidence contracts/common.md#clear-and-simple-design Adds one member to the shared motion state instead of declaring a parallel type, so placement functions that read only the state accept this record unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null rather than an identity reform is a contract distinction between no target and a target equal to the design; no consumer is special-cased by it.
 * @evidence contracts/common.md#meaningful-documentation States the identity state before the first cue, that a gap holds the last finished cue's end state, and what a null reform means.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record; the sampler's filter and sort over the unit's cues are costs of `sampleFormationMotion`. Sampled afresh for each time from the cue list, so seeking needs no history and nothing carries over from the previous frame. Holds two small vectors, a heading and an optional reform reference; the caller owns the record and the cue list owns the referenced layout.
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
