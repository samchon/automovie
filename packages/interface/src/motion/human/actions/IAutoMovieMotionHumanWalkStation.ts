import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanFormation } from "../ensemble/IAutoMovieMotionHumanFormation";

/**
 * Constants of {@link walkStation}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation to: The floor point to stop at. via: Points passed in order before `to`. station: The station, when the walk keeps one.
 * @evidence contracts/development/design.md#principled-representation to: The floor point to stop at. via: Points passed in order before `to`. station: The station, when the walk keeps one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStation.ts (walkStation.rests, context); actions/walkStation.ts (walkStation.cadenced, context); actions/walkStation.ts (walkStation.point, context); actions/walkStation.ts (walkStation.resolve).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanFormation.IStation identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWalkStation {
  /**
   * What a walk keeping station reads of its parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation to: The floor point to stop at. via: Points passed in order before `to`. station: The station, when the walk keeps one.
   * @evidence contracts/development/design.md#principled-representation to: The floor point to stop at. via: Points passed in order before `to`. station: The station, when the walk keeps one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStation.ts (walkStation.rests, context); actions/walkStation.ts (walkStation.cadenced, context); actions/walkStation.ts (walkStation.point, context); actions/walkStation.ts (walkStation.resolve).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanFormation.IStation identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IStationed {
    /** The floor point to stop at. */
    to: IAutoMovieVector3;

    /** Points passed in order before `to`. */
    via?: IAutoMovieVector3[];

    /** The station, when the walk keeps one. */
    station?: IAutoMovieMotionHumanFormation.IStation;
  }
}
