import type { IAutoMovieEditorialMarker } from "../cinematics/IAutoMovieEditorialMarker";

/** One retained play of a shot editorial marker on the sequence clock. */
export interface IAutoMoviePlaybackEditorialMarker extends IAutoMovieEditorialMarker {
  /** Zero-based index in `sequence.shots`. */
  entry: number;

  /** Id of the shot owning the source marker. */
  shot: string;

  /** Retained start in shot-local seconds after trimming. */
  retainedStartSeconds: number;

  /**
   * Retained end in shot-local seconds. It can round to the start of a positive
   * played interval.
   */
  retainedEndSeconds: number;

  /** Retained start on the output clock in seconds. */
  outputStartSeconds: number;

  /** Retained end on the output clock in seconds. */
  outputEndSeconds: number;
}
