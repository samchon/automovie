/**
 * One fixed member an opening carries, with no travel of its own.
 *
 * Hardware has no degree of freedom, so it is not part of the work-wide table
 * of driven elements, and its element is not required to sit under the
 * opening's fill. An element parented under a panel's element still rides that
 * panel's travel through the element hierarchy.
 *
 * Only `validateBuiltEnvironment` reads hardware today; lowering, drawings, and
 * schedules ignore it.
 */
export interface IAutoMovieOpeningHardware {
  /** Stable, non-blank hardware identity, unique within the opening. */
  id: string;

  /**
   * Non-blank open semantic label such as `frame`, `hinge`, `handle`, or
   * `track`.
   */
  kind: string;

  /** Visible element realizing it, or null when it is only declared. */
  element: string | null;
}
