import { IAutoMovieDeliveryCrop } from "@automovie/interface";

/** The whole uncropped gate, what an omitted crop means. */
const WHOLE_DELIVERY_CROP: IAutoMovieDeliveryCrop = {
  left: 0,
  top: 0,
  right: 1,
  bottom: 1,
};

/**
 * Validate one delivery-gate crop and return a copy of it, or of the whole gate
 * when it is omitted.
 *
 * Edges are fractions of the uncropped raster with a top-left origin, so the
 * same window holds at every output resolution. A crop is accepted when every
 * edge is finite and within `[0, 1]`, `left < right` and `top < bottom`. The
 * result never aliases the caller's object, so render and review consumers
 * share values without sharing mutation.
 *
 * @param crop The authored window, or `undefined` for the whole gate.
 * @returns A fresh crop with the same four edges.
 * @throws {RangeError} When an edge is non-finite or outside `[0, 1]`, or the
 *   window is empty or inverted on either axis.
 */
export function resolveAutoMovieDeliveryCrop(
  crop: IAutoMovieDeliveryCrop | undefined,
): IAutoMovieDeliveryCrop {
  const resolved: IAutoMovieDeliveryCrop = crop ?? WHOLE_DELIVERY_CROP;
  if (
    [resolved.left, resolved.top, resolved.right, resolved.bottom].every(
      (edge: number): boolean =>
        edge >= 0 && edge <= 1,
    ) === false ||
    resolved.left >= resolved.right ||
    resolved.top >= resolved.bottom
  )
    throw new RangeError(
      "Delivery crop edges must be finite, normalized to [0, 1], and ordered left < right and top < bottom.",
    );
  return { ...resolved };
}
