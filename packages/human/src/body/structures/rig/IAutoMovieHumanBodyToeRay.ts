import type { AutoMovieHumanBodyToeBone } from "./AutoMovieHumanBodyToeBone";

/**
 * One phalanx joint of a toe ray in the body basis.
 *
 * Its rest position is the `head` landmark and its axis runs to `tail`. A
 * proximal phalanx hangs from the humanoid `leftToes` or `rightToes` bone,
 * which stays the common metatarsophalangeal driver: with every ray at rest a
 * ray vertex moves exactly as the toes bone moves it. A middle or distal
 * phalanx hangs from the phalanx before it.
 *
 * @evidence contracts/common.md#principled-implementation Hanging the rays under the humanoid toes bone keeps every existing toes pose meaning unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Bone, parent, two landmarks and the source correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positions come from shape-dependent landmarks, never stored vertices.
 * @evidence contracts/common.md#meaningful-documentation States the parenting and the rest frame.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each record names one phalanx and its parent in the ray.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Landmarks are metres in the basis frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder's consumer renders the result.
 * @evidence contracts/anatomy.md#anatomical-source The source rig's head and tail cubes place each phalanx; they are rig landmarks, not palpated joint centres.
 * @evidenceExclude contracts/anatomy.md#permitted-range The toe range constant owns admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is basis data, not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyToeRay {
  /** The phalanx this joint moves. */
  bone: AutoMovieHumanBodyToeBone;

  /** The humanoid toes bone for a proximal phalanx, else the phalanx before it. */
  parent: "leftToes" | "rightToes" | AutoMovieHumanBodyToeBone;

  /** Landmark id of the joint centre. */
  head: string;

  /** Landmark id the phalanx axis runs to. */
  tail: string;

  /** The source rig bone this phalanx corresponds to, for provenance. */
  source: string;

  /**
   * The source rig bone's roll about its axis, degrees, for provenance. The
   * flexion and splay axes come from the foot frame, so the roll does not
   * enter the pose.
   */
  roll: number;
}
