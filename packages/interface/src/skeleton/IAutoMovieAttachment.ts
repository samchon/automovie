import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { AutoMovieHumanoidBone } from "./AutoMovieHumanoidBone";

/**
 * A rigid coupling of one model's root to a **bone of another model**: the cross-skeleton joint that lets a rider sit a horse, a passenger ride a cart, or a sword stay in a hand.
 *
 * This is the automovie expression of what a physics engine does with a fixed joint between two bodies: the child's body frame is locked into the parent bone's frame, so wherever and however that bone moves in the world (the horse's saddle pitching back as it rears), the child follows rigidly, position and orientation together. The engine's `resolveAttachment` computes the child root world transform each frame from the parent's posed skeleton.
 *
 * @evidence contracts/common.md#principled-implementation resolveAttachment applies parent-bone forward kinematics then rigidly composes the child offset, rotating translation, multiplying unit rotations and copying offset scale in the parent's model frame.
 * @evidence contracts/common.md#clear-and-simple-design Parent bone and local offset describe one cross-rig coupling while scene node identity and world placement belong to the surrounding attachment action.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or unreachable parent bones throw, and the bone frame carries no inherited scale; renderer and resolver must use matching clinical axes and rest frames.
 * @evidence contracts/common.md#meaningful-documentation Defines parent-skeleton bone ownership, local offset composition and rigid following with model-versus-world placement distinction.
 * @author Samchon
 */
export interface IAutoMovieAttachment {
  /**
   * The bone on the **parent** skeleton the child rides (e.g. a horse's `chest` standing in for the saddle).
   */
  parentBone: AutoMovieHumanoidBone;

  /**
   * The child root's offset within that bone's local frame: where the seat is relative to the bone origin (translation) and how the child is oriented on it (rotation). Composed onto the bone's world transform.
   */
  offset: IAutoMovieTransform;
}
