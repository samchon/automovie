import {
  IAutoMovieBuiltPlacementBounds,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

/**
 * One placed body resolved to its reported box and to the boxes it fills.
 *
 * Produced by `resolveBuiltPlacementBody`. An element's `solids` are its part
 * boxes, because a multi-part body's union box is mostly air; a population has
 * no part structure, so its one `bounds` box is also its only solid. Every
 * solid lies inside `bounds`, so `bounds` is a safe prune before solids are
 * compared.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the union box with the boxes it was folded from, so an overlap query can prune on the union and confirm on the parts without resolving the body twice; every solid lies inside `bounds` because `bounds` is their union or is the one solid itself.
 * @evidence contracts/common.md#clear-and-simple-design Two members, the reported box with its basis and the solid boxes, which are exactly what the pairwise and sweep overlap queries read, so neither re-derives the other's rule for what a body fills.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A part box carries no fabricated `basis`; only the reported box does, and a population is given its own box as solid rather than an invented part split.
 * @evidence contracts/common.md#meaningful-documentation States the producer, what `solids` holds for each locator kind and why, and the containment of every solid in `bounds` that makes the union a safe prune.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record with no behavior; resolving it costs one part-box lookup and one union fold inside `resolveBuiltPlacementBody`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Describes one body for one query; the sweep resolves each body once and the pairwise query once per side, which is where reuse is decided.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds one reported box and the part boxes the lookup returned; the querying call owns it and drops it on return.
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementBody {
  /** The body's reported world box, labelled with how it was derived. */
  bounds: IAutoMovieBuiltPlacementBounds;

  /**
   * World boxes the body actually fills: one per drawn part for an element,
   * or `[bounds]` for a population. Never empty.
   */
  solids: readonly IAutoMovieSubjectBox[];
}
