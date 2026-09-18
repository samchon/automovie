/**
 * One non-negative film time authored as an exact frame or frame-grid second.
 *
 * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `AutoMovieFilmTime` as the portable data boundary for the formation nested frame clock requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `AutoMovieFilmTime` for the performance formation hierarchy membership command system contract.
 */
export type AutoMovieFilmTime =
  | {
      /** Zero-based production frame. */
      frame: number;
    }
  | {
      /** Seconds that must land exactly on the production frame clock. */
      seconds: number;
    };
