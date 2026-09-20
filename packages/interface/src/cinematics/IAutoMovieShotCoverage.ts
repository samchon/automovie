import { IAutoMovieClip } from "../core/IAutoMovieClip";
import { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";

/**
 * One alternate camera take covering the shot's beat (#1187): the staged camera
 * that plays the angle, its compiled move, and its per-span directorial intent.
 * Same contract as the hero take, plural: a beat blocked for several angles
 * assembles one take per staged camera, and a render/diffusion host picks or
 * intercuts them without re-performing the shot.
 *
 * @evidence requirements/camera/position-and-movement.md#camera-path-time-sampling Exposes `IAutoMovieShotCoverage` as the portable data boundary for the camera path time sampling requirement.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-direct-sampling Types `IAutoMovieShotCoverage` for the clv camera path direct sampling system contract.
 */
export interface IAutoMovieShotCoverage {
  /**
   * Id of the scene camera this take plays on (never the hero `camera`).
   *
   * @evidence requirements/camera/position-and-movement.md#camera-path-time-sampling Exposes `camera` as the portable data boundary for the camera path time sampling requirement.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-direct-sampling Types `camera` for the clv camera path direct sampling system contract.
   */
  camera: string;

  /**
   * The covering camera's move: a clip of its transform tracks, compiled by the
   * same framing grammar as the hero `cameraMotion`. `null` for a locked-off
   * (static) covering camera.
   *
   * @evidence requirements/camera/position-and-movement.md#camera-path-time-sampling Exposes `cameraMotion` as the portable data boundary for the camera path time sampling requirement.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-direct-sampling Types `cameraMotion` for the clv camera path direct sampling system contract.
   */
  cameraMotion: IAutoMovieClip | null;

  /**
   * This take's directorial intent per frame span, the same record the hero
   * take carries on `cameraIntent`. Empty when the angle had no frame actions.
   *
   * @evidence requirements/camera/position-and-movement.md#camera-path-time-sampling Exposes `cameraIntent` as the portable data boundary for the camera path time sampling requirement.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-direct-sampling Types `cameraIntent` for the clv camera path direct sampling system contract.
   */
  cameraIntent: IAutoMovieCameraIntent[];
}
