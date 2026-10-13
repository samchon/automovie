import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/** Hold the current pose (a beat of stillness) for the duration. */
export interface IAutoMovieHoldAction extends IAutoMovieActionBase {
  /** Selects a pose hold as the action family. */
  verb: "hold";

  /** Shot-local length of the held pose in seconds. */
  duration: number;
}
