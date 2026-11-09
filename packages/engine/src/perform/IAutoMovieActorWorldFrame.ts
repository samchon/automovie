import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A rigid actor root frame at one shot-local second, combining staged position/heading with a sampled motion root when present. Scale is absent; position is world metres, rotation is a quaternion and facingDeg is projected +Z heading about +Y.
 *
 * @evidence contracts/development/design.md#principled-representation The frame representation matches resolveActorWorldFrame's staged rotation times motion-root rotation and rotated root translation; projected heading supports lookAt yaw calculations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps only the rigid quantities consumed by live action targeting, without claiming a complete staged affine transform.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Root scale and arbitrary nonuniform staged scale are not represented; no affine decomposition is silently approximated by this type.
 * @evidence contracts/development/common.md#meaningful-documentation States shot-local sampling, world metres, quaternion orientation and heading degrees with absent scale.
 */
export interface IAutoMovieActorWorldFrame {
  /** Actor-root world position in metres at the sampled shot time. */
  position: IAutoMovieVector3;

  /** World orientation quaternion including staged and sampled root rotation. */
  rotation: IAutoMovieQuaternion;

  /** Degrees about +Y of the orientation's projected +Z heading; scale is absent. */
  facingDeg: number;
}
