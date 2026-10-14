/**
 * One whole final posed basis surface as a face measurement reads it.
 *
 * `positions` are flat XYZ metres in the basis head frame, each rounded to Float32, in the surface's resident vertex order; `indices` are its oriented triangles over those vertices, before material or UV seam splitting. Both arrays are read only.
 *
 * @evidence contracts/common.md#principled-implementation A final posed source surface supplies rounded XYZ and original oriented incidence before material/UV separation.
 * @evidence contracts/common.md#clear-and-simple-design Whole-source instruments read this same registered vertex order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source surface acquisition is not a guarantee that replaced generated geometry remains readable; its context refuses those surfaces.
 * @evidence contracts/common.md#meaningful-documentation Positions are Float32-rounded head metres and readonly arrays express borrowing rather than runtime freezing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Context producers own coordinate rounding/copying and concrete instruments own traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Original source incidence is shared while rounded positions are produced for the current read.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The context source variant owns its returned positions and borrows basis indices; actual-Person adapters own their reconstructed surface arrays.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurementSurface {
  /** Final posed XYZ metres, Float32-rounded, resident vertex order. */
  positions: readonly number[];

  /** Oriented triangles over the resident vertices. */
  indices: readonly number[];
}
