/**
 * A delivery crop restated in the uncropped frame's normalized device
 * coordinates, the form the perspective frustum tests and the projection read.
 *
 * {@link deliveryCropNdc} produces it from an `IAutoMovieDeliveryCrop`. NDC runs
 * from −1 at the left and bottom gate edges to +1 at the right and top ones, so
 * the top-left pixel-edge origin of the crop flips vertically here.
 */
export interface IAutoMovieDeliveryCropNdc {
  /** Left crop edge in NDC, from −1 at the uncropped gate's left edge. */
  left: number;

  /** Right crop edge in NDC, up to +1 at the uncropped gate's right edge. */
  right: number;

  /** Top crop edge in NDC, up to +1 at the uncropped gate's top edge. */
  top: number;

  /** Bottom crop edge in NDC, from −1 at the uncropped gate's bottom edge. */
  bottom: number;

  /** Crop width as a fraction of the uncropped gate width, in `(0, 1]`. */
  width: number;

  /** Crop height as a fraction of the uncropped gate height, in `(0, 1]`. */
  height: number;

  /** True when the crop is the whole gate, so NDC needs no rescaling. */
  whole: boolean;
}
