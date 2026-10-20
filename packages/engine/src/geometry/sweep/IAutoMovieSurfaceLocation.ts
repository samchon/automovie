import { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";

/**
 * Where one vertex of a subdivided surface network lies in the network's own
 * terms: its surface coordinate, its patch's name and, on a sweep or
 * transition patch, the point of the sweep's `(u, v)` domain.
 *
 * The domain point is the patch's `(s, t)` carried by its ranges, `u` from
 * `t` and `v` from `s`, so it follows the cage's chart rather than a
 * projection onto the sweep. Sweep cell averaging, inverse fitting and the
 * finite chart reconstruction all separate this domain address from the
 * displayed skin; no nearest-point or universal distance bound is promised.
 * Each vertex reports one incident-face address, not every adjacent chart.
 * Fields crossing patch seams must agree at the corresponding addresses.
 * `v` stays in the patch's range, so on a patch spanning a whole turn a seam vertex reads `v`
 * at either end of the range, one turn apart; give a field over such a patch
 * a period of one turn in `v` so both read alike.
 *
 * @evidence contracts/common.md#principled-implementation The network's patch chart, the one coordinate every tier shares, plus the sweep domain a sweep or transition patch is a rectangle of.
 * @evidence contracts/common.md#clear-and-simple-design The coordinate, the patch's name and an optional domain point, the least a field over the surface needs to address a vertex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The domain point is the chart's, never snapped to a cage vertex or projected onto the sweep.
 * @evidence contracts/common.md#meaningful-documentation States chart composition, the generating/filter/display distinction, one-address ownership and seam compatibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A location record; the linear chart-composition pass is owned by `locateAutoMovieSurfaceVertices`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A location record; callers reuse the producer's result across poses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A location record with no resource lifetime; its producer returns caller-owned records.
 */
export interface IAutoMovieSurfaceLocation {
  /** The vertex's patch and patch coordinates. */
  coordinate: IAutoMovieSurfaceCoordinate;

  /** The patch's name. */
  name: string;

  /** On a sweep or transition patch, the sweep's name and the domain point, `u` along the spine and `v` round it; otherwise null. */
  sweep: { name: string; u: number; v: number } | null;
}
