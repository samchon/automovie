import type { IAutoMovieSurfaceGraphic } from "./IAutoMovieSurfaceGraphic";

/**
 * A shot-local sequence of pictures shown on one `surface` affordance of a
 * placed prop: a phone's screen, a cash machine's display, a sign's face.
 *
 * The track names the scene node and the affordance, so the picture follows
 * every placement and object motion the prop takes. `render` lays each graphic
 * out in the affordance's reading frame (see `IAutoMovieAffordance.frame`):
 * read from the frame's `+Y` side, local `+X` runs to the reader's right and
 * local `-Z` toward the face's top, over the `width` by `depth` rectangle
 * centred on the frame.
 *
 * `engine` admission refuses a node that is not staged, a surface id that is
 * not a `surface` affordance of the node's registered model, a surface without
 * positive `width` and `depth`, two tracks for one node and surface, keys out
 * of order or not opening at zero, and malformed graphics.
 *
 * A surface that rides an articulation is refused as well. Such a surface, the
 * book's `face` on its `hinge` or a folded sheet's `face` on its `fold`, moves
 * with the articulation's travel, so its picture would have to follow the
 * moving part rather than the prop's built object. Reopen when a production
 * needs a graphic on an articulated surface and `render` can parent a graphic
 * mesh to the moving part an articulation drives, so the graphic follows the
 * articulation's travel at every sample time.
 */
export interface IAutoMovieSurfaceGraphicTrack {
  /** Stable id of the placed prop in the shot's scene. */
  node: string;

  /**
   * Id of a `surface` affordance on the prop's registered model, with positive
   * `width` and `depth` and no `rides`.
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
