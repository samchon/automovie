import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { IAutoMovieGeometry } from "./IAutoMovieGeometry";

/**
 * One piece of a model: a chunk of geometry, the material on it, and how it attaches to the rig.
 *
 * A model is assembled from parts so a character can mix paths (a primitive torso here, an imported mesh head there) and so each surface can carry its own material. How a part follows the skeleton is captured by two mutually informing fields: a _skinned_ part deforms via its mesh's {@link IAutoMovieMeshSkin} (`attachedBone` is `null`); a _rigid_ part (a prop, a sword, a primitive limb) is parented wholesale to one bone via `attachedBone` and rides its transform.
 *
 * @evidence contracts/common.md#principled-implementation A part combines local geometry with a model-scoped material reference and attachment transform; rigid parts follow one skeleton bone, while skinned meshes use per-vertex joint weights and leave attachedBone null.
 * @evidence contracts/common.md#clear-and-simple-design Geometry, appearance reference and attachment remain separate fields, allowing primitive and mesh parts in one model without duplicating materials or embedding world placement here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material and bone ids resolve through their owning model rather than descriptive part names; a null material selects the viewer's ordinary default material instead of implying an unlit special case.
 * @evidence contracts/common.md#meaningful-documentation States model-scoped identity and material lookup, rigid-versus-skinned attachment, and the bone-or-root local transform with null identity, including default material behavior.
 * @author Samchon
 */
export interface IAutoMovieModelPart {
  /** Stable id within the model. */
  id: string;

  /**
   * Human / LLM readable label (e.g. `"head"`, `"left forearm"`). Null if unnamed.
   */
  name: string | null;

  /** This part's geometry: a primitive or a mesh. */
  geometry: IAutoMovieGeometry;

  /**
   * Id of the material applied to this part, into the owning model's `materials`. Null uses the renderer's default material.
   */
  material: string | null;

  /**
   * For a **rigid** part, the bone it is parented to (rides that bone's transform). `null` for a **skinned** part (deformation comes from the mesh skin) or static geometry with no rig.
   */
  attachedBone: AutoMovieHumanoidBone | null;

  /**
   * Local transform of the part relative to its attachment (bone or model root). `null` = identity.
   */
  transform: IAutoMovieTransform | null;
}
