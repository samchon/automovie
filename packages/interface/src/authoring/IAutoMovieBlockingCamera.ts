import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";

/**
 * Camera grammar shared by hero and alternate takes.
 *
 * For the hero intent, `performShot` compares `framing` and `move` with the
 * first `frame` action; `blockBeat` checks only that a node `on` target is
 * placed, and no gate compares it with the performed frame subject.
 *
 * @author Samchon
 */
export interface IAutoMovieBlockingCamera {
  /** Shot size the compiled camera must deliver. */
  framing: "wide" | "full" | "medium" | "close";

  /** Deterministic move family. */
  move: "static" | "follow" | "orbit" | "push-in" | "truck" | "whip";

  /**
   * Staged actor, set piece or camera, or a literal world point, the camera
   * should favor.
   */
  on: IAutoMovieNodeTarget | IAutoMoviePointTarget;
}
