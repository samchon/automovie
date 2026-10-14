/**
 * The part of a material region that region splitting reads: the triangles
 * of one material as corner references into a connected surface's shared
 * vertices, and the UV pair of each corner.
 *
 * A face basis region and a body basis region both have these two fields (and
 * more, a material id among them), so either passes where this is asked for.
 * Splitting a shared surface into per-material buffers needs only the corner
 * indices and their UVs, and asking for nothing more is what keeps `common`
 * from depending on either anatomy's basis type.
 *
 *
 * @evidence contracts/common.md#principled-implementation Ordered shared-surface corner references and per-corner UV pairs are the exact inputs region splitting reads.
 * @evidence contracts/common.md#clear-and-simple-design Face and body region owners satisfy this minimal common view without common importing either anatomy's larger basis type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The view adds no material identity, source geometry or alternate connected-surface interpretation beyond the supplied indices and UVs.
 * @evidence contracts/common.md#meaningful-documentation The prose explains the two-field dependency boundary and members state winding, vertex indexing and null texture semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Anatomy-independent material-region view is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Anatomy-independent material-region view specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Anatomy-independent material-region view acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IHumanMaterialRegion {
  /** Oriented triangle corners, each a vertex index of the connected surface. */
  indices: readonly number[];

  /** Flat UV pairs per corner, or null for an untextured region. */
  uvs: readonly number[] | null;
}
