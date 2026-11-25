import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * A beat of stillness: the actor holds a pose for an explicit span.
 *
 * The reference synthesizer (`makeActorSynthesizer`) emits a two-keyframe
 * `holdMotion` clip of the actor context's rest pose, or of the articulation a
 * previous beat ended in when the beat resumes from one. It does not freeze the
 * pose an earlier action of the same shot left, and an actor without an actor
 * context gets no clip. `performShot` applies only the checks every action
 * shares, and with no `region` the clip is masked to the full body.
 */
export interface IAutoMovieHoldAction extends IAutoMovieActionBase {
  /** Selects a pose hold as the action family. */
  verb: "hold";

  /**
   * Shot-local length of the hold in seconds, finite and `> 0` with `start +
   * duration` inside the shot; `"auto"` is not accepted.
   */
  duration: number;
}
