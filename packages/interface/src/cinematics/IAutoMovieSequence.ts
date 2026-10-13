import { IAutoMovieSequenceEntry } from "./IAutoMovieSequenceEntry";

/**
 * A sequence: an ordered cut-list of shots, the editorial timeline, modelled on
 * OpenTimelineIO. Shots play back to back; a hard cut is the default (two
 * adjacent entries with no transition), an optional transition blends them.
 *
 * Each shot keeps its own local time origin; the sequence composes the global
 * timeline by accumulating trimmed durations (minus transition overlap), so
 * reordering or retiming a shot is a local edit and never forces recomputing
 * downstream timestamps.
 *
 * @author Samchon
 */
export interface IAutoMovieSequence {
  /** Stable id. */
  id: string;

  /** Human / LLM readable name. Null if unnamed. */
  name: string | null;

  /** Shots in playback order; at least one entry. */
  shots: IAutoMovieSequenceEntry[];

  /**
   * Finite positive nominal playback frame rate; a render spec's
   * `frameFormat.fps` governs the frames actually rendered.
   */
  fps: number;
}
