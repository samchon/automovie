import type { AutoMovieCameraFraming } from "../harness/AutoMovieCameraFraming";
import type { IAutoMovieCameraAction } from "../harness/IAutoMovieCameraAction";
import type { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import type { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";

/**
 * Camera grammar shared by the hero intent and every alternate take.
 *
 * Framing and move share the frame action's closed vocabulary. For the hero
 * intent, performShot compares them with the earliest chronological frame
 * action, while camera election uses the first frame camera in authored list
 * order. blockBeat checks a node on target for placement; no gate compares the
 * hero intent's subject with the performed subject. With no frame action, only
 * move is checked for static.
 */
export interface IAutoMovieBlockingCamera {
  /** Shot size the compiled camera must deliver, in `frame` vocabulary. */
  framing: AutoMovieCameraFraming;

  /** Move family the compiled camera path takes, in `frame` vocabulary. */
  move: IAutoMovieCameraAction["move"];

  /**
   * What the camera favors: a staged actor, set piece or camera by id, or a
   * fixed world point. A node id must name something the staged set places;
   * hero intent does not itself drive or verify the performed subject.
   */
  on: IAutoMovieNodeTarget | IAutoMoviePointTarget;
}
