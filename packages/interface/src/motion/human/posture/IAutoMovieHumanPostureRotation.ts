import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A whole-posture rigid turn around a fixed world point in metres. The world quaternion applies after the posture heading; airborne planning and posture composition share this record.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A whole-posture rigid turn around a fixed world point in metres. The world quaternion applies after the posture heading; airborne planning and posture composition share this record.
 * @evidence contracts/development/design.md#principled-representation about: The point that stays, world metres; normally the centre of mass.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPerformanceFlight and jumpAirborne produce the same whole-body turn consumed by channel composition, mixHumanPosture and turnHumanPosture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The world pivot and unit quaternion are explicit; pose composition owns their application after heading. This does not reinterpret clinical degree tuples as rotation quaternions.
 */
export interface IAutoMovieHumanPostureRotation {
  /** The point that stays, world metres; normally the centre of mass. */
  about: IAutoMovieVector3;

  /** The turn, a unit quaternion in the world frame, applied after the heading. */
  turn: IAutoMovieQuaternion;
}
