import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One leaf occurrence retaining its complete generated TRS fields.
 *
 * The CPU record retains translation, quaternion rotation and per-axis scale
 * without reducing orientation to yaw or scale to one number. The viewer
 * composes them into instance matrices whose Float32 storage can round binary64
 * inputs; its prototype is a planar XY card, so local Z scale does not create
 * leaf thickness.
 */
export interface IAutoMoviePlantingLeaf {
  /** Stable leaf identity within the derived structure. */
  id: string;

  /** Id of the branch bearing this leaf. */
  branch: string;

  /** Recipe-frame position of the leaf's origin. */
  translation: IAutoMovieVector3;

  /** Unit quaternion in glTF `(x, y, z, w)` order. */
  rotation: IAutoMovieQuaternion;

  /** Per-axis scale of the prototype leaf; each strictly positive. */
  scale: IAutoMovieVector3;
}
