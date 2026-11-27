import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import type { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Turn the head to look at a target.
 *
 * `performShot` refuses a target that does not resolve to one point, which
 * includes the relative kinds and a group naming a formation. The reference
 * synthesizer (`AutoMovieEngineFilm.makeActorSynthesizer`) aims from the actor's
 * eye height. When the target ID has an actor context, it aims at that actor's
 * eyes. It then solves yaw and pitch and spreads them over `neck` and `head`
 * within the rig's declared range when the context carries one. The solve runs
 * once at `start` and is held, unless the target is a bone or the host supplies
 * the actor's moving frame, in which case it is resampled through the span. An
 * `"auto"` gaze lasts 1 s, and with no `region` it drives the head region.
 */
export interface IAutoMovieLookAtAction extends IAutoMovieActionBase {
  /** Selects gaze tracking as the action family. */
  verb: "lookAt";

  /** Target the actor's gaze is directed at; it must resolve to one point. */
  to: IAutoMovieActionTarget;
}
