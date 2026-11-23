import type { IAutoMovieFlameCue } from "../cinematics/IAutoMovieFlameCue";
import type { IAutoMoviePolygonBodyCue } from "../cinematics/IAutoMoviePolygonBodyCue";
import type { IAutoMoviePracticalSurfaceTrack } from "../cinematics/IAutoMoviePracticalSurfaceTrack";
import type { IAutoMovieSurfaceGraphicTrack } from "../cinematics/IAutoMovieSurfaceGraphicTrack";
import type { IAutoMovieScript } from "../harness/IAutoMovieScript";
import type { IAutoMovieBlocking } from "./IAutoMovieBlocking";
import type { IAutoMoviePerformance } from "./IAutoMoviePerformance";
import type { IAutoMovieShotActorProgram } from "./IAutoMovieShotActorProgram";
import type { IAutoMovieStage } from "./IAutoMovieStage";

/**
 * Context-free shot program returned by a registered source builder.
 *
 * CompileDefinedShot requires stage.scene.id to equal the registration's scene,
 * both blocking and performance to carry the contract beat and durationSeconds
 * with strict equality, and eventSamples to sample each contract event exactly
 * once inside its window before staging, blocking and performance.
 */
export interface IAutoMovieShotProgram {
  /**
   * Runtime facts for the staged actors whose verbs need a measured speed or
   * eye height, at most one entry per `stage.actors` node.
   *
   * Geometry and gait curves remain builder-owned through
   * {@link IAutoMovieShotActorProgram.model}; the source states only the
   * scale-dependent values a generic builder cannot infer without guessing.
   */
  actors: IAutoMovieShotActorProgram[];

  /** The film's script, whose beats must include the registered beat. */
  script: IAutoMovieScript;

  /** Set declaration whose `scene.id` must equal the registration's scene. */
  stage: IAutoMovieStage;

  /** Checked plan that the action program must realize. */
  blocking: IAutoMovieBlocking;

  /**
   * Thin verb program compiled by the engine, including any shot-local
   * editorial markers.
   */
  performance: IAutoMoviePerformance;

  /** Shot-local material changes on staged prop parts, admitted by performShot. */
  practicalSurfaces?: readonly IAutoMoviePracticalSurfaceTrack[];

  /** Pictures on `surface` affordances of staged props, admitted by performShot. */
  surfaceGraphics?: readonly IAutoMovieSurfaceGraphicTrack[];

  /** Flames at staged props' flame frames, admitted by performShot. */
  flames?: readonly IAutoMovieFlameCue[];

  /**
   * Polygon body changes at source-shot times, admitted by performShot against
   * the staged subjects.
   */
  polygonBodyCues?: readonly IAutoMoviePolygonBodyCue[];

  /**
   * One authoritative sample time for every event the contract declares, inside
   * that event's window; undeclared or repeated ids are refused.
   */
  eventSamples: Array<{
    /** Id of an event the registered contract declares. */
    id: string;

    /**
     * Finite shot-local measurement time in seconds, within the event's
     * contract window inclusive.
     */
    time: number;
  }>;
}
