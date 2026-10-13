/** One fixed, non-travelling member an opening carries. */
export interface IAutoMovieOpeningHardware {
  /** Stable hardware identity within the opening. */
  id: string;

  /** Open semantic label such as `frame`, `hinge`, `handle`, or `track`. */
  kind: string;

  /** Visible element realizing it, or null when it is only declared. */
  element: string | null;
}
