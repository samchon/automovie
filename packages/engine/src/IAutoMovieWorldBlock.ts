import {
  IAutoMovieModelRecipe,
  IAutoMovieSceneNode,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 *
 * One generated visible wall/building block and its support footprint.
 *
 * Built by `worldBlock` from a base point at the bottom centre and a positive
 * size. The block is never rotated, so `bounds` is exact. `assertWorldPlacements`
 * refuses two blocks whose bounds overlap with positive volume, a block whose
 * footprint does not rest on a declared surface, and a route crossing a block.
 *
 * @evidence contracts/common.md#principled-implementation An unrotated box stated three ways (recipe, scene node, axis-aligned bounds) from one base and size, so overlap and support checks use exact interval arithmetic instead of mesh geometry.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the recipe and node together with their bounds, so a source registers the model, stages the node and passes the block to `assertWorldPlacements` from one value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The archetype defaults to the shipped `primitive-prop` box only because the size parameters describe a box; a production with another catalogue id passes its own.
 * @evidence contracts/common.md#meaningful-documentation States the bottom-centre base convention, that the box is unrotated, the meter units of the bounds, and what the placement assertion checks with them.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record; the pairwise overlap test over blocks is a cost of `assertWorldPlacements`. Each block is built once from literal inputs by the author's source; nothing derived from it is shared. Holds one recipe, one node and two corner vectors owned by the authored world, and no handle.
 * @author Samchon
 */
export interface IAutoMovieWorldBlock {
  /** Stable block identity, shared by the recipe, the node and the bounds. */
  id: string;

  /** Block semantic; carried for the author and does not change the geometry. */
  kind: "wall" | "building";

  /**
   * Box recipe registered with production design, with width, height and depth
   * in meters.
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
