import { IAutoMovieCameraAction } from "@automovie/interface";

import { IAutoMovieFramedSubject } from "./IAutoMovieFramedSubject";

/**
 * One `frame` action paired with the subject it was resolved to, the unit
 * {@link compileCameraMove} keys a camera clip from.
 *
 * `performShot` builds one entry per `frame` action of the elected live camera,
 * in action order, after it has refused overlapping spans, so the list it hands
 * the compiler is sorted by `action.start` and its spans do not overlap.
 * {@link IAutoMovieCameraCoverageEntry} extends it with the intent record an
 * alternate coverage take emits.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the authored action with its subject resolved once by `performShot`'s `framedSubject`, so `compileCameraMove` solves distance, aim and path from measured geometry and never resolves a target id itself; the premise that entries arrive sorted and non-overlapping holds because `performShot` refuses overlapping same-camera frame spans before building the list.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the action that states framing, move and timing and the subject that states where and how large, which is exactly what one keyed span of the camera clip needs; coverage reuses the pair by extension and adds only its intent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No camera, subject kind or move is special-cased in the pairing; a group, a node, a bone and a camera subject all arrive as the same framed-subject shape.
 * @evidence contracts/common.md#meaningful-documentation States the consumer, the producer, the order and non-overlap the producer guarantees, and the coverage extension.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record with no runtime body; one entry is built per frame action in a single pass inside `performShot`, whose cost is answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The entry is built and consumed within one `performShot` call and never cached; subject reuse across the hero and coverage takes happens in `framedSubject`, not in this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds a reference to the authored action and to the subject, whose `at` closure captures the shot's motion tables; the entries list is local to `performShot` and dropped when the camera clip is compiled.
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
