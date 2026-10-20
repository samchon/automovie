import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One accepted cluster member as a full-TRS instance.
 *
 * @evidence contracts/common.md#principled-implementation arrangePlantingCluster preserves the accepted slot index and derives translation, normalized yaw quaternion and independently sampled positive axis scales; the viewer composes this transform with recipe-frame plant geometry.
 * @evidence contracts/common.md#clear-and-simple-design The placement stores only an instance transform and identity, allowing one grown structure to serve every accepted member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected slots are absent rather than represented by invented placements; scale axes are retained rather than reduced to a scalar.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish stable identity from authored slot and identify world translation, glTF quaternion order and positive scales.
 */
export interface IAutoMoviePlantingPlacement {
  /** Stable placement identity within the cluster. */
  id: string;

  /** Authored slot index this placement satisfied. */
  slot: number;

  /** World position of the member's base. */
  translation: IAutoMovieVector3;

  /** Unit quaternion in glTF `(x, y, z, w)` order. */
  rotation: IAutoMovieQuaternion;

  /** Per-axis scale; each strictly positive. */
  scale: IAutoMovieVector3;
}
