import { IAutoMovieDeliveryCrop } from "@automovie/interface";

/** The whole uncropped gate, what an omitted crop means. */
const WHOLE_DELIVERY_CROP: IAutoMovieDeliveryCrop = {
  left: 0,
  top: 0,
  right: 1,
  bottom: 1,
};

/**
 * Validate one delivery-gate crop and return a copy of it, or of the whole gate when it is omitted.
 *
 * Edges are fractions of the uncropped raster with a top-left origin, so the same window holds at every output resolution. A crop is accepted when every edge is finite and within `[0, 1]`, `left < right` and `top < bottom`. The result never aliases the caller's object, so render and review consumers share values without sharing mutation.
 *
 * @param crop The authored window, or `undefined` for the whole gate.
 * @returns A fresh crop with the same four edges.
 * @throws {RangeError} When an edge is non-finite or outside `[0, 1]`, or the window is empty or inverted on either axis.
 *
 * @evidence contracts/common.md#principled-implementation Checks the four edges with `Number.isFinite` and closed unit bounds and the two orderings strictly, which is exactly the non-empty sub-rectangle of the unit square the interface allows; a malformed window throws instead of being clamped, so the author sees the fault.
 * @evidence contracts/common.md#clear-and-simple-design The one validator and default for a crop, called by `deliveryCropNdc` for culling and by geometry measurement, so every consumer reads the same window and the same refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No crop or resolution is special-cased; the whole-gate default is the interface's stated meaning of omission.
 * @evidence contracts/common.md#meaningful-documentation States the coordinate frame and origin, the acceptance conditions, the omission default, the copy guarantee and the error type with its causes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Four finiteness and range tests and two comparisons in constant time, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validates one small record per call; callers that read the crop per frame call it once per frame and the cost is constant.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one four-field copy owned by the caller and retains nothing.
 */
export function resolveAutoMovieDeliveryCrop(
  crop: IAutoMovieDeliveryCrop | undefined,
): IAutoMovieDeliveryCrop {
  const resolved: IAutoMovieDeliveryCrop = crop ?? WHOLE_DELIVERY_CROP;
  if (
    [resolved.left, resolved.top, resolved.right, resolved.bottom].every(
      (edge: number): boolean =>
        Number.isFinite(edge) && edge >= 0 && edge <= 1,
    ) === false ||
    resolved.left >= resolved.right ||
    resolved.top >= resolved.bottom
  )
    throw new RangeError(
      "Delivery crop edges must be finite, normalized to [0, 1], and ordered left < right and top < bottom.",
    );
  return { ...resolved };
}
