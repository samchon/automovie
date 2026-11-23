import type { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";

/**
 * Optional degree-valued rest mappings for the three anatomical axes. An absent
 * axis uses sign one and zero neutral in conversion.
 */
export interface IAutoMovieRestFrame {
  /** Rest-frame mapping for the flexion axis. */
  flexion?: IAutoMovieAxisFrame;

  /** Rest-frame mapping for the abduction axis. */
  abduction?: IAutoMovieAxisFrame;

  /** Rest-frame mapping for the twist axis. */
  twist?: IAutoMovieAxisFrame;
}
