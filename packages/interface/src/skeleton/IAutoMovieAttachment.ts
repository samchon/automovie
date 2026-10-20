import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { AutoMovieHumanoidBone } from "./AutoMovieHumanoidBone";

/**
 * A rigid coupling of one model's root to a **bone of another model**: the cross-skeleton joint that lets a rider sit a horse, a passenger ride a cart, or a sword stay in a hand.
 *
 * resolveAttachment composes the offset with forward kinematics in the parent's skeleton model frame. compileAttach separately composes the parent's staged translation and rotation and samples a follow clip; parent scale is not inherited, and interpolation between baked samples is approximate. This coupling is not a dynamic fixed-joint simulation.
 *
 * @evidence contracts/common.md#principled-implementation resolveAttachment applies parent-bone forward kinematics then rigidly composes the child offset, rotating translation, multiplying unit rotations and copying offset scale in the parent's model frame.
 * @evidence contracts/common.md#clear-and-simple-design Parent bone and local offset describe one cross-rig coupling while scene node identity and world placement belong to the surrounding attachment action.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or unreachable parent bones throw, and the bone frame carries no inherited scale; renderer and resolver must use matching clinical axes and rest frames.
 * @evidence contracts/common.md#meaningful-documentation Defines parent-skeleton bone ownership, local offset composition and rigid following with model-versus-world placement distinction.
 */
export interface IAutoMovieAttachment {
  /**
   * The bone on the **parent** skeleton the child rides (e.g. a horse's `chest` standing in for the saddle).
   */
  parentBone: AutoMovieHumanoidBone;

  /**
   * Child root offset in the parent bone's local frame. The resolver rotates its translation, multiplies its rotation and copies its scale into a parent-model-frame result; outer scene placement is separate.
   */
  offset: IAutoMovieTransform;
}
