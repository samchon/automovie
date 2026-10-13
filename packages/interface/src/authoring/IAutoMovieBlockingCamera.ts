import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";

/** Camera grammar shared by hero and alternate takes. */
export interface IAutoMovieBlockingCamera {
  /** Shot size the compiled camera must deliver. */
  framing: "wide" | "full" | "medium" | "close";

  /** Deterministic move family. */
  move: "static" | "follow" | "orbit" | "push-in" | "truck" | "whip";

  /** Staged node or literal point the camera must favor. */
  on: IAutoMovieNodeTarget | IAutoMoviePointTarget;
}
