import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A performer's own horizontal frame: an origin on the floor and a heading.
 *
 * Local coordinates follow the canonical body: `x` toward the performer's
 * left, `y` up and `z` forward. A heading of 0 degrees faces world +Z and 90
 * faces world +X, a right-handed turn about +Y, so the left of a performer at
 * heading `h` is world `(cos h, 0, -sin h)` and the forward is
 * `(sin h, 0, cos h)`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation origin: Origin, world metres. yaw: Heading about +Y, degrees.
 * @evidence contracts/development/design.md#principled-representation origin: Origin, world metres. yaw: Heading about +Y, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jump.ts (jump.plan.frame, return); compose/AutoMovieMotionHumanArmTarget.ts (AutoMovieMotionHumanArmTarget.origin, frame); floor/crawlChain.ts (crawlChain.of, frame); floor/crawlFeet.ts (crawlFeet.planted, measured); floor/crawlFeet.ts (crawlFeet.planted, return); floor/crawlInchwormPose.ts (crawlInchwormPose.of, frame).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanFrame {
  /**
   * A frame: a floor origin and a heading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation origin: Origin, world metres. yaw: Heading about +Y, degrees.
   * @evidence contracts/development/design.md#principled-representation origin: Origin, world metres. yaw: Heading about +Y, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jump.ts (jump.plan.frame, return); compose/AutoMovieMotionHumanArmTarget.ts (AutoMovieMotionHumanArmTarget.origin, frame); floor/crawlChain.ts (crawlChain.of, frame); floor/crawlFeet.ts (crawlFeet.planted, measured); floor/crawlFeet.ts (crawlFeet.planted, return); floor/crawlInchwormPose.ts (crawlInchwormPose.of, frame).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFrame {
    /** Origin, world metres. */
    origin: IAutoMovieVector3;

    /** Heading about +Y, degrees. */
    yaw: number;
  }
}
