import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A live bone on a rigged staged actor, resolved on the shot clock.
 *
 * `performShot` refuses a node that is not staged, has no actor context when
 * the caller supplies that check, or has no rig, and a bone that rig does not
 * carry. The bone's world position is then sampled from the actor's posed
 * skeleton at each instant the verb asks about, so a gaze or reach follows a
 * moving hand. `resolveTargetPoint` answers `null` for it, so a distance query
 * cannot use it.
 */
export interface IAutoMovieBoneTarget {
  /** Selects a live skeleton bone as the target representation. */
  kind: "bone";

  /** Staged actor node carrying the rig. */
  node: string;

  /** Bone on that actor's declared skeleton. */
  bone: AutoMovieHumanoidBone;
}
