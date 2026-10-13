/**
 * One portable window inside the uncropped delivery gate.
 *
 * Coordinates are normalized pixel-edge positions with a top-left origin.
 * `left` and `top` are inclusive clipping boundaries, as are exact contacts
 * with `right` and `bottom`; geometry outside those closed boundaries is not
 * delivered. The selected window is projected back onto the complete output
 * raster, so the same crop remains exact across final, proxy, and diagnostic
 * resolutions. `resolveAutoMovieDeliveryCrop` throws a `RangeError` for a
 * malformed window instead of clamping it.
 *
 * @author Samchon
 */
export interface IAutoMovieDeliveryCrop {
  /** Left edge in `[0, 1)`, measured from the uncropped gate's left edge. */
  left: number;

  /** Top edge in `[0, 1)`, measured from the uncropped gate's top edge. */
  top: number;

  /**
   * Right edge in `(left, 1]`, measured from the uncropped gate's left edge.
   */
  right: number;

  /** Bottom edge in `(top, 1]`, measured from the uncropped gate's top edge. */
  bottom: number;
}
