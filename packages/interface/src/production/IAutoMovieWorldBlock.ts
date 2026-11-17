import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieSceneNode } from "../scene/IAutoMovieSceneNode";

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

/**
 * Grounded block constructor inputs paired with its generated scene artifacts.
 */
export namespace IAutoMovieWorldBlock {
  /**
   * Build a box model group, placed node and bounds from a grounded base and size.
   *
   * Inputs are borrowed during construction; the returned model, node and corner vectors are newly allocated. Derived coordinate overflow is not separately checked by this constructor.
   *
   * @evidence contracts/development/design.md#principled-representation The base is bottom-centre world metres and size is positive X/Y/Z metres; worldBlock admits nonblank id, finite base/size and hexadecimal color before deriving axis-aligned bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface worldBlock creates a model, node and placement bounds for assertWorldPlacements; the input controls only the dimensions, classification and surface color that construction reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Wall/building is semantic classification with identical box geometry. Constructor checks do not prove support or route clearance, which assertWorldPlacements evaluates against the declared world.
   * @evidence contracts/development/common.md#meaningful-documentation Grounded block constructor inputs paired with its generated scene artifacts. The base is bottom-centre world metres and size is positive X/Y/Z metres; worldBlock admits nonblank id, finite base/size and hexadecimal color before deriving axis-aligned bounds.
   */
  export type IInput = {
    /** Nonblank block/node identity. worldBlock derives its model identity through productionRuntimeModelId and rejects whitespace-only input. */
    id: string;
    /** Author-facing wall or building classification; both produce the same unrotated box construction. */
    kind: "wall" | "building";
    /** Finite world position in metres at the bottom center. Box placement raises Y by half the height and centers XZ on this point. */
    base: IAutoMovieVector3;
    /** Positive finite width, height and depth in metres along world X, Y and Z. Typed vector completeness is a premise; the constructor checks enumerated values. */
    size: IAutoMovieVector3;
    /** Six-digit #RRGGBB sRGB string, case-insensitive. Invalid syntax throws before construction; the shared decoder converts it to linear material color. */
    color: string;
  };
}
