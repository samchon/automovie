import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieMountBinding } from "../harness/IAutoMovieMountBinding";

/** One scripted actor's initial world placement and persistent coupling. */
export interface IAutoMovieStageActor {
  /** Script cast id; this is also the scene-node identity. */
  node: string;

  /** Initial root position in world meters. */
  position: IAutoMovieVector3;

  /** Initial heading in degrees about +Y, where zero faces +Z. */
  facingDeg: number;

  /**
   * Film-persistent mount carried through beat-end continuity, when present.
   */
  attach?: IAutoMovieMountBinding;
}
