import type { IAutoMovieColor } from "../color/IAutoMovieColor";
import type { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import type { IAutoMovieFog } from "../scene/IAutoMovieFog";
import type { IAutoMovieMedium } from "../scene/IAutoMovieMedium";
import type { IAutoMovieSceneEnvironment } from "../scene/IAutoMovieSceneEnvironment";
import type { IAutoMovieSpace } from "../scene/IAutoMovieSpace";
import type { IAutoMovieStageActor } from "./IAutoMovieStageActor";
import type { IAutoMovieStageCamera } from "./IAutoMovieStageCamera";
import type { IAutoMovieStageLight } from "./IAutoMovieStageLight";
import type { IAutoMovieStageSetPiece } from "./IAutoMovieStageSetPiece";

/**
 * The coding-agent-owned set before a shot is performed.
 *
 * This is an engine input. Positions and couplings stay declarative so
 * `stageScene` can validate identities and lower the set into deterministic
 * scene data. Node ids must be non-blank and unique across actors, set pieces,
 * cameras and lights.
 */
export interface IAutoMovieStage {
  /**
   * Stable scene identity, with a non-blank id, cited by every registered shot
   * that uses this set.
   */
  scene: IAutoMovieNamedId;

  /**
   * Human-readable geometric rationale retained beside the authored values;
   * `stageScene` does not read it.
   */
  plan: string;

  /**
   * Exactly one placement for every script cast member and none for any other
   * node.
   */
  actors: IAutoMovieStageActor[];

  /** Optional unrigged set geometry, lowered to motionless scene nodes. */
  set?: IAutoMovieStageSetPiece[];

  /**
   * Walkable surfaces whose geometry drives grounding and locomotion checks,
   * checked by `validateSpace` and lowered verbatim. Omitted lowers to `space:
   * null`, the scalar ground plane.
   */
  space?: IAutoMovieSpace;

  /**
   * The set's fog specified by density, range-checked and lowered verbatim.
   * Author this field or `fogVisibility`. Omit both for a scene without fog.
   */
  fog?: IAutoMovieFog;

  /**
   * Calibrate the set's fog by the fraction of the subject color retained at a
   * reference camera-axis depth. Staging solves the FogExp2 law for a finite
   * scene density. Use either this field or `fog`.
   */
  fogVisibility?: {
    /** Positive finite reference camera-axis depth in metres. */
    cameraDepthM: number;

    /**
     * Finite fraction of subject color retained at that depth, in (0, 1]. One
     * produces zero fog density.
     */
    transmittance: number;

    /** Linear fog color approached as transmittance decreases. */
    color: IAutoMovieColor;
  };

  /**
   * The set's physical haze, range-checked and lowered verbatim to the scene's
   * `medium`. Staging refuses it beside `fog` or `fogVisibility`. Omit it, or
   * give `null`, for clear air.
   */
  medium?: IAutoMovieMedium | null;

  /**
   * Image lighting, exposure, tone mapping and shadow policy, checked against
   * these lights by `validateSceneEnvironment` and lowered verbatim. Omitted
   * leaves those decisions to the host renderer.
   */
  environment?: IAutoMovieSceneEnvironment;

  /**
   * Cameras available to the shot and its coverage takes. Staging accepts an
   * empty list, but `performShot` refuses a shot whose staged scene has no
   * camera to frame it.
   */
  cameras: IAutoMovieStageCamera[];

  /** Physical light declarations lowered into the deterministic scene. */
  lights: IAutoMovieStageLight[];
}
