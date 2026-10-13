import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One frame span's directorial camera intent (#1187): what the take frames and
 * how, plus the two lens intents the fixed move grammar could not carry: the
 * focus subject (resolved to a world point) and the focal length. INTENT only:
 * `fovY` on the scene camera stays the geometric truth, and depth-of-field blur
 * is deliberately out of scope (diffusion's job).
 *
 * `performShot` resolves `focus` once, at shot time 0, not at the span's
 * `start`, so a subject that moves records where it stood at the opening.
 *
 * @evidence contracts/common.md#principled-implementation `performShot` writes one intent per `frame` action of the elected camera with `start`, framing and move copied from the action, and resolves `focus` through the live-target resolver at time 0 or the staged placements, never at `start`.
 * @evidence contracts/common.md#clear-and-simple-design Holds intent only, beside `cameraMotion`, and no camera solve reads it; its framing and move are inline literal unions that repeat `IAutoMovieBlockingCamera` rather than one named type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage takes write `focus` and `focalLength` as null instead of inventing lens intent; the artifact gate requires `start` within the shot, closed-union framing and move, a finite focus vector and a positive focal length.
 * @evidence contracts/common.md#meaningful-documentation Documents seconds, millimetres, the world frame of `focus`, the null meanings, that depth of field is out of scope, and the time-0 focus resolution.
 * @author Samchon
 */
export interface IAutoMovieCameraIntent {
  /** Shot-local start (seconds) of the frame span this intent covers. */
  start: number;

  /** How tight the framing is. */
  framing: "wide" | "full" | "medium" | "close";

  /** How the camera behaves over the span. */
  move: "static" | "follow" | "orbit" | "push-in" | "truck" | "whip";

  /**
   * World focus point resolved at shot time 0, or `null` when the action named
   * none.
   */
  focus: IAutoMovieVector3 | null;

  /**
   * Positive lens intent in millimetres, or `null` when the action named none.
   */
  focalLength: number | null;
}
