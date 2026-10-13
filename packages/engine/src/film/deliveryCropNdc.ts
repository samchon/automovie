import { IAutoMovieDeliveryCrop } from "@automovie/interface";

import { IAutoMovieDeliveryCropNdc } from "./IAutoMovieDeliveryCropNdc";
import { resolveAutoMovieDeliveryCrop } from "./resolveAutoMovieDeliveryCrop";

/**
 * Validate one delivery crop and restate it in the uncropped frame's
 * normalized device coordinates.
 *
 * An omitted crop is the whole gate. A malformed one throws the `RangeError`
 * of {@link resolveAutoMovieDeliveryCrop} rather than being clamped, so a
 * frustum test never silently clips against a window nobody could deliver.
 *
 * @param crop The delivery crop, or `undefined` for the whole gate.
 * @returns A new NDC restatement of the crop.
 *
 * @evidence contracts/common.md#principled-implementation Validation is delegated to `resolveAutoMovieDeliveryCrop`, then each edge goes through the affine map from normalized pixel edges to NDC, `2u - 1` horizontally and `1 - 2v` vertically to flip the top-left origin; `whole` compares the resolved edges exactly, which is sound because the whole-gate default is the literal `0` and `1`.
 * @evidence contracts/common.md#clear-and-simple-design The one conversion behind `projectToNdc` and the segment, box and sphere frustum tests, which each carried a private copy of it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every crop goes through the same validation and map; an omitted crop is the stated whole-gate default, not a separate branch per caller.
 * @evidence contracts/common.md#meaningful-documentation States the whole-gate default, the thrown error and why it is not clamped, and that the result is a new record.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one validation over four edges and six arithmetic results.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure conversion of one crop; callers that test many points against one crop convert it once per call and reuse the result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the resolved crop copy is dropped on return and the caller owns the result.
 */
export const deliveryCropNdc = (
  crop: IAutoMovieDeliveryCrop | undefined,
): IAutoMovieDeliveryCropNdc => {
  const resolved: IAutoMovieDeliveryCrop = resolveAutoMovieDeliveryCrop(crop);
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
