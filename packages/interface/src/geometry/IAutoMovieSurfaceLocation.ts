import type { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";

/**
 * Where one vertex of a subdivided surface network lies in the network's own
 * terms: its surface coordinate, its patch's name and, on a sweep or transition
 * patch, the point of the sweep's `(u, v)` domain.
 *
 * The domain point is the patch's `(s, t)` carried by its ranges, `u` from `t`
 * and `v` from `s`, so it follows the cage's chart rather than a projection
 * onto the sweep. Sweep cell averaging, inverse fitting and the finite chart
 * reconstruction all separate this domain address from the displayed skin; no
 * nearest-point or universal distance bound is promised. Each vertex reports
 * one incident-face address, not every adjacent chart. Fields crossing patch
 * seams must agree at the corresponding addresses. `v` stays in the patch's
 * range, so on a patch spanning a whole turn a seam vertex reads `v` at either
 * end of the range, one turn apart; give a field over such a patch a period of
 * one turn in `v` so both read alike.
 */
export interface IAutoMovieSurfaceLocation {
  /**
   * Newly allocated patch index and dimensionless s/t reconstructed from one
   * incident cage face. Mutating this result does not change the cage or
   * network.
   */
  coordinate: IAutoMovieSurfaceCoordinate;

  /**
   * Authored name of coordinate.patch in the network's ordered patch list,
   * copied into the result.
   */
  name: string;

  /**
   * On a sweep or transition patch, the sweep's name and the domain point, `u`
   * along the spine and `v` round it; otherwise null.
   */
  sweep: IAutoMovieSurfaceLocation.ISweepAddress | null;
}

/** Additional chart address for a vertex that belongs to a sweep. */
export namespace IAutoMovieSurfaceLocation {
  /** One patch-derived address in a named sweep's parameter domain. */
  export type ISweepAddress = {
    /** Network sweep key selected by the sweep or transition patch. */
    name: string;

    /**
     * Normalized spine coordinate obtained by carrying chart t through the
     * patch's u range.
     */
    u: number;

    /**
     * Section turn obtained by carrying chart s through the patch's v range,
     * without wrapping seam endpoints. Polar angle for direction
     * correspondence, curve parameter for parameter correspondence.
     */
    v: number;
  };
}
