import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Humanoid-bone capsule shared by body, validation, and soft-contact systems.
 *
 * The record is actor-local geometry only. A consumer supplies the actor and
 * evaluated pose whose bone segment places it in world space.
 *
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
