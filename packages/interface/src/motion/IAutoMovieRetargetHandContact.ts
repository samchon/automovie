import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Declare one hand chain's inclusive contact window in source-clip seconds;
 * each covered keyframe maps that frame's source effector position through
 * rootScale. A chain unresolved on either rig is skipped by the contact pass.
 * This preserves an authored source slide rather than pinning the entire window
 * to its first hand position.
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
