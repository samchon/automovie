import { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import { IAutoMovieFog } from "../scene/IAutoMovieFog";
import { IAutoMovieSceneEnvironment } from "../scene/IAutoMovieSceneEnvironment";
import { IAutoMovieSpace } from "../scene/IAutoMovieSpace";
import { IAutoMovieStageActor } from "./IAutoMovieStageActor";
import { IAutoMovieStageCamera } from "./IAutoMovieStageCamera";
import { IAutoMovieStageLight } from "./IAutoMovieStageLight";
import { IAutoMovieStageSetPiece } from "./IAutoMovieStageSetPiece";

/**
 * The coding-agent-owned set before a shot is performed.
 *
 * This is an engine input. Positions and couplings stay declarative so `stageScene` can validate identities and lower the set into deterministic scene data. Node ids must be non-blank and unique across actors, set pieces, cameras and lights.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` checks referential integrity and finite ranges, not craft: every cast member placed exactly once and every placement a cast member, unique non-blank ids across the four node lists, camera and mount targets that resolve, and the space, fog and environment through their own validators; it then lowers actors and set pieces to scene nodes, cameras to resolved scene cameras and lights to scene lights.
 * @evidence contracts/common.md#clear-and-simple-design The set is one record of typed lists, one per kind of placement, plus optional world members lowered verbatim; each list's rules live on its element type, and the cross-list id uniqueness is stated once here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted `space` lowers to an explicit `space: null` while an omitted `fog` or `environment` is left absent, so a scene states whether it has a ground and an unstaged atmosphere does not change the bytes of scenes that never declared one; no node id or set shape is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States who owns the record and who consumes it, the id uniqueness rule, what each optional member lowers to when omitted, which validator checks it, that `plan` is never read, and that a shot needs at least one camera.
 * @author Samchon
 */
export interface IAutoMovieStage {
  /**
   * Stable scene identity, with a non-blank id, cited by every registered shot that uses this set.
   */
  scene: IAutoMovieNamedId;

  /**
   * Human-readable geometric rationale retained beside the authored values; `stageScene` does not read it.
   */
  plan: string;

  /**
   * Exactly one placement for every script cast member and none for any other node.
   */
  actors: IAutoMovieStageActor[];

  /** Optional unrigged set geometry, lowered to motionless scene nodes. */
  set?: IAutoMovieStageSetPiece[];

  /**
   * Walkable surfaces whose geometry drives grounding and locomotion checks, checked by `validateSpace` and lowered verbatim. Omitted lowers to `space: null`, the scalar ground plane.
   */
  space?: IAutoMovieSpace;

  /**
   * The set's atmosphere, range-checked and lowered verbatim onto the composed scene's `fog`. Omitted composes a scene with no `fog` member, which renders without atmosphere.
   */
  fog?: IAutoMovieFog;

  /**
   * Image lighting, exposure, tone mapping and shadow policy, checked against these lights by `validateSceneEnvironment` and lowered verbatim. Omitted leaves those decisions to the host renderer.
   */
  environment?: IAutoMovieSceneEnvironment;

  /**
   * Cameras available to the shot and its coverage takes. Staging accepts an empty list, but `performShot` refuses a shot whose staged scene has no camera to frame it.
   */
  cameras: IAutoMovieStageCamera[];

  /** Physical light declarations lowered into the deterministic scene. */
  lights: IAutoMovieStageLight[];
}
