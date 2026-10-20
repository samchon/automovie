import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * A beat of stillness: the actor holds a pose for an explicit span.
 *
 * The reference synthesizer (`makeActorSynthesizer`) emits a two-keyframe
 * `holdMotion` clip of the actor context's rest pose, or of the articulation a
 * previous beat ended in when the beat resumes from one. It does not freeze the
 * pose an earlier action of the same shot left, and an actor without an actor
 * context gets no clip. `performShot` applies only the checks every action
 * shares, and with no `region` the clip is masked to the full body.
 *
 * @evidence contracts/common.md#principled-implementation A hold is a constant clip, two identical keyframes at `0` and `duration`, so sampling anywhere in the span returns the held pose exactly.
 * @evidence contracts/common.md#clear-and-simple-design The verb adds no field to the shared base beyond narrowing `duration` to a number, since a stillness has no natural length for `"auto"` to choose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The held pose is the context's declared rest or the measured prior beat end, never a pose guessed from the preceding action, and the documentation states that limit.
 * @evidence contracts/common.md#meaningful-documentation States which pose is held and when, what is not held, the no-context outcome, the checks and the default mask; the members give the discriminator and the span's unit and why it is numeric.
 */
export interface IAutoMovieHoldAction extends IAutoMovieActionBase {
  /** Selects a pose hold as the action family. */
  verb: "hold";

  /**
   * Shot-local length of the hold in seconds, finite and `> 0` with
   * `start + duration` inside the shot; `"auto"` is not accepted.
   */
  duration: number;
}
