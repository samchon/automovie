import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/** Turn the head/eyes to track a target; engine: `aimRotation` look-at. */
export interface IAutoMovieLookAtAction extends IAutoMovieActionBase {
  /** Selects gaze tracking as the action family. */
  verb: "lookAt";

  /** Target to which the actor directs its gaze. */
  to: IAutoMovieActionTarget;
}
