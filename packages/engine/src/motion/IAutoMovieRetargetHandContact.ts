import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Declare one hand chain's inclusive contact window in source-clip seconds; each covered keyframe maps that frame's source effector position through rootScale.
 * A chain unresolved on either rig is skipped by the contact pass. This preserves an authored source slide rather than pinning the entire window to its first hand position.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit chain names and inclusive source-clock bounds distinguish declared contact from an airborne hand with the same position; each source-frame effector becomes that frame's target-space contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A chain triple plus start/end supplies exactly the arm and authored frames preserveRetargetContacts needs, without introducing a separate contact target coordinate frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Hands are never inferred from proximity; unresolved chains on either rig are omitted as a whole rather than partially solved, and authored per-frame source motion remains the contact reference.
 * @evidence contracts/development/common.md#meaningful-documentation States inclusive clip-local seconds, per-frame rootScale mapping, unresolved-chain omission and preservation of an authored slide.
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
