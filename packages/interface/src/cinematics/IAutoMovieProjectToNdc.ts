/**
 * Perspective projection measurements shared by framing, grammar and keypoint
 * readers.
 */
export namespace IAutoMovieProjectToNdc {
  /**
   * Fresh, caller-owned projection of one world point into the delivered
   * frame's normalized device coordinates.
   *
   * The camera looks down its local −Z, as glTF cameras do, so `depth =
   * −localZ` is positive in front of the lens, and NDC is `local / (depth ·
   * halfY)` vertically and `local / (depth · halfY · aspect)` horizontally.
   * With a crop, NDC is rescaled so the crop window spans `[−1, 1]` on both
   * axes; without one, the whole gate does. Behind the lens (`depth <= 0`) the
   * NDC is meaningless and at `depth = 0` it is infinite or `NaN`: this never
   * clamps, and the caller reads `depth`, the near and far bounds and the `[−1,
   * 1]` rectangle to decide. A malformed crop throws the `RangeError` of
   * {@link deliveryCropNdc}.
   */
  export type IResult = {
    /**
     * Horizontal delivered-frame coordinate: -1 left and +1 right. Unclamped
     * and possibly non-finite.
     */
    ndcX: number;

    /**
     * Vertical delivered-frame coordinate: -1 bottom and +1 top. Unclamped and
     * possibly non-finite.
     */
    ndcY: number;

    /**
     * Signed camera-forward distance in metres, -localZ; positive is in front,
     * zero is on the lens plane. Near/far clipping is not applied.
     */
    depth: number;
  };
}
