import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * Root-feature support and proximity on one owned current collider snapshot. Ordinals follow the supplied index order, including appended cap faces when they share the root feature; they are not reordered BVH leaf addresses.
 *
 * @evidence contracts/common.md#principled-implementation Original feature incidence and named-face unsigned distance refer to one owned current collider snapshot, preserving root support identity.
 * @evidence contracts/common.md#clear-and-simple-design The two-reader boundary separates source incidence from proximity without exposing an unrelated nearest-feature identifier.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only original resident ordinals identify support; the boundary does not replace them with BVH leaf ordinals or a later nearest-face guess.
 * @evidence contracts/common.md#meaningful-documentation The declaration documents owned current snapshot, original incident face ordinals and head-metre unsigned distance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This service type defines no incidence-index construction; createHumanFaceHairRootBoundary owns its vertex/triangle scan and per-face query strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Both readers use the same compiled collider, and lazy triangle queries are retained by its concrete boundary owner.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no runtime cache itself; the factory closure retains incidence and lazily acquired per-face query bytes until released.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootBoundary {
  /**
   * Resolve owned resident face ordinals incident on the root's positive-weight support, including any appended cap faces incident on that same feature.
   *
   * @evidence contracts/common.md#principled-implementation Positive barycentric support selects original face, edge or vertex incidence on the compiled snapshot without treating weight magnitudes as coordinates.
   * @evidence contracts/common.md#clear-and-simple-design A native-reference resolver leaves support topology with the root-boundary owner, separate from ray classification and root seating.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returned ordinals come from actual resident incidence; negative, nonfinite or all-zero support is refused by the concrete owner.
   * @evidence contracts/common.md#meaningful-documentation The member identifies original resident face ordinals incident on the sampled root feature and promises an owned result array.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callable contract implements no adjacency scan; the factory resolver searches the smallest incident list of up to three support vertices.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compiled incidence is reused for roots of the same collider snapshot, while each resolve returns a fresh owned ordinal array.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A returned support list belongs to its caller and retains no lazy proximity query or ongoing classification task.
   */
  resolve: (root: IHumanFaceHairRootReference) => number[];

  /**
   * Unsigned distance to one named original face, in current head-frame metres; point must contain finite XYZ coordinates in that frame.
   *
   * @evidence contracts/common.md#principled-implementation The reader returns unsigned distance to one named original triangle, so root-prefix certification uses proximity rather than an open sheet's ambiguous sign.
   * @evidence contracts/common.md#clear-and-simple-design Named-face distance remains beside compiled incidence to ensure ray-prefix checks use the same current coordinates as the resolved support.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader does not substitute a nearest later face or ignore a distant support hit; invalid resident ordinals are refused by its owner.
   * @evidence contracts/common.md#meaningful-documentation The member specifies current head-metre unsigned proximity to an original face and requires a finite XYZ point in the same frame.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This distance signature selects no spatial query algorithm; the factory lazily builds one constant-size open triangle query for each requested ordinal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The concrete boundary caches each named-face query within its immutable collider snapshot and rebuilds the whole boundary for changed geometry.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Per-face query retention is owned by the enclosing boundary closure and bounded by its resident triangle population.
   */
  distance: (triangle: number, point: readonly number[]) => number;
}
