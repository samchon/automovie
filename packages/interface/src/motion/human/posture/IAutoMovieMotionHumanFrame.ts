import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A performer's horizontal frame: an origin in world metres and a yaw in degrees about +Y. Zero faces +Z; local x is the performer's left, y is up and z is forward.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A performer's horizontal frame: an origin in world metres and a yaw in degrees about +Y. Zero faces +Z; local x is the performer's left, y is up and z is forward.
 * @evidence contracts/development/design.md#principled-representation origin: Origin, world metres. yaw: Heading about +Y, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanFrame operations, jump/floor planners and meeting resolution share a floor origin and heading; a quaternion rigid transform remains a separate capability.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The origin is world metres and yaw is degrees about +Y. HumanFrame owns conversion; the contract preserves canonical left/up/forward axes rather than adopting camera coordinates.
 */
export interface IAutoMovieMotionHumanFrame {
  /** Origin, world metres. */
  origin: IAutoMovieVector3;

  /** Heading about +Y, degrees. */
  yaw: number;
}
