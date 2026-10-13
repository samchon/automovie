import { IAutoMovieClip } from "../core/IAutoMovieClip";
import { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";

/**
 * One alternate camera take covering the shot's beat (#1187): the staged camera
 * that plays the angle, its compiled move, and its per-span directorial intent.
 * Same contract as the hero take, plural: a beat blocked for several angles
 * assembles one take per staged camera, and a render/diffusion host picks or
 * intercuts them without re-performing the shot.
 *
 * @evidence contracts/common.md#principled-implementation `performShot` compiles one take per validated blocking coverage intent through `compileCameraCoverage`, playing that single intent from time 0 across the whole beat with the take's own staged camera as the solve parameter.
 * @evidence contracts/common.md#clear-and-simple-design Repeats the hero take's camera, move and intent fields in plural form so a host can switch angles without re-performing, and carries no timing because a coverage angle spans the beat.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The artifact gate refuses a take on the hero camera, a repeated camera and an unknown scene camera, the same rules `performShot` applied before compiling, so stored and freshly compiled takes obey one rule set.
 * @evidence contracts/common.md#meaningful-documentation States that the camera is never the hero, the null meaning of a static move, and that the intent list uses the same record as the hero take.
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
