import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";

/**
 * A spine compiled for evaluation: its curve, unit tangent and
 * rotation-minimizing frame at any parameter, from `frameAutoMovieSweepSpine`.
 *
 * The parameter `u` runs over `[0, 1]` by chord length; values outside are
 * clamped to the ends.
 *
 * @evidence contracts/development/design.md#principled-representation The three queries a sweep needs from its path, position, tangent and transported frame, behind one compiled record so the transport is computed once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A record of closures over the compiled path, owned by the sweep that compiled it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Queries outside the path clamp to its ends rather than extrapolating a curve the spine never declared.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the parameter's meaning and range, and each query's unit.
 */
export interface IAutoMovieSweepPath {
  /** Length of the spine's point polygon in metres, the chord-length scale of `u`. */
  length: number;

  /**
   * Position on the curve.
   *
   * @param u Chord-length parameter, clamped to `[0, 1]`
   * @returns Metres
   *
   * @evidence contracts/development/implementation.md#principled-implementation Position on the compiled centripetal Catmull-Rom spine.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One query by chord-length parameter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Parameters outside the spine clamp to its ends.
   * @evidence contracts/development/common.md#meaningful-documentation States the parameter and unit.
   * @evidence contracts/development/implementation.md#efficient-algorithms A segment search and a cubic per call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `frameAutoMovieSweepSpine`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `frameAutoMovieSweepSpine`.
   */
  point(u: number): IAutoMovieVector3;

  /**
   * Unit tangent, the direction of increasing `u`.
   *
   * @param u Chord-length parameter, clamped to `[0, 1]`
   * @returns Unit vector
   *
   * @evidence contracts/development/implementation.md#principled-implementation The spine's unit tangent in closed form.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One query by parameter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A vanishing tangent is refused, not replaced.
   * @evidence contracts/development/common.md#meaningful-documentation States the direction.
   * @evidence contracts/development/implementation.md#efficient-algorithms A segment search and a quadratic per call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `frameAutoMovieSweepSpine`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `frameAutoMovieSweepSpine`.
   */
  tangent(u: number): IAutoMovieVector3;

  /**
   * Rotation-minimizing frame: the normal is the tangent and `x` is the spine's starting direction transported without twist.
   *
   * @param u Chord-length parameter, clamped to `[0, 1]`
   * @returns The frame at the curve point
   *
   * @evidence contracts/development/implementation.md#principled-implementation The double-reflection rotation-minimizing frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One query returning a frame record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Between table entries the frame takes one more reflection rather than an interpolation.
   * @evidence contracts/development/common.md#meaningful-documentation States what the frame's axes are.
   * @evidence contracts/development/implementation.md#efficient-algorithms A segment search and one reflection per call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `frameAutoMovieSweepSpine`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `frameAutoMovieSweepSpine`.
   */
  frame(u: number): IAutoMovieSweepFrame;
}
