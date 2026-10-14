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
 * @evidence contracts/common.md#principled-implementation The low-level resolveBoneTarget samples motion or rest, applies root-inclusive FK with humanoid axes and context rest frames, then staged facing/position; it currently has only test callers. Shot admission and actor synthesis require their supplied live target callbacks to resolve bones, and dynamic gaze/reach clips sample rather than continuously evaluate that world point.
 * @evidence contracts/common.md#clear-and-simple-design A node id and a semantic bone are all a live point on a figure needs; the skeleton and motion come from the staged actor, not from the target record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing rigs/bones are located refusals at shot admission; unavailable bone callbacks cannot be replaced by staged root positions. The low-level resolver represents rigid position/+Y facing and omits arbitrary node scale, while callback stability between admission and compilation remains a host responsibility.
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
