import type { IAutoMovieSurfaceGraphic } from "./IAutoMovieSurfaceGraphic";

/**
 * Show successive pictures on a sized surface during one shot.
 *
 * Name a placed node and one surface in its model. Read the picture from the
 * affordance frame's +Y side. Its right is local +X and its top is local -Z.
 * The frame centres the surface's width and depth in metres.
 *
 * `engine` admission refuses a node that is not staged, a surface id that is
 * not a `surface` affordance of the node's registered model, a surface without
 * positive `width` and `depth`, two tracks for one node and surface, keys out
 * of order or not opening at zero, and malformed graphics.
 *
 * A fixed surface follows the prop. A surface that declares `rides` follows
 * that articulation's single driven rigid part, or its explicitly named
 * `materialPart` among those driven parts. An unresolved or deforming carrier
 * is refused. The graphic keys still use the shot's clock when the surface
 * moves.
 */
export interface IAutoMovieSurfaceGraphicTrack {
  /** Stable id of the placed prop in the shot's scene. */
  node: string;

  /**
   * Id of a `surface` affordance on the prop's registered model, with positive
   * `width` and `depth`. When it rides an articulation, the model must identify
   * its rigid carrier.
   */
  surface: string;

  /**
   * Nonempty list of keys in strictly increasing shot-local time, the first at
   * zero. A key's graphic shows from its time until the next key's time; the
   * last shows until the shot ends.
   */
  keys: readonly {
    /** Finite shot-local seconds in the half-open interval [0, duration). */
    time: number;

    /** The picture shown from this key on. */
    graphic: IAutoMovieSurfaceGraphic;
  }[];
}
