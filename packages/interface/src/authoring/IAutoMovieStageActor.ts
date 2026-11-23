import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMountBinding } from "../harness/IAutoMovieMountBinding";
import type { IAutoMovieStageSupportWindow } from "./IAutoMovieStageSupportWindow";

/**
 * One scripted actor's initial world placement and persistent coupling.
 *
 * `stageScene` lowers it to a unit-scale scene node whose model is the cast
 * member's `modelRef`, or `node` itself when the member has none. After
 * checking the authored stage and blocking, `compileDefinedShot` restages
 * actors named in the supplied prior beat state with its translation, facing
 * and mount; actors without carried state retain their authored placement.
 */
export interface IAutoMovieStageActor {
  /** Script cast id; this is also the scene-node identity. */
  node: string;

  /** Finite initial root position in world metres. */
  position: IAutoMovieVector3;

  /** Finite initial heading in degrees about +Y, where zero faces +Z. */
  facingDeg: number;

  /**
   * Static ground choices in increasing shot-local time. Omission keeps the
   * scene-wide ground rule. When present, begin at zero and author the last
   * active window through the shot's end.
   */
  support?: readonly IAutoMovieStageSupportWindow[];

  /**
   * Film-persistent mount carried through beat-end continuity, when present.
   * The parent must be another placed actor whose rig has the named bone.
   */
  attach?: IAutoMovieMountBinding;
}
