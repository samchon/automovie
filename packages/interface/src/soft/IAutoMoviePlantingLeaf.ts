import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One leaf occurrence, as a lossless full-TRS instance.
 *
 * Translation, a unit quaternion and a per-axis scale, which is exactly what GPU instancing consumes. A leaf is never reduced to a yaw or to one uniform number, because a reduction is a fact about the plant that nobody authored.
 *
 * @evidence contracts/common.md#principled-implementation Growth derives stable leaf identity and bearing branch with recipe-frame translation, unit quaternion and positive per-axis scale, matching the full affine instance transform consumed by rendering.
 * @evidence contracts/common.md#clear-and-simple-design A lossless occurrence projection exposes generated placement without embedding the branch recipe or renderer instance object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Leaf orientation and anisotropic scale are preserved instead of silently reduced to yaw or one scale; identity names the actual derived bearing branch.
 * @evidence contracts/common.md#meaningful-documentation Defines stable leaf/branch identity, recipe-meter origin, glTF quaternion order and positive prototype-axis scale.
 * @author Samchon
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
