import type { IAutoMovieColor } from "../color/IAutoMovieColor";

/**
 * One layer of a surface graphic, placed by its box on the face.
 *
 * The box is in face fractions: `x` and `y` measure from the face's top-left
 * corner, `x` toward the reader's right and `y` toward the face's bottom, and
 * `width` and `height` extend the box the same ways. Each is finite, `x` and
 * `y` are at least 0, `width` and `height` are positive, and neither the sum of
 * `x` and `width` nor the sum of `y` and `height` exceeds 1. The face's right
 * and top come from the surface's reading frame, so a layout is never mirrored
 * or flipped.
 */
export type IAutoMovieSurfaceGraphicLayer =
  | IAutoMovieSurfaceGraphicLayer.IRect
  | IAutoMovieSurfaceGraphicLayer.IImage
  | IAutoMovieSurfaceGraphicLayer.IText
  | IAutoMovieSurfaceGraphicLayer.IFeed;

/** The closed layer kinds a surface graphic draws. */
export namespace IAutoMovieSurfaceGraphicLayer {
  /** The box every layer occupies, in face fractions from the top-left corner. */
  export interface IBox {
    /** Left edge, a fraction of the face's width from its left edge. */
    x: number;

    /** Top edge, a fraction of the face's height from its top edge. */
    y: number;

    /** Box width, a positive fraction of the face's width. */
    width: number;

    /** Box height, a positive fraction of the face's height. */
    height: number;
  }

  /** A box filled with one colour. */
  export interface IRect extends IBox {
    /** Discriminant. */
    kind: "rect";

    /** Linear fill colour; its alpha blends over what lies beneath. */
    color: IAutoMovieColor;
  }

  /**
   * A fixed still image fitted into the box.
   *
   * The asset id resolves against the images the prop's model carries first,
   * then against the project's assets, as material texture bindings do; a
   * project asset records the `surface-graphic` consumer whose id is the shot
   * id. Pixels are sRGB-encoded and decoded to linear before emission applies.
   */
  export interface IImage extends IBox {
    /** Discriminant. */
    kind: "image";

    /** Image id a model carries, or a project asset path. */
    asset: string;

    /**
     * How the image meets the box: `contain` shows all of it at its own aspect,
     * centred, leaving the rest of the box empty; `cover` fills the box at its
     * own aspect, centred, cropping what overflows; `stretch` fills the box and
     * changes its aspect.
     */
    fit: "contain" | "cover" | "stretch";
  }

  /**
   * Flat lettering set in the box from a shot font or the renderer's system UI
   * font. The system font and script fallback depend on the host's fonts.
   *
   * A newline breaks a line and a line wider than the box wraps at spaces. A
   * word wider than the box or lines taller than it are refused. An explicit
   * font is decoded before drawing, then the engine lays out and triangulates
   * its glyphs and refuses unmapped code points. When omitted, a browser canvas
   * uses `system-ui` to shape and rasterize the text on the face.
   */
  export interface IText extends IBox {
    /** Discriminant. */
    kind: "text";

    /** Id in the shot's `fonts` list. Omit to use the browser's system UI font. */
    font?: string;

    /** The text to set; nonempty. */
    text: string;

    /**
     * Em size as a positive fraction of the face's height; `render` multiplies
     * it by the surface's `depth` to get metres.
     */
    size: number;

    /** Linear colour of the letters; its alpha blends over what lies beneath. */
    color: IAutoMovieColor;

    /** Line alignment in the box; default `"start"`, the reader's left. */
    align?: "start" | "center" | "end";

    /**
     * Line pitch multiplier, default 1. The base is ascent plus descent and the
     * line gap when an explicit font supplies one.
     */
    lineHeight?: number;
  }

  /**
   * Another staged camera's live view shown in the box, as a CCTV monitor, a
   * camera's rear screen or a video call shows one.
   *
   * Before each frame `render` draws the scene at the same scene time from
   * `camera` into the layer's own colour target, `pixels` high and as wide as
   * the box's aspect on the face, and shows it under the graphic's emission.
   * Under the film's optics the feed is exposed, tone-mapped and graded as the
   * film is, so the screen shows a monitor's picture whose white emits the
   * graphic's `luminance`. A feed's own render draws every feed layer as its
   * graphic's background, so a screen never shows a view of itself and the feed
   * stays one level deep. `engine` admission refuses a camera the scene does
   * not stage, the shot's own camera, and a `pixels` value that is not an
   * integer from 1 to 2048.
   */
  export interface IFeed extends IBox {
    /** Discriminant. */
    kind: "feed";

    /** Id of a camera in the shot's scene other than the shot's own camera. */
    camera: string;

    /** The feed's height in pixels, an integer from 1 to 2048. */
    pixels: number;
  }
}
