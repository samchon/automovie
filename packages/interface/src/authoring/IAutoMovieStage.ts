import { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import { IAutoMovieFog } from "../scene/IAutoMovieFog";
import { IAutoMovieSceneEnvironment } from "../scene/IAutoMovieSceneEnvironment";
import { IAutoMovieSpace } from "../scene/IAutoMovieSpace";
import { IAutoMovieStageActor } from "./IAutoMovieStageActor";
import { IAutoMovieStageCamera } from "./IAutoMovieStageCamera";
import { IAutoMovieStageLight } from "./IAutoMovieStageLight";
import { IAutoMovieStageSetPiece } from "./IAutoMovieStageSetPiece";

/**
 * Models the coding-agent-owned set before a shot is performed.
 *
 * This is an engine input, not an LLM application payload. Positions and
 * couplings are kept declarative so {@code stageScene} can validate every
 * identity and lower the set into deterministic scene data.
 */
export interface IAutoMovieStage {
  /**
   * Stable scene identity cited by every registered shot that uses this set.
   */
  scene: IAutoMovieNamedId;

  /** Human-readable geometric rationale retained beside the authored values. */
  plan: string;

  /** One placement for every scripted cast node that appears on the set. */
  actors: IAutoMovieStageActor[];

  /** Optional static set geometry; these nodes never perform an action. */
  set?: IAutoMovieStageSetPiece[];

  /**
   * Walkable surfaces whose geometry drives grounding and locomotion checks.
   */
  space?: IAutoMovieSpace;

  /**
   * The set's atmosphere, lowered verbatim onto the composed scene's `fog`.
   * Omitted stages a scene with no atmosphere, which renders exactly as every
   * staged scene did before the field existed.
   */
  fog?: IAutoMovieFog;

  /** Optional image-lighting, exposure, tone mapping, and shadow policy. */
  environment?: IAutoMovieSceneEnvironment;

  /** Cameras available to the shot and its alternate coverage takes. */
  cameras: IAutoMovieStageCamera[];

  /** Physical light declarations lowered into the deterministic scene. */
  lights: IAutoMovieStageLight[];
}
