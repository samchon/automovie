import type { IAutoMovieColor } from "../color/IAutoMovieColor";

/**
 * One layer of a surface graphic, placed by its box on the face.
 *
 * The box is in face fractions: `x` and `y` measure from the face's top-left
 * corner, `x` toward the reader's right and `y` toward the face's bottom, and
 * `width` and `height` extend the box the same ways. Each is finite, `x` and
 * `y` are at least 0, `width` and `height` are positive, and `x + width` and `y
 * + height` are at most 1. The face's right and top come from the surface's
 * reading frame, so a layout is never mirrored or flipped.
 */
export type IAutoMovieSurfaceGraphicLayer =
  | IAutoMovieSurfaceGraphicLayer.IRect
  | IAutoMovieSurfaceGraphicLayer.IImage
  | IAutoMovieSurfaceGraphicLayer.IText;

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
   * Flat lettering set in the box from a font the shot lists.
   *
   * `engine` lays the text out from the decoded font: `\n` breaks a line, a
   * line wider than the box wraps at its last space, the first baseline sits
   * one scaled ascender below the box top, and an unmapped code point, a word
   * wider than the box or lines taller than it are refused, never substituted
   * or clipped. `render` decodes the shot's fonts before drawing any frame and
   * draws the triangulated glyphs flat on the face in the layer's colour.
   */
  export interface IText extends IBox {
    /** Discriminant. */
    kind: "text";

    /** Id of a font source in the shot's `fonts` list. */
    font: string;

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
     * Line pitch as a positive multiple of the font's ascender minus
     * descender plus line gap; default 1.
     */
    lineHeight?: number;
  }
}
