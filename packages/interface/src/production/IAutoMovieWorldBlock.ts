import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieSceneNode } from "../scene/IAutoMovieSceneNode";

/**
 * One generated visible wall/building block and its support footprint.
 *
 * Built by `AutoMovieEngineWorld.block` from a base point at the bottom centre
 * and a positive size. The block is never rotated, so `bounds` is exact.
 * `AutoMovieEngineWorld.assertPlacements` refuses two blocks whose bounds
 * overlap with positive volume, a block whose footprint does not rest on a
 * declared surface, and a route crossing a block.
 */
export interface IAutoMovieWorldBlock {
  /**
   * Stable block identity, also used as the node id and, under the runtime
   * model namespace, as the model id.
   */
  id: string;

  /** Block semantic; carried for the author and does not change the geometry. */
  kind: "wall" | "building";

  /**
   * Skeletonless box model group to register with the scene: one centred `box`
   * part of the block's width, height and depth in meters, wearing one opaque
   * dielectric material named `structure` decoded from the sRGB color.
   */
  model: IAutoMovieModel;

  /**
   * Static scene node citing `model.id`, translated to the box centre with
   * identity rotation and scale.
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

/** Grounded block constructor inputs paired with its generated scene artifacts. */
export namespace IAutoMovieWorldBlock {
  /**
   * Build a box model group, placed node and bounds from a grounded base and
   * size.
   *
   * Inputs are borrowed during construction; the returned model, node and
   * corner vectors are newly allocated. Each computed bound span must be
   * positive and representable at the block's placed coordinates.
   */
  export type IInput = {
    /**
     * Nonblank block and node identity. The model identity uses the compiler's
     * runtime model namespace.
     */
    id: string;
    /**
     * Author-facing wall or building classification; both produce the same
     * unrotated box construction.
     */
    kind: "wall" | "building";
    /**
     * Finite world position in metres at the bottom center. Box placement
     * raises Y by half the height and centers XZ on this point.
     */
    base: IAutoMovieVector3;
    /**
     * Positive finite width, height and depth in metres along world X, Y and Z.
     * Typed vector completeness is a premise; the constructor checks enumerated
     * values.
     */
    size: IAutoMovieVector3;
    /**
     * Six-digit #RRGGBB sRGB string, case-insensitive. Invalid syntax throws
     * before construction; the shared decoder converts it to linear material
     * color.
     */
    color: string;
  };
}
