import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/**
 * A rigid actor root frame at one shot-local second, combining staged
 * position/heading with a sampled motion root when present. Scale is absent;
 * position is world metres, rotation is a quaternion and facingDeg is projected
 * +Z heading about +Y.
 */
export interface IAutoMovieActorWorldFrame {
  /** Actor-root world position in metres at the sampled shot time. */
  position: IAutoMovieVector3;

  /** World orientation quaternion including staged and sampled root rotation. */
  rotation: IAutoMovieQuaternion;

  /**
   * Degrees about +Y of the orientation's projected +Z heading; scale is
   * absent.
   */
  facingDeg: number;
}
