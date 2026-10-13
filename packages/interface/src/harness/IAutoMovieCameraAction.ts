import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * The camera is an actor; this is how it moves. A _list_ of camera actions
 * composes a move that changes mid-shot ("follow the charge, then hold static
 * on the fall"). The engine realises the framing/move against the target as a
 * camera-node clip (`cameraMotion` on the shot).
 */
export interface IAutoMovieCameraAction extends IAutoMovieActionBase {
  /** Selects camera framing as the action family. */
  verb: "frame";

  /** How tight the framing is. */
  framing: "wide" | "full" | "medium" | "close";

  /** How the camera behaves over this span. */
  move: "static" | "follow" | "orbit" | "push-in" | "truck" | "whip";

  /** What it frames/tracks. */
  on: IAutoMovieActionTarget;

  /**
   * What the lens holds sharp, when it differs from `on` (a rack focus onto the
   * approaching rider while the frame stays on the gate). Structural guide
   * INTENT for a diffusion/render host (#1187): the deterministic camera solve
   * never reads it, and it is not depth-of-field blur (that is diffusion's
   * job). Omit when the framed subject is the focus.
   */
  focus?: IAutoMovieActionTarget;

  /**
   * Lens intent in millimetres (full-frame equivalent: 24 wide, 50 normal, 85
   * portrait). Structural guide INTENT only (#1187): the scene camera's `fovY`
   * stays the geometric truth and this never changes the solve. Omit when the
   * lens is not a directorial choice.
   */
  focalLength?: number;
}
