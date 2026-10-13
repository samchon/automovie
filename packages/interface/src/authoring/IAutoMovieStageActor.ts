import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieMountBinding } from "../harness/IAutoMovieMountBinding";

/**
 * One scripted actor's initial world placement and persistent coupling.
 *
 * `stageScene` lowers it to a scene node at unit scale whose model is the cast
 * member's `modelRef`, or `node` itself when the member has none.
 *
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
