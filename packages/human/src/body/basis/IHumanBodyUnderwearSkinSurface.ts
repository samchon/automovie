/**
 * Native posed skin read by garment closing, with shared vertex indices.
 *
 * @evidence contracts/common.md#principled-implementation Posed meter coordinates and oriented native triangle indices preserve the shared skin population used for garment clearance.
 * @evidence contracts/common.md#clear-and-simple-design One borrowed surface carries only native geometry rather than renderer material/UV seam copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference topology cannot gain synthetic closing faces or replace native indices with duplicated rendering corners.
 * @evidence contracts/common.md#meaningful-documentation Members state posed-frame XYZ units and oriented shared-position incidence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Native skin typing performs no voxel clearance or surface closure algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared native operands describe one reference without owning clearance-query caches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed skin arrays acquire no spatial hierarchy or garment fitting state here.
 * @author Samchon
 */
export interface IHumanBodyUnderwearSkinSurface {
  /** Flat XYZ metres in the posed skin frame. */
  positions: readonly number[];

  /** Oriented triangles over the shared native positions. */
  indices: readonly number[];
}
