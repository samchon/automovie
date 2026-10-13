import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";

/**
 * A bone's per-axis rest frame; an omitted axis is the identity (sign 1, 0).
 */
export interface IAutoMovieRestFrame {
  /** Rest-frame mapping for the flexion axis. */
  flexion?: IAutoMovieAxisFrame;
  /** Rest-frame mapping for the abduction axis. */
  abduction?: IAutoMovieAxisFrame;
  /** Rest-frame mapping for the twist axis. */
  twist?: IAutoMovieAxisFrame;
}
