import { IAutoMovieDeliveryCrop } from "@automovie/interface";

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

interface IAutoMovieDeliveryCropNdc {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  whole: boolean;
}

const deliveryCropNdc = (
  crop: IAutoMovieDeliveryCrop | undefined,
): IAutoMovieDeliveryCropNdc => {
  const resolved = resolveAutoMovieDeliveryCrop(crop);
  return {
    left: 2 * resolved.left - 1,
    right: 2 * resolved.right - 1,
    top: 1 - 2 * resolved.top,
    bottom: 1 - 2 * resolved.bottom,
    width: resolved.right - resolved.left,
    height: resolved.bottom - resolved.top,
    whole:
      resolved.left === 0 &&
      resolved.top === 0 &&
      resolved.right === 1 &&
      resolved.bottom === 1,
  };
};

interface IAutoMovieDeliveryCropNdc {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  whole: boolean;
}
