import type * as THREE from "three";
import { hideAutoMovieSurfaceGraphics as hideAutoMovieSurfaceGraphicsImplementation } from "./internal/hideAutoMovieSurfaceGraphics.js";
import { type IAutoMovieSurfaceGraphicsObject } from "./IAutoMovieSurfaceGraphicsObject.js";
import { type IPrepareAutoMovieSurfaceGraphicsProps } from "./IPrepareAutoMovieSurfaceGraphicsProps.js";
import { prepareAutoMovieSurfaceGraphics as prepareAutoMovieSurfaceGraphicsImplementation } from "./internal/prepareAutoMovieSurfaceGraphics.js";

/** Public operations for Auto Movie Render Surface Graphic. */
export namespace AutoMovieRenderSurfaceGraphic {
  /**
   * Hide every currently visible surface graphic root in a scene and return the
   * restore that shows them again.
   *
   * The depth, normal, outline, pose and albedo passes leave surface graphics
   * out: the prop's own surface beneath already draws there, and a control
   * channel carries no lettering or overlay. Only roots that were visible are
   * hidden, so a key group that the per-frame applier hid stays hidden after
   * restore.
   */
  export function hide(scene: THREE.Scene): () => void {
    return hideAutoMovieSurfaceGraphicsImplementation(scene);
  }

  /**
   * Build a shot's surface graphics once, before any frame is drawn, and mount
   * each on its prop.
   *
   * Every track becomes one group named `surface-graphic:<node>/<surface>`,
   * marked for the render-mode boundary, parented to the node's model object at
   * the surface affordance's frame and lifted half a millimetre along `+Y`. It
   * holds one group per key, built by `buildAutoMovieSurfaceGraphicKey` and
   * clipped to the surface's `outline` when it declares one, of which the
   * returned `apply` shows only the key in force. Because the graphic rides the
   * model object, it follows the node's placement, its object motion and its
   * carriage at every sample time, and two props sharing one model show their own
   * graphics.
   *
   * The shot's font sources decode here first, all of them, so a source the
   * decoder refuses rejects with its diagnostic before anything is built; a text
   * layer then sets its glyphs from the decoded font it names. If a text layer
   * omits its font, the key builder draws it with the system UI font. Images
   * decode here too, once per distinct image: an id the node's model carries
   * decodes from its PNG bytes, any other id loads through `loadImage`. Every
   * texture is decoded as sRGB and sampled with the first image row at the face's
   * top. A node without a mounted object, a surface that is not a sized `surface`
   * affordance of its model, or an image that resolves nowhere rejects naming the
   * track, after releasing everything already made.
   */
  export function prepare(props: IPrepareAutoMovieSurfaceGraphicsProps): Promise<IAutoMovieSurfaceGraphicsObject> {
    return prepareAutoMovieSurfaceGraphicsImplementation(props);
  }
}
