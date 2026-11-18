import type { IAutoMovieEditorialMarker } from "../cinematics/IAutoMovieEditorialMarker";

/**
 * One retained play of a shot editorial marker on the sequence clock.
 *
 * @evidence contracts/development/design.md#principled-representation Inherited endpoints preserve the authored source range. Retained endpoints report the rounded intersection with the trim. Output endpoints use entry placement and rate, extending a range that covers a positive collapsed source interval across its played duration. Point markers have equal endpoints on each clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the source marker's identity and label and adds only playback identity and retained/output endpoints.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A replay keeps its own entry index and a clipped range never replaces its original authored endpoints.
 * @evidence contracts/development/common.md#meaningful-documentation Defines entry and shot identity and distinguishes authored, retained source and output time in seconds.
 */
export interface IAutoMoviePlaybackEditorialMarker extends IAutoMovieEditorialMarker {
  /** Zero-based index in `sequence.shots`. */
  entry: number;

  /** Id of the shot owning the source marker. */
  shot: string;

  /** Retained start in shot-local seconds after trimming. */
  retainedStartSeconds: number;

  /** Retained end in shot-local seconds. It can round to the start of a positive played interval. */
  retainedEndSeconds: number;

  /** Retained start on the output clock in seconds. */
  outputStartSeconds: number;

  /** Retained end on the output clock in seconds. */
  outputEndSeconds: number;
}
