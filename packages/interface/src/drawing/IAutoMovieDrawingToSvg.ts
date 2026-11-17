import type { IAutoMovieDrawing } from "./IAutoMovieDrawing";
import type { IAutoMovieDrawingView } from "./IAutoMovieDrawingView";

/**
 * Data and callback contracts shared by the DrawingToSvg operations.
 *
 * @evidence contracts/development/design.md#principled-representation A derived drawing and its originating view join model-metre geometry to page-millimetre pen and scale settings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieDrawingToSvg reads the existing drawing and view; no canvas, renderer or filesystem handle enters serialization.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Mismatched view identity and invalid positive pen scalars throw; missing drawing evidence stays in SVG markers rather than disappearing.
 * @evidence contracts/development/common.md#meaningful-documentation Documents scale conversion, y inversion, XML escaping, deterministic bytes and refusal.
 */
export namespace IAutoMovieDrawingToSvg {
  /**
   * Serialize one derived drawing as a self-describing SVG sheet.
   *
   * Every line carries its owner, space, layer and role; every region its space,
   * cell, kind, finish and area; every opening its identity, basis and size, as
   * an empty group when it has no outline; every dimension and note its status,
   * as an empty group with its reason when stale; and every gap is a marker, so
   * a sheet cannot look complete while its record says it is not. The root
   * carries the drawing's protocol, view, environment, projection, discipline,
   * scale and digest.
   *
   * The scale is drafting scale: one model metre is `1000 / scale` page
   * millimetres, so a 1:50 plan prints at 1:50, and pen weights and text height
   * are page millimetres. The page is the drawing's extent plus a fixed
   * {@link AUTOMOVIE_DRAWING_SVG_MARGIN} on each side, with y flipped because
   * SVG y grows downward. Numbers are rounded and printed to three decimals and
   * every attribute value is XML-escaped, so one drawing and view yield one byte
   * sequence.
   *
   * Throws an `Error` when the view is not the one the drawing was derived from,
   * or its pen has a weight, dash or text height that is not a finite positive
   * number.
   *
   * @evidence contracts/development/design.md#principled-representation A derived drawing and its originating view join model-metre geometry to page-millimetre pen and scale settings.
   * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieDrawingToSvg reads the existing drawing and view; no canvas, renderer or filesystem handle enters serialization.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Mismatched view identity and invalid positive pen scalars throw; missing drawing evidence stays in SVG markers rather than disappearing.
   * @evidence contracts/development/common.md#meaningful-documentation Documents scale conversion, y inversion, XML escaping, deterministic bytes and refusal.
   */
  export type IProps = {
    /** Drawing to serialize. */
    drawing: IAutoMovieDrawing;
    /** View the drawing was derived from; supplies the pen. */
    view: IAutoMovieDrawingView;
  };
}
