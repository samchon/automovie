/**
 * Source incidence witnessed while one section contour is fitted. This acquisition-only record stays outside the source-free coefficient bundle. Face IDs address the original observation input's triangle array; they include every face incident to a contour vertex or crossed edge, so they may include adjacent faces and do not identify an anatomical region or an exact generating patch.
 *
 * @evidence contracts/common.md#principled-implementation Original edge and vertex incidence identifies supporting source faces without nearest-point inference or face reindexing.
 * @evidence contracts/common.md#clear-and-simple-design One callback record separates acquisition provenance from source-free reconstruction data and identifies the corresponding published curve or unsupported contour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record supplies no source positions, normals, replacement surface or semantic part labels; incident support is not claimed as exact patch membership.
 * @evidence contracts/common.md#meaningful-documentation States millimetre station coordinates, original source addresses, publication indices, callback ownership and the incidence limitation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observer receives a copied face array and owns any retained records; no source geometry array is transferred.
 */
export interface IAutoMovieRecoverySourceLineage {
  /** Signed station coordinate in millimetres along the input's section axis. */
  readonly coordinateMm: number;

  /** Zero-based raw contour ordinal at this station, before fitting or rejection. */
  readonly contourIndex: number;

  /** Copied original input.triangles ordinals in deterministic incidence traversal order. */
  readonly sourceTriangleIds: readonly number[];

  /** Present only when exact cutter provenance was requested: original faces that emitted the visited cut segments or isolated contact. This differs from the broader incident-face witness above. */
  readonly exactSourceTriangleIds?: readonly number[];

  /** Closed and open indices address loft.sections[].loops and reports[].open at this station; failed and degenerate contours publish no fitted curve. */
  readonly publication:
    | { kind: "closed"; loopIndex: number; curveName: string }
    | { kind: "open"; reportIndex: number; curveName: string }
    | { kind: "degenerate" }
    | { kind: "failed"; diagnostic: string };
}
