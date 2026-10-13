import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A rigid actor root frame at one shot-local second, combining staged position/heading with a sampled motion root when present. Scale is absent; position is world metres, rotation is a quaternion and facingDeg is projected +Z heading about +Y.
 *
 * @evidence contracts/common.md#principled-implementation The frame representation matches resolveActorWorldFrame's staged rotation times motion-root rotation and rotated root translation; projected heading supports lookAt yaw calculations.
 * @evidence contracts/common.md#clear-and-simple-design Keeps only the rigid quantities consumed by live action targeting, without claiming a complete staged affine transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Root scale and arbitrary nonuniform staged scale are not represented; no affine decomposition is silently approximated by this type.
 * @evidence contracts/common.md#meaningful-documentation States shot-local sampling, world metres, quaternion orientation and heading degrees with absent scale.
 * @evidence contracts/performance.md#efficient-algorithms The record incurs no algorithm; producing it adds constant rigid-transform arithmetic after motion sampling.
 * @evidence contracts/performance.md#reuse-equivalent-work A sampled frame may be reused for equal shot time and unchanged context/motion; the type provides no revision key or cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The producer/caller owns each frame's values; no retained rig, task or resource handle is part of this representation.
 * @author Samchon
 */
export interface IAutoMovieActorWorldFrame {
  /** Actor-root world position in metres at the sampled shot time. */
  position: IAutoMovieVector3;

  /** World orientation quaternion including staged and sampled root rotation. */
  rotation: IAutoMovieQuaternion;

  /** Degrees about +Y of the orientation's projected +Z heading; scale is absent. */
  facingDeg: number;
}
