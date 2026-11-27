import type { IAutoMovieStage } from "../authoring/IAutoMovieStage";
import type { IAutoMovieCamera } from "./IAutoMovieCamera";
import type { IAutoMovieFog } from "./IAutoMovieFog";
import type { IAutoMovieLight } from "./IAutoMovieLight";
import type { IAutoMovieMedium } from "./IAutoMovieMedium";
import type { IAutoMovieSceneEnvironment } from "./IAutoMovieSceneEnvironment";
import type { IAutoMovieSceneNode } from "./IAutoMovieSceneNode";
import type { IAutoMovieSpace } from "./IAutoMovieSpace";

/**
 * A scene: placed characters, cameras, and lights, the top-level container the
 * viewer plays and the renderer bakes frames from.
 *
 * The scene is the composition layer above individual rigs: it says _where_
 * characters stand, _what_ they are doing (which motion/pose), and _how_ the
 * frame is lit and framed. A structured building owns rooms and lowers the
 * world transforms of its visible elements here, while actors and props remain
 * ordinary scene nodes in that same frame.
 */
export interface IAutoMovieScene {
  /** Stable id. */
  id: string;

  /** Human / LLM readable name. Null if unnamed. */
  name: string | null;

  /** Placed characters and what each is doing. */
  nodes: IAutoMovieSceneNode[];

  /** Cameras; the first is the default render viewpoint when unspecified. */
  cameras: IAutoMovieCamera[];

  /** Scene lights. */
  lights: IAutoMovieLight[];

  /** Optional physical render environment; omitted preserves legacy output. */
  environment?: IAutoMovieSceneEnvironment | null;

  /**
   * The scene's space: standable surfaces and walkability (#605). Absent or
   * `null` means no declared space: the engine falls back to the scalar ground
   * plane it assumed before the space layer existed. Optional (`?`) rather than
   * required so every pre-space scene stays valid, the evolving-schema pattern
   * {@link IAutoMovieShot.events} uses.
   *
   * Staging authors it ({@link IAutoMovieStage.space}); the low-level viewer
   * builder tessellates each nondegenerate patch for structural passes. Its
   * ordinary material writes no beauty colour or depth, because semantic
   * support does not establish that an authored physical floor exists.
   * Heightfield interiors are planar triangle approximations of the bilinear
   * height law.
   */
  space?: IAutoMovieSpace | null;

  /**
   * The scene's atmosphere: exponential distance fog ({@link IAutoMovieFog}),
   * the depth cue an exterior needs and the only one that costs no particles.
   *
   * Absent or `null` means no atmosphere, and a scene that says nothing about
   * fog renders exactly as it did before the field existed: the viewer leaves
   * `scene.fog` unset and every offline consumer derives a transmittance of
   * one. Optional (`?`) rather than required for the same evolving-schema
   * reason {@link space} is, so no committed scene has to be rewritten.
   *
   * ApplySceneFog constructs FogExp2 from this declaration;
   * sceneFogTransmittance predicts the same squared camera-depth law in
   * binary64. Shader precision, rasterization and appearance processing can
   * differ, so the shared formula does not certify identical rendered pixels or
   * numbers. Structural guide passes suspend fog to preserve their geometry
   * channels.
   */
  fog?: IAutoMovieFog | null;

  /**
   * The scene's physical haze ({@link IAutoMovieMedium}), which dims what lies
   * behind it and scatters the scene's lights toward the camera. Absent or
   * `null` means none. A scene carries a fog or a medium, never both; staging
   * refuses both. `applySceneMedium` attaches it to a built scene, and a
   * directly rendered film draws it in its linear beauty target, so a draw
   * scene with a medium must supply `optics`, and `AutoMovieRenderScenePass.render`,
   * which has no linear target, refuses it.
   */
  medium?: IAutoMovieMedium | null;
}
