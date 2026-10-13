import {
  IAutoMovieModelRecipe,
  IAutoMovieSceneNode,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One generated visible wall/building block and its support footprint.
 *
 * Built by `worldBlock` from a base point at the bottom centre and a positive
 * size. The block is never rotated, so `bounds` is exact. `assertWorldPlacements`
 * refuses two blocks whose bounds overlap with positive volume, a block whose
 * footprint does not rest on a declared surface, and a route crossing a block.
 *
 * @evidence contracts/common.md#principled-implementation An unrotated box is described by its base centre and size, so the axis-aligned bounds are exact and the overlap, support and route checks in `assertWorldPlacements` are interval and polygon tests without rotation error.
 * @evidence contracts/common.md#clear-and-simple-design Bundles the three artifacts one block produces, the model recipe, the scene node and the bounds, so a caller registers the recipe, stages the node and checks the bounds from one value without recomputing any of them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The default archetype is the shipped `primitive-prop` builder that the box parameters describe, and a production with a different catalogue passes its own id instead of the helper guessing; no block id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States how the block is built, that it is never rotated, every refusal `assertWorldPlacements` applies, the shared id, the recipe's archetype, shape, units and LOD, the node's translation, and both bound corners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Record of derived values; building one is constant work in `worldBlock`, and the pairwise overlap check over blocks is answered on `assertWorldPlacements`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call to `worldBlock` builds a new block from its inputs; nothing keyed by a block is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A fixed-size record of one recipe, one node and two corner vectors, owned by the authored source that built it.
 * @author Samchon
 */
export interface IAutoMovieWorldBlock {
  /** Stable block identity, also used as the recipe id and the node id. */
  id: string;

  /** Block semantic; carried for the author and does not change the geometry. */
  kind: "wall" | "building";

  /**
   * Box recipe to register with production design: the `primitive-prop`
   * archetype unless the caller named another, `box` shape, width, height and
   * depth in meters, and one unbounded `near` LOD tier.
   */
  recipe: IAutoMovieModelRecipe;

  /**
   * Static scene node using the builder-owned runtime model id, translated to
   * the box centre with identity rotation and scale.
   */
  node: IAutoMovieSceneNode;

  /** Exact axis-aligned occupied world volume, in meters. */
  bounds: {
    /** Lowest corner: the base less half the width and depth, at base height. */
    min: IAutoMovieVector3;

    /** Highest corner: the base plus half the width and depth, plus the height. */
    max: IAutoMovieVector3;
  };
}
