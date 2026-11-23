import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";

/**
 * One alternate camera take covering the shot's beat: the staged camera that
 * plays the angle, its compiled move, and its per-span directorial intent.
 *
 * It follows the hero take's contract for each extra angle: a beat blocked for
 * several angles assembles one take per staged camera, and a render or
 * diffusion host picks or intercuts them without re-performing the shot.
 */
export interface IAutoMovieShotCoverage {
  /**
   * Id of the scene camera this take plays on; never the hero `camera`, and
   * never another take's camera.
   */
  camera: string;

  /**
   * The covering camera's move: a clip of its transform tracks, compiled by the
   * same framing grammar as the hero `cameraMotion`. `null` for a locked-off
   * (static) covering camera.
   */
  cameraMotion: IAutoMovieClip | null;

  /**
   * This take's directorial intent per frame span, the same record the hero
   * take carries on `cameraIntent`. Empty when the angle had no frame actions.
   */
  cameraIntent: IAutoMovieCameraIntent[];
}
