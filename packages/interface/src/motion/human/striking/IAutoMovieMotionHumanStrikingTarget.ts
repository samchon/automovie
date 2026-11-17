import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * The relations every striking law reads from its entry state and its
 * target: which side leads, the line to the target, the feet as placed, and
 * how a foot steps along the line or pivots on its ball.
 *
 * @evidence contracts/development/common.md#meaningful-documentation centre: The stance centre a range is measured from: midway between the ankles, on the floor. forward: The horizontal unit direction toward the virtual opponent.
 * @evidence contracts/development/design.md#principled-representation centre: The stance centre a range is measured from: midway between the ankles, on the floor. forward: The horizontal unit direction toward the virtual opponent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingTarget.ts (StrikingTarget.stance, return); striking/KickGeometry.ts (KickGeometry.build); striking/StrikingTarget.ts (StrikingTarget.aim).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStrikingTarget {
  /**
   * The line a virtual opponent stands on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation centre: The stance centre a range is measured from: midway between the ankles, on the floor. forward: The horizontal unit direction toward the virtual opponent.
   * @evidence contracts/development/design.md#principled-representation centre: The stance centre a range is measured from: midway between the ankles, on the floor. forward: The horizontal unit direction toward the virtual opponent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingTarget.ts (StrikingTarget.stance, return); striking/KickGeometry.ts (KickGeometry.build); striking/StrikingTarget.ts (StrikingTarget.aim).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IStance {
    /** The stance centre a range is measured from: midway between the ankles, on the floor. */
    centre: IAutoMovieVector3;

    /** The horizontal unit direction toward the virtual opponent. */
    forward: IAutoMovieVector3;
  }
}
