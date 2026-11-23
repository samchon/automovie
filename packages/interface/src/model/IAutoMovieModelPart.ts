import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieGeometry } from "./IAutoMovieGeometry";

/**
 * One piece of a model: a chunk of geometry, the material on it, and how it
 * attaches to the rig.
 *
 * A model is assembled from parts so a character can mix paths (a primitive
 * torso here, an imported mesh head there) and so each surface can carry its
 * own material. How a part follows the skeleton is captured by two mutually
 * informing fields: a _skinned_ part deforms via its mesh's
 * {@link IAutoMovieMeshSkin} (`attachedBone` is `null`); a _rigid_ part (a prop,
 * a sword, a primitive limb) is parented wholesale to one bone via
 * `attachedBone` and rides its transform.
 */
export interface IAutoMovieModelPart {
  /** Stable id within the model. */
  id: string;

  /**
   * Human / LLM readable label (e.g. `"head"`, `"left forearm"`). Null if
   * unnamed.
   */
  name: string | null;

  /** This part's geometry: a primitive or a mesh. */
  geometry: IAutoMovieGeometry;

  /**
   * Id of the material applied to this part, into the owning model's
   * `materials`. Null uses the renderer's default material.
   */
  material: string | null;

  /**
   * Bone for rigid parenting, or null for mesh skinning/static root geometry.
   * If both this field and mesh skin are present, the current viewer chooses
   * rigid attachment and ignores skin deformation; admission does not enforce
   * mutual exclusion.
   */
  attachedBone: AutoMovieHumanoidBone | null;

  /**
   * Local transform of the part relative to its attachment (bone or model
   * root). `null` = identity.
   */
  transform: IAutoMovieTransform | null;
}
