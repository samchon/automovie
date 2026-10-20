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
 * @evidence contracts/common.md#principled-implementation `resolveAutoMovieDeliveryCrop` accepts four finite edges in `[0, 1]` with `left < right` and `top < bottom` and returns a copy; the viewer installs the window as a `three.js` view offset on the full aspect, and frustum culling maps the same edges to normalized device coordinates, so rendering and visibility use one window.
 * @evidence contracts/common.md#clear-and-simple-design Four normalized edges are the whole window, resolution-independent by construction; omission of the whole record on its owner means the full gate, so the record never needs a "no crop" flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed window throws instead of being clamped into range, and the full `0, 0, 1, 1` window clears the view offset rather than installing an identity one.
 * @evidence contracts/common.md#meaningful-documentation States the origin, normalization, inclusive boundaries, resolution independence, the open and closed range of every edge, and the failure a malformed window raises.
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
