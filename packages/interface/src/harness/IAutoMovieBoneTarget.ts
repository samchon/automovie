import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A live bone on a rigged staged actor, resolved on the shot clock.
 *
 * `performShot` refuses a node that is not staged, has no actor context or no
 * rig, and a bone that rig does not carry. The bone's world position is then
 * sampled from the actor's posed skeleton at each instant the verb asks about.
 *
 * @evidence contracts/common.md#principled-implementation Resolves by sampling the actor's posed skeleton at the requested shot time, so a target that moves with a limb is tracked instead of read once from the staged placement.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the actor node and a bone from the shared humanoid vocabulary, which is enough for the engine to find the rig and run its forward kinematics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bone or actor is special-cased; a missing rig or bone is refused at the target's path rather than falling back to the node origin.
 * @evidence contracts/common.md#meaningful-documentation States the staging, actor-context and rig requirements, the refusals, and that the point is sampled on the shot clock.
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
