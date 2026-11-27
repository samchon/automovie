import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { AutoMovieHumanoidBone } from "./AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import type { IAutoMovieJointConstraint } from "./IAutoMovieJointConstraint";

/**
 * One bone in a {@link IAutoMovieSkeleton}: its identity, parent, rest pose,
 * anatomical range of motion, and optionally the axes its clinical angles turn
 * about.
 *
 * A bone binds together (a) the normalized humanoid slot it fills (`bone`), (b)
 * where it sits in the hierarchy (`parent`), (c) its neutral local transform
 * (`rest`, the 0-articulation pose), (d) the ROM the engine validates poses
 * against (`constraint`), and (e) optionally what its clinical angles rotate
 * about (`axes`). For a _generated_ character the geometry phase produces
 * these; for an _imported_ glTF/VRM the ingest package derives them.
 */
export interface IAutoMovieBone {
  /** Which normalized humanoid slot this bone fills. Unique within a skeleton. */
  bone: AutoMovieHumanoidBone;

  /**
   * Parent bone in the hierarchy, or `null` for the sole root. Defines the
   * space in which `rest` and articulation are expressed.
   */
  parent: AutoMovieHumanoidBone | null;

  /**
   * Rest-pose local transform relative to parent at zero articulation. Current
   * FK composes rest rotation with clinical articulation and rotates rest
   * translation by the parent frame; FK ignores rest.scale and general skeleton
   * lowering emits unit bone scales.
   */
  rest: IAutoMovieTransform;

  /**
   * Per-rig anatomical range-of-motion override for this joint. `null` keeps
   * the normalized humanoid default when that slot has one; a slot absent from
   * the default table is unconstrained. Supply a constraint to replace the
   * default for a stylized, non-human, or specially trained character.
   */
  constraint: IAutoMovieJointConstraint | null;

  /**
   * The local axes this joint's flexion, abduction and twist turn about, in the
   * bone's rest frame.
   *
   * A generated rig states here what its clinical angles mean, so a pose
   * articulates it correctly whichever host resolves it. Omitted, the engine
   * reads the per-bone table the host passes, such as `AutoMovieEngineHumanoidJointAxes`,
   * and then the default basis. `validateModel` refuses a non-finite,
   * degenerate or non-orthogonal triple.
   */
  axes?: IAutoMovieJointAxes;
}
