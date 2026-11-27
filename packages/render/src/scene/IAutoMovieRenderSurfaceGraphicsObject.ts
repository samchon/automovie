import type { IAutoMovieFilmOptics } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieRenderFilmResponseRenderer } from "./IAutoMovieRenderFilmResponseRenderer";

/**
 * A shot's surface graphics, built and mounted on their props.
 *
 * `prepareSurfaceGraphics` returns it. The caller owns it until
 * `dispose`. Each track's root is named `surface-graphic:<node>/<surface>` and
 * parented to its prop's model object at the surface frame, so a host finds it
 * by that name in the scene it mounted, as the semantic mask does.
 */
export interface IAutoMovieRenderSurfaceGraphicsObject {
  /**
   * Show every track's key in force at shot-local `seconds` and hide its other
   * keys. Call it before drawing each frame. A time outside [0, duration)
   * throws a `RangeError` and changes nothing.
   */
  apply(seconds: number): void;

  /**
   * Draw every shown feed layer's camera view into its own render target, at
   * the scene's current placement; call it after `apply` and the scene's own
   * placement, before drawing the frame. Inside a feed every feed layer draws
   * as its graphic's background, so a screen never shows itself. The renderer's
   * render target is restored, and a camera `camera` cannot resolve throws.
   * Does nothing when no feed is shown.
   *
   * With `response`, the film's optics at the drawn second, each feed is drawn
   * through its own `AutoMovieRenderFilmResponseStage`, so the screen shows the
   * exposed, white-balanced, tone-mapped and graded picture a monitor would,
   * and the feed's material decodes that display picture, so its white emits
   * the graphic's `luminance`. A refused optics value throws naming `seconds`.
   * Without it the scene's linear light is drawn into the target as it is,
   * which suits only light values already scaled to a display.
   */
  renderFeeds(
    renderer: IAutoMovieRenderFilmResponseRenderer,
    scene: THREE.Scene,
    camera: (id: string) => THREE.Camera | undefined,
    response?: {
      /** The film's camera response at the drawn second. */
      optics: IAutoMovieFilmOptics;

      /** The drawn second, which a refusal of `optics` names. */
      seconds: number;
    },
  ): void;

  /**
   * Detach every root and release the geometries, materials, textures and feed
   * render targets the graphics own. Calling it again does nothing.
   */
  dispose(): void;
}
