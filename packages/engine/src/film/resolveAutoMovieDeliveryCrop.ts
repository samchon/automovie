import { IAutoMovieDeliveryCrop } from "@automovie/interface";

const WHOLE_DELIVERY_CROP: IAutoMovieDeliveryCrop = {
  left: 0,
  top: 0,
  right: 1,
  bottom: 1,
};

/**
 * Validate and resolve one portable delivery-gate crop.
 *
 * Coordinates name pixel edges in the uncropped raster with a top-left
 * origin. Omission resolves to the whole gate. The returned object never
 * aliases caller-owned input, so render and review consumers share values
 * without sharing mutation.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-delivery-gate Resolves the authored delivery window in a resolution-independent coordinate system before projection and rendering consume it.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Validates the closed normalized crop region that narrows the delivery frustum without changing its near or far planes.
 */
export const resolveAutoMovieDeliveryCrop = (
  crop: IAutoMovieDeliveryCrop | undefined,
): IAutoMovieDeliveryCrop => {
  const resolved = crop ?? WHOLE_DELIVERY_CROP;
  if (
    [resolved.left, resolved.top, resolved.right, resolved.bottom].every(
      (edge) => Number.isFinite(edge) && edge >= 0 && edge <= 1,
    ) === false ||
    resolved.left >= resolved.right ||
    resolved.top >= resolved.bottom
  )
    throw new RangeError(
      "Delivery crop edges must be finite, normalized to [0, 1], and ordered left < right and top < bottom.",
    );
  return { ...resolved };
};
