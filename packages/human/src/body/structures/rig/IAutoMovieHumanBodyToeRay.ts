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
