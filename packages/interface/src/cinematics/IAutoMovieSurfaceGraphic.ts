import type { IAutoMovieColor } from "../color/IAutoMovieColor";
import type { IAutoMovieSurfaceGraphicLayer } from "./IAutoMovieSurfaceGraphicLayer";

/**
 * One picture on a prop's surface: how it gives off light, what fills the face
 * behind its layers, and the layers drawn over that fill in order.
 *
 * Every colour is linear RGB as {@link IAutoMovieColor} defines it. Its alpha
 * blends the fill or layer over what lies beneath on the face, and `null` alpha
 * is opaque. The picture is flat: layers stack by draw order on one plane and
 * never by depth.
 */
export interface IAutoMovieSurfaceGraphic {
  /**
   * How the picture's pixels reach the camera.
   *
   * `emissive` is a lit screen: unlit, and a pixel's radiance in cd/m² is its
   * linear colour (an image decoded from sRGB first) times `luminance`, the
   * luminance of a white pixel, finite and nonnegative. Like any emissive
   * surface it lights nothing else; stage an area light for a screen's spill.
   *
   * `printed` is ink or paint: the scene's lights illuminate it as a matte
   * surface whose albedo is the pixel's linear colour.
   */
  emission:
    | {
        /** Discriminant: a self-luminous screen. */
        kind: "emissive";

        /** Luminance of a white pixel, cd/m², finite and nonnegative. */
        luminance: number;
      }
    | {
        /** Discriminant: a reflective print the scene lights. */
        kind: "printed";
      };

  /**
   * Fill of the whole face beneath the layers, or `null` for none, which leaves
   * the prop's own surface showing wherever no layer draws.
   */
  background: IAutoMovieColor | null;

  /** Layers drawn over the background in this order; possibly empty. */
  layers: readonly IAutoMovieSurfaceGraphicLayer[];
}
