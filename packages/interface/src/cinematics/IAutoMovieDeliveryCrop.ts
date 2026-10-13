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
 * @evidence contracts/common.md#principled-implementation Normalized pixel-edge coordinates make the window independent of resolution; `resolveAutoMovieDeliveryCrop` requires finite edges in [0, 1] with `left < right` and `top < bottom` and returns a fresh copy so consumers never alias caller input.
 * @evidence contracts/common.md#clear-and-simple-design Four scalars and no pixel sizes, because the window is projected onto whatever raster the frame format names; an omitted crop resolves to the whole-gate constant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed crop raises `RangeError` rather than being clamped into range, and edge inclusivity is fixed by contract, so a contact exactly on `right` or `bottom` is delivered.
 * @evidence contracts/common.md#meaningful-documentation States the coordinate frame and origin, which edges are inclusive, the interval of each edge, the failure on a malformed window, and that the window maps back onto the full raster.
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
