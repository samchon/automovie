import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMoviePose } from "../pose/IAutoMoviePose";

/**
 * Placement of one model in a scene, plus what it is doing there.
 *
 * A scene node binds a model (a character or an object) to a world transform and either a running motion clip or a held static pose. This is the seam where automovie's structured building lowering and ordinary stage authoring meet the renderer. A built environment defines logical rooms and visible elements; its lowering places those elements here with the shared world transform contract (see the scene coordinate note in the package README).
 *
 * @evidence contracts/common.md#principled-implementation Stable placement binds a reusable model to world TRS and intended motion-or-pose state, with both null describing rest. Geometry/shot subject readers choose motion before held pose, while the current Production scene-artifact gate checks node identity, model reference and transform without admitting these two state fields.
 * @evidence contracts/common.md#clear-and-simple-design World placement and performed state remain node-owned while geometry, skeleton and material definitions stay on the referenced model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mutual exclusion and compatible rig/state remain caller obligations because the current scene-artifact gate does not inspect motion or pose. The low-level viewer scene builder applies neither field; its host owns posing and playback instead of claiming that graph construction performed them.
 * @evidence contracts/common.md#meaningful-documentation Defines placement/model identity, world transform, motion-versus-pose exclusivity and rest null semantics.
 * @author Samchon
 */
export interface IAutoMovieSceneNode {
  /** Stable id for this placement. */
  id: string;

  /** Which model is placed here. */
  model: string;

  /** World placement (position / orientation / scale) of the model root. */
  transform: IAutoMovieTransform;

  /**
   * Id of the motion clip currently playing on this node, or `null` for a static placement. Mutually exclusive with `pose`. Only meaningful for a model that has a skeleton.
   */
  motion: string | null;

  /**
   * A held static pose when motion is null, or null for model rest. Author it exclusively with motion; current subject readers prefer motion if both are present, and scene-artifact admission does not enforce that exclusivity.
   */
  pose: IAutoMoviePose | null;
}
