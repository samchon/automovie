import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Humanoid-bone capsule shared by body, validation, and soft-contact systems.
 *
 * The record is actor-local geometry only. A consumer supplies the actor and evaluated pose whose bone segment places it in world space.
 *
 * @evidence contracts/development/design.md#principled-representation validateCapsule requires two distinct declared FK-reachable bones and a finite positive radius; contact consumers place the endpoints with the supplied evaluated actor pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared endpoint/radius record lets body validation and soft contact use the same authored proxy rather than separate capsule vocabularies.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing or unreachable bone is a structural error rather than an invented endpoint; this proxy approximates body geometry and does not assert exact mesh collision.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify actor-local bone endpoints and metre radius, while consumers retain responsibility for actor and world-pose resolution.
 */
export interface IAutoMovieCapsuleProxy {
  /** Humanoid bone at the first end of the actor-local segment. */
  from: AutoMovieHumanoidBone;

  /** Humanoid bone at the second end of the actor-local segment. */
  to: AutoMovieHumanoidBone;

  /** Finite strictly positive radius in meters. */
  radius: number;
}
