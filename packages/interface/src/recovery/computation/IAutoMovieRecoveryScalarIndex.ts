/**
 * Prepare height intervals once; the caller keeps source arrays unchanged until
 * queries finish. Results contain original face IDs in ascending order. Plane
 * queries include both endpoints; slab queries require positive overlap with
 * the open interval, retaining internal components.
 */

export namespace IAutoMovieRecoveryScalarIndex {
  /**
   * Prepare height intervals once; the caller keeps source arrays unchanged
   * until queries finish. Results contain original face IDs in ascending order.
   * Plane queries include both endpoints; slab queries require positive overlap
   * with the open interval, retaining internal components.
   */

  export type Create = (
    triangles: readonly (readonly [number, number, number])[],
    heights: readonly number[],
  ) => {
    /**
     * Returns ascending original face indices whose closed height intervals
     * include the finite query level.
     */
    cut: (level: number) => readonly number[];

    /**
     * Returns ascending original face indices with positive overlap with the
     * finite open interval (before,after).
     */
    slab: (before: number, after: number) => readonly number[];
  };
}
