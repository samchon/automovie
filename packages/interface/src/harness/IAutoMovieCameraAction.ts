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
 * `on` target and any `focus` must resolve to a point (node, live bone, point, or group), with formation groups allowed for lens targets.
 * `compileCameraMove` owns the path each `move` takes.
 *
 * @evidence contracts/common.md#principled-implementation performShot sorts frame starts and checks overlap, then compileCameraMove fits supplied subject height/radius by the pinhole vertical/horizontal bounds along staged bearing. Orbit/push/truck use eight eased segments, follow samples at 4 Hz and whip turns within 0.2 seconds; linear keys approximate these paths, and opening rest/proxy extents are not a measured visible-pixel enclosure.
 * @evidence contracts/common.md#clear-and-simple-design Framing, move and subject are closed choices the solver understands; the two lens intents are optional fields copied into `shot.cameraIntent` instead of a separate lens record the solve would also have to ignore.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Focus and focalLength leave the deterministic solve unchanged and produce no depth-of-field blur. Missing/invalid aspect uses a square-fit fallback at the low-level compiler, close keys within 1e-9 seconds merge with later values, and focus is resolved as a metadata point at the compiler's opening read rather than animated lens tracking.
 * @evidence contracts/common.md#meaningful-documentation States the camera-as-actor model, every refusal about actor, live camera, overlap and target kind, what `"auto"` means here, and the owner of each move's path; members give the closed values, units, bounds and that the lens fields only reach `shot.cameraIntent`.
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
