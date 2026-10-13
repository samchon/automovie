import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";

/**
 * Camera grammar shared by hero and alternate takes.
 *
 * For the hero intent, `performShot` compares `framing` and `move` with the
 * first `frame` action; `blockBeat` checks only that a node `on` target is
 * placed, and no gate compares it with the performed frame subject.
 *
 * @evidence contracts/common.md#principled-implementation Closed string unions name exactly the framing sizes and move families `compileCameraMove` implements, so an unknown value is a type error for typed authors and a runtime refusal for coverage takes.
 * @evidence contracts/common.md#clear-and-simple-design Restates the framing and move literal unions that `IAutoMovieCameraIntent` and `IAutoMovieCameraAction` also spell inline, mirrored by three runtime sets, so adding a move edits six places instead of one named type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The hero `on` target is gated only for placement by `blockBeat`; `performShot` compares framing and move but never the subject, so the hero take's "must favor" is unenforced.
 * @evidence contracts/common.md#meaningful-documentation Documents which fields the hero coherence gate compares, which staged things `on` may name, and that the hero subject is not compared with the performance.
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
