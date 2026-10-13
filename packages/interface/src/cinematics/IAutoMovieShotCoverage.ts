import { IAutoMovieClip } from "../core/IAutoMovieClip";
import { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";

/**
 * One alternate camera take covering the shot's beat (#1187): the staged camera
 * that plays the angle, its compiled move, and its per-span directorial intent.
 * Same contract as the hero take, plural: a beat blocked for several angles
 * assembles one take per staged camera, and a render/diffusion host picks or
 * intercuts them without re-performing the shot.
 *
 * @author Samchon
 */
export interface IAutoMovieShotCoverage {
  /**
   * Id of the scene camera this take plays on (never the hero `camera`, and
   * never another take's camera).
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
