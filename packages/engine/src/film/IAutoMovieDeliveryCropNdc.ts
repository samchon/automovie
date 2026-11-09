/**
 * A delivery crop restated in the uncropped frame's normalized device
 * coordinates, the form the perspective frustum tests and the projection read.
 *
 * {@link deliveryCropNdc} produces it from an `IAutoMovieDeliveryCrop`. NDC runs
 * from −1 at the left and bottom gate edges to +1 at the right and top ones,
 * so the top-left pixel-edge origin of the crop flips vertically here.
 *
 * @evidence contracts/development/design.md#principled-representation The four edges are the affine maps `2u - 1` horizontally and `1 - 2v` vertically from the crop's normalized pixel-edge coordinates into NDC, and `width` and `height` stay in the crop's own `[0, 1]` scale because the projection divides the half-span `(right - left) / 2` in NDC, which equals that fraction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record shared by the projection and the three frustum tests, so each reads the crop in the frame it clips in rather than converting it again.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The `whole` flag is the exact test for the untouched gate, letting the projection return unscaled NDC instead of dividing by one, and it is derived from the edges rather than from whether a crop was supplied.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the consumers, the NDC orientation and the vertical flip, and for each field its frame and scale.
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
