import { IAutoMovieClip } from "../core/IAutoMovieClip";
import { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";

/**
 * One alternate camera take covering the shot's beat: the staged camera that
 * plays the angle, its compiled move, and its per-span directorial intent.
 *
 * It follows the hero take's contract for each extra angle: a beat blocked for
 * several angles assembles one take per staged camera, and a render or
 * diffusion host picks or intercuts them without re-performing the shot.
 *
 * @evidence contracts/common.md#principled-implementation `performShot` compiles each take's move with the same framing solve as the hero camera, and `appendShotMetadataArtifact` requires a non-blank camera that is a scene camera, is not the hero camera and appears once, a move that is `null` or a valid clip, and a camera-intent list held to the same rules as the hero's.
 * @evidence contracts/common.md#clear-and-simple-design A take repeats only the three per-camera fields of the hero take (camera, move, intent) and inherits everything else from the shot, so the cut and the performances exist once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The hero camera and a duplicate camera are refused rather than collapsed into one take, and coverage never becomes a separate timeline entry.
 * @evidence contracts/common.md#meaningful-documentation States what a take is for, which cameras it may and may not use, what a null move and an empty intent list mean, and that it reuses the hero take's grammar.
 * @author Samchon
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
