import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A live bone on a rigged staged actor, resolved on the shot clock.
 *
 * `performShot` refuses a node that is not staged, has no actor context when
 * the caller supplies that check, or has no rig, and a bone that rig does not
 * carry. The bone's world position is then sampled from the actor's posed
 * skeleton at each instant the verb asks about, so a gaze or reach follows a
 * moving hand. `resolveTargetPoint` answers `null` for it, so a distance query
 * cannot use it.
 *
 * @evidence contracts/common.md#principled-implementation `resolveBoneTarget` samples the actor's motion at the requested time, or its rest pose without one, runs forward kinematics with the humanoid joint axes, then rotates the bone's model-space position by the staged facing and adds the staged position.
 * @evidence contracts/common.md#clear-and-simple-design A node id and a semantic bone are all a live point on a figure needs; the skeleton and motion come from the staged actor, not from the target record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing rig or bone is refused with a located violation rather than falling back to the actor's root position.
 * @evidence contracts/common.md#meaningful-documentation States every refusal, how and when the position is sampled, and that point-only consumers cannot use it; members name the node and bone requirements.
 * @author Samchon
 */
export interface IAutoMovieBoneTarget {
  /** Selects a live skeleton bone as the target representation. */
  kind: "bone";

  /** Staged actor node carrying the rig. */
  node: string;

  /** Bone on that actor's declared skeleton. */
  bone: AutoMovieHumanoidBone;
}
