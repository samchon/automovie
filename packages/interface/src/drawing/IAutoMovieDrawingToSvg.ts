import type { IAutoMovieDrawing } from "./IAutoMovieDrawing";
import type { IAutoMovieDrawingView } from "./IAutoMovieDrawingView";

/** Data and callback contracts shared by the DrawingToSvg operations. */
export namespace IAutoMovieDrawingToSvg {
  /**
   * Serialize one derived drawing as a self-describing SVG sheet.
   *
   * Every line carries its owner, space, layer and role; every region its
   * space, cell, kind, finish and area; every opening its identity, basis and
   * size, as an empty group when it has no outline; every dimension and note
   * its status, as an empty group with its reason when stale; and every gap is
   * a marker, so a sheet cannot look complete while its record says it is not.
   * The root carries the drawing's protocol, view, environment, projection,
   * discipline, scale and digest.
   *
   * The scale is drafting scale: one model metre is `1000 / scale` page
   * millimetres, so a 1:50 plan prints at 1:50, and pen weights and text height
   * are page millimetres. The page is the drawing's extent plus a fixed
   * {@link AutoMovieEngineDrawingSvgMargin} on each side, with y flipped because
   * SVG y grows downward. Numbers are rounded and printed to three decimals and
   * every attribute value is XML-escaped, so one drawing and view yield one
   * byte sequence.
   *
   * Throws an `Error` when the view is not the one the drawing was derived
   * from, or its pen has a weight, dash or text height that is not a finite
   * positive number.
   */
  export type IProps = {
    /** Drawing to serialize. */
    drawing: IAutoMovieDrawing;
    /** View the drawing was derived from; supplies the pen. */
    view: IAutoMovieDrawingView;
  };
}
