import type { IAutoMovieBuiltEnvironment } from "./IAutoMovieBuiltEnvironment";

/**
 * Building input for a declaration-wide sweep of positive-volume box
 * intersections.
 */
export namespace IAutoMovieBuiltEnvironmentPlacementOverlapSweep {
  /**
   * Building input for a declaration-wide sweep of positive-volume box
   * intersections.
   *
   * Resolves each body from one building-wide part table, sorts lower x
   * corners, then sweeps an active list. The broad phase avoids narrow-phase
   * work for disjoint union boxes; compared counts active candidate comparisons
   * and is not a full operation or timing measurement.
   *
   * Exact box-face contact is excluded by {@link propBoundsOverlap}. Positive
   * overlap is a bounds finding, not proof of mesh interpenetration: part boxes
   * include empty space, and a population envelope includes gaps between
   * members. Volume and fraction grade these proxies, not occupied material.
   *
   * Every element and population is a body, elements first in declaration
   * order. A pair whose union boxes meet is confirmed part against part and
   * reported, left being the earlier body, with its summed shared part volume
   * in cubic metres and that volume's share of the smaller body's summed part
   * volume, clamped to `1` because two parts of one body may themselves meet.
   * Pairs are sorted by share and then by volume, both descending. `measured`
   * counts resolved bodies and `unresolved` lists the rest in body order. A
   * population with an `along-route` layout makes the placement fold throw.
   */
  export type IProps = {
    /**
     * Borrowed building; all elements then populations are resolved in
     * declaration order, without expanding compact members.
     */
    environment: IAutoMovieBuiltEnvironment;
  };
}
