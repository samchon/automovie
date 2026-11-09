import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One leaf occurrence retaining its complete generated TRS fields.
 *
 * The CPU record retains translation, quaternion rotation and per-axis scale without reducing orientation to yaw or scale to one number. The viewer composes them into instance matrices whose Float32 storage can round binary64 inputs; its prototype is a planar XY card, so local Z scale does not create leaf thickness.
 *
 * @evidence contracts/development/design.md#principled-representation Growth derives stable leaf identity and bearing branch with recipe-frame translation, composed roll/alignment quaternion and a common jitter factor applied to all prototype scale axes; finite normalization and representable positive products are premises rather than separately gated generated results.
 * @evidence contracts/development/design.md#minimal-and-owned-surface An occurrence exposes the complete generated placement fields without embedding the branch recipe or renderer instance object.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Leaf orientation and anisotropic scale are preserved instead of silently reduced to yaw or one scale; identity names the actual derived bearing branch.
 * @evidence contracts/development/common.md#meaningful-documentation Defines stable leaf/branch identity, recipe-meter origin, glTF quaternion order and positive prototype-axis scale.
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
