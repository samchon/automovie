import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieMountBinding } from "../harness/IAutoMovieMountBinding";

/**
 * One scripted actor's initial world placement and persistent coupling.
 *
 * `stageScene` lowers it to a scene node at unit scale whose model is the cast
 * member's `modelRef`, or `node` itself when the member has none.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` lowers `facingDeg` with `Quaternion.fromAxisAngle` about +Y and copies `position` into the node translation at unit scale, after refusing a non-finite position or heading.
 * @evidence contracts/common.md#clear-and-simple-design The scene node takes `node` as its id and `modelRef ?? node` as its model, so the cast id doubles as the join key and this record needs no model field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A mount riding the actor itself or an unplaced actor is refused at staging; the parent bone is checked later by `performShot`, which owns the rig lookup, rather than guessed here.
 * @evidence contracts/common.md#meaningful-documentation Documents world metres, the degrees-about-+Y heading with zero facing +Z, the model fallback, and that `attach` persists across beats.
 * @author Samchon
 */
export interface IAutoMovieStageActor {
  /** Script cast id; this is also the scene-node identity. */
  node: string;

  /** Initial root position in world meters. */
  position: IAutoMovieVector3;

  /** Initial heading in degrees about +Y, where zero faces +Z. */
  facingDeg: number;

  /**
   * Film-persistent mount carried through beat-end continuity, when present.
   * The parent must be another placed actor whose rig has the named bone.
   */
  attach?: IAutoMovieMountBinding;
}
