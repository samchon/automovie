import type { AutoMovieHumanBodyToeBone } from "./rig/AutoMovieHumanBodyToeBone";

/**
 * One phalanx's pose relative to the bone it hangs from, in degrees.
 *
 * Flexion turns the phalanx toward the sole about the foot's mediolateral
 * axis; abduction (splay) turns it about the sole's normal and exists only
 * at a proximal phalanx, positive toward the foot's lateral side. Positive
 * flexion is the clinical sign; the humanoid toes bone keeps the source rig's
 * opposite sign (its positive flexion lifts the toes). A proximal phalanx's
 * rotation composes on top of the toes bone's, which stays the common
 * metatarsophalangeal motion.
 *
 * @evidence contracts/common.md#principled-implementation A relative pose on top of the toes bone keeps existing documents' meaning.
 * @evidence contracts/common.md#clear-and-simple-design Bone, flexion and an optional splay.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Splay at an interphalangeal hinge is refused by admission rather than ignored.
 * @evidence contracts/common.md#meaningful-documentation States the sign, axis and composition.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each row addresses one phalanx.
 * @evidence contracts/modeling.md#parameter-channels Named motions in degrees, not vertex edits.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Degrees about axes derived from the foot frame and the phalanx direction.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder's consumer renders the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The toe range constant owns the ranges and their status.
 * @evidenceExclude contracts/anatomy.md#permitted-range The toe range constant and admission own the bounds.
 * @evidence contracts/anatomy.md#parametric-authority Each value is a named physiological motion.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyToePose {
  /** The phalanx posed. */
  bone: AutoMovieHumanBodyToeBone;

  /** Flexion toward the sole, degrees; negative extends. */
  flexion: number;

  /** Splay toward the foot's lateral side, degrees; a proximal phalanx only. */
  abduction?: number;
}
