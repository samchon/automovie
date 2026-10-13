import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { AutoMovieHumanoidBone } from "./AutoMovieHumanoidBone";
import { IAutoMovieJointConstraint } from "./IAutoMovieJointConstraint";

/**
 * One bone in a {@link IAutoMovieSkeleton}: its identity, parent, rest pose, and anatomical range of motion.
 *
 * A bone binds together (a) the normalized humanoid slot it fills (`bone`), (b) where it sits in the hierarchy (`parent`), (c) its neutral local transform (`rest`, the 0-articulation pose), and (d) the ROM the engine validates poses against (`constraint`). For a _generated_ character the geometry phase produces these; for an _imported_ glTF/VRM the ingest package derives them.
 *
 * @evidence contracts/common.md#principled-implementation Bone identity, resolved parent and local rest transform establish the FK graph; nullable rig ROM override selects the shared humanoid default when available, while an explicit override replaces it.
 * @evidence contracts/common.md#clear-and-simple-design One record keeps neutral geometry and pose-admission responsibility local to the bone without embedding clinical defaults or animation channels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null bone constraint is default-or-unconstrained, distinct from a null axis inside a supplied constraint, and a named parent must exist in the admitted single-root connected graph.
 * @evidence contracts/common.md#meaningful-documentation Defines unique semantic identity, parent/rest basis and default-versus-override ROM behavior.
 * @author Samchon
 */
export interface IAutoMovieBone {
  /**
   * Which normalized humanoid slot this bone fills. Unique within a skeleton.
   */
  bone: AutoMovieHumanoidBone;

  /**
   * Parent bone in the hierarchy, or `null` for the sole root. Defines the space in which `rest` and articulation are expressed.
   */
  parent: AutoMovieHumanoidBone | null;

  /**
   * Rest-pose local transform relative to `parent`: the bone at 0 articulation. Semantic joint angles ({@link IAutoMovieJointPose}) are applied _on top of_ this by the engine.
   */
  rest: IAutoMovieTransform;

  /**
   * Per-rig anatomical range-of-motion override for this joint. `null` keeps the normalized humanoid default when that slot has one; a slot absent from the default table is unconstrained. Supply a constraint to replace the default for a stylized, non-human, or specially trained character.
   */
  constraint: IAutoMovieJointConstraint | null;
}
