import type { IAutoMovieEditorialMarker } from "../cinematics/IAutoMovieEditorialMarker";

/**
 * One retained play of a shot editorial marker on the sequence clock.
 *
 * @evidence contracts/development/design.md#principled-representation Inherited endpoints preserve the authored source range, while retained endpoints show its intersection with the trim and output endpoints apply the playback entry's affine clock map. Points have equal endpoints on each clock.
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

  /** Retained end in shot-local seconds after trimming. */
  retainedEndSeconds: number;

  /** Retained start on the output clock in seconds. */
  outputStartSeconds: number;

  /** Retained end on the output clock in seconds. */
  outputEndSeconds: number;
}
