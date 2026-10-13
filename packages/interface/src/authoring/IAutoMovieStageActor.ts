import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieMountBinding } from "../harness/IAutoMovieMountBinding";

/**
 * One scripted actor's initial world placement and persistent coupling.
 *
 * `stageScene` lowers it to a scene node at unit scale whose model is the cast
 * member's `modelRef`, or `node` itself when the member has none. When a
 * registered shot resumes a prior beat's end state, `compileDefinedShot`
 * replaces `position`, `facingDeg` and `attach` with that state before
 * staging, so these values only open the first beat an actor appears in.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` requires a cast-member node, a finite position and a finite heading, turns the heading into a quaternion about +Y, and checks that a mount parent is another placed actor; `performShot` then bakes the mount through the same attach baker an `attachTo` uses and refuses a rig-less parent or a missing bone.
 * @evidence contracts/common.md#clear-and-simple-design Placement is a ground position and a single heading because a staged actor stands upright; scale and model come from the cast, so the placement carries only what the script does not already say.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A mount that names the actor itself is refused rather than ignored, and a resumed beat overwrites the placement from recorded state instead of trusting a stale authored value.
 * @evidence contracts/common.md#meaningful-documentation States how the node and model are chosen, the world frame, units and heading convention, what resumption replaces, and every requirement on the mount parent and bone.
 * @author Samchon
 */
export interface IAutoMovieStageActor {
  /** Script cast id; this is also the scene-node identity. */
  node: string;

  /** Finite initial root position in world metres. */
  position: IAutoMovieVector3;

  /** Finite initial heading in degrees about +Y, where zero faces +Z. */
  facingDeg: number;

  /**
   * Film-persistent mount carried through beat-end continuity, when present.
   * The parent must be another placed actor whose rig has the named bone.
   */
  attach?: IAutoMovieMountBinding;
}
