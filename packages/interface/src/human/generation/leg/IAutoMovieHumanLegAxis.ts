import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanLegAxis; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanLegAxis exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IFrame, IJoints, ITurn, IFrames, InterpolatedRate. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanLegAxis; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IFrame, IJoints, ITurn, IFrames, InterpolatedRate contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanLegAxis {
  /** A section plane, canonical, with its normal.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A section plane, canonical, with its normal.
   * @evidence contracts/development/design.md#principled-representation `origin`: Origin, on the axis. `u`: In-plane axis, forward in the straight leg. `v`: In-plane axis, lateral in the straight leg.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegAxis.frameAt, AutoMovieHumanLegAxis.frameRate. Read by AutoMovieHumanLegLaw.points, AutoMovieHumanLegReflection.placed, AutoMovieHumanLegSectionLaw.points. Also types AutoMovieHumanLegAxis.derive, AutoMovieHumanLegCentreLine.f.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `origin`, `u`, `v`, `n`; callers supply the complete record.
   */
  export interface IFrame {
    /** Origin, on the axis. */
    origin: AutoMovieVector3Tuple;

    /** In-plane axis, forward in the straight leg. */
    u: AutoMovieVector3Tuple;

    /** In-plane axis, lateral in the straight leg. */
    v: AutoMovieVector3Tuple;

    /** Normal, along the bone. */
    n: AutoMovieVector3Tuple;
  }

  /** The joints the axis passes through.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The joints the axis passes through.
   * @evidence contracts/development/design.md#principled-representation `hip`: Hip centre. `knee`: Knee centre. `ankle`: Ankle centre.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegChain.joints. Read by AutoMovieHumanLegAxis.of. Also types AutoMovieHumanLegChain.bones.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `hip`, `knee`, `ankle`; callers supply the complete record.
   */
  export interface IJoints {
    /** Hip centre. */
    hip: AutoMovieVector3Tuple;

    /** Knee centre. */
    knee: AutoMovieVector3Tuple;

    /** Ankle centre. */
    ankle: AutoMovieVector3Tuple;
  }

  /** One eased turn of the section normal about a fixed axis.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One eased turn of the section normal about a fixed axis.
   * @evidence contracts/development/design.md#principled-representation `from`: Station where the turn starts. `span`: Length of the turn along the stations, mm. `axis`: Unit axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegAxis.turn.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `from`, `span`, `axis`, `angle`; callers supply the complete record.
   */
  export interface ITurn {
    /** Station where the turn starts. */
    from: number;

    /** Length of the turn along the stations, mm. */
    span: number;

    /** Unit axis. */
    axis: AutoMovieVector3Tuple;

    /** Total angle, radians. */
    angle: number;
  }

  /** The leg's frames along its stations.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The leg's frames along its stations.
   * @evidence contracts/development/design.md#principled-representation `s0`: Station of the ankle ring. `s1`: Station of the crotch ring. `turns`: The three turns: ankle ring to shank, shank to thigh, thigh to the crotch ring.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegAxis.of. Read by AutoMovieHumanLegAxis.rotated, AutoMovieHumanLegAxis.frameAt, AutoMovieHumanLegAxis.frameRate. Also types AutoMovieHumanLegAxis.frames, AutoMovieHumanLegChain.frames.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `s0`, `s1`, `turns`, `twist`, `knee`, `origins`; callers supply the complete record.
   */
  export interface IFrames {
    /** Station of the ankle ring. */
    s0: number;

    /** Station of the crotch ring. */
    s1: number;

    /** The three turns: ankle ring to shank, shank to thigh, thigh to the crotch ring. */
    turns: ITurn[];

    /** Residual twist about the vertical, radians. */
    twist: number;

    /** Knee centre. */
    knee: AutoMovieVector3Tuple;

    /** Origins at whole millimetres of station, from `s0 - PAD`. */
    origins: AutoMovieVector3Tuple[];
  }

  /** The rate argument of AutoMovieHumanLegAxis.interpolated. A table's value at s by cubic Hermite, with derivatives from `rate`.
  @param table Values at whole millimetres from `first`.
  @param rate Derivative at a station.
  @param first Station of the table's first value.
  @param s Station read.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A table's value at s by cubic Hermite, with derivatives from `rate`.
 * @evidence contracts/development/design.md#principled-representation A table's value at s by cubic Hermite, with derivatives from `rate`. The callable takes s and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegAxis.InterpolatedRate is the canonical exchange used by AutoMovieHumanLegAxis.interpolated.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegAxis.interpolated for a table's value at s by cubic Hermite, with derivatives from `rate`.
 */
  export type InterpolatedRate = (s: number) => AutoMovieVector3Tuple;
}
