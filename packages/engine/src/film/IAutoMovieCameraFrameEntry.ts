import { IAutoMovieCameraAction } from "@automovie/interface";
import { IAutoMovieFramedSubject } from "./IAutoMovieFramedSubject";

/**
 * One `frame` action paired with its resolved subject.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieCameraFrameEntry drives required-landmark framing: One `frame` action paired with its resolved subject.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieCameraFrameEntry realizes landmark-based framing: One `frame` action paired with its resolved subject.
 */
export interface IAutoMovieCameraFrameEntry {
  /**
   * Authored camera action whose framing and move are compiled.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieCameraFrameEntry.action drives required-landmark framing: Authored camera action whose framing and move are compiled.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieCameraFrameEntry.action realizes landmark-based framing: Authored camera action whose framing and move are compiled.
   */
  action: IAutoMovieCameraAction;
  /**
   * Resolved subject extent and trajectory used by the framing solve.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieCameraFrameEntry.subject drives required-landmark framing: Resolved subject extent and trajectory used by the framing solve.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieCameraFrameEntry.subject realizes landmark-based framing: Resolved subject extent and trajectory used by the framing solve.
   */
  subject: IAutoMovieFramedSubject;
}
