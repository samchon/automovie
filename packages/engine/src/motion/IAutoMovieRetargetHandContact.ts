import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * One declared hand contact: the arm chain and the clip window over which its
 * hand is touching something.
 *
 * Feet are detected geometrically against the ground, but a hand has no such
 * reference: a hand on a table, a wall, or a partner is indistinguishable from
 * a hand in the air by position alone. So a hand contact is **declared**, never
 * inferred.
 *
 * @author Samchon
 */
export interface IAutoMovieRetargetHandContact {
  /** Hand end-effector bone held on its source contact. */
  hand: AutoMovieHumanoidBone;

  /** Chain-root segment (upper arm). */
  upper: AutoMovieHumanoidBone;

  /** Mid segment (forearm). */
  lower: AutoMovieHumanoidBone;

  /** Inclusive contact-window start, seconds on the clip's own clock. */
  start: number;

  /** Inclusive contact-window end, seconds on the clip's own clock. */
  end: number;
}
