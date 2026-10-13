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
