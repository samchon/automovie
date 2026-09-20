/**
 * One portable window inside the uncropped delivery gate.
 *
 * Coordinates are normalized pixel-edge positions with a top-left origin.
 * `left` and `top` are inclusive clipping boundaries, as are exact contacts
 * with `right` and `bottom`; geometry outside those closed boundaries is not
 * delivered. The selected window is projected back onto the complete output
 * raster, so the same crop remains exact across final, proxy, and diagnostic
 * resolutions.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Exposes the output crop independently of the delivery raster so required landmarks are judged in the actual delivered window.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the delivery crop used by clipping evaluation in one resolution-independent coordinate system.
 * @author Samchon
 */
export interface IAutoMovieDeliveryCrop {
  /**
   * Left edge in `[0, 1)`, measured from the uncropped gate's left edge.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Addresses the selected delivery window's left boundary.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the left clipping boundary in the specified crop coordinate system.
   */
  left: number;

  /**
   * Top edge in `[0, 1)`, measured from the uncropped gate's top edge.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Addresses the selected delivery window's top boundary.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the top clipping boundary in the specified crop coordinate system.
   */
  top: number;

  /**
   * Right edge in `(left, 1]`, measured from the uncropped gate's left edge.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Addresses the selected delivery window's right boundary.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the right clipping boundary in the specified crop coordinate system.
   */
  right: number;

  /**
   * Bottom edge in `(top, 1]`, measured from the uncropped gate's top edge.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Addresses the selected delivery window's bottom boundary.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the bottom clipping boundary in the specified crop coordinate system.
   */
  bottom: number;
}
