import {
  IAutoMovieBuiltPlacementBounds,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

/**
 * One placed body resolved to its reported box and overlap proxy boxes.
 *
 * Produced by `resolveBuiltPlacementBody`. An element's `solids` are its part boxes because the union can contain gaps; a population has no part split, so its one `bounds` envelope is also its only solid proxy. These AABBs can contain empty space and are not exact mesh occupancy. Every solid lies inside `bounds`, making the union a safe prune before proxy comparison.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the union box with the boxes it was folded from, so an overlap query can prune on the union and confirm on the parts without resolving the body twice; every solid lies inside `bounds` because `bounds` is their union or is the one solid itself.
 * @evidence contracts/common.md#clear-and-simple-design Two members supply the reported envelope with provenance and the finer AABB proxies consumed by pairwise/sweep overlap queries; they describe box occupancy, not a separate physical solid solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A part box carries no fabricated `basis`; only the reported box does, and a population is given its own box as solid rather than an invented part split.
 * @evidence contracts/common.md#meaningful-documentation States the producer, what `solids` holds for each locator kind and why, and the containment of every solid in `bounds` that makes the union a safe prune.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record without behavior; the resolver costs element part-box lookup/folding or population search and instance-bounds generation, as documented on `resolveBuiltPlacementBody`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Describes one body for one query; the sweep resolves each body once and the pairwise query once per side, which is where reuse is decided.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds one reported box and the part boxes the lookup returned; the querying call owns it and drops it on return.
 */
export interface IAutoMovieBuiltPlacementBody {
  /** The body's reported world box, labelled with how it was derived. */
  bounds: IAutoMovieBuiltPlacementBounds;

  /**
   * World AABB proxies: one per drawn part for an element, or `[bounds]` for a population. Never empty; proxies can include gaps and other empty space.
   */
  solids: readonly IAutoMovieSubjectBox[];
}
