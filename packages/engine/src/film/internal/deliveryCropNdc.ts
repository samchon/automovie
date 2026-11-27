import {
  IAutoMovieDeliveryCrop,
  type IAutoMovieDeliveryCropNdc,
} from "@automovie/interface";

import { resolveDeliveryCrop } from "./resolveDeliveryCrop";

/*
 * Validate one delivery crop and restate it in the uncropped frame's normalized
 * device coordinates.
 *
 * An omitted crop is the whole gate. A malformed one throws the `RangeError` of
 * resolveDeliveryCrop rather than being clamped, so a frustum
 * test never silently clips against a window nobody could deliver.
 * Parameter crop: The delivery crop, or `undefined` for the whole gate.
 * Returns: A new NDC restatement of the crop.
 */
export function deliveryCropNdc(
  crop: IAutoMovieDeliveryCrop | undefined,
): IAutoMovieDeliveryCropNdc {
  const resolved: IAutoMovieDeliveryCrop = resolveDeliveryCrop(crop);
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
}
