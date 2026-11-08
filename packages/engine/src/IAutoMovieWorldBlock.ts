import {
  IAutoMovieModel,
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
 * @evidence contracts/development/design.md#principled-representation An unrotated box is described by its base centre and size, so the axis-aligned bounds are exact and the overlap, support and route checks in `assertWorldPlacements` are interval and polygon tests without rotation error.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Bundles the three artifacts one block produces, the model group, the scene node and the bounds, so a caller registers the model, stages the node and checks the bounds from one value without recomputing any of them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The model is the one box the size describes, built in place because `engine` cannot depend on the archetype catalogue; no block id is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation States how the block is built, that it is never rotated, every refusal `assertWorldPlacements` applies, the shared id, the model's box part, material and units, the node's translation, and both bound corners.
 */
export interface IAutoMovieWorldBlock {
  /** Stable block identity, also used as the node id and, under the runtime model namespace, as the model id. */
  id: string;

  /** Block semantic; carried for the author and does not change the geometry. */
  kind: "wall" | "building";

  /**
   * Skeletonless box model group to register with the scene: one centred `box` part of the block's width, height and depth in meters, wearing one opaque dielectric material named `structure` decoded from the sRGB color.
   */
  model: IAutoMovieModel;

  /**
   * Static scene node citing `model.id`, translated to the box centre with identity rotation and scale.
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
