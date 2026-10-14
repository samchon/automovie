/**
 * Capsule aligned to local Y, centred on its cylindrical body's midpoint. Total height is `height + 2 * radius`; height excludes both hemispheres.
 *
 * @evidence contracts/common.md#principled-implementation A cylinder and two hemispheres are determined by their common radius and cylindrical length, so bounds span plus or minus radius horizontally and half height plus radius vertically; runtime extent validation requires both dimensions positive and finite.
 * @evidence contracts/common.md#clear-and-simple-design Two dimensions express the rounded shape without exposing cap centres or tessellation resolution; the enclosing part supplies its placement transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declared capsule is rounded for every consumer; tessellate currently substitutes its bounding cylinder, an unresolved consumer defect that must not redefine the two parameters.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes cylindrical body length from total height, states the local Y alignment and midpoint origin, and gives metre units and strict positive finite bounds.
 * @author Samchon
 */
export interface IAutoMovieCapsuleShape {
  /** Discriminator. */
  type: "capsule";

  /** Finite positive radius of the body and end caps, metres. */
  radius: number;

  /** Finite positive cylindrical length between the caps, metres. */
  height: number;
}
