import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMoviePose } from "../pose/IAutoMoviePose";

/**
 * Placement of one model in a scene, plus what it is doing there.
 *
 * A scene node binds a model (a character or an object) to a world transform and either a running motion clip or a held static pose. This is the seam where automovie's structured building lowering and ordinary stage authoring meet the renderer. A built environment defines logical rooms and visible elements; its lowering places those elements here with the shared world transform contract (see the scene coordinate note in the package README).
 *
 * @evidence contracts/common.md#principled-implementation Stable placement binds a reusable model to world TRS and either running motion or held pose, with rest represented by null motion and pose and rig compatibility checked by engine consumers.
 * @evidence contracts/common.md#clear-and-simple-design World placement and performed state remain node-owned while geometry, skeleton and material definitions stay on the referenced model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Motion and held pose are mutually exclusive at admission; null state uses declared model rest rather than a guessed motion or bone configuration.
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
   * A held static pose when motion is null, or null for model rest. Admission refuses a nonnull pose alongside nonnull motion rather than ignoring either authored state.
   */
  pose: IAutoMoviePose | null;
}
