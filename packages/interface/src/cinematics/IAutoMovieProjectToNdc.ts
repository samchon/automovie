

/**
 * Perspective projection measurements shared by framing, grammar and keypoint readers.
 *
 * @evidence contracts/development/design.md#principled-representation IResult keeps dimensionless delivered NDC separate from signed metre depth, without claiming every result is finite.
 * @evidence contracts/development/design.md#minimal-and-owned-surface All projection consumers share the same three-number result while deciding their own near/far and frame inclusion policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Out-of-frame and behind-lens values remain representable instead of being coerced into visible coordinates.
 * @evidence contracts/development/common.md#meaningful-documentation IResult describes crop remapping, axis direction, non-finite values and caller ownership.
 */
export namespace IAutoMovieProjectToNdc {
  /**
   * Fresh, caller-owned projection of one world point into the delivered frame's normalized device coordinates.
   * 
   * The camera looks down its local −Z, as glTF cameras do, so `depth = −localZ` is positive in front of the lens, and NDC is `local / (depth · halfY)` vertically and `local / (depth · halfY · aspect)` horizontally. With a crop, NDC is rescaled so the crop window spans `[−1, 1]` on both axes; without one, the whole gate does. Behind the lens (`depth <= 0`) the NDC is meaningless and at `depth = 0` it is infinite or `NaN`: this never clamps, and the caller reads `depth`, the near and far bounds and the `[−1, 1]` rectangle to decide. A malformed crop throws the `RangeError` of {@link deliveryCropNdc}.
   *
   * @evidence contracts/development/design.md#principled-representation NDC components are dimensionless and depth is signed camera-forward metres. A finite world point alone cannot guarantee finite projection; camera rotation, positive lens/aspect and nonzero depth remain producer premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface projectToNdc returns only the two projected coordinates and depth used by film grammar, framing and keypoint consumers; visibility policy is not duplicated here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Coordinates outside the frame or behind the lens remain observable instead of being clamped to valid-looking values; no pixel or occlusion result is implied.
   * @evidence contracts/development/common.md#meaningful-documentation States crop remapping, axes, signed depth, zero-depth behavior, caller-owned mutability and visibility limits.
   */
  export type IResult = {
    /** Horizontal delivered-frame coordinate: -1 left and +1 right. Unclamped and possibly non-finite. */
    ndcX: number;

    /** Vertical delivered-frame coordinate: -1 bottom and +1 top. Unclamped and possibly non-finite. */
    ndcY: number;

    /** Signed camera-forward distance in metres, -localZ; positive is in front, zero is on the lens plane. Near/far clipping is not applied. */
    depth: number;
  };
}
