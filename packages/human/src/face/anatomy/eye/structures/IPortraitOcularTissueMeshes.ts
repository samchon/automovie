import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Shared medial caruncle/plica sheet and lower wet-margin patch.
 *
 * createPortraitOcularTissues returns these owned lattices in head millimetres. Null preserves an explicitly zero authored extent rather than an empty mesh.
 *
 * @evidence contracts/common.md#principled-implementation Nullable corner and lower-margin lattices distinguish intentionally zero authored extents from an emitted degenerate empty surface.
 * @evidence contracts/common.md#clear-and-simple-design The two tissue outputs are grouped at their common builder boundary, with geometry represented by the existing IAutoMovieMesh contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null follows explicit extent-zero semantics, not a retry or an exception that disguises invalid ocular dimensions.
 * @evidence contracts/common.md#meaningful-documentation The comment names both owned tissue patches, their head-millimetre construction frame and the meaning of null.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The result type performs no tessellation; lattice-size costs belong to the ocular producer that constructs these two meshes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Returned tissue lattices are outputs rather than a coordination cache; repeated-build equivalence is not established by this pair of fields.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Mesh arrays remain reachable with the returned result; this interface owns no native handle or asynchronous task requiring explicit disposal.
 *
 * @author Samchon
 */
export interface IPortraitOcularTissueMeshes {
  /** Shared medial caruncle/plica lattice, or null when its authored extent is zero. */
  corner: IAutoMovieMesh | null;

  /** Lower wet-margin lattice, or null when its authored maximum width is zero. */
  lowerMargin: IAutoMovieMesh | null;
}
