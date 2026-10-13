import type { IAutoMovieHumanFaceOcularSurfaceShape } from "./IAutoMovieHumanFaceOcularSurfaceShape";

/**
 * Independent authored visible caruncle/plica and wet-margin shape; no clinical tissue measurement.
 *
 * @evidence contracts/common.md#principled-implementation Each present anatomical side selects its own registered cage/medial bed and ocular exterior for visible relief; absent sides add no generated sheet.
 * @evidence contracts/common.md#clear-and-simple-design Independent optional side records delegate all dimensions to OcularSurfaceShape without mirroring an omitted request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Availability admission requires cage/canthal support and source contact geometry; actual surface/contact owners still evaluate generated faces, and source display finish supplies no tear-fluid measurement.
 * @evidence contracts/common.md#meaningful-documentation Anatomical left/right and authored visible scope separate these appearance dimensions from hidden tissue observations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The side selector performs no projection or mesh construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Side ownership does not implement optical or sheet cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional caller data opens no mesh or renderer resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOcularSurfaces {
  /** Anatomical left medial relief and independently authored wet-margin dimensions. */
  left?: IAutoMovieHumanFaceOcularSurfaceShape;

  /** Anatomical right surface dimensions, independent of the left request. */
  right?: IAutoMovieHumanFaceOcularSurfaceShape;
}
