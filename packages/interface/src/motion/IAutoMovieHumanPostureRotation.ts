import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A whole-posture rigid turn around a fixed world point in metres. The world
 * quaternion applies after the posture heading; airborne planning and posture
 * composition share this record.
 */
export interface IAutoMovieHumanPostureRotation {
  /** The point that stays, world metres; normally the centre of mass. */
  about: IAutoMovieVector3;

  /** The turn, a unit quaternion in the world frame, applied after the heading. */
  turn: IAutoMovieQuaternion;

  /**
   * How a planted goal meets the turn: absent, a planted goal refuses it, as a
   * body turned whole cannot keep a world contact; true, the planted goal stays
   * where it is in the world and its limb is re-solved onto it, so the turn
   * reaches the root and the free goals only (a landing carrying a flight's
   * touchdown attitude away over its planted feet).
   */
  planted?: boolean;
}
