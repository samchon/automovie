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
