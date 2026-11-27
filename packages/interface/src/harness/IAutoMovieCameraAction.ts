import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import type { AutoMovieCameraFraming } from "./AutoMovieCameraFraming";
import type { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";
import type { IAutoMovieCameraActionFocusPull } from "./IAutoMovieCameraActionFocusPull";

/**
 * The camera is an actor; this is how it moves. A list of camera actions
 * composes a move that changes mid-shot ("follow the charge, then hold static
 * on the fall"), which the engine realizes against the target as the shot's
 * camera-node clip (`cameraMotion`).
 *
 * `performShot` requires the `actor` to be exactly one staged camera and allows
 * one live camera per shot. Its moves may not share a start or overlap; an
 * `"auto"` duration runs until the next move starts, or to the shot end. The
 * `on` target and any `focus` must resolve to a point (node, live bone, point,
 * or group), with formation groups allowed for lens targets.
 * `compileCameraMove` owns the path each `move` takes.
 */
export interface IAutoMovieCameraAction extends IAutoMovieActionBase {
  /** Selects camera framing as the action family. */
  verb: "frame";

  /** How tight the framing is. */
  framing: AutoMovieCameraFraming;

  /** How the camera behaves over this span. */
  move: "static" | "follow" | "orbit" | "push-in" | "truck" | "whip";

  /**
   * Finite nonnegative seconds of aim lookahead for a `"follow"` move. At a
   * camera key, translation follows the subject's current position and rotation
   * aims at the subject this far ahead, capped at the shot end. Omission or
   * zero aims at the current position. The frame action gate rejects this field
   * on other moves.
   *
   * @see https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineRotationComposer.html
   */
  lookahead?: number;

  /** What it frames and tracks. */
  on: IAutoMovieActionTarget;

  /**
   * The lens subject, which may differ from the framed subject `on`.
   * `performShot` records the world point in `shot.cameraIntent` at the shot
   * opening, or at the pull's first mark when `focusPull` is present.
   */
  focus?: IAutoMovieActionTarget;

  /**
   * Timed focus pull from the explicit `focus` subject to another lens subject.
   * The frame action's interval contains both marks. A downstream host can read
   * these lens marks independently of the camera path.
   */
  focusPull?: IAutoMovieCameraActionFocusPull;

  /**
   * Lens intent in millimetres, full-frame equivalent (24 wide, 50 normal, 85
   * portrait), finite and `> 0`. Structural intent only: it is copied into
   * `shot.cameraIntent`, while the scene camera's `fovY` stays the geometric
   * truth and the solve never reads it. Omit when the lens is not a directorial
   * choice.
   */
  focalLength?: number;

  /**
   * The lens stop, the f-number, finite and `> 0`: how a cinematographer states
   * how much falls out of focus. Copied into `shot.cameraIntent`, where
   * `resolveLensAt` turns it and the lens subject into the depth of
   * field a directly rendered film draws. The blur's aperture is the camera's
   * actual field of view's full-frame focal length divided by this stop, not
   * `focalLength`. Omit for a frame drawn sharp at every depth.
   */
  fNumber?: number;
}
