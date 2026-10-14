import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Humanoid-bone capsule shared by body, validation, and soft-contact systems.
 *
 * The record is actor-local geometry only. A consumer supplies the actor and evaluated pose whose bone segment places it in world space.
 *
 * @evidence contracts/common.md#principled-implementation validateCapsule requires two distinct declared FK-reachable bones and a finite positive radius; contact consumers place the endpoints with the supplied evaluated actor pose.
 * @evidence contracts/common.md#clear-and-simple-design The shared endpoint/radius record lets body validation and soft contact use the same authored proxy rather than separate capsule vocabularies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing or unreachable bone is a structural error rather than an invented endpoint; this proxy approximates body geometry and does not assert exact mesh collision.
 * @evidence contracts/common.md#meaningful-documentation Members identify actor-local bone endpoints and metre radius, while consumers retain responsibility for actor and world-pose resolution.
 * @author Samchon
 */
export interface IAutoMovieCapsuleProxy {
  /** Humanoid bone at the first end of the actor-local segment. */
  from: AutoMovieHumanoidBone;

  /** Humanoid bone at the second end of the actor-local segment. */
  to: AutoMovieHumanoidBone;

  /** Finite strictly positive radius in meters. */
  radius: number;
}
