import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * How much of its speed and step a walk keeps when the body does not face
 * the way it goes: all of it forward, `BACKWARD` going backward, and going
 * sideways the step that does not cross the feet, the feet's rest
 * separation, blended by the squared cosine and sine of the angle between
 * the way and the facing at the walk's start. The cadence is the gait's
 * own either way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation yaw: Fixed heading in degrees about world +Y, zero toward +Z. toward: World-space point, metres, toward which the walking body faces. turn: Additional yaw in degrees relative to the direction toward the point; zero when omitted.
 * @evidence contracts/development/design.md#principled-representation yaw: Fixed heading in degrees about world +Y, zero toward +Z. toward: World-space point, metres, toward which the walking body faces. turn: Additional yaw in degrees relative to the direction toward the point; zero when omitted.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkFacing.ts (walkFacing.share, facing); actions/walkSteps.ts (walkSteps.plan); lexicon/HumanTravelLeafWalk.ts (HumanTravelLeafWalk.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWalkFacing {
  /**
   * Which way a walking body faces, apart from the way it goes: a fixed heading, degrees about +Y (0 faces +Z), or the heading toward a floor point turned by `turn` degrees (0 when absent), read where each footprint lies (`walkSteps`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation yaw: Fixed heading in degrees about world +Y, zero toward +Z. toward: World-space point, metres, toward which the walking body faces. turn: Additional yaw in degrees relative to the direction toward the point; zero when omitted.
   * @evidence contracts/development/design.md#principled-representation yaw: Fixed heading in degrees about world +Y, zero toward +Z. toward: World-space point, metres, toward which the walking body faces. turn: Additional yaw in degrees relative to the direction toward the point; zero when omitted.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkFacing.ts (walkFacing.share, facing); actions/walkSteps.ts (walkSteps.plan); lexicon/HumanTravelLeafWalk.ts (HumanTravelLeafWalk.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IFacing =
    | {
        /** Fixed heading in degrees about world +Y, zero toward +Z. */
        yaw: number;
      }
    | {
        /** World-space point, metres, toward which the walking body faces. */
        toward: IAutoMovieVector3;
        /** Additional yaw in degrees relative to the direction toward the point; zero when omitted. */
        turn?: number;
      };
}
