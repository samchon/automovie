/**
 * One fixed, non-travelling member an opening carries.
 *
 * Hardware never moves, so it is not part of the work-wide table of driven
 * elements, and its element is not required to sit under the opening's fill.
 *
 * @author Samchon
 */
export interface IAutoMovieOpeningHardware {
  /** Stable hardware identity within the opening. */
  id: string;

  /** Open semantic label such as `frame`, `hinge`, `handle`, or `track`. */
  kind: string;

  /** Visible element realizing it, or null when it is only declared. */
  element: string | null;
}
