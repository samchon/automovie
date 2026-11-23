import type { IAutoMovieCameraAction } from "../harness/IAutoMovieCameraAction";
import type { IAutoMovieFramedSubject } from "./IAutoMovieFramedSubject";

/**
 * One `frame` action paired with the subject it was resolved to, the unit
 * {@link compileCameraMove} keys a camera clip from.
 *
 * `performShot` builds one entry per `frame` action of the elected live camera,
 * in action order, after it has refused overlapping spans, so the list it hands
 * the compiler is sorted by `action.start` and its spans do not overlap.
 * {@link IAutoMovieCameraCoverageEntry} extends it with the intent record an
 * alternate coverage take emits.
 */
export interface IAutoMovieCameraFrameEntry {
  /**
   * Authored `frame` action: framing, move, start and duration of this span.
   * Its `on` target is already resolved into {@link subject}.
   */
  action: IAutoMovieCameraAction;

  /** Resolved subject extent and trajectory the framing solve reads. */
  subject: IAutoMovieFramedSubject;
}
