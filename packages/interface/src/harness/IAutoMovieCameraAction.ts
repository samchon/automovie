import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * The camera is an actor; this is how it moves. A list of camera actions
 * composes a move that changes mid-shot ("follow the charge, then hold static
 * on the fall"), which the engine realizes against the target as the shot's
 * camera-node clip (`cameraMotion`).
 *
 * `performShot` requires the `actor` to be exactly one staged camera and allows
 * one live camera per shot. Its moves may not share a start or overlap; an
 * `"auto"` duration runs until the next move starts, or to the shot end. The
 * `on` target and any `focus` must resolve to a point (node, point, or group).
 * `compileCameraMove` owns the path each `move` takes.
 *
 * @evidence contracts/common.md#principled-implementation `performShot` sorts the live camera's frame actions by start, refuses equal starts and explicit spans that run past the next start, and hands each span to `compileCameraMove`, which solves the camera path from the framing, the move and the resolved subject.
 * @evidence contracts/common.md#clear-and-simple-design Framing, move and subject are closed choices the solver understands; the two lens intents are optional fields copied into `shot.cameraIntent` instead of a separate lens record the solve would also have to ignore.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `focus` and `focalLength` never alter the solved camera, and the scene camera's `fovY` stays the geometric truth, so a diffusion hint cannot change what the deterministic render frames.
 * @evidence contracts/common.md#meaningful-documentation States the camera-as-actor model, every refusal about actor, live camera, overlap and target kind, what `"auto"` means here, and the owner of each move's path; members give the closed values, units, bounds and that the lens fields only reach `shot.cameraIntent`.
 * @author Samchon
 */
export interface IAutoMovieCameraAction extends IAutoMovieActionBase {
  /** Selects camera framing as the action family. */
  verb: "frame";

  /** How tight the framing is. */
  framing: "wide" | "full" | "medium" | "close";

  /** How the camera behaves over this span. */
  move: "static" | "follow" | "orbit" | "push-in" | "truck" | "whip";

  /** What it frames and tracks. */
  on: IAutoMovieActionTarget;

  /**
   * What the lens holds sharp, when it differs from `on` (a rack focus onto the
   * approaching rider while the frame stays on the gate). Structural intent
   * for a diffusion or render host: `performShot` copies its resolved point
   * into `shot.cameraIntent`, the deterministic camera solve never reads it,
   * and it produces no depth-of-field blur. Omit when the framed subject is
   * the focus.
   */
  focus?: IAutoMovieActionTarget;

  /**
   * Lens intent in millimetres, full-frame equivalent (24 wide, 50 normal, 85
   * portrait), finite and `> 0`. Structural intent only: it is copied into
   * `shot.cameraIntent`, while the scene camera's `fovY` stays the geometric
   * truth and the solve never reads it. Omit when the lens is not a
   * directorial choice.
   */
  focalLength?: number;
}
