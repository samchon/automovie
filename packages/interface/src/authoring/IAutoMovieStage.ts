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
 * identity and lower the set into deterministic scene data. Node ids must be
 * unique across actors, set pieces, cameras and lights.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` checks referential integrity (every cast member placed, every placement a cast member, ids unique across all four lists, resolvable camera targets and mount parents) and lowers the set into an `IAutoMovieScene` without judging distances.
 * @evidence contracts/common.md#clear-and-simple-design Actors, set pieces, cameras and lights keep separate lists with their own placement shapes, while `space`, `fog` and `environment` go through `validateSpace`, `validateFogPlacement` and `validateSceneEnvironment` instead of stage-specific rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent `space` lowers to `space: null` while absent `fog` and `environment` are omitted from the scene, a stated asymmetry that keeps the bytes and digest of scenes that never mention fog.
 * @evidence contracts/common.md#meaningful-documentation States the scene-id citation, the cross-list id uniqueness, that `plan` is unchecked prose, that set pieces never perform, and what omitting `fog` means.
 * @author Samchon
 */
export interface IAutoMovieStage {
  /**
   * Stable scene identity cited by every registered shot that uses this set.
   */
  scene: IAutoMovieNamedId;

  /**
   * Human-readable geometric rationale retained beside the authored values;
   * `stageScene` does not read it.
   */
  plan: string;

  /** One placement for every scripted cast node that appears on the set. */
  actors: IAutoMovieStageActor[];

  /** Optional static set geometry; these nodes never perform an action. */
  set?: IAutoMovieStageSetPiece[];

  /**
   * Walkable surfaces whose geometry drives grounding and locomotion checks.
   * Omitted lowers to `space: null`, the scalar ground plane.
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
