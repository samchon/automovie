import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { AutoMovieHumanoidBone } from "./AutoMovieHumanoidBone";

/**
 * A rigid coupling of one model's root to a **bone of another model**: the
 * cross-skeleton joint that lets a rider sit a horse, a passenger ride a cart,
 * or a sword stay in a hand.
 *
 * ResolveAttachment composes the offset with forward kinematics in the parent's
 * skeleton model frame. compileAttach separately composes the parent's staged
 * translation and rotation and samples a follow clip; parent scale is not
 * inherited, and interpolation between baked samples is approximate. This
 * coupling is not a dynamic fixed-joint simulation.
 */
export interface IAutoMovieAttachment {
  /**
   * The bone on the **parent** skeleton the child rides (e.g. a horse's `chest`
   * standing in for the saddle).
   */
  parentBone: AutoMovieHumanoidBone;

  /**
   * Child root offset in the parent bone's local frame. The resolver rotates
   * its translation, multiplies its rotation and copies its scale into a
   * parent-model-frame result; outer scene placement is separate.
   */
  offset: IAutoMovieTransform;
}
